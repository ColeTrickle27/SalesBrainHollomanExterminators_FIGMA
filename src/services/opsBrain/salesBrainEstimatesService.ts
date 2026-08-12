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
}

export interface SalesBrainEstimatesService {
  /** Create a new estimate or overwrite the persisted record with the same id. */
  saveEstimate(estimate: SalesInspection): Promise<SalesInspection>
  /** Lightweight persisted-estimate summaries, newest updated record first. */
  listEstimates(): Promise<SalesBrainEstimateListItem[]>
  /** Fetch the full saved inspection by id. Missing records return null. */
  getEstimate(id: string): Promise<SalesInspection | null>
  uploadPhoto(estimateId: string, file: File): Promise<PhotoReference>
  deletePhoto(photo: PhotoReference): Promise<void>
}
