export type DateRangeBoundary = "start" | "end";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function normalizedDateBoundary(value: string | null | undefined, boundary: DateRangeBoundary): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const raw = dateOnlyPattern.test(trimmed)
    ? `${trimmed}${boundary === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z"}`
    : trimmed;
  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}
