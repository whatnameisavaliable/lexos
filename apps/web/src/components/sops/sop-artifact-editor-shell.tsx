"use client";

import { useCallback, useEffect, useState } from "react";
import type { ArtifactContentType, PipelineArtifactStatus } from "@lexos/shared";
import {
  getSopArtifact,
  patchSopArtifact,
  type SopArtifactDetail,
} from "@/lib/lawyer-sops-api";
import { toApiClientError, ApiClientError } from "@/lib/api-client";
import { SopArtifactJsonViewer } from "./sop-artifact-json-viewer";
import { SopArtifactHtmlSplitPane } from "./sop-artifact-html-split-pane";
import { SopArtifactVerifyButton } from "./sop-artifact-verify-button";
import { SopRegeneratePdfButton } from "./sop-regenerate-pdf-button";
import { SopPdfLinkStatus } from "./sop-pdf-link-status";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function HtmlArtifactEditor({
  artifact,
  readOnly,
  onSave,
}: {
  readonly artifact: SopArtifactDetail;
  readonly readOnly: boolean;
  readonly onSave: (contentRaw: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(artifact.contentRaw);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(artifact.contentRaw);
  }, [artifact.contentRaw]);

  return (
    <div className="flex flex-col gap-2">
      <SopArtifactHtmlSplitPane
        value={draft}
        onChange={setDraft}
        readOnly={readOnly}
      />
      {!readOnly ? (
        <Button
          type="button"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            void onSave(draft).finally(() => setSaving(false));
          }}
        >
          {saving ? "保存中…" : "保存草稿"}
        </Button>
      ) : null}
    </div>
  );
}

export interface SopArtifactEditorShellProps {
  readonly artifactId: string;
  readonly requiresVerification: boolean;
  readonly verified: boolean;
  readonly onVerified?: () => void;
  readonly onArtifactUpdated?: (artifact: SopArtifactDetail) => void;
}

/** 按 `contentType` 切换 JSON / HTML 编辑器。 */
export function SopArtifactEditorShell({
  artifactId,
  requiresVerification,
  verified,
  onVerified,
  onArtifactUpdated,
}: SopArtifactEditorShellProps) {
  const [artifact, setArtifact] = useState<SopArtifactDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await getSopArtifact(artifactId);
      setArtifact(detail);
      onArtifactUpdated?.(detail);
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }, [artifactId, onArtifactUpdated]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveHtml(contentRaw: string) {
    if (!artifact) {
      return;
    }
    try {
      const result = await patchSopArtifact(artifact.id, artifact.version, {
        contentRaw,
      });
      setArtifact({
        ...artifact,
        contentRaw: result.contentRaw,
        version: result.version,
      });
      toast.success("草稿已保存");
    } catch (err) {
      const apiErr = toApiClientError(err);
      if (apiErr.code === "RESOURCE_CONFLICT") {
        toast.error("版本冲突，请刷新");
        void load();
      } else {
        toast.error(apiErr.message);
      }
      if (err instanceof ApiClientError) {
        /* handled */
      }
    }
  }

  if (loading || !artifact) {
    return <p className="text-muted-foreground text-sm">加载产出物…</p>;
  }

  const readOnly = artifact.status === "finalized";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SopArtifactVerifyButton
          artifactId={artifact.id}
          requiresVerification={requiresVerification}
          verified={verified}
          onVerified={onVerified}
        />
        <SopRegeneratePdfButton
          artifactId={artifact.id}
          artifactStatus={artifact.status}
        />
      </div>
      <SopPdfLinkStatus linkedDriveNodeId={artifact.linkedDriveNodeId} />
      {artifact.contentType === "json" ? (
        <SopArtifactJsonViewer
          artifactId={artifact.id}
          version={artifact.version}
          status={artifact.status}
          contentRaw={artifact.contentRaw}
          onPatched={(contentRaw, version) =>
            setArtifact({ ...artifact, contentRaw, version })
          }
        />
      ) : (
        <HtmlArtifactEditor
          artifact={artifact}
          readOnly={readOnly}
          onSave={saveHtml}
        />
      )}
    </div>
  );
}

/** 是否 HTML 分支。 */
export function isHtmlArtifactContentType(
  contentType: ArtifactContentType,
): boolean {
  return contentType === "html";
}

/** 是否 JSON 分支。 */
export function isJsonArtifactContentType(
  contentType: ArtifactContentType,
): boolean {
  return contentType === "json";
}

/** 产出物是否可编辑草稿。 */
export function isSopArtifactEditable(status: PipelineArtifactStatus): boolean {
  return status === "draft";
}
