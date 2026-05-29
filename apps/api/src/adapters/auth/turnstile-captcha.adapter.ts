import type { CaptchaAdapter, CaptchaVerifyResult } from "./captcha.adapter.js";

/**
 * Cloudflare Turnstile 桩实现。
 *
 * 未引入 HTTP 客户端依赖前不发起外呼；启用前须用户授权并补全 `siteverify` 调用。
 */
export class TurnstileCaptchaAdapterStub implements CaptchaAdapter {
  async verify(_token: string, _remoteIp?: string): Promise<CaptchaVerifyResult> {
    throw new Error(
      "TurnstileCaptchaAdapter is not implemented; set CAPTCHA_PROVIDER=none or authorize dependency install",
    );
  }
}
