import {
  buildMustacheContextFromArtifacts,
  type FinalizedArtifactForContext,
} from "../domain/sop/build-mustache-context-from-artifacts.js";
import type { SopPromptContext } from "@lexos/shared";
import { renderMustacheTemplate } from "@lexos/shared";

/**
 * 组装 SOP 用户 Prompt：表单值 + 卷宗 OCR 文本 + 上游 Mustache 插槽。
 */
export function assembleUserPrompt(
  userTemplate: string,
  context: SopPromptContext,
): string {
  const artifactContext = buildMustacheContextFromArtifacts(
    context.finalizedArtifacts as readonly FinalizedArtifactForContext[],
  );
  const merged: Record<string, string> = {
    ...artifactContext,
    ...context.formValues,
    sop_media_extracted_text: context.sopMediaExtractedText,
  };
  return renderMustacheTemplate(userTemplate, merged);
}
