"use client";

import { useState } from "react";
import { verifySopArtifact } from "@/lib/lawyer-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface SopArtifactVerifyButtonProps {
  readonly artifactId: string;
  readonly requiresVerification: boolean;
  readonly verified: boolean;
  readonly onVerified?: () => void;
}

/** 幻觉校验按钮与 Verified 状态。 */
export function SopArtifactVerifyButton({
  artifactId,
  requiresVerification,
  verified,
  onVerified,
}: SopArtifactVerifyButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!requiresVerification) {
    return null;
  }

  async function handleVerify() {
    setLoading(true);
    try {
      await verifySopArtifact(artifactId);
      toast.success("已完成校验");
      onVerified?.();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }

  if (verified) {
    return <Badge variant="default">Verified</Badge>;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => void handleVerify()}
    >
      {loading ? "校验中…" : "人工校验"}
    </Button>
  );
}
