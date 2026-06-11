export type SourceReviewInput = {
  caseResultScore?: unknown;
  caseResultSummary?: unknown;
  sourceReviewComment?: unknown;
  sourceReviewScore?: unknown;
};

export type SourceReviewDraft = {
  caseResultScore?: number;
  caseResultSummary?: string;
  sourceReviewComment?: string;
  sourceReviewScore?: number;
};

export function validateSourceReviewInput(input: SourceReviewInput): SourceReviewDraft {
  return {
    caseResultScore: optionalScore(input.caseResultScore, "案件结果评分"),
    caseResultSummary: optionalText(input.caseResultSummary, 500),
    sourceReviewComment: optionalText(input.sourceReviewComment, 500),
    sourceReviewScore: optionalScore(input.sourceReviewScore, "发起人评分"),
  };
}

export function averageScores(scores: Array<number | null | undefined>): number | null {
  const validScores = scores.filter(
    (score): score is number => score !== null && score !== undefined && Number.isInteger(score) && score >= 1 && score <= 10,
  );

  if (!validScores.length) {
    return null;
  }

  return Math.round((validScores.reduce((sum, score) => sum + score, 0) / validScores.length) * 10) / 10;
}

function optionalScore(value: unknown, label: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const score = Number(value);

  if (!Number.isInteger(score) || score < 1 || score > 10) {
    throw new Error(`${label}必须是 1 到 10 的整数`);
  }

  return score;
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();

  if (!text) {
    return undefined;
  }

  return text.slice(0, maxLength);
}
