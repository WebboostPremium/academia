export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-SV", { style: "currency", currency }).format(cents / 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-SV", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
