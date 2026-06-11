import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_DELIVERABLE_FILE_BYTES,
  buildDeliverableStoragePath,
  detectDeliverableMimeType,
  formatFileSize,
  sanitizeDeliverableFileName,
  validateDeliverableUpload,
} from "../src/lib/deliverables/files.ts";

describe("交付附件", () => {
  it("清理不适合进入对象路径的文件名", () => {
    assert.equal(sanitizeDeliverableFileName("  ../合同:终稿?.pdf  "), "-合同-终稿-.pdf");
    assert.equal(sanitizeDeliverableFileName(""), "deliverable-file");
  });

  it("在浏览器未提供 MIME 时根据扩展名兜底识别", () => {
    assert.equal(
      detectDeliverableMimeType({
        name: "代理意见.docx",
        size: 1024,
        type: "",
      }),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("拒绝超出 6MB 或不支持格式的文件", () => {
    assert.throws(
      () =>
        validateDeliverableUpload({
          name: "证据材料.pdf",
          size: MAX_DELIVERABLE_FILE_BYTES + 1,
          type: "application/pdf",
        }),
      /不能超过 6MB/,
    );

    assert.throws(
      () =>
        validateDeliverableUpload({
          name: "脚本.exe",
          size: 120,
          type: "application/x-msdownload",
        }),
      /仅支持 PDF、Word、Excel、图片或 ZIP 附件/,
    );
  });

  it("生成按组织和任务隔离的 Storage 路径", () => {
    assert.equal(
      buildDeliverableStoragePath({
        fileName: " 材料包?.zip ",
        organizationId: "org-1",
        taskId: "task-1",
        uniqueId: "file-1",
      }),
      "org-1/task-1/file-1-材料包-.zip",
    );
  });

  it("按业务展示格式输出文件大小", () => {
    assert.equal(formatFileSize(512), "512 B");
    assert.equal(formatFileSize(1536), "1.5 KB");
    assert.equal(formatFileSize(2 * 1024 * 1024), "2.0 MB");
  });
});
