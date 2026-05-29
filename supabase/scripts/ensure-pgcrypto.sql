-- 修复 append_audit_log 依赖的 digest()（pgcrypto）
-- 在 Supabase SQL Editor 或 `supabase db query --linked -f` 执行
CREATE EXTENSION IF NOT EXISTS pgcrypto;
