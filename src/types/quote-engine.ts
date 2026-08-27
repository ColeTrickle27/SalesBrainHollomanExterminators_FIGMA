/**
 * Quote Engine contract shared by SalesBrain's internal Quote Builder and the
 * authenticated OpsBrain API. Costs and margin values are server results,
 * never browser inputs.
 */

export type QuoteEngineMarginStatus = "available" | "low_margin_warning" | "incomplete" | "excluded"

export interface QuoteEnginePricingRule {
  key: string
  version: string
}

export interface QuoteEngineContext {
  quoteId?: string
  leadId?: string
  billToNumber?: string
  locationNumber?: string
  preparedBy?: string
}

export interface QuoteEngineMaterialOverride {
  productId: string
  estimatedConsumption: number
  consumptionUnit?: string | null
}

export interface QuoteEngineLaborOverride {
  onsiteHours?: number | null
  employeeCount?: number | null
}

export interface QuoteEngineServiceInput {
  lineId: string
  serviceId: string
  customerDescription?: string | null
  sellingPriceCents?: number | null
  measurements?: Record<string, unknown>
  materialOverrides?: QuoteEngineMaterialOverride[]
  laborOverride?: QuoteEngineLaborOverride
}

export interface QuoteEngineCustomLineInput {
  lineId: string
  name: string
  description?: string | null
  sellingPriceCents: number
}

/** The only quote economics input SalesBrain is allowed to send to OpsBrain. */
export interface QuoteEngineInput extends QuoteEngineContext {
  services: QuoteEngineServiceInput[]
  customLineItems: QuoteEngineCustomLineInput[]
}

export interface QuoteEngineCustomerFacingLine {
  lineId: string
  serviceName: string
  description: string | null
  sellingPriceCents: number | null
  custom?: boolean
}

export interface QuoteEngineMaterialBreakdown {
  productId: string
  productName: string
  sku: string | null
  estimatedConsumption: number
  consumptionUnit: string | null
  packageContentQuantity: number | null
  packageContentUnit: string | null
  wholePackageQuantity: number | null
  purchaseUnitCostCents: number | null
  purchaseCostCents: number | null
  unavailableReason: string | null
}

export interface QuoteEngineLaborBreakdown {
  onsiteHours: number | null
  employeeCount: number | null
  travelHoursExcluded: number
  employeeHours: number | null
  loadedRateCents: number
  costCents: number | null
  unavailableReasons: string[]
}

export interface QuoteEngineDirectCost {
  name: string
  costCents: number
}

export interface QuoteEngineInternalLine {
  lineId: string
  serviceId?: string
  serviceName: string
  custom?: boolean
  pricingType?: "fixed" | "cost_based"
  pricingRule?: QuoteEnginePricingRule
  materialBreakdown: QuoteEngineMaterialBreakdown[]
  labor: QuoteEngineLaborBreakdown | null
  otherDirectCosts: QuoteEngineDirectCost[]
  excludedFollowUpCosts?: QuoteEngineDirectCost[]
  directJobCostCents: number | null
  grossProfitCents: number | null
  grossMarginPercent: number | null
  marginStatus: QuoteEngineMarginStatus
  marginWarning: string | null
  marginMessage: string | null
  recommendedSellingPriceCents?: number | null
}

export interface QuoteEngineCustomerFacingResult {
  lines: QuoteEngineCustomerFacingLine[]
  quoteTotalCents: number | null
}

export interface QuoteEngineInternalResult {
  lines: QuoteEngineInternalLine[]
  quoteOtherDirectCosts: QuoteEngineDirectCost[]
  knownDirectJobCostCents: number
  directJobCostCents: number | null
  grossProfitCents: number | null
  grossMarginPercent: number | null
  marginStatus: QuoteEngineMarginStatus
  marginWarning: string | null
  marginMessage: string | null
}

export interface QuoteEngineCatalogReference {
  serviceId?: string
  lineId: string
  servicePriceCents?: number
  pricingRule?: QuoteEnginePricingRule
  productIds?: string[]
  custom?: boolean
}

/** Durable economics written by OpsBrain when an estimate is saved. */
export interface QuoteEngineSnapshot {
  version: string
  calculatedAt: string
  quote: QuoteEngineContext
  customerFacing: QuoteEngineCustomerFacingResult
  internal: QuoteEngineInternalResult
  catalogReferences: QuoteEngineCatalogReference[]
}

export interface QuoteEngineCalculation extends QuoteEngineSnapshot {
  snapshot: QuoteEngineSnapshot
}

export interface QuoteEngineRecommendedService {
  id: string
  active: boolean
}

export function createEmptyQuoteEngineInput(
  context: QuoteEngineContext,
): QuoteEngineInput {
  return { ...context, services: [], customLineItems: [] }
}

export function quoteEngineInputHasLines(input?: QuoteEngineInput | null) {
  return Boolean(
    input && (input.services.length || input.customLineItems.length),
  )
}

/**
 * An approved Pricebook recommendation is a starting point only. Existing
 * Quote Engine lines always win so later recommendation changes cannot erase
 * the estimator's quote-specific work.
 */
export function initializeQuoteEngineInputFromRecommendation(
  input: QuoteEngineInput | undefined,
  context: QuoteEngineContext,
  service: QuoteEngineRecommendedService,
): QuoteEngineInput | undefined {
  if (!service.active || quoteEngineInputHasLines(input)) return input
  return {
    ...(input ?? createEmptyQuoteEngineInput(context)),
    ...context,
    services: [
      {
        lineId: `service-${service.id}`,
        serviceId: service.id,
        materialOverrides: [],
        laborOverride: {},
      },
    ],
    customLineItems: input?.customLineItems ?? [],
  }
}

/**
 * OpsBrain currently persists the authoritative snapshot with an estimate.
 * This restores only the editable quote choices from that server snapshot;
 * it never recalculates or invents economics in the browser.
 */
export function quoteEngineInputFromSnapshot(
  snapshot: QuoteEngineSnapshot,
): QuoteEngineInput {
  const customerLines = new Map(
    snapshot.customerFacing.lines.map((line) => [line.lineId, line]),
  )
  return {
    ...snapshot.quote,
    services: snapshot.internal.lines.flatMap((line) => {
      if (line.custom || !line.serviceId) return []
      const customer = customerLines.get(line.lineId)
      return [
        {
          lineId: line.lineId,
          serviceId: line.serviceId,
          customerDescription: customer?.description ?? undefined,
          sellingPriceCents: customer?.sellingPriceCents ?? undefined,
          materialOverrides: line.materialBreakdown.map((material) => ({
            productId: material.productId,
            estimatedConsumption: material.estimatedConsumption,
            consumptionUnit: material.consumptionUnit ?? undefined,
          })),
          laborOverride: line.labor
            ? {
                onsiteHours: line.labor.onsiteHours ?? undefined,
                employeeCount: line.labor.employeeCount ?? undefined,
              }
            : undefined,
        },
      ]
    }),
    customLineItems: snapshot.internal.lines.flatMap((line) => {
      if (!line.custom) return []
      const customer = customerLines.get(line.lineId)
      if (!customer || customer.sellingPriceCents === null) return []
      return [
        {
          lineId: line.lineId,
          name: customer.serviceName,
          description: customer.description ?? undefined,
          sellingPriceCents: customer.sellingPriceCents,
        },
      ]
    }),
  }
}

/** Compatibility data for legacy lists and screens, derived only from a server result. */
export function customerPricingSnapshotFromQuoteEngine(
  calculation: Pick<QuoteEngineSnapshot, "calculatedAt" | "customerFacing">,
) {
  const { customerFacing } = calculation
  if (
    customerFacing.quoteTotalCents === null ||
    !customerFacing.lines.every((line) =>
      Number.isSafeInteger(line.sellingPriceCents),
    )
  ) {
    return undefined
  }
  return {
    currency: "USD" as const,
    totalCents: customerFacing.quoteTotalCents,
    lineItems: customerFacing.lines.map((line) => ({
      id: line.lineId,
      label: line.serviceName,
      amountCents: line.sellingPriceCents as number,
    })),
    quotedAt: calculation.calculatedAt,
  }
}

export function quoteEngineMarginMessage(
  status: QuoteEngineMarginStatus,
  message?: string | null,
) {
  if (status === "incomplete")
    return "Margin unavailable — cost data incomplete"
  if (status === "excluded") return "Margin excluded — General Pest Control"
  return message ?? null
}
