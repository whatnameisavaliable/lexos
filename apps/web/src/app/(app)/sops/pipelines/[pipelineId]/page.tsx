import { LawyerSopPipelineWorkspace } from "@/components/sops/LawyerSopPipelineWorkspace";

export interface LawyerSopPipelinePageProps {
  readonly params: Promise<{ readonly pipelineId: string }>;
}

/** 律师 SOP 流水线工作区页。 */
export default async function LawyerSopPipelinePage({
  params,
}: LawyerSopPipelinePageProps) {
  const { pipelineId } = await params;
  return <LawyerSopPipelineWorkspace pipelineId={pipelineId} />;
}
