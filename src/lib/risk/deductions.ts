import type { SystemSettingItem } from "../settings/definitions.ts";
import type { RiskCaseSeverity } from "./cases.ts";

export type RiskDeductionRates = Record<RiskCaseSeverity, number>;

export type RiskDeductionPreview = {
  basisPoints: number;
  deductionAmountCents: number;
  enabled: boolean;
  payableAmountCents: number;
  severity: RiskCaseSeverity;
};

export const DEFAULT_RISK_DEDUCTION_RATES: RiskDeductionRates = {
  critical: 3000,
  high: 1500,
  low: 0,
  medium: 500,
};

export const RISK_DEDUCTION_SETTING_KEYS: Record<RiskCaseSeverity, string> = {
  critical: "risk_deduction_critical_basis_points",
  high: "risk_deduction_high_basis_points",
  low: "risk_deduction_low_basis_points",
  medium: "risk_deduction_medium_basis_points",
};

export const riskDeductionSeverities: RiskCaseSeverity[] = ["low", "medium", "high", "critical"];

export function buildRiskDeductionRatesFromSettings(settings: Array<Pick<SystemSettingItem, "key" | "value">>): RiskDeductionRates {
  const valuesByKey = new Map(settings.map((setting) => [setting.key, setting.value]));

  return riskDeductionSeverities.reduce<RiskDeductionRates>((rates, severity) => {
    const key = RISK_DEDUCTION_SETTING_KEYS[severity];
    const value = valuesByKey.get(key);

    return {
      ...rates,
      [severity]: normalizeRiskDeductionBasisPoints(typeof value === "number" ? value : DEFAULT_RISK_DEDUCTION_RATES[severity]),
    };
  }, { ...DEFAULT_RISK_DEDUCTION_RATES });
}

export function calculateRiskDeductionPreview(
  amountCents: number,
  severity: RiskCaseSeverity | null | undefined,
  rates: RiskDeductionRates = DEFAULT_RISK_DEDUCTION_RATES,
): RiskDeductionPreview | null {
  if (!severity) {
    return null;
  }

  const normalizedAmountCents = normalizeAmountCents(amountCents);
  const basisPoints = normalizeRiskDeductionBasisPoints(rates[severity] ?? DEFAULT_RISK_DEDUCTION_RATES[severity]);
  const deductionAmountCents = Math.floor((normalizedAmountCents * basisPoints) / 10000);

  return {
    basisPoints,
    deductionAmountCents,
    enabled: basisPoints > 0,
    payableAmountCents: Math.max(0, normalizedAmountCents - deductionAmountCents),
    severity,
  };
}

export function normalizeRiskDeductionBasisPoints(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(10000, Math.max(0, Math.trunc(value)));
}

function normalizeAmountCents(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}
