import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJsonSuccess } from "../lib/http.js";
import type { AdminUserGetService } from "../services/admin-user-get.service.js";

/** `GET /api/admin/users/:id` Controller。 */
export class AdminUsersGetController {
  constructor(
    private readonly adminUserGetService: AdminUserGetService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const result = await this.adminUserGetService.getById(params.id);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
