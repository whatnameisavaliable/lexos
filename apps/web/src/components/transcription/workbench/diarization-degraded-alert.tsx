import { Alert, AlertDescription } from "@/components/ui/alert";

/** Diarization 降级固定 Banner（`prd.md` §4.3 · `ui_design.md` §4.3.5）。 */
export function DiarizationDegradedAlert() {
  return (
    <Alert>
      <AlertDescription>
        音频声纹重叠严重，已降级为无区分文本展示
      </AlertDescription>
    </Alert>
  );
}
