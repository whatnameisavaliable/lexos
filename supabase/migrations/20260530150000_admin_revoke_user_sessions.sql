-- M2: 按 user_id 吊销全部 Auth 会话（Supabase admin.signOut 首参为 JWT，不能传 uuid）

CREATE OR REPLACE FUNCTION public.admin_revoke_user_sessions(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.refresh_tokens WHERE user_id = p_user_id::text;
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revoke_user_sessions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revoke_user_sessions(uuid) TO service_role;
