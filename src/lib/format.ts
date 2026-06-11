export function formatMoney(amountCents: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function formatBasisPoints(basisPoints: number): string {
  return `${Number((basisPoints / 100).toFixed(2))}%`;
}

export function nowText(): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

