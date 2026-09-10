export interface QuoteNumberDetails {
  company?: string
  lastName?: string
  customerName?: string
  serviceName?: string
  createdAt: string
}

// This is a readable label, never the quote's unique storage identity.
export function customerQuoteNumber(details: QuoteNumberDetails, fallback: string): string {
  const segment = (value: string) => value.trim().replace(/[^\p{L}\p{N}]/gu, "")
  const customer = segment(details.company || details.lastName || details.customerName || "").slice(0, 55)
  const service = segment(details.serviceName || "").slice(0, 15)
  const date = new Date(details.createdAt)
  if (!customer || !service || Number.isNaN(date.getTime())) return fallback
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", month: "2-digit", day: "2-digit", year: "2-digit",
  }).formatToParts(date)
  const part = (type: string) => parts.find(item => item.type === type)?.value || ""
  return `${customer}-${service}-${part("month")}.${part("day")}.${part("year")}`
}
