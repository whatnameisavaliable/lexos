import type { SupabaseClient } from "@supabase/supabase-js";

import { loadSystemSettingNumber } from "../settings/runtime.ts";
import {
  DEFAULT_RISK_DEDUCTION_RATES,
  RISK_DEDUCTION_SETTING_KEYS,
  riskDeductionSeverities,
  type RiskDeductionRates,
} from "./deductions.ts";

export async function loadRiskDeductionRates(admin: SupabaseClient, organizationId: string): Promise<RiskDeductionRates> {
  const entries = await Promise.all(
    riskDeductionSeverities.map(async (severity) => {
      const key = RISK_DEDUCTION_SETTING_KEYS[severity];
      const value = await loadSystemSettingNumber(admin, organizationId, key);

      return [severity, value] as const;
    }),
  );

  return entries.reduce<RiskDeductionRates>(
    (rates, [severity, value]) => ({
      ...rates,
      [severity]: value,
    }),
    { ...DEFAULT_RISK_DEDUCTION_RATES },
  );
}
