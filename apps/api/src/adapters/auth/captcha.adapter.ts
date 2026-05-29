/**
 * 图形验证码校验结果。
 */
export interface CaptchaVerifyResult {
  readonly success: boolean;
}

/**
 * 登录验证码适配器（`architecture.md` §4.4；`CAPTCHA_PROVIDER` 可切换）。
 */
export interface CaptchaAdapter {
  /**
   * 校验客户端提交的验证码 token。
   * @param token - 前端提交的 captchaToken
   * @param remoteIp - 可选客户端 IP（Turnstile/Geetest 用）
   */
  verify(token: string, remoteIp?: string): Promise<CaptchaVerifyResult>;
}
