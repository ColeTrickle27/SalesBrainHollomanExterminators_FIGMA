/**
 * Estimate persistence boundary for Sales Brain.
 *
 * SalesInspection remains the one saved workflow model. This service only
 * transports complete inspections to and from Ops Brain; it never creates a
 * parallel estimate model or lets UI components fetch directly.
 */

import type {
  SalesInspection,
  SalesInspectionStatus,
} from "../../types/sales-inspection"

import type { PhotoReference } from "../../types/property"

import type {
  PestPacHandoff,
  SalesDeliveryEvent,
  SalesDeliveryInput,
  SalesDocumentType,
  SalesGeneratedDocument,
  SalesSignatureRequest,
} from "../../types/sales-operations"

export interface SalesBrainEstimateListItem {
  id: string

  estimateNumber: string

  status: SalesInspectionStatus

  createdAt: string

  updatedAt: string

  createdBy: string

  customerName: string | null

  locationName: string | null

  locationAddress: string | null

  totalCents: number | null

  directCostCents?: number | null

  grossProfitCents?: number | null

  marginBps?: number | null

  leadId?: string | null

  sentAt?: string | null
  acceptedAt?: string | null
  declinedAt?: string | null
  signatureStatus?: SalesInspection["signatureStatus"]
}

export interface SalesBrainEstimatesService {
  /** Create a new estimate or overwrite the persisted record with the same id. */

  saveEstimate(estimate: SalesInspection): Promise<SalesInspection>

  /** Lightweight persisted-estimate summaries, newest updated record first. */

  listEstimates(): Promise<SalesBrainEstimateListItem[]>

  /** Fetch the full saved inspection by id. Missing records return null. */

  getEstimate(id: string): Promise<SalesInspection | null>

  /** Remove an open draft or sent quote from active SalesBrain views. */

  deleteEstimate(id: string): Promise<void>

  updateStatus(
    id: string,
    status: SalesInspectionStatus,
  ): Promise<SalesInspection>

  createProposalPdf(id: string): Promise<{
    key: string
    name: string
    url: string
  }>

  createDocument(id: string, type: SalesDocumentType): Promise<{
    document: SalesGeneratedDocument
    key: string
    name: string
    url: string
  }>

  listDocuments(id: string): Promise<SalesGeneratedDocument[]>

  sendDelivery(id: string, input: SalesDeliveryInput): Promise<{
    delivery: SalesDeliveryEvent
    duplicate: boolean
  }>

  listDeliveries(id: string): Promise<SalesDeliveryEvent[]>

  createSignatureRequest(
    id: string,
    input: {
      customerEmail: string
      customerName: string
      selectedOptionId: string
      message: string
      idempotencyKey: string
    },
  ): Promise<{ signatureRequest: SalesSignatureRequest; duplicate: boolean }>

  getSignatureRequest(id: string): Promise<SalesSignatureRequest | null>

  getPestPacHandoff(id: string): Promise<PestPacHandoff | null>

  savePestPacHandoff(
    id: string,
    input: PestPacHandoff & { complete?: boolean },
  ): Promise<PestPacHandoff>

  uploadPhoto(estimateId: string, file: File): Promise<PhotoReference>

  deletePhoto(photo: PhotoReference): Promise<void>
}
