import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const SOP_DEEP_RESEARCH_OFFLINE_MESSAGE =
  "外网检索不可用，幻觉风险上升";

export interface SopDeepResearchOfflineBannerProps {
  readonly visible?: boolean;
}

/** Deep Research 外网不可用提示（`architecture.md` §3.2.6.7）。 */
export function SopDeepResearchOfflineBanner({
  visible = true,
}: SopDeepResearchOfflineBannerProps) {
  if (!visible) {
    return null;
  }
  return (
    <Alert variant="destructive">
      <AlertTitle>深度研究受限</AlertTitle>
      <AlertDescription>{SOP_DEEP_RESEARCH_OFFLINE_MESSAGE}</AlertDescription>
    </Alert>
  );
}
