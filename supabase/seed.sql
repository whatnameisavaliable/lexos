-- =============================================================================
-- LexOS M0-C — 内置管理员种子（database.md §6.4 · PRD §1.4 A3）
-- =============================================================================
--
-- Auth 用户须先由 Admin API 创建（禁止在本文件写入密码）：
--   npm run seed:admin
--
-- 虚拟邮箱：admin@<AUTH_VIRTUAL_EMAIL_DOMAIN>（默认 llexos.internal）
-- 首次登录：requires_password_change = true（强制改密）
--
-- 本 SQL 幂等：在 auth.users 已存在 admin 邮箱前缀时同步 public.profiles
-- =============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  SELECT u.id, u.email
  INTO v_user_id, v_email
  FROM auth.users AS u
  WHERE split_part(u.email, '@', 1) = 'admin'
  ORDER BY u.created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'LexOS seed: auth user with username prefix "admin" not found; run npm run seed:admin first.';
    RETURN;
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    role,
    status,
    requires_password_change,
    mfa_enabled
  ) VALUES (
    v_user_id,
    'admin',
    '系统管理员',
    'admin'::public.user_role,
    'enabled'::public.user_status,
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    requires_password_change = EXCLUDED.requires_password_change,
    updated_at = now();

  RAISE NOTICE 'LexOS seed: synced builtin admin profile for % (user_id=%)', v_email, v_user_id;
END;
$$;
