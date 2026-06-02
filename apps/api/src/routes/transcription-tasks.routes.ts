import type { IncomingMessage, ServerResponse } from "node:http";

import { matchRoutePattern } from "../lib/route-match.js";

import type { TranscriptionTasksListController } from "../controllers/transcription-tasks-list.controller.js";

import type { TranscriptionTasksGetController } from "../controllers/transcription-tasks-get.controller.js";

import type { TranscriptionTranscriptGetController } from "../controllers/transcription-transcript-get.controller.js";

import type { TranscriptionTranscriptPatchController } from "../controllers/transcription-transcript-patch.controller.js";

import type { TranscriptionTaskDownloadController } from "../controllers/transcription-task-download.controller.js";

import type { TranscriptionTaskExportDocxController } from "../controllers/transcription-task-export-docx.controller.js";

import type { TranscriptionTaskExportPdfController } from "../controllers/transcription-task-export-pdf.controller.js";

import type { TranscriptionTaskExportTxtController } from "../controllers/transcription-task-export-txt.controller.js";

import type { TranscriptionTaskDeleteController } from "../controllers/transcription-task-delete.controller.js";
import type { TranscriptionTasksRetryController } from "../controllers/transcription-tasks-retry.controller.js";



export interface TranscriptionTasksRouteHandlers {

  readonly list: TranscriptionTasksListController;

  readonly get: TranscriptionTasksGetController;

  readonly getTranscript: TranscriptionTranscriptGetController;

  readonly patchTranscript: TranscriptionTranscriptPatchController;

  readonly download: TranscriptionTaskDownloadController;

  readonly exportDocx: TranscriptionTaskExportDocxController;

  readonly exportPdf: TranscriptionTaskExportPdfController;

  readonly exportTxt: TranscriptionTaskExportTxtController;

  readonly delete: TranscriptionTaskDeleteController;

  readonly retry: TranscriptionTasksRetryController;

}



/**

 * 分发 `/api/transcription/tasks*`。

 */

export async function handleTranscriptionTasksRoute(

  req: IncomingMessage,

  res: ServerResponse,

  path: string,

  handlers: TranscriptionTasksRouteHandlers,

): Promise<boolean> {

  const method = req.method ?? "GET";



  if (method === "GET" && path === "/api/transcription/tasks") {

    await handlers.list.handle(req, res);

    return true;

  }



  const exportDocxParams = matchRoutePattern(

    "/api/transcription/tasks/:id/export/docx",

    path,

  );

  if (method === "POST" && exportDocxParams) {

    await handlers.exportDocx.handle(req, res, exportDocxParams);

    return true;

  }



  const exportPdfParams = matchRoutePattern(

    "/api/transcription/tasks/:id/export/pdf",

    path,

  );

  if (method === "POST" && exportPdfParams) {

    await handlers.exportPdf.handle(req, res, exportPdfParams);

    return true;

  }



  const exportTxtParams = matchRoutePattern(

    "/api/transcription/tasks/:id/export/txt",

    path,

  );

  if (method === "POST" && exportTxtParams) {

    await handlers.exportTxt.handle(req, res, exportTxtParams);

    return true;

  }



  const downloadParams = matchRoutePattern(

    "/api/transcription/tasks/:id/download",

    path,

  );

  if (method === "GET" && downloadParams) {

    await handlers.download.handle(req, res, downloadParams);

    return true;

  }



  const transcriptParams = matchRoutePattern(

    "/api/transcription/tasks/:id/transcript",

    path,

  );

  if (method === "GET" && transcriptParams) {

    await handlers.getTranscript.handle(req, res, transcriptParams);

    return true;

  }

  if (method === "PATCH" && transcriptParams) {

    await handlers.patchTranscript.handle(req, res, transcriptParams);

    return true;

  }



  const retryParams = matchRoutePattern("/api/transcription/tasks/:id/retry", path);

  if (method === "POST" && retryParams) {

    await handlers.retry.handle(req, res, retryParams);

    return true;

  }



  const getParams = matchRoutePattern("/api/transcription/tasks/:id", path);

  if (method === "GET" && getParams) {

    await handlers.get.handle(req, res, getParams);

    return true;

  }

  if (method === "DELETE" && getParams) {

    await handlers.delete.handle(req, res, getParams);

    return true;

  }



  return false;

}


