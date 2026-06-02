import { describe, expect, it, vi } from "vitest";
import { SOP_OUTBOX_AGGREGATE_TYPE, SOP_STAGE_DEEP_RESEARCH } from "@lexos/shared";
import { OutboxRepository } from "./outbox.repository.js";

describe("OutboxRepository.insertSopOutboxInTransaction", () => {
  it("inserts case_pipeline row with pipeline.stage event_type", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ id: "outbox-1" }],
    });
    const client = { query } as never;

    const repo = new OutboxRepository();
    const id = await repo.insertSopOutboxInTransaction(client, {
      pipelineId: "pipe-1",
      stage: SOP_STAGE_DEEP_RESEARCH,
      stepCode: "02-B",
      artifactId: "art-1",
    });

    expect(id).toBe("outbox-1");
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO public.outbox_events"),
      [
        SOP_OUTBOX_AGGREGATE_TYPE,
        "pipe-1",
        `pipeline.stage.${SOP_STAGE_DEEP_RESEARCH}`,
        JSON.stringify({
          stage: SOP_STAGE_DEEP_RESEARCH,
          pipeline_id: "pipe-1",
          step_code: "02-B",
          artifact_id: "art-1",
        }),
      ],
    );
  });
});
