import { z } from "zod";
import { DRIVE_FOLDER_NAME_MAX_LENGTH } from "../lib/sanitize-drive-folder-name.js";

const uuidSchema = z.string().uuid();

const folderNameSchema = z
  .string()
  .trim()
  .min(1, "name cannot be empty")
  .max(DRIVE_FOLDER_NAME_MAX_LENGTH);

/**
 * `PATCH /api/drive/nodes/:id` 请求体（重命名 / 移动）。
 */
export const driveNodeUpdateBodySchema = z
  .object({
    name: folderNameSchema.optional(),
    parentId: uuidSchema.optional(),
  })
  .strict()
  .refine((value) => value.name !== undefined || value.parentId !== undefined, {
    message: "at least one of name or parentId must be provided",
  });

/** 更新云盘节点 DTO（解析后）。 */
export type DriveNodeUpdateBody = z.infer<typeof driveNodeUpdateBodySchema>;

/**
 * 解析并校验节点更新请求体；失败抛出 `ZodError`。
 */
export function parseDriveNodeUpdateBody(input: unknown): DriveNodeUpdateBody {
  return driveNodeUpdateBodySchema.parse(input);
}
