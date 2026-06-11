export const VERCEL_PREVIEW_DEPLOYMENT_EVIDENCE_KIND = "lexos-vercel-preview-deployment-evidence";

export type PreviewDeploymentEvidenceItemId =
  | "approval"
  | "preview-url"
  | "deployment-ref"
  | "build-log"
  | "smoke"
  | "owner"
  | "deployed-at";

export type PreviewDeploymentEvidenceItem = {
  id: PreviewDeploymentEvidenceItemId;
  title: string;
  value: string;
  ok: boolean;
  notes: string[];
};

export type VercelPreviewDeploymentEvidence = {
  version: 1;
  app: "lexos";
  kind: typeof VERCEL_PREVIEW_DEPLOYMENT_EVIDENCE_KIND;
  generatedAt: string;
  ok: boolean;
  approvalApproved: boolean;
  approvalRef: string;
  previewUrl: string;
  deploymentRef: string;
  buildLogRef: string;
  smokeRef: string;
  owner: string;
  deployedAt: string;
  claimUrl: string;
  evidenceItems: PreviewDeploymentEvidenceItem[];
  blockers: string[];
  warnings: string[];
};

const notSet = "not-set";
const sensitiveRefPattern =
  /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|sms)/i;

export function getVercelPreviewDeploymentEvidenceConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  approvalApproved: boolean;
  approvalRef: string;
  buildLogRef: string;
  claimUrl: string;
  deployedAt: string;
  deploymentRef: string;
  owner: string;
  previewUrl: string;
  smokeRef: string;
} {
  return {
    approvalApproved: env.LEXOS_DEPLOY_APPROVED_TO_UPLOAD === "true",
    approvalRef: env.LEXOS_DEPLOY_APPROVAL_REF || notSet,
    buildLogRef: env.LEXOS_PREVIEW_BUILD_LOG_REF || notSet,
    claimUrl: env.LEXOS_PREVIEW_CLAIM_URL || notSet,
    deployedAt: env.LEXOS_PREVIEW_DEPLOYED_AT || notSet,
    deploymentRef: env.LEXOS_PREVIEW_DEPLOYMENT_REF || env.LEXOS_PREVIEW_DEPLOYMENT_ID || notSet,
    owner: env.LEXOS_PREVIEW_DEPLOYMENT_OWNER || env.LEXOS_POST_DEPLOYMENT_OWNER || notSet,
    previewUrl: env.LEXOS_PREVIEW_BASE_URL || env.LEXOS_POST_DEPLOYMENT_BASE_URL || notSet,
    smokeRef: env.LEXOS_PREVIEW_SMOKE_REF || notSet,
  };
}

export function buildVercelPreviewDeploymentEvidence(options: {
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
} = {}): VercelPreviewDeploymentEvidence {
  const generatedAt = options.generatedAt ?? new Date();
  const config = getVercelPreviewDeploymentEvidenceConfigFromEnv(options.env ?? process.env);
  const blockers: string[] = [];
  const warnings = [
    "This check is read-only. It does not upload code, call Vercel, inspect deployments, run smoke tests, or write evidence files.",
    "Run this after a real Vercel Preview upload and after `npm.cmd run smoke:preview` has produced a result to archive.",
  ];

  if (!config.approvalApproved) {
    blockers.push("Preview deployment evidence requires LEXOS_DEPLOY_APPROVED_TO_UPLOAD=true from the approved upload turn.");
  }

  if (isUnset(config.approvalRef)) {
    blockers.push("Preview deployment evidence requires LEXOS_DEPLOY_APPROVAL_REF with the approval chat, ticket, or signoff reference.");
  }

  if (isUnset(config.previewUrl)) {
    blockers.push("Preview deployment evidence requires LEXOS_PREVIEW_BASE_URL with the public Vercel Preview URL.");
  } else {
    blockers.push(...validatePublicPreviewUrl(config.previewUrl, "LEXOS_PREVIEW_BASE_URL"));
  }

  if (isUnset(config.deploymentRef)) {
    blockers.push("Preview deployment evidence requires LEXOS_PREVIEW_DEPLOYMENT_REF or LEXOS_PREVIEW_DEPLOYMENT_ID.");
  }

  if (isUnset(config.buildLogRef)) {
    blockers.push("Preview deployment evidence requires LEXOS_PREVIEW_BUILD_LOG_REF with a build log, dashboard, or deployment inspection reference.");
  }

  if (isUnset(config.smokeRef)) {
    blockers.push("Preview deployment evidence requires LEXOS_PREVIEW_SMOKE_REF with the archived `npm.cmd run smoke:preview` result.");
  }

  if (isUnset(config.owner)) {
    blockers.push("Preview deployment evidence requires LEXOS_PREVIEW_DEPLOYMENT_OWNER or LEXOS_POST_DEPLOYMENT_OWNER.");
  }

  if (isUnset(config.deployedAt)) {
    blockers.push("Preview deployment evidence requires LEXOS_PREVIEW_DEPLOYED_AT as an ISO timestamp.");
  } else {
    const deployedAtCheck = validateTimestamp(config.deployedAt, generatedAt);

    if (deployedAtCheck) {
      blockers.push(deployedAtCheck);
    }
  }

  const sensitiveValueNames = [
    ["LEXOS_DEPLOY_APPROVAL_REF", config.approvalRef],
    ["LEXOS_PREVIEW_DEPLOYMENT_REF", config.deploymentRef],
    ["LEXOS_PREVIEW_BUILD_LOG_REF", config.buildLogRef],
    ["LEXOS_PREVIEW_SMOKE_REF", config.smokeRef],
    ["LEXOS_PREVIEW_DEPLOYMENT_OWNER", config.owner],
    ["LEXOS_PREVIEW_DEPLOYED_AT", config.deployedAt],
    ["LEXOS_PREVIEW_CLAIM_URL", config.claimUrl],
  ] as const;

  for (const [name, value] of sensitiveValueNames) {
    if (!isUnset(value) && sensitiveRefPattern.test(value)) {
      blockers.push(`${name} must be an evidence reference, URL, owner, or timestamp; it must not contain credentials or postponed capability traces.`);
    }
  }

  if (!isUnset(config.claimUrl)) {
    blockers.push(...validateOptionalUrl(config.claimUrl, "LEXOS_PREVIEW_CLAIM_URL"));
  }

  const evidenceItems = buildEvidenceItems(config, generatedAt);

  return {
    version: 1,
    app: "lexos",
    kind: VERCEL_PREVIEW_DEPLOYMENT_EVIDENCE_KIND,
    generatedAt: generatedAt.toISOString(),
    ok: blockers.length === 0,
    approvalApproved: config.approvalApproved,
    approvalRef: config.approvalRef,
    previewUrl: config.previewUrl,
    deploymentRef: config.deploymentRef,
    buildLogRef: config.buildLogRef,
    smokeRef: config.smokeRef,
    owner: config.owner,
    deployedAt: config.deployedAt,
    claimUrl: config.claimUrl,
    evidenceItems,
    blockers,
    warnings,
  };
}

export function formatVercelPreviewDeploymentEvidence(report: VercelPreviewDeploymentEvidence): string {
  const lines = [
    "# Lexos Vercel Preview Deployment Evidence",
    "",
    `Generated at: ${report.generatedAt}`,
    `Status: ${report.ok ? "complete" : "incomplete"}`,
    `Approval status: ${report.approvalApproved ? "approved" : "missing"}`,
    `Approval ref: ${report.approvalRef}`,
    `Preview URL: ${report.previewUrl}`,
    `Deployment ref: ${report.deploymentRef}`,
    `Build log ref: ${report.buildLogRef}`,
    `Smoke ref: ${report.smokeRef}`,
    `Owner: ${report.owner}`,
    `Deployed at: ${report.deployedAt}`,
    `Claim URL: ${report.claimUrl}`,
    "Command: `npm.cmd run deploy:preview:evidence`",
    "",
  ];

  if (report.blockers.length) {
    lines.push("## Blockers", "");
    report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  if (report.warnings.length) {
    lines.push("## Warnings", "");
    report.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push("");
  }

  lines.push("## Evidence Items", "");
  report.evidenceItems.forEach((item) => {
    lines.push(`- ${item.ok ? "[x]" : "[ ]"} ${item.title}: ${item.value}`);
    item.notes.forEach((note) => lines.push(`  - ${note}`));
  });

  lines.push("");
  lines.push("## Execution Boundary", "");
  lines.push("- This command only verifies the local evidence metadata for an already completed Vercel Preview upload.");
  lines.push("- It does not deploy, upload, call Vercel APIs, link a project, push Git, or run Playwright.");
  lines.push("- Production deployment evidence is out of scope for this Preview-only check.");

  return lines.join("\n").trimEnd();
}

function buildEvidenceItems(
  config: ReturnType<typeof getVercelPreviewDeploymentEvidenceConfigFromEnv>,
  generatedAt: Date,
): PreviewDeploymentEvidenceItem[] {
  return [
    {
      id: "approval",
      title: "Upload approval",
      value: config.approvalApproved && !isUnset(config.approvalRef) ? config.approvalRef : notSet,
      ok: config.approvalApproved && !isUnset(config.approvalRef),
      notes: ["Must point to the user-approved upload turn, ticket, or signoff record."],
    },
    {
      id: "preview-url",
      title: "Public Preview URL",
      value: config.previewUrl,
      ok: !isUnset(config.previewUrl) && validatePublicPreviewUrl(config.previewUrl, "LEXOS_PREVIEW_BASE_URL").length === 0,
      notes: ["Must be an HTTPS public URL, normally a vercel.app Preview URL or a protected Preview domain."],
    },
    {
      id: "deployment-ref",
      title: "Vercel deployment reference",
      value: config.deploymentRef,
      ok: !isUnset(config.deploymentRef),
      notes: ["Can be a Vercel deployment id, URL, dashboard reference, or connector response id."],
    },
    {
      id: "build-log",
      title: "Build log reference",
      value: config.buildLogRef,
      ok: !isUnset(config.buildLogRef),
      notes: ["Should allow the handoff owner to find build logs if Preview smoke fails later."],
    },
    {
      id: "smoke",
      title: "Preview smoke result",
      value: config.smokeRef,
      ok: !isUnset(config.smokeRef),
      notes: ["Archive the `npm.cmd run smoke:preview` output or Playwright report reference."],
    },
    {
      id: "owner",
      title: "Deployment owner",
      value: config.owner,
      ok: !isUnset(config.owner),
      notes: ["Names the person responsible for the Preview deployment evidence."],
    },
    {
      id: "deployed-at",
      title: "Deployment timestamp",
      value: config.deployedAt,
      ok: !isUnset(config.deployedAt) && validateTimestamp(config.deployedAt, generatedAt) === undefined,
      notes: ["Use an ISO timestamp from the deployment event or evidence archive time."],
    },
  ];
}

function isUnset(value: string): boolean {
  return !value || value === notSet;
}

function validatePublicPreviewUrl(value: string, envName: string): string[] {
  const blockers = validateOptionalUrl(value, envName);

  if (blockers.length) {
    return blockers;
  }

  const parsed = new URL(value);
  const hostname = parsed.hostname.toLowerCase();

  if (parsed.protocol !== "https:") {
    blockers.push(`${envName} must use https for Vercel Preview evidence.`);
  }

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    blockers.push(`${envName} must be a public Preview URL, not a local development address.`);
  }

  return blockers;
}

function validateOptionalUrl(value: string, envName: string): string[] {
  const blockers: string[] = [];

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      blockers.push(`${envName} must be an http or https URL.`);
    }

    if (parsed.username || parsed.password) {
      blockers.push(`${envName} must not embed credentials.`);
    }

    if (sensitiveRefPattern.test(parsed.search) || sensitiveRefPattern.test(parsed.hash)) {
      blockers.push(`${envName} must not include credential-like query or hash fragments.`);
    }
  } catch {
    blockers.push(`${envName} must be a valid URL.`);
  }

  return blockers;
}

function validateTimestamp(value: string, generatedAt: Date): string | undefined {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "LEXOS_PREVIEW_DEPLOYED_AT must be a valid ISO timestamp.";
  }

  if (timestamp > generatedAt.getTime() + 60_000) {
    return "LEXOS_PREVIEW_DEPLOYED_AT cannot be in the future.";
  }

  return undefined;
}
