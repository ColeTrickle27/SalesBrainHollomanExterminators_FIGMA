import type { LeadInput, LeadStatus, SalesLead } from "../../types/sales-operations"

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = { open: "Open", sold: "Won", lost: "Lost", ex_dated: "Ex-Dated" }
export function leadBusinessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now)
  return `${parts.find((item) => item.type === "year")?.value}-${parts.find((item) => item.type === "month")?.value}-${parts.find((item) => item.type === "day")?.value}`
}
export function effectiveLeadStatus(lead: Pick<SalesLead, "status" | "exDate">, today = leadBusinessDate()): LeadStatus {
  return lead.status === "ex_dated" && Boolean(lead.exDate && lead.exDate <= today) ? "open" : lead.status
}
export function filterDashboardLeads(leads: SalesLead[], status: string, temperature: string, search: string, today = leadBusinessDate()): SalesLead[] {
  const query = search.trim().toLowerCase()
  return leads.filter((lead) => (status === "all" || effectiveLeadStatus(lead, today) === status) && (temperature === "all" || lead.temperature === temperature) && (!query || [lead.customerName, lead.companyName, lead.phone, lead.email, lead.billToNumber, lead.locationNumber].filter(Boolean).join(" ").toLowerCase().includes(query)))
}
export function leadFollowUpIssue(input: Partial<LeadInput>, today = leadBusinessDate()): string | null {
  if (input.status !== "ex_dated") return null
  if (!input.exDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.exDate) || !Number.isFinite(Date.parse(input.exDate)) || new Date(input.exDate).toISOString().slice(0, 10) !== input.exDate || input.exDate <= today) return "Choose a future Ex-Date."
  if (!input.exDateNote?.trim()) return "Add a note explaining the Ex-Date follow-up."
  return null
}
export function leadDateLabel(value?: string): string {
  if (!value) return "Not scheduled"
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(0, 4)}`
  return new Date(value).toLocaleDateString("en-US", { timeZone: "America/New_York" })
}

export function leadSourceLabel(lead: Pick<SalesLead, "source">): string {
  return lead.source === "hubspot_form" ? "HubSpot Form" : lead.source === "quote" ? "Quote" : "Manual Lead"
}
export function leadAssigneeLabel(lead: Pick<SalesLead, "assignedTo" | "assignedToName">): string {
  return lead.assignedTo ? lead.assignedToName || lead.assignedTo : "UNASSIGNED"
}

export function leadCommentIssue(type: string, note: string): string | null {
  return type === "Comment" && !note.trim() ? "Enter a comment before saving." : null
}
