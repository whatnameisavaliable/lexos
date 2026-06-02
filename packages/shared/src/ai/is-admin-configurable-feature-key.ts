import {
  ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES,
  type AdminConfigurableFeatureKey,
} from "./admin-configurable-feature-keys.js";

/**
 * 判断字符串是否为 Admin AI 后台可配置的功能点。
 */
export function isAdminConfigurableFeatureKey(
  value: string,
): value is AdminConfigurableFeatureKey {
  return (ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES as readonly string[]).includes(
    value,
  );
}
