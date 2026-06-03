import { describe, expect, it, vi, afterEach } from "vitest";
import { initSopUpload } from "./lawyer-sops-api.js";

describe("initSopUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs SOP upload init body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          data: {
            uploadSessionId: "sess-1",
            storageBucket: "b",
            storageObjectKey: "key",
            tusEndpoint: "https://tus.example/upload",
            tusHeaders: {},
          },
          meta: { requestId: "r1" },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await initSopUpload({
      pipelineId: "00000000-0000-4000-8000-000000000001",
      fileName: "a.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 1024n,
    });
    expect(result.uploadSessionId).toBe("sess-1");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/sops/uploads/init"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
