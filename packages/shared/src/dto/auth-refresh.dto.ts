import { z } from "zod";

/**
 * `POST /api/auth/refresh` 请求体。
 */
export const authRefreshBodySchema = z.object({
  refreshToken: z.string().trim().min(1, "refreshToken is required"),
});

export type AuthRefreshBody = z.infer<typeof authRefreshBodySchema>;

export function parseAuthRefreshBody(input: unknown): AuthRefreshBody {
  return authRefreshBodySchema.parse(input);
}
