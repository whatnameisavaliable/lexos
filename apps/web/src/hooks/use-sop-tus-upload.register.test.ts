import { describe, expect, it, vi } from "vitest";
import { createSopBeforeUnloadHandler } from "./use-sop-tus-upload.js";

describe("createSopBeforeUnloadHandler", () => {
  it("calls preventDefault on beforeunload", () => {
    const handler = createSopBeforeUnloadHandler();
    const event = { preventDefault: vi.fn() } as unknown as BeforeUnloadEvent;
    handler(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
