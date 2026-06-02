import { ErrorCode } from "../api/error-code.js";
import { LexosError } from "../errors/lexos-error.js";
import { stepCodeToMustacheArtifactPrefix } from "./step-code-to-mustache-token.js";

/**
 * 断言 `artifact_*` 插槽引用的 `step_code` 均列于 `depends_on`（`prd.md` §2.4）。
 */
export function assertMustacheSlotsCoveredByDependsOn(
  slots: readonly string[],
  dependsOn: readonly string[],
): void {
  const allowedPrefixes = dependsOn.map((code) =>
    stepCodeToMustacheArtifactPrefix(code),
  );

  for (const slot of slots) {
    if (!slot.startsWith("artifact_")) {
      continue;
    }
    const covered = allowedPrefixes.some((prefix) => slot.startsWith(prefix));
    if (!covered) {
      throw new LexosError(
        ErrorCode.VALIDATION_FAILED,
        `Mustache slot "${slot}" references a step not listed in depends_on`,
      );
    }
  }
}
