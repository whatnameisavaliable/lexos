import { test, expect } from "@playwright/test";
import { loginViaBff } from "./fixtures/auth";
import {
  getE2ePassword,
  hasE2eCredentials,
  isApiHealthy,
} from "./fixtures/env";

/**
 * 轮询任务至 completed（依赖 Worker + ASR/LLM 测试环境）。
 */
test.describe("transcription pipeline completed", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() ||
        !(await isApiHealthy(request)) ||
        !process.env.E2E_COMPLETED_TASK_ID,
      "Requires E2E_COMPLETED_TASK_ID and healthy API/worker stack",
    );
  });

  test("polls task until completed", async ({ request }) => {
    const taskId = process.env.E2E_COMPLETED_TASK_ID as string;
    const password = getE2ePassword();
    const username = process.env.E2E_LAWYER_USERNAME ?? "lawyer";
    const session = await loginViaBff(request, { username, password });

    const deadline = Date.now() + 300_000;
    let status = "";
    while (Date.now() < deadline) {
      const res = await request.get(`/api/transcription/tasks/${taskId}`, {
        headers: { authorization: `Bearer ${session.accessToken}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = (await res.json()) as {
        data?: { status?: string };
      };
      status = body.data?.status ?? "";
      if (status === "completed") {
        break;
      }
      await new Promise((r) => setTimeout(r, 3_000));
    }
    expect(status).toBe("completed");
  });
});
