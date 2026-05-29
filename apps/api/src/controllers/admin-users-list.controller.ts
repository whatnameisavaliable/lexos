import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAdminUserListQuery } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminUserListService } from "../services/admin-user-list.service.js";

/** `GET /api/admin/users` Controller。 */
export class AdminUsersListController {
  constructor(
    private readonly adminUserListService: AdminUserListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const query = parseAdminUserListQuery(parseQueryString(req.url));
      const result = await this.adminUserListService.list(query);
      sendJsonSuccess(res, 200, result, this.requestIdHeader);
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid list query");
    }
  }
}
