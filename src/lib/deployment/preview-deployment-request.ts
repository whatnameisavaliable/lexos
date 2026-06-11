import {
  buildDeploymentChannelReadiness,
  readDeploymentChannelInventory,
  requiredVercelIgnorePatterns,
  type DeploymentChannelInventory,
  type DeploymentMethod,
} from "./deployment-channel.ts";
import {
  buildPreviewReadiness,
  type PreviewReadiness,
} from "./preview-readiness.ts";
import {
  buildVercelUploadPackageCheck,
  type VercelUploadPackageCheck,
} from "./vercel-upload-package.ts";

export const VERCEL_PREVIEW_DEPLOYMENT_REQUEST_KIND = "lexos-vercel-preview-deployment-request";

export type VercelPreviewDeploymentRequest = {
  version: 1;
  app: "lexos";
  kind: typeof VERCEL_PREVIEW_DEPLOYMENT_REQUEST_KIND;
  generatedAt: string;
  ok: boolean;
  provider: string;
  target: "preview";
  method: DeploymentMethod;
  approvalStatus: "approved" | "pending";
  approvalRef: string;
  requiredApprovalStatement: string;
  previewReadiness: PreviewReadiness;
  uploadPackage: {
    ok: boolean;
    includedFileCount: number;
    includedBytes: number;
    highRiskIncludedPaths: string[];
    sensitiveFindings: number;
  };
  deploymentChannel: {
    gitRemoteUrl?: string;
    hasVercelCli: boolean;
    hasVercelIgnore: boolean;
    hasVercelLink: boolean;
    requiredIgnorePatternCount: number;
    presentIgnorePatternCount: number;
  };
  blockers: string[];
  warnings: string[];
  nextActions: string[];
};

const defaultApprovalStatement = "I approve uploading the current private LexOS project to Vercel Preview.";

const ignoredApprovalBlockerPrefixes = [
  "External upload is not explicitly approved.",
  "Deployment approval evidence is missing.",
  "Production deployment requires explicit production approval.",
];

export function buildVercelPreviewDeploymentRequest(options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
  previewReadiness?: PreviewReadiness;
  deploymentChannelInventory?: DeploymentChannelInventory;
  vercelUploadPackageCheck?: VercelUploadPackageCheck;
} = {}): VercelPreviewDeploymentRequest {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const generatedAt = options.generatedAt ?? new Date();
  const previewReadiness = options.previewReadiness ?? buildPreviewReadiness(env);
  const deploymentChannel = buildDeploymentChannelReadiness({
    cwd,
    env,
    generatedAt,
    inventory: options.deploymentChannelInventory ?? readDeploymentChannelInventory(cwd, env),
  });
  const uploadPackage = options.vercelUploadPackageCheck ?? buildVercelUploadPackageCheck({ cwd, generatedAt });
  const blockers: string[] = [];
  const warnings = [
    "This request is read-only. It does not upload code, create an archive, call Vercel, link a project, push Git, or read secret values.",
    ...previewReadiness.warnings.map((warning) => `Preview readiness: ${warning}`),
    ...deploymentChannel.warnings.map((warning) => `Deployment channel: ${warning}`),
    ...uploadPackage.warnings.map((warning) => `Upload package: ${warning}`),
  ];

  if (!previewReadiness.ok) {
    blockers.push(`Preview readiness is blocked. Missing Supabase variables: ${previewReadiness.missingSupabaseEnvKeys.join(", ")}.`);
  }

  if (deploymentChannel.target !== "preview") {
    blockers.push("Preview deployment request only prepares Vercel Preview. Set LEXOS_DEPLOY_TARGET=preview before requesting upload approval.");
  }

  deploymentChannel.blockers
    .filter((blocker) => !isApprovalBlocker(blocker))
    .forEach((blocker) => blockers.push(`Deployment channel: ${blocker}`));

  uploadPackage.blockers.forEach((blocker) => blockers.push(`Upload package: ${blocker}`));

  const approvalStatus = deploymentChannel.uploadApproved && deploymentChannel.approvalRef !== "not-set"
    ? "approved"
    : "pending";

  if (approvalStatus === "pending") {
    warnings.push("External upload is still pending explicit user approval.");
  }

  return {
    version: 1,
    app: "lexos",
    kind: VERCEL_PREVIEW_DEPLOYMENT_REQUEST_KIND,
    generatedAt: generatedAt.toISOString(),
    ok: blockers.length === 0,
    provider: deploymentChannel.provider,
    target: "preview",
    method: deploymentChannel.method,
    approvalStatus,
    approvalRef: deploymentChannel.approvalRef,
    requiredApprovalStatement: defaultApprovalStatement,
    previewReadiness,
    uploadPackage: {
      ok: uploadPackage.ok,
      includedBytes: uploadPackage.includedBytes,
      includedFileCount: uploadPackage.includedFileCount,
      highRiskIncludedPaths: uploadPackage.highRiskIncludedPaths,
      sensitiveFindings: uploadPackage.sensitiveFindings.length,
    },
    deploymentChannel: {
      gitRemoteUrl: deploymentChannel.inventory.gitRemoteUrl,
      hasVercelCli: deploymentChannel.inventory.hasVercelCli,
      hasVercelIgnore: deploymentChannel.inventory.hasVercelIgnore,
      hasVercelLink: deploymentChannel.inventory.hasVercelProjectConfig || deploymentChannel.inventory.hasVercelRepoConfig,
      presentIgnorePatternCount: deploymentChannel.inventory.vercelIgnorePatterns.length,
      requiredIgnorePatternCount: requiredVercelIgnorePatterns.length,
    },
    blockers,
    warnings,
    nextActions: buildNextActions(approvalStatus, deploymentChannel.method),
  };
}

export function formatVercelPreviewDeploymentRequest(request: VercelPreviewDeploymentRequest): string {
  const lines = [
    "# Lexos Vercel Preview Deployment Request",
    "",
    `Generated at: ${request.generatedAt}`,
    `Status: ${request.ok ? "ready for approval" : "blocked"}`,
    `Provider: ${request.provider}`,
    `Target: ${request.target}`,
    `Method: ${request.method}`,
    `Approval status: ${request.approvalStatus}`,
    `Approval ref: ${request.approvalRef}`,
    `Preview mode: ${request.previewReadiness.mode}`,
    `Preview readiness: ${request.previewReadiness.ok ? "passed" : "blocked"}`,
    `Upload package: ${request.uploadPackage.ok ? "passed" : "blocked"}`,
    `Included files: ${request.uploadPackage.includedFileCount}`,
    `Included bytes: ${request.uploadPackage.includedBytes}`,
    `High-risk included paths: ${request.uploadPackage.highRiskIncludedPaths.length}`,
    `Sensitive findings: ${request.uploadPackage.sensitiveFindings}`,
    `Git remote: ${request.deploymentChannel.gitRemoteUrl ?? "not found"}`,
    `Vercel link: ${request.deploymentChannel.hasVercelLink ? "present" : "not found"}`,
    `Vercel CLI: ${request.deploymentChannel.hasVercelCli ? "available" : "not found"}`,
    `Required approval statement: ${request.requiredApprovalStatement}`,
    `Command: \`npm.cmd run deploy:preview:request\``,
    "",
  ];

  if (request.blockers.length) {
    lines.push("## Blockers", "");
    request.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  if (request.warnings.length) {
    lines.push("## Warnings", "");
    request.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push("");
  }

  lines.push("## Next Actions", "");
  request.nextActions.forEach((action) => lines.push(`- ${action}`));
  lines.push("");
  lines.push("## Execution Boundary", "");
  lines.push("- This command only prepares an approval packet for Vercel Preview.");
  lines.push("- It does not upload the project, create an archive, call Vercel APIs, link a project, push Git, or read secret values.");
  lines.push("- Production deployment is out of scope for this request.");

  return lines.join("\n").trimEnd();
}

function isApprovalBlocker(blocker: string): boolean {
  return ignoredApprovalBlockerPrefixes.some((prefix) => blocker.startsWith(prefix));
}

function buildNextActions(approvalStatus: VercelPreviewDeploymentRequest["approvalStatus"], method: DeploymentMethod): string[] {
  const actions = [
    "Archive this request output with the deployment evidence.",
  ];

  if (approvalStatus === "pending") {
    actions.push(`Ask the user to approve with: ${defaultApprovalStatement}`);
  } else {
    actions.push("Verify the approval reference maps to an explicit user approval before upload.");
  }

  actions.push(`Deploy using the approved ${method} Preview path.`);
  actions.push("After deployment, set LEXOS_PREVIEW_BASE_URL to the Preview URL and run npm.cmd run smoke:preview.");

  return actions;
}
