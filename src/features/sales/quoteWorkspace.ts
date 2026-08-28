import type { SalesInspection } from "../../types/sales-inspection"
import type { QuoteEngineSnapshot } from "../../types/quote-engine"
import type { SalesBrainWorkflowData } from "../../types/figma-workflow"

export function isQuoteEngineBackedQuote(
  inspection: Pick<SalesInspection, "quoteEngineInput" | "quoteEngineSnapshot">,
) {
  return Boolean(inspection.quoteEngineInput || inspection.quoteEngineSnapshot)
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
