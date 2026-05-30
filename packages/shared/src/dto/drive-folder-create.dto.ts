import { z } from "zod";

/** `drive_nodes.name` 最大长度（`database.md` §3.5）。 */
export const DRIVE_FOLDER_NAME_MAX_LENGTH = 256;

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
