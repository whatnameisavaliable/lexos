import type { TaskStatus } from "./core.ts";

export type PortalLinkStatus = "active" | "expired" | "revoked";

export type PortalVerificationResult = {
  verified: boolean;
  reason?: "PHONE_MISMATCH" | "CODE_MISMATCH" | "LINK_INACTIVE";
};

export function verifyDemoPortalCode(input: {
  expectedCode?: string;
  expectedPhone: string;
  submittedPhone: string;
  submittedCode: string;
  linkStatus: PortalLinkStatus;
}): PortalVerificationResult {
  if (input.linkStatus !== "active") {
    return { verified: false, reason: "LINK_INACTIVE" };
  }

  if (input.expectedPhone !== input.submittedPhone) {
    return { verified: false, reason: "PHONE_MISMATCH" };
  }

  if (input.submittedCode !== (input.expectedCode ?? "111111")) {
    return { verified: false, reason: "CODE_MISMATCH" };
  }

  return { verified: true };
}

export function canCustomerDownloadDeliverable(taskStatus: TaskStatus): boolean {
  return ["approved", "customer_confirmed", "settlement_pending", "settled"].includes(taskStatus);
}
