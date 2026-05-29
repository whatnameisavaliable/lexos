import type { AiProviderKind } from "@lexos/shared";
import type { AiAdapter } from "./ai-adapter.interface.js";
import { AzureOpenAiAdapter } from "./azure-openai.adapter.js";
import { CustomHttpAdapter } from "./custom-http.adapter.js";
import { OpenAiCompatibleAdapter } from "./openai-compatible.adapter.js";

/**
 * 按 `provider_kind` 解析 U6 适配器（`architecture.md` §4.3.2）。
 */
export class AiAdapterFactory {
  private readonly registry: Readonly<Record<AiProviderKind, AiAdapter>>;

  constructor(adapters: readonly AiAdapter[] = [
    new OpenAiCompatibleAdapter(),
    new AzureOpenAiAdapter(),
    new CustomHttpAdapter(),
  ]) {
    this.registry = adapters.reduce(
      (acc, adapter) => {
        acc[adapter.providerKind] = adapter;
        return acc;
      },
      {} as Record<AiProviderKind, AiAdapter>,
    );
  }

  get(providerKind: AiProviderKind): AiAdapter {
    const adapter = this.registry[providerKind];
    if (!adapter) {
      throw new Error(`No AI adapter registered for ${providerKind}`);
    }
    return adapter;
  }
}
