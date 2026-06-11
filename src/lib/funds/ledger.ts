import {
  settlementRiskPenaltyDestinationLabels,
  settlementRiskPenaltyDestinations,
  type SettlementRiskPenaltyDestination,
} from "../settlements/risk-deduction.ts";

export type FundAccountType = SettlementRiskPenaltyDestination;
export type FundTransactionDirection = "inflow" | "outflow";
export type FundTransactionStatus = "posted" | "void";
export type FundTransactionType = "risk_deduction" | "manual_adjustment" | "client_refund";

export type FundTransaction = {
  id: string;
  accountType: FundAccountType;
  amountCents: number;
  createdAt: string;
  createdByName?: string;
  direction: FundTransactionDirection;
  lawyerName?: string;
  note?: string;
  riskCaseId?: string;
  riskCaseTitle?: string;
  settlementId?: string;
  status: FundTransactionStatus;
  taskId?: string;
  taskTitle?: string;
  transactionType: FundTransactionType;
};

export type FundSummaryItem = {
  accountType: FundAccountType;
  balanceCents: number;
  inflowCents: number;
  label: string;
  latestTransactionAt?: string;
  outflowCents: number;
  postedCount: number;
};

export type RiskDeductionFundTransactionInput = {
  amountCents: number;
  createdAt: string;
  createdByName?: string;
  destination: FundAccountType;
  id: string;
  lawyerName?: string;
  note?: string;
  riskCaseId?: string;
  riskCaseTitle?: string;
  settlementId: string;
  taskId?: string;
  taskTitle?: string;
};

export const fundAccountLabels = settlementRiskPenaltyDestinationLabels;

export const fundTransactionTypeLabels: Record<FundTransactionType, string> = {
  client_refund: "客户退费支出",
  manual_adjustment: "手工调整",
  risk_deduction: "扣罚入账",
};

export function buildFundSummary(transactions: FundTransaction[]): FundSummaryItem[] {
  const summaries = settlementRiskPenaltyDestinations.map<FundSummaryItem>((accountType) => ({
    accountType,
    balanceCents: 0,
    inflowCents: 0,
    label: fundAccountLabels[accountType],
    latestTransactionAt: undefined,
    outflowCents: 0,
    postedCount: 0,
  }));
  const summaryByAccount = new Map(summaries.map((summary) => [summary.accountType, summary]));

  transactions.forEach((transaction) => {
    if (transaction.status !== "posted") {
      return;
    }

    const summary = summaryByAccount.get(transaction.accountType);

    if (!summary) {
      return;
    }

    const amountCents = normalizeAmountCents(transaction.amountCents);

    if (transaction.direction === "outflow") {
      summary.outflowCents += amountCents;
      summary.balanceCents -= amountCents;
    } else {
      summary.inflowCents += amountCents;
      summary.balanceCents += amountCents;
    }

    summary.postedCount += 1;

    if (
      transaction.createdAt &&
      (!summary.latestTransactionAt || transaction.createdAt > summary.latestTransactionAt)
    ) {
      summary.latestTransactionAt = transaction.createdAt;
    }
  });

  return summaries;
}

export function createRiskDeductionFundTransaction(input: RiskDeductionFundTransactionInput): FundTransaction {
  return {
    id: input.id,
    accountType: input.destination,
    amountCents: normalizeAmountCents(input.amountCents),
    createdAt: input.createdAt,
    createdByName: input.createdByName,
    direction: "inflow",
    lawyerName: input.lawyerName,
    note: input.note?.trim() || undefined,
    riskCaseId: input.riskCaseId,
    riskCaseTitle: input.riskCaseTitle,
    settlementId: input.settlementId,
    status: "posted",
    taskId: input.taskId,
    taskTitle: input.taskTitle,
    transactionType: "risk_deduction",
  };
}

export function fundAccountLabel(accountType?: string | null): string {
  if (accountType && settlementRiskPenaltyDestinations.includes(accountType as FundAccountType)) {
    return fundAccountLabels[accountType as FundAccountType];
  }

  return "未知账户";
}

export function fundTransactionTypeLabel(type?: string | null): string {
  if (type && type in fundTransactionTypeLabels) {
    return fundTransactionTypeLabels[type as FundTransactionType];
  }

  return "资金流水";
}

function normalizeAmountCents(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}
