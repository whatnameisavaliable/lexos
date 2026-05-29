import type { CaptchaAdapter, CaptchaVerifyResult } from "./captcha.adapter.js";

/**
 * `CAPTCHA_PROVIDER=none` 空实现：始终通过（配合 IP 白名单等其它策略）。
 */
export class NoneCaptchaAdapter implements CaptchaAdapter {
  async verify(_token: string, _remoteIp?: string): Promise<CaptchaVerifyResult> {
    return { success: true };
  }
}
