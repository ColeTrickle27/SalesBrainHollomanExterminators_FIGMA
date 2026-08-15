/**
 * In-memory estimates adapter for local development. Production builds select
 * the HTTP adapter by default, so no mock estimate can be mistaken for an Ops
 * Brain record after the Sales Brain bundle is mounted.
 */

import type { SalesInspection } from "../../types/sales-inspection"
import type { PhotoReference } from "../../types/property"
import type { PestPacHandoff, SalesDeliveryEvent, SalesDeliveryInput, SalesDocumentType, SalesGeneratedDocument, SalesSignatureRequest } from "../../types/sales-operations"
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
  private readonly documents = new Map<string, SalesGeneratedDocument[]>()
  private readonly deliveries = new Map<string, SalesDeliveryEvent[]>()
  private readonly signatures = new Map<string, SalesSignatureRequest>()
  private readonly handoffs = new Map<string, PestPacHandoff>()

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

  async deleteEstimate(id: string): Promise<void> {
    const estimate = this.estimates.get(id)
    if (!estimate) throw new Error("Estimate not found.")
    if (estimate.status !== "draft" && estimate.status !== "sent") throw new Error("Only open draft or sent quotes can be deleted.")
    this.estimates.delete(id)
    this.documents.delete(id)
    this.deliveries.delete(id)
    this.signatures.delete(id)
    this.handoffs.delete(id)
  }

  async updateStatus(id: string, status: SalesInspection["status"]): Promise<SalesInspection> {
    const estimate = this.estimates.get(id)
    if (!estimate) throw new Error("Estimate not found.")
    const now = new Date().toISOString()
    const saved = {
      ...estimate,
      status,
      updatedAt: now,
      ...(status === "sent" ? { sentAt: now } : {}),
      ...(status === "accepted" ? { acceptedAt: now } : {}),
      ...(status === "declined" ? { declinedAt: now } : {}),
    }
    this.estimates.set(id, saved)
    return clone(saved)
  }

  async createProposalPdf(id: string) {
    if (!this.estimates.has(id)) throw new Error("Estimate not found.")
    return { key: `mock/proposals/${id}.pdf`, name: `${id}.pdf`, url: "#" }
  }

  async createDocument(id: string, type: SalesDocumentType) {
    if (!this.estimates.has(id)) throw new Error("Estimate not found.")
    const document: SalesGeneratedDocument = { id: crypto.randomUUID(), quoteId: id, type, r2Key: `mock/documents/${id}/${type}.pdf`, filename: `${id}-${type}.pdf`, createdBy: "local", createdAt: new Date().toISOString() }
    this.documents.set(id, [document, ...(this.documents.get(id) || [])])
    return { document, key: document.r2Key, name: document.filename, url: "#" }
  }

  async listDocuments(id: string) { return clone(this.documents.get(id) || []) }
  async sendDelivery(id: string, input: SalesDeliveryInput) {
    const delivery: SalesDeliveryEvent = { id: crypto.randomUUID(), quoteId: id, documentType: input.documentType, provider: "gmail", status: "sent", recipient: input.to, cc: input.cc, bcc: input.bcc, subject: input.subject, message: input.message, providerMessageId: `mock-${crypto.randomUUID()}`, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() }
    this.deliveries.set(id, [delivery, ...(this.deliveries.get(id) || [])])
    return { delivery, duplicate: false }
  }
  async listDeliveries(id: string) { return clone(this.deliveries.get(id) || []) }
  async createSignatureRequest(id: string, input: { customerEmail: string; customerName: string; selectedOptionId: string; message: string; idempotencyKey: string }) {
    const request: SalesSignatureRequest = { id: crypto.randomUUID(), quoteId: id, provider: "boldsign", status: "pending", customerEmail: input.customerEmail, selectedOptionId: input.selectedOptionId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    this.signatures.set(id, request)
    return { signatureRequest: request, duplicate: false }
  }
  async getSignatureRequest(id: string) { return clone(this.signatures.get(id) || null) }
  async getPestPacHandoff(id: string) { return clone(this.handoffs.get(id) || null) }
  async savePestPacHandoff(id: string, input: PestPacHandoff & { complete?: boolean }) { const handoff = { ...input, quoteId: id, status: input.complete ? "completed" as const : "pending" as const }; this.handoffs.set(id, handoff); return clone(handoff) }

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
