import path from "node:path";
import type { SopOutboxPayload } from "@lexos/shared";
import type { Pool } from "pg";
import type { WorkerExportsStorageAdapter } from "../adapters/storage/worker-exports-storage.adapter.js";
import { buildExportsPdfStorageKey } from "../domain/sop/build-exports-pdf-storage-key.js";
import { withPgClient } from "../infra/with-pg-client.js";
import type { WorkerCasePipelineRepository } from "../repositories/worker-case-pipeline.repository.js";
import type { WorkerPipelineArtifactRepository } from "../repositories/worker-pipeline-artifact.repository.js";
import type { WorkerSopDriveRepository } from "../repositories/worker-sop-drive.repository.js";

/** Playwright 渲染端口（测试可注入 Mock）。 */
export interface PlaywrightPdfRenderer {
  renderHtmlToPdfBuffer(html: string): Promise<Buffer>;
}

/** 默认 Playwright 无头 PDF 渲染实现。 */
export async function createDefaultPlaywrightPdfRenderer(): Promise<PlaywrightPdfRenderer> {
  const { chromium } = await import("playwright");
  return {
    async renderHtmlToPdfBuffer(html: string): Promise<Buffer> {
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle" });
        const pdf = await page.pdf({ format: "A4", printBackground: true });
        return Buffer.from(pdf);
      } finally {
        await browser.close();
      }
    },
  };
}

/**
 * `sop.pdf_export` 阶段：HTML → PDF → `exports` 桶 → 回写 `linked_drive_node_id`。
 *
 * 失败时 **不** 回滚 `finalized` 状态（`prd.md` §3.8.5）。
 */
export class SopPdfExportService {
  constructor(
    private readonly pipelineRepository: WorkerCasePipelineRepository,
    private readonly artifactRepository: WorkerPipelineArtifactRepository,
    private readonly exportsStorage: WorkerExportsStorageAdapter,
    private readonly sopDriveRepository: WorkerSopDriveRepository,
    private readonly pdfRenderer: PlaywrightPdfRenderer,
  ) {}

  async run(pool: Pool, payload: SopOutboxPayload): Promise<void> {
    if (!payload.artifact_id) {
      throw new Error("sop.pdf_export requires artifact_id");
    }

    await withPgClient(pool, async (client) => {
      await this.pipelineRepository.assertLawyerPipelineWritable(
        client,
        payload.pipeline_id,
      );
    });

    const html = await withPgClient(pool, (client) =>
      this.artifactRepository.loadFinalizedSnapshotHtml(
        client,
        payload.artifact_id!,
      ),
    );
    if (!html?.trim()) {
      throw new Error("No finalized HTML snapshot for PDF export");
    }

    const pipeline = await withPgClient(pool, (client) =>
      this.pipelineRepository.findPipelineWithLawyer(
        client,
        payload.pipeline_id,
      ),
    );
    if (!pipeline) {
      throw new Error(`case_pipelines not found: ${payload.pipeline_id}`);
    }

    const storageKey = buildExportsPdfStorageKey(
      pipeline.lawyerId,
      payload.pipeline_id,
      payload.artifact_id,
    );

    const pdfBuffer = await this.renderHtmlToPdfBuffer(html);
    await this.uploadPdfToExports(pdfBuffer, storageKey);
    await withPgClient(pool, async (client) => {
      const driveNodeId = await this.linkPdfToDriveNode(
        client,
        {
          ownerId: pipeline.lawyerId,
          pipelineId: payload.pipeline_id,
          artifactId: payload.artifact_id!,
          storageKey,
          pdfFileName: `${payload.artifact_id}.pdf`,
        },
      );
      await this.artifactRepository.setLinkedDriveNodeId(
        client,
        payload.artifact_id!,
        driveNodeId,
      );
    });
  }

  async renderHtmlToPdfBuffer(html: string): Promise<Buffer> {
    return this.pdfRenderer.renderHtmlToPdfBuffer(html);
  }

  async uploadPdfToExports(buffer: Buffer, storageKey: string): Promise<void> {
    await this.exportsStorage.uploadPdfBuffer(storageKey, buffer);
  }

  async linkPdfToDriveNode(
    client: import("pg").PoolClient,
    input: {
      readonly ownerId: string;
      readonly pipelineId: string;
      readonly artifactId: string;
      readonly storageKey: string;
      readonly pdfFileName: string;
    },
  ): Promise<string> {
    return this.sopDriveRepository.linkPdfToDriveNode(client, input);
  }
}
