import { randomUUID } from "node:crypto";
import path from "node:path";
import type { WorkerAsrResult } from "./worker-ai-client.port.js";
import type { WorkerAiCredentials } from "./worker-ai-client.port.js";
import type { WorkerStorageAdapter } from "../storage/worker-storage.adapter.js";

const DASHSCOPE_SUBMIT_PATH =
  "/api/v1/services/audio/asr/transcription";
const POLL_INTERVAL_MS = 1_000;

/** DashScope Fun-ASR / Paraformer 录音文件识别（异步 REST · 需公网 URL）。 */
export class DashScopeFunAsrWorkerClient {
  constructor(private readonly storage: WorkerStorageAdapter) {}

  async transcribe(
    credentials: WorkerAiCredentials,
    localAudioPath: string,
    options?: { readonly timeoutMs?: number },
  ): Promise<WorkerAsrResult> {
    const timeoutMs = options?.timeoutMs ?? 120_000;
    const storageKey = `asr-temp/${randomUUID()}/${path.basename(localAudioPath)}`;
    await this.storage.uploadFile(localAudioPath, storageKey);
    try {
      const fileUrl = await this.storage.createSignedDownloadUrl(storageKey, 3_600);
      const text = await transcribeWithDashScopeFunAsr({
        apiKey: credentials.apiKey,
        baseUrl: credentials.baseUrl,
        modelName: credentials.modelName,
        fileUrl,
        timeoutMs,
      });
      return { text, diarizationDegraded: true };
    } finally {
      await this.storage.removeObject(storageKey).catch(() => undefined);
    }
  }
}

/** 是否应走 DashScope 录音文件识别 REST（非 OpenAI `/audio/transcriptions`）。 */
export function usesDashScopeFunAsrApi(
  credentials: WorkerAiCredentials,
): boolean {
  const base = (credentials.baseUrl ?? "").toLowerCase();
  const model = credentials.modelName.toLowerCase();
  if (!base.includes("dashscope.aliyuncs.com")) {
    return false;
  }
  return (
    model.startsWith("fun-asr") ||
    model.startsWith("paraformer") ||
    model.startsWith("sensevoice")
  );
}

interface DashScopeTranscribeInput {
  readonly apiKey: string;
  readonly baseUrl: string | null;
  readonly modelName: string;
  readonly fileUrl: string;
  readonly timeoutMs: number;
}

async function transcribeWithDashScopeFunAsr(
  input: DashScopeTranscribeInput,
): Promise<string> {
  const apiRoot = resolveDashScopeApiRoot(input.baseUrl);
  const submitUrl = `${apiRoot}${DASHSCOPE_SUBMIT_PATH}`;
  const submitResponse = await fetch(submitUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify({
      model: input.modelName,
      input: { file_urls: [input.fileUrl] },
      parameters: { channel_id: [0] },
    }),
  });
  if (!submitResponse.ok) {
    const detail = await readResponseSnippet(submitResponse);
    throw new Error(
      `DashScope ASR submit HTTP ${submitResponse.status} ${submitUrl}: ${detail}`,
    );
  }

  const submitBody = (await submitResponse.json()) as {
    output?: { task_id?: string };
  };
  const taskId = submitBody.output?.task_id;
  if (!taskId) {
    throw new Error("DashScope ASR submit missing task_id");
  }

  const deadline = Date.now() + input.timeoutMs;
  while (Date.now() < deadline) {
    const taskUrl = `${apiRoot}/api/v1/tasks/${taskId}`;
    const taskResponse = await fetch(taskUrl, {
      headers: { Authorization: `Bearer ${input.apiKey}` },
    });
    if (!taskResponse.ok) {
      const detail = await readResponseSnippet(taskResponse);
      throw new Error(
        `DashScope ASR poll HTTP ${taskResponse.status} ${taskUrl}: ${detail}`,
      );
    }

    const taskBody = (await taskResponse.json()) as {
      output?: {
        task_status?: string;
        results?: Array<{
          subtask_status?: string;
          transcription_url?: string;
          message?: string;
        }>;
      };
    };
    const status = taskBody.output?.task_status;
    if (status === "SUCCEEDED") {
      const result = taskBody.output?.results?.[0];
      if (result?.subtask_status === "FAILED") {
        throw new Error(
          `DashScope ASR subtask failed: ${result.message ?? "unknown"}`,
        );
      }
      const transcriptionUrl = result?.transcription_url;
      if (!transcriptionUrl) {
        throw new Error("DashScope ASR missing transcription_url");
      }
      return fetchTranscriptionText(transcriptionUrl);
    }
    if (status === "FAILED") {
      const message =
        taskBody.output?.results?.[0]?.message ?? "DashScope ASR task failed";
      throw new Error(message);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`DashScope ASR timed out after ${input.timeoutMs}ms`);
}

async function fetchTranscriptionText(transcriptionUrl: string): Promise<string> {
  const response = await fetch(transcriptionUrl);
  if (!response.ok) {
    throw new Error(`DashScope ASR result HTTP ${response.status}`);
  }
  const body = (await response.json()) as {
    transcripts?: Array<{ text?: string }>;
  };
  const text = body.transcripts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("DashScope ASR result missing transcript text");
  }
  return text;
}

function resolveDashScopeApiRoot(baseUrl: string | null): string {
  const value = (baseUrl ?? "https://dashscope.aliyuncs.com").replace(/\/$/, "");
  if (value.includes("/compatible-mode")) {
    return value.split("/compatible-mode")[0] ?? "https://dashscope.aliyuncs.com";
  }
  if (value.endsWith("/api/v1")) {
    return value.slice(0, -"/api/v1".length);
  }
  if (value.endsWith("/v1")) {
    return value.slice(0, -"/v1".length);
  }
  return value;
}

async function readResponseSnippet(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 300);
  } catch {
    return "";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
