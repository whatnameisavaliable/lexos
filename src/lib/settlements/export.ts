import { rowsToCsv } from "../csv.ts";
import { formatBasisPoints } from "../format.ts";
import { riskPenaltyDestinationLabel } from "./risk-deduction.ts";

export type SettlementExportRow = {
  confirmedAt?: string | null;
  generatedAt?: string | null;
  id: string;
  lawyerName?: string | null;
  lawyerUsername?: string | null;
  payableAmountCents?: number | null;
  rankCode?: string | null;
  riskDeductionAmountCents?: number | null;
  riskDeductionLockedAt?: string | null;
  riskPenaltyDestination?: string | null;
  settlementAmountCents: number;
  settlementBasisPoints: number;
  status: string;
  taskAmountCents: number;
  taskTitle?: string | null;
};

export function settlementsToCsv(rows: SettlementExportRow[]): string {
  return rowsToCsv(
    [
      "结算ID",
      "任务",
      "承办律师",
      "用户名",
      "职级",
      "任务金额(元)",
      "结算比例",
      "原结算金额(元)",
      "扣减金额(元)",
      "律师实付金额(元)",
      "扣罚去向",
      "扣罚锁定时间",
      "状态",
      "生成时间",
      "确认时间",
    ],
    rows.map((row) => [
      row.id,
      row.taskTitle ?? "",
      row.lawyerName ?? "",
      row.lawyerUsername ?? "",
      row.rankCode ?? "",
      centsToYuanText(row.taskAmountCents),
      formatBasisPoints(row.settlementBasisPoints),
      centsToYuanText(row.settlementAmountCents),
      centsToYuanText(row.riskDeductionAmountCents ?? 0),
      centsToYuanText(row.payableAmountCents ?? row.settlementAmountCents),
      riskPenaltyDestinationLabel(row.riskPenaltyDestination),
      row.riskDeductionLockedAt ?? "",
      settlementStatusLabel(row.status),
      row.generatedAt ?? "",
      row.confirmedAt ?? "",
    ]),
  );
}

export function centsToYuanText(amountCents: number): string {
  if (!Number.isFinite(amountCents)) {
    return "0.00";
  }

  return (Math.trunc(amountCents) / 100).toFixed(2);
}

export function settlementStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    cancelled: "已取消",
    confirmed: "已确认",
    paid: "已付款",
    pending: "待确认",
  };

  return labels[status] ?? status;
}
