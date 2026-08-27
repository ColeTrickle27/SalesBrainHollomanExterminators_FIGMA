/**
 * SalesInspection is the central workflow model for Sales Brain. Every step
 * in the approved workflow (Customer -> Property -> Inspection Findings ->
 * Recommended Service -> Review & Send) reads from and writes to a single
 * SalesInspection. This is what gets persisted (eventually to Ops Brain) and
 * what the future customer report/PDF is generated from.
 */

import type { CustomerBillTo, CustomerLocation } from "./customer"

import type { PhotoReference, PropertyInspection } from "./property"

import type { InspectionFinding, InspectionMarker } from "./findings"

import type { ServiceRecommendation } from "./recommendations"

import type { WorkflowStepId } from "./workflow"
import type { SalesBrainWorkflowData } from "./figma-workflow"
import type { QuoteEngineInput, QuoteEngineSnapshot } from "./quote-engine"

export type SalesInspectionStatus = "draft" | "sent" | "accepted" | "declined"

/**
 * The price actually quoted on this inspection. This is deliberately a
 * snapshot, rather than a live pricebook lookup, so a saved estimate remains
 * historically accurate when a future Pricebook entry changes.
 */

export interface SalesInspectionPricingSnapshot {
  currency: "USD"

  totalCents: number

  lineItems: Array<{
    id: string

    label: string

    amountCents: number
  }>

  quotedAt: string
}

export interface SalesInspection {
  id: string
  /** e.g. "HE-2641" -- human-facing estimate number, independent of PestPac IDs. */
  estimateNumber: string
  leadId?: string

  billTo?: CustomerBillTo

  location?: CustomerLocation

  property?: PropertyInspection

  markers: InspectionMarker[]
  findings: InspectionFinding[]
  photos: PhotoReference[]
  /** Graph photos removed from this report; they remain owned by the graph. */
  excludedGraphPhotoIds?: string[]
  /** Graph-derived finding groups intentionally dismissed by the technician. */
  dismissedGraphFindingIds?: string[]
  /** Finding cards hidden in the UI without deleting their saved content. */
  hiddenFindingIds?: string[]

  recommendations: ServiceRecommendation[]

  /** The recommendation currently highlighted in the Recommended Service step, if any. */

  selectedRecommendationId?: string

  /** The quoted amount retained with this estimate, independent of future Pricebook changes. */

  pricingSnapshot?: SalesInspectionPricingSnapshot
  /** Customer-facing notes for the quote; separate from internal findings and costs. */
  quoteNotes?: string
  /** Quote-specific choices sent to OpsBrain for authoritative calculation. */
  quoteEngineInput?: QuoteEngineInput
  /** Server-calculated historical Quote Engine economics. */
  quoteEngineSnapshot?: QuoteEngineSnapshot

  /** Persisted state for the redesigned nine-stage Figma workflow. */
  workflowData?: SalesBrainWorkflowData

  activeStep: WorkflowStepId

  completedSteps: WorkflowStepId[]

  status: SalesInspectionStatus
  sentAt?: string
  acceptedAt?: string
  declinedAt?: string
  proposalR2Key?: string
  signatureStatus?: "not_requested" | "pending" | "sent" | "viewed" | "signed" | "completed" | "declined" | "expired" | "send_failed" | "revoked"
  boldSignDocumentId?: string
  pestPacHandoffStatus?: "not_ready" | "pending" | "completed"
  /** Set only after the technician explicitly builds the customer report. */

  reportBuiltAt?: string

  createdBy: string

  createdAt: string

  updatedAt: string
}
