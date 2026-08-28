import type { SalesInspection } from "../../types/sales-inspection"
import type { QuoteEngineSnapshot } from "../../types/quote-engine"
import type { SalesBrainWorkflowData } from "../../types/figma-workflow"
import type { SalesLead } from "../../types/sales-operations"

export type QuoteWorkspaceRoute =
  | "quote-workspace"
  | "wizard"
  | "job-costing"
  | "presentation"
  | "proposal"

const MODERN_DEPRECATED_ROUTES: QuoteWorkspaceRoute[] = [
  "wizard",
  "job-costing",
  "presentation",
  "proposal",
]

export function isQuoteEngineBackedQuote(
  inspection: Pick<SalesInspection, "quoteEngineInput" | "quoteEngineSnapshot">,
) {
  return Boolean(inspection.quoteEngineInput || inspection.quoteEngineSnapshot)
}

export function resolveQuoteWorkspaceRoute({
  route,
  restoringEstimate,
  modernQuote,
}: {
  route: QuoteWorkspaceRoute
  restoringEstimate: boolean
  modernQuote: boolean
}): "quote-workspace" | "job-costing" | null {
  if (restoringEstimate) return null
  if (modernQuote && MODERN_DEPRECATED_ROUTES.includes(route))
    return "quote-workspace"
  if (!modernQuote && route === "quote-workspace") return "job-costing"
  return null
}

export function shouldRenderQuoteWorkspace({
  route,
  restoringEstimate,
  modernQuote,
}: {
  route: QuoteWorkspaceRoute
  restoringEstimate: boolean
  modernQuote: boolean
}) {
  return Boolean(
    !restoringEstimate &&
      modernQuote &&
      (route === "quote-workspace" || MODERN_DEPRECATED_ROUTES.includes(route)),
  )
}

export function quoteInspectionWithUpdatedLead(
  inspection: SalesInspection,
  lead: SalesLead,
) {
  if (inspection.leadId !== lead.id) return inspection

  const workflowData = inspection.workflowData
  if (!workflowData) return inspection

  return {
    ...inspection,
    workflowData: {
      ...workflowData,
      customer: {
        ...workflowData.customer,
        leadType: lead.leadType,
        company: lead.company || lead.companyName,
        first: lead.first,
        last: lead.last,
        phone: lead.phone,
        email: lead.email,
        preferredContact: lead.preferredContact,
        referralSource: lead.referralSource,
        referralSourceOther: lead.referralSourceOther,
        locationName: lead.locationName,
        streetAddress: lead.streetAddress,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        accountNotes: lead.notes,
      },
    },
  }
}

export function getQuoteWorkspaceReadiness({
  inspection,
  calculation,
  calculating,
}: {
  inspection: Pick<
    SalesInspection,
    "leadId" | "billTo" | "location" | "quoteEngineInput"
  >
  calculation: QuoteEngineSnapshot | null
  calculating: boolean
}) {
  const hasContext = Boolean(
    inspection.leadId ||
      (inspection.billTo?.billToNumber &&
        inspection.location?.locationNumber),
  )
  const hasLines = Boolean(
    inspection.quoteEngineInput?.services.length ||
      inspection.quoteEngineInput?.customLineItems.length,
  )
  const hasAuthoritativeCalculation = Boolean(calculation)

  return {
    hasContext,
    hasLines,
    saveEligible: hasContext && hasLines,
    hasAuthoritativeCalculation,
    calculating,
    ready:
      hasContext && hasLines && hasAuthoritativeCalculation && !calculating,
  }
}

export function quoteWorkspaceCustomerFacingReview(
  calculation: QuoteEngineSnapshot | null,
) {
  return calculation?.customerFacing ?? null
}

export function quoteWorkspaceCustomerIdentity(
  inspection: SalesInspection,
  workflowData: SalesBrainWorkflowData,
) {
  const leadName =
    workflowData.customer.company ||
    [workflowData.customer.first, workflowData.customer.last]
      .filter(Boolean)
      .join(" ")
  const name =
    inspection.billTo?.billToName ||
    (inspection.leadId ? leadName || "SalesBrain lead" : "Customer not selected")
  const address =
    inspection.location?.locationAddress ||
    inspection.location?.locationName ||
    (inspection.leadId
      ? [
          workflowData.customer.streetAddress,
          workflowData.customer.city,
          workflowData.customer.state,
          workflowData.customer.zip,
        ]
          .filter(Boolean)
          .join(", ") || "Lead address not provided"
      : "Select an OpsBrain customer and location")

  return { name, address }
}
