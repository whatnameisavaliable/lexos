"use client";

import { useEffect, useState } from "react";
import type { SystemSettingData } from "@/lib/admin-settings-api";
import { getSetting, listSettings, upsertSetting } from "@/lib/admin-settings-api";
import { toApiClientError } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/** 系统键值 JSON 编辑表单。 */
export function SystemSettingForm() {
  const [items, setItems] = useState<readonly SystemSettingData[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [jsonText, setJsonText] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listSettings();
        setItems(data.items);
        if (data.items.length > 0) {
          setSelectedKey((prev) => prev || data.items[0]!.key);
        }
      } catch (err) {
        setError(toApiClientError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedKey) {
      return;
    }
    void (async () => {
      try {
        const row = await getSetting(selectedKey);
        setJsonText(JSON.stringify(row.value, null, 2));
      } catch (err) {
        setError(toApiClientError(err).message);
      }
    })();
  }, [selectedKey]);

  const handleSave = async () => {
    if (!selectedKey.trim()) {
      toast.error("请选择或输入配置键");
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      const raw = JSON.parse(jsonText) as unknown;
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        throw new Error("invalid");
      }
      parsed = raw as Record<string, unknown>;
    } catch {
      toast.error("JSON 格式无效，须为对象");
      return;
    }

    setSaving(true);
    try {
      const saved = await upsertSetting(selectedKey.trim(), { value: parsed });
      toast.success("已保存");
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.key === saved.key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[240px] flex-col gap-2">
          <Label htmlFor="setting-key">配置键</Label>
          <Input
            id="setting-key"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            placeholder="例如 retention.days"
          />
          {items.length > 0 ? (
            <ul className="max-h-48 overflow-auto rounded-md border text-sm">
              {items.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-muted/50"
                    onClick={() => setSelectedKey(item.key)}
                  >
                    {item.key}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">尚无配置项，输入键名后保存创建。</p>
          )}
        </div>
        <div className="flex min-w-[320px] flex-1 flex-col gap-2">
          <Label htmlFor="setting-json">JSON 值</Label>
          <Textarea
            id="setting-json"
            className="min-h-[240px] font-mono text-xs"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <Button type="button" disabled={saving} onClick={() => void handleSave()}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
