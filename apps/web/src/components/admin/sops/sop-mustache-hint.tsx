import { stepCodeToMustacheArtifactPrefix } from "@lexos/shared";

/** Mustache 插槽说明（`prd.md` §2.4）。 */
export function SopMustacheHint({
  stepCode,
}: {
  readonly stepCode?: string;
}) {
  const examplePrefix = stepCode
    ? stepCodeToMustacheArtifactPrefix(stepCode)
    : "artifact_{step_code}_";

  return (
    <p className="text-muted-foreground text-sm">
      Prompt 中引用上游产出物时使用 Mustache 插槽，格式为{" "}
      <code className="text-foreground">{`{{${examplePrefix}*}}`}</code>
      ，对应的前置步骤须列入 <code className="text-foreground">depends_on</code>
      。
    </p>
  );
}

/** 静态说明文案（测试用）。 */
export function mustacheHintContainsStepCode(stepCode: string): boolean {
  return stepCodeToMustacheArtifactPrefix(stepCode).startsWith("artifact_");
}
