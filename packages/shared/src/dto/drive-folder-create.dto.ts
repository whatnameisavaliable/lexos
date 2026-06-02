import { z } from "zod";
import { DRIVE_FOLDER_NAME_MAX_LENGTH } from "../lib/sanitize-drive-folder-name.js";

const parentIdSchema = z.string().uuid("parentId must be a UUID");

const folderNameSchema = z
  .string()
  .trim()
  .min(1, "name is required")
  .max(DRIVE_FOLDER_NAME_MAX_LENGTH);

/**
 * `POST /api/drive/folders` 请求体。
 */
export const driveFolderCreateBodySchema = z
  .object({
    parentId: parentIdSchema,
    name: folderNameSchema,
  })
  .strict();

/** 创建云盘文件夹 DTO（解析后）。 */
export type DriveFolderCreateBody = z.infer<typeof driveFolderCreateBodySchema>;

/**
 * 解析并校验创建文件夹请求体；失败抛出 `ZodError`。
 */
export function parseDriveFolderCreateBody(
  input: unknown,
): DriveFolderCreateBody {
  return driveFolderCreateBodySchema.parse(input);
}
