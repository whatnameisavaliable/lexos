"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mfaEnroll, mfaVerify } from "@/lib/auth-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * MFA 绑定：展示 QR + 6 位 TOTP 校验（`ui_design.md` §2.5.2）。
 */
export function MfaVerifyForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void mfaEnroll()
      .then((data) => {
        setFactorId(data.factorId);
        setQrCode(data.qrCode);
      })
      .catch((err) => setError(toApiClientError(err).message))
      .finally(() => setLoading(false));
  }, []);

  async function handleVerify() {
    if (!factorId || code.length !== 6) {
      setError("请输入 6 位验证码");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await mfaVerify(factorId, code);
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Skeleton className="mx-auto h-48 w-48" />;
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
      {error ? (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {qrCode ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase 返回 data URI QR
        <img
          src={qrCode}
          alt="MFA QR Code"
          width={200}
          height={200}
          className="rounded-md border border-border"
        />
      ) : null}
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="totp">6 位验证码</Label>
        <Input
          id="totp"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </div>
      <Button type="button" className="w-full" disabled={submitting} onClick={() => void handleVerify()}>
        验证并绑定
      </Button>
    </div>
  );
}
