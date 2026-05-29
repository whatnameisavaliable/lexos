"use client";

import { useState } from "react";
import { testModel } from "@/lib/admin-ai-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AiModelTestButtonProps {
  readonly modelId: string;
}

/** 调用连通性测试并 Toast 反馈（PRD AI-01）。 */
export function AiModelTestButton({ modelId }: AiModelTestButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleTest() {
    setLoading(true);
    try {
      const result = await testModel(modelId);
      if (result.success) {
        toast.success(`连通成功（${result.latencyMs}ms）`);
      } else {
        toast.error(result.message ?? result.errorCode ?? "连通失败");
      }
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void handleTest()}>
      {loading ? "测试中…" : "测试"}
    </Button>
  );
}
