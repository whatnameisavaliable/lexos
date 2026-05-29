"use client";

import { AiFeatureMappingsPanel } from "@/components/admin/ai/AiFeatureMappingsPanel";
import { AiInvocationLogsPanel } from "@/components/admin/ai/AiInvocationLogsPanel";
import { AiModelsPanel } from "@/components/admin/ai/AiModelsPanel";
import { AiPromptsPanel } from "@/components/admin/ai/AiPromptsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** 管理员 AI 基础设施配置（`ui_design.md` §5.1）。 */
export default function AdminAiPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI 配置</h1>
        <p className="text-sm text-muted-foreground">
          模型凭证、功能映射与 Prompt 模板；仅管理员可访问。
        </p>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList>
          <TabsTrigger value="models">模型凭证</TabsTrigger>
          <TabsTrigger value="mappings">功能映射</TabsTrigger>
          <TabsTrigger value="prompts">Prompt</TabsTrigger>
          <TabsTrigger value="logs">调用日志</TabsTrigger>
        </TabsList>
        <TabsContent value="models" className="mt-4">
          <AiModelsPanel />
        </TabsContent>
        <TabsContent value="mappings" className="mt-4">
          <AiFeatureMappingsPanel />
        </TabsContent>
        <TabsContent value="prompts" className="mt-4">
          <AiPromptsPanel />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <AiInvocationLogsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
