import type { TaskStatus, UserRole } from "@/lib/domain/core";
import type { RiskCaseSeverity, RiskCaseSource, RiskCaseStatus } from "@/lib/risk/cases";
import type { RiskCaseCommitteeDecision } from "@/lib/risk/committee-decision";
import type { SettlementRiskPenaltyDestination } from "@/lib/settlements/risk-deduction";
import type { TaskReviewStatus } from "@/lib/tasks/review";

export type Rank = {
  id?: string;
  code: string;
  name: string;
  settlementBasisPoints: number;
  sortOrder: number;
};

export type DemoUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  rankId?: string;
  rankCode?: string;
  password: string;
  mustChangePassword: boolean;
  status: "active" | "disabled";
};

export type Customer = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  source: string;
};

export type Task = {
  id: string;
  title: string;
  customerId: string;
  description: string;
  taskType: string;
  amountCents: number;
  minRankId?: string;
  minRankCode: string;
  sourceLawyerId: string;
  assignedLawyerId?: string;
  status: TaskStatus;
  dueAt: string;
  portalToken: string;
  customerName?: string;
  deliverables?: TaskDeliverable[];
  submittedTitle?: string;
  submittedContent?: string;
  externalUrl?: string;
  approvedAt?: string;
  sourceReviewScore?: number;
  sourceReviewComment?: string;
  sourceReviewedAt?: string;
  caseResultScore?: number;
  caseResultSummary?: string;
  reviewComment?: string;
  reviewedAt?: string;
  reviewLawyerId?: string;
  reviewRequired?: boolean;
  reviewStatus?: TaskReviewStatus;
  customerConfirmedAt?: string;
};

export type TaskDeliverable = {
  id: string;
  title: string;
  content: string;
  externalUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileMimeType?: string;
  downloadUrl?: string;
  submittedAt?: string;
};

export type Settlement = {
  id: string;
  taskId: string;
  taskTitle?: string;
  lawyerId: string;
  lawyerName?: string;
  rankId?: string;
  rankCode: string;
  taskAmountCents: number;
  settlementBasisPoints: number;
  settlementAmountCents: number;
  payableAmountCents?: number;
  status: "pending" | "confirmed";
  riskFreezeCaseCount?: number;
  riskFreezeCaseTitles?: string[];
  riskFreezeHighestSeverity?: RiskCaseSeverity;
  riskFreezeReason?: string;
  riskFrozen?: boolean;
  riskDeductionBasisPoints?: number;
  lockedRiskDeductionBasisPoints?: number;
  riskDeductionAmountCents?: number;
  riskDeductionCandidateBasisPoints?: number;
  riskDeductionCandidateCaseId?: string;
  riskDeductionCandidateTitle?: string;
  riskDeductionCaseId?: string;
  riskDeductionLockedAt?: string;
  riskDeductionNote?: string;
  riskPenaltyDestination?: SettlementRiskPenaltyDestination;
  riskSuggestedDeductionCents?: number;
  riskSuggestedPayableCents?: number;
  generatedAt?: string;
  confirmedAt?: string;
};

export type FundTransaction = {
  id: string;
  accountType: SettlementRiskPenaltyDestination;
  amountCents: number;
  createdAt: string;
  createdByName?: string;
  direction: "inflow" | "outflow";
  lawyerName?: string;
  note?: string;
  riskCaseId?: string;
  riskCaseTitle?: string;
  settlementId?: string;
  status: "posted" | "void";
  taskId?: string;
  taskTitle?: string;
  transactionType: "risk_deduction" | "manual_adjustment" | "client_refund";
};

export type CustomerFeedback = {
  taskId: string;
  score: number;
  comment: string;
  confirmedAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  actionCode?: string;
  entity: string;
  entityType: string;
  createdAt: string;
  rawCreatedAt?: string;
};

export type RiskCase = {
  id: string;
  taskId?: string;
  taskAssignedLawyerId?: string;
  taskTitle?: string;
  customerId?: string;
  customerName?: string;
  reportedByUserId?: string;
  reporterName?: string;
  ownerUserId?: string;
  ownerName?: string;
  source: RiskCaseSource;
  severity: RiskCaseSeverity;
  status: RiskCaseStatus;
  committeeDecidedAt?: string;
  committeeDecidedByUserId?: string;
  committeeDeciderName?: string;
  committeeDecision?: RiskCaseCommitteeDecision;
  committeeDecisionNote?: string;
  committeeDeductionBasisPoints?: number;
  defenseStatement?: string;
  defendedAt?: string;
  title: string;
  description?: string;
  createdAt: string;
  rawCreatedAt?: string;
  rawUpdatedAt?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  updatedAt?: string;
};
