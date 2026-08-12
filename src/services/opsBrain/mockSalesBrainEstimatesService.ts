/**
 * In-memory estimates adapter for local development. Production builds select
 * the HTTP adapter by default, so no mock estimate can be mistaken for an Ops
 * Brain record after the Sales Brain bundle is mounted.
 */

import type { SalesInspection } from "../../types/sales-inspection"
import type { PhotoReference } from "../../types/property"
import type {
  SalesBrainEstimateListItem,
  SalesBrainEstimatesService,
} from "./salesBrainEstimatesService"

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function toListItem(estimate: SalesInspection): SalesBrainEstimateListItem {
  return {
    id: estimate.id,
    estimateNumber: estimate.estimateNumber,
    status: estimate.status,
    createdAt: estimate.createdAt,
    updatedAt: estimate.updatedAt,
    createdBy: estimate.createdBy,
    customerName: estimate.billTo?.billToName ?? null,
    locationName: estimate.location?.locationName ?? null,
    locationAddress: estimate.location?.locationAddress ?? null,
    totalCents: estimate.pricingSnapshot?.totalCents ?? null,
  }
}

export class MockSalesBrainEstimatesService
  implements SalesBrainEstimatesService
{
  private readonly estimates = new Map<string, SalesInspection>()

  async saveEstimate(estimate: SalesInspection): Promise<SalesInspection> {
    const existing = this.estimates.get(estimate.id)
    const now = new Date().toISOString()
    const saved: SalesInspection = {
      ...clone(estimate),
      createdAt: existing?.createdAt ?? estimate.createdAt,
      updatedAt: now,
    }
    this.estimates.set(saved.id, saved)
    return clone(saved)
  }

  async listEstimates(): Promise<SalesBrainEstimateListItem[]> {
    return [...this.estimates.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toListItem)
  }

  async getEstimate(id: string): Promise<SalesInspection | null> {
    const estimate = this.estimates.get(id)
    return estimate ? clone(estimate) : null
  }

  async uploadPhoto(estimateId: string, file: File): Promise<PhotoReference> {
    return {
      id: crypto.randomUUID(),
      source: "legacy-inline",
      storageKey: `mock/${estimateId}`,
      url: URL.createObjectURL(file),
      caption: file.name,
      byteSize: file.size,
      uploadedAt: new Date().toISOString(),
    }
  }

  async deletePhoto(): Promise<void> {}
}
