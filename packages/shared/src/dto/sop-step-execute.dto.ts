import { z } from "zod";

const formValuesSchema = z.record(z.string(), z.unknown());

const mediaObjectKeySchema = z.string().trim().min(1).max(2048);

/**
 * `POST /api/sops/pipelines/:id/steps/:code/execute` 请求体（`prd.md` §3.8.3）。
 */
export const sopStepExecuteBodySchema = z.object({
  formValues: formValuesSchema.default({}),
  mediaObjectKeys: z.array(mediaObjectKeySchema).optional(),
});

/** 步骤执行请求 DTO（解析后）。 */
export interface SopStepExecuteBody {
  readonly formValues: Readonly<Record<string, unknown>>;
  /** 卷宗 Storage 对象键列表（TUS 完成后由客户端回传）。 */
  readonly mediaObjectKeys?: readonly string[];
}

/**
 * 解析并校验步骤 execute 请求体；失败抛出 `ZodError`。
 */
export function parseSopStepExecuteBody(input: unknown): SopStepExecuteBody {
  const parsed = sopStepExecuteBodySchema.parse(input ?? {});
  return {
    formValues: parsed.formValues,
    mediaObjectKeys: parsed.mediaObjectKeys,
  };
}
