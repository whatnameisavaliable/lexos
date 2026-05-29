import type { AuthRuntimeEnvConfig } from "@lexos/shared/config";
import type { CaptchaAdapter } from "./captcha.adapter.js";
import { NoneCaptchaAdapter } from "./none-captcha.adapter.js";
import { TurnstileCaptchaAdapterStub } from "./turnstile-captcha.adapter.js";

/**
 * 按 `CAPTCHA_PROVIDER` 构造验证码适配器。
 */
export function createCaptchaAdapter(
  authEnv: Pick<AuthRuntimeEnvConfig, "captchaProvider">,
): CaptchaAdapter {
  switch (authEnv.captchaProvider) {
    case "none":
      return new NoneCaptchaAdapter();
    case "turnstile":
      return new TurnstileCaptchaAdapterStub();
    case "geetest":
      throw new Error(
        "Geetest captcha adapter is not implemented; use CAPTCHA_PROVIDER=none",
      );
    default: {
      const _exhaustive: never = authEnv.captchaProvider;
      throw new Error(`Unsupported CAPTCHA_PROVIDER: ${_exhaustive}`);
    }
  }
}
