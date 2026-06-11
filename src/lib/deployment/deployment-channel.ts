import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const DEPLOYMENT_CHANNEL_KIND = "lexos-deployment-channel-readiness";

export type DeploymentTarget = "preview" | "production";

export type DeploymentMethod =
  | "vercel-cli"
  | "vercel-git"
  | "vercel-mcp"
  | "vercel-dashboard"
  | "manual";

export type DeploymentChannelInventory = {
  gitRemoteUrl?: string;
  hasVercelCli: boolean;
  hasVercelIgnore: boolean;
  hasVercelJson: boolean;
  hasVercelProjectConfig: boolean;
  hasVercelRepoConfig: boolean;
  vercelIgnorePatterns: string[];
};

export type DeploymentChannelReadiness = {
  version: 1;
  app: "lexos";
  kind: typeof DEPLOYMENT_CHANNEL_KIND;
  generatedAt: string;
  provider: string;
  target: DeploymentTarget;
  method: DeploymentMethod;
  uploadApproved: boolean;
  productionApproved: boolean;
  approvalRef: string;
  expectedUrl: string;
  inventory: DeploymentChannelInventory;
  ok: boolean;
  blockers: string[];
  warnings: string[];
};

const defaultProvider = "vercel";
const defaultApprovalRef = "not-set";
const defaultExpectedUrl = "not-set";
const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|sms)/i;
export const requiredVercelIgnorePatterns = [
  ".env",
  ".env*.local",
  ".git/",
  ".next/",
  ".tmp/",
  "backups/",
  "coverage/",
  "dev-server*.log",
  "dist/",
  "node_modules/",
  "playwright-report/",
  "reports/",
  "supabase/.temp/",
  "test-results/",
  "tests/",
  "tsconfig.tsbuildinfo",
  "*.log",
] as const;
const deploymentMethods: DeploymentMethod[] = [
  "vercel-cli",
  "vercel-git",
  "vercel-mcp",
  "vercel-dashboard",
  "manual",
];

export function readDeploymentChannelInventory(
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): DeploymentChannelInventory {
  const vercelIgnorePath = path.join(cwd, ".vercelignore");

  return {
    gitRemoteUrl: readOriginRemoteUrl(cwd),
    hasVercelCli: commandExists("vercel", env),
    hasVercelIgnore: existsSync(vercelIgnorePath),
    hasVercelJson: existsSync(path.join(cwd, "vercel.json")),
    hasVercelProjectConfig: existsSync(path.join(cwd, ".vercel", "project.json")),
    hasVercelRepoConfig: existsSync(path.join(cwd, ".vercel", "repo.json")),
    vercelIgnorePatterns: existsSync(vercelIgnorePath) ? readIgnorePatterns(vercelIgnorePath) : [],
  };
}

export function buildDeploymentChannelReadiness(options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
  inventory?: DeploymentChannelInventory;
} = {}): DeploymentChannelReadiness {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const inventory = options.inventory ?? readDeploymentChannelInventory(cwd, env);
  const provider = env.LEXOS_DEPLOY_PROVIDER || defaultProvider;
  const target = normalizeTarget(env.LEXOS_DEPLOY_TARGET);
  const method = normalizeMethod(env.LEXOS_DEPLOY_METHOD) ?? inferDeploymentMethod(inventory);
  const uploadApproved = env.LEXOS_DEPLOY_APPROVED_TO_UPLOAD === "true";
  const productionApproved = env.LEXOS_DEPLOY_PRODUCTION_APPROVED === "true";
  const approvalRef = env.LEXOS_DEPLOY_APPROVAL_REF || defaultApprovalRef;
  const expectedUrl = env.LEXOS_DEPLOY_EXPECTED_URL || env.LEXOS_POST_DEPLOYMENT_BASE_URL || env.LEXOS_PREVIEW_BASE_URL || defaultExpectedUrl;
  const blockers: string[] = [];
  const warnings: string[] = [
    "This check is read-only. It does not upload code, contact Vercel, create projects, push git, or read secret values.",
  ];

  if (provider !== "vercel") {
    blockers.push("Only the Vercel deployment provider is documented for this release. Set LEXOS_DEPLOY_PROVIDER=vercel.");
  }

  if (!uploadApproved) {
    blockers.push("External upload is not explicitly approved. Set LEXOS_DEPLOY_APPROVED_TO_UPLOAD=true only after the user approves deploying this private project.");
  }

  if (approvalRef === defaultApprovalRef) {
    blockers.push("Deployment approval evidence is missing. Set LEXOS_DEPLOY_APPROVAL_REF to the chat, ticket, or signoff reference that approved upload.");
  }

  if (!inventory.hasVercelIgnore) {
    blockers.push("Vercel upload ignore list is missing. Add .vercelignore before uploading this private project.");
  } else {
    const missingIgnorePatterns = requiredVercelIgnorePatterns.filter(
      (pattern) => !hasIgnorePattern(inventory.vercelIgnorePatterns, pattern),
    );

    if (missingIgnorePatterns.length) {
      blockers.push(`.vercelignore is missing required upload exclusions: ${missingIgnorePatterns.join(", ")}.`);
    }
  }

  if (target === "production" && !productionApproved) {
    blockers.push("Production deployment requires explicit production approval. Set LEXOS_DEPLOY_PRODUCTION_APPROVED=true only after production release is approved.");
  }

  if (method === "vercel-cli" && !inventory.hasVercelCli) {
    blockers.push("LEXOS_DEPLOY_METHOD=vercel-cli but the Vercel CLI is not available on PATH.");
  }

  if (method === "vercel-git" && !inventory.gitRemoteUrl) {
    blockers.push("LEXOS_DEPLOY_METHOD=vercel-git but no origin git remote was found.");
  }

  if (method === "manual") {
    warnings.push("Manual deployment method selected; archive the dashboard deployment URL and build log reference after upload.");
  }

  if (method === "vercel-mcp") {
    warnings.push("Vercel MCP deployment is operator-controlled; this local script can only verify the declared method and approval metadata.");
  }

  if (!inventory.hasVercelProjectConfig && !inventory.hasVercelRepoConfig) {
    warnings.push("No .vercel project or repo link is present locally; the first Vercel deployment may need to create or link a project.");
  }

  if (
    !inventory.hasVercelCli &&
    method !== "vercel-git" &&
    method !== "vercel-mcp" &&
    method !== "vercel-dashboard" &&
    method !== "manual"
  ) {
    blockers.push("No local Vercel CLI deployment channel is available. Install/authenticate Vercel CLI, use Vercel MCP, or use a documented manual dashboard deployment.");
  }

  if (secretLikePattern.test(approvalRef) || secretLikePattern.test(expectedUrl)) {
    blockers.push("Deployment approval references and expected URLs must not contain tokens, secrets, connection strings, access keys, or SMS provider details.");
  }

  if (target === "preview") {
    warnings.push("Preview is the default deployment target; production remains blocked until explicitly approved.");
  }

  return {
    version: 1,
    app: "lexos",
    kind: DEPLOYMENT_CHANNEL_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    provider,
    target,
    method,
    uploadApproved,
    productionApproved,
    approvalRef,
    expectedUrl,
    inventory,
    ok: blockers.length === 0,
    blockers,
    warnings,
  };
}

export function formatDeploymentChannelReadiness(readiness: DeploymentChannelReadiness): string {
  const lines = [
    "# Lexos Deployment Channel Readiness",
    "",
    `Generated at: ${readiness.generatedAt}`,
    `Status: ${readiness.ok ? "passed" : "blocked"}`,
    `Provider: ${readiness.provider}`,
    `Target: ${readiness.target}`,
    `Method: ${readiness.method}`,
    `Upload approved: ${readiness.uploadApproved ? "yes" : "no"}`,
    `Production approved: ${readiness.productionApproved ? "yes" : "no"}`,
    `Approval ref: ${readiness.approvalRef}`,
    `Expected URL: ${readiness.expectedUrl}`,
    `Git remote: ${readiness.inventory.gitRemoteUrl ?? "not found"}`,
    `Vercel link: ${readiness.inventory.hasVercelProjectConfig || readiness.inventory.hasVercelRepoConfig ? "present" : "not found"}`,
    `Vercel CLI: ${readiness.inventory.hasVercelCli ? "available" : "not found"}`,
    `Vercel ignore: ${readiness.inventory.hasVercelIgnore ? "present" : "missing"}`,
    `Vercel ignore exclusions: ${countRequiredIgnorePatterns(readiness.inventory.vercelIgnorePatterns)}/${requiredVercelIgnorePatterns.length}`,
    `Command: \`npm.cmd run deploy:channel:check\``,
    "",
  ];

  if (readiness.blockers.length) {
    lines.push("## Blockers", "");
    readiness.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  if (readiness.warnings.length) {
    lines.push("## Warnings", "");
    readiness.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push("");
  }

  lines.push("## Execution Boundary", "");
  lines.push("- This command is a local read-only deployment-channel check.");
  lines.push("- It does not upload the project, push git, create a Vercel project, or call Vercel APIs.");
  lines.push("- Production deployment must remain disabled unless the user explicitly approves production release.");

  return lines.join("\n").trimEnd();
}

function inferDeploymentMethod(inventory: DeploymentChannelInventory): DeploymentMethod {
  if ((inventory.hasVercelProjectConfig || inventory.hasVercelRepoConfig) && inventory.gitRemoteUrl) {
    return "vercel-git";
  }

  if (inventory.hasVercelCli) {
    return "vercel-cli";
  }

  return "manual";
}

function normalizeTarget(value: string | undefined): DeploymentTarget {
  return value === "production" ? "production" : "preview";
}

function normalizeMethod(value: string | undefined): DeploymentMethod | undefined {
  return deploymentMethods.find((method) => method === value);
}

function readOriginRemoteUrl(cwd: string): string | undefined {
  const gitConfigPath = path.join(cwd, ".git", "config");

  if (!existsSync(gitConfigPath)) {
    return undefined;
  }

  const config = readFileSync(gitConfigPath, "utf8");
  const remoteBlock = config.match(/\[remote "origin"\]([\s\S]*?)(?:\n\[|$)/);
  const urlLine = remoteBlock?.[1]?.match(/^\s*url\s*=\s*(.+)\s*$/m);

  return urlLine?.[1]?.trim();
}

function readIgnorePatterns(filePath: string): string[] {
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => normalizeIgnorePattern(line))
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("!"));
}

function hasIgnorePattern(patterns: string[], required: string): boolean {
  const normalizedRequired = normalizeIgnorePattern(required);
  const candidates = new Set([
    normalizedRequired,
    normalizedRequired.endsWith("/") ? normalizedRequired.slice(0, -1) : `${normalizedRequired}/`,
  ]);

  return patterns.some((pattern) => candidates.has(normalizeIgnorePattern(pattern)));
}

function countRequiredIgnorePatterns(patterns: string[]): number {
  return requiredVercelIgnorePatterns.filter((pattern) => hasIgnorePattern(patterns, pattern)).length;
}

function normalizeIgnorePattern(pattern: string): string {
  return pattern.trim().replaceAll("\\", "/").replace(/^\/+/, "");
}

function commandExists(command: string, env: NodeJS.ProcessEnv): boolean {
  const pathValue = env.PATH || env.Path || env.path || "";
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";")
    : [""];

  return pathEntries.some((entry) => (
    extensions.some((extension) => existsSync(path.join(entry, `${command}${extension.toLowerCase()}`))
      || existsSync(path.join(entry, `${command}${extension.toUpperCase()}`)))
  ));
}
