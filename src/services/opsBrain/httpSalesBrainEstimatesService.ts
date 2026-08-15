/**
 * HTTP implementation of SalesBrainEstimatesService. It mirrors the purpose-
 * built Ops Brain contract exactly:
 *
 * POST /api/sales-brain/estimates       -> { estimate } (201 create, 200 update)
 * GET  /api/sales-brain/estimates       -> { estimates, truncated, cursor }
 * GET  /api/sales-brain/estimates/:id   -> { estimate }
 *
 * Sales Brain is mounted at /sales-brain/ under Ops Brain, so a blank baseUrl
 * intentionally uses the shared origin and its HttpOnly session cookie.
 */

import type { SalesInspection } from "../../types/sales-inspection"
import type { PhotoReference } from "../../types/property"
import type { OpsBrainClientConfig } from "./httpCustomerFilesService"
import { OpsBrainAuthError } from "./errors"
import type {
  SalesBrainEstimateListItem,
  SalesBrainEstimatesService,
} from "./salesBrainEstimatesService"

type EstimateResponse = { estimate: SalesInspection }
type EstimateListResponse = {
  estimates: SalesBrainEstimateListItem[]
  truncated?: boolean
  cursor?: string | null
}

export class HttpSalesBrainEstimatesService
  implements SalesBrainEstimatesService
{
  constructor(private readonly config: OpsBrainClientConfig) {}

  private async request<T,>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}/api${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...init,
    })
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error(
        "Ops Brain returned an unexpected (non-JSON) response. Check the configured baseUrl / mounting.",
      )
    }
    const error = (payload as { error?: string } | undefined)?.error
    if (!response.ok) {
      if (response.status === 401) throw new OpsBrainAuthError(error)
      throw new Error(error || `Ops Brain request failed (${response.status}).`)
    }
    return payload as T
  }

  async saveEstimate(estimate: SalesInspection): Promise<SalesInspection> {
    const data = await this.request<EstimateResponse>(
      "/sales-brain/estimates",
      {
        method: "POST",
        body: JSON.stringify(estimate),
      },
    )
    return data.estimate
  }

  async listEstimates(): Promise<SalesBrainEstimateListItem[]> {
    const data = await this.request<EstimateListResponse>(
      "/sales-brain/estimates",
    )
    return data.estimates
  }

  async getEstimate(id: string): Promise<SalesInspection | null> {
    try {
      const data = await this.request<EstimateResponse>(
        `/sales-brain/estimates/${encodeURIComponent(id)}`,
      )
      return data.estimate
    } catch (error) {
      if (error instanceof Error && error.message === "Estimate not found.")
        return null
      throw error
    }
  }

  async deleteEstimate(id: string): Promise<void> {
    await this.request<{ ok: true }>(
      `/sales-brain/estimates/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    )
  }

  async updateStatus(id: string, status: SalesInspection["status"]): Promise<SalesInspection> {
    const data = await this.request<EstimateResponse>(
      `/sales-brain/estimates/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    )
    return data.estimate
  }

  async createProposalPdf(id: string) {
    return this.request<{ key: string; name: string; url: string }>(
      `/sales-brain/estimates/${encodeURIComponent(id)}/proposal.pdf`,
      { method: "POST" },
    )
  }

  async createDocument(id: string, type: import("../../types/sales-operations").SalesDocumentType) {
    return this.request<{ document: import("../../types/sales-operations").SalesGeneratedDocument; key: string; name: string; url: string }>(
      `/sales-brain/estimates/${encodeURIComponent(id)}/documents`,
      { method: "POST", body: JSON.stringify({ type }) },
    )
  }

  async listDocuments(id: string) {
    return (await this.request<{ documents: import("../../types/sales-operations").SalesGeneratedDocument[] }>(`/sales-brain/estimates/${encodeURIComponent(id)}/documents`)).documents
  }

  async sendDelivery(id: string, input: import("../../types/sales-operations").SalesDeliveryInput) {
    return this.request<{ delivery: import("../../types/sales-operations").SalesDeliveryEvent; duplicate: boolean }>(`/sales-brain/estimates/${encodeURIComponent(id)}/deliveries`, { method: "POST", body: JSON.stringify(input) })
  }

  async listDeliveries(id: string) {
    return (await this.request<{ deliveries: import("../../types/sales-operations").SalesDeliveryEvent[] }>(`/sales-brain/estimates/${encodeURIComponent(id)}/deliveries`)).deliveries
  }

  async createSignatureRequest(id: string, input: { customerEmail: string; customerName: string; selectedOptionId: string; message: string; idempotencyKey: string }) {
    return this.request<{ signatureRequest: import("../../types/sales-operations").SalesSignatureRequest; duplicate: boolean }>(`/sales-brain/estimates/${encodeURIComponent(id)}/signature-request`, { method: "POST", body: JSON.stringify(input) })
  }

  async getSignatureRequest(id: string) {
    return (await this.request<{ signatureRequest: import("../../types/sales-operations").SalesSignatureRequest | null }>(`/sales-brain/estimates/${encodeURIComponent(id)}/signature-request`)).signatureRequest
  }

  async getPestPacHandoff(id: string) {
    return (await this.request<{ handoff: import("../../types/sales-operations").PestPacHandoff | null }>(`/sales-brain/estimates/${encodeURIComponent(id)}/pestpac-handoff`)).handoff
  }

  async savePestPacHandoff(id: string, input: import("../../types/sales-operations").PestPacHandoff & { complete?: boolean }) {
    return (await this.request<{ handoff: import("../../types/sales-operations").PestPacHandoff }>(`/sales-brain/estimates/${encodeURIComponent(id)}/pestpac-handoff`, { method: "PATCH", body: JSON.stringify(input) })).handoff
  }

  async uploadPhoto(estimateId: string, file: File): Promise<PhotoReference> {
    const form = new FormData()
    form.set("photo", file)
    const response = await fetch(
      `${this.config.baseUrl}/api/sales-brain/estimates/${encodeURIComponent(estimateId)}/photos`,
      { method: "POST", credentials: "include", body: form },
    )
    const payload = (await response.json().catch(() => ({}))) as {
      photo?: PhotoReference
      error?: string
    }
    if (!response.ok || !payload.photo) {
      if (response.status === 401) throw new OpsBrainAuthError(payload.error)
      throw new Error(payload.error || "Unable to save inspection photo.")
    }
    return payload.photo
  }

  async deletePhoto(photo: PhotoReference): Promise<void> {
    if (photo.source !== "sales-brain" || !photo.storageKey) return
    const [estimateId, photoId] = photo.storageKey
      .replace(/^sales-brain\/photos\//, "")
      .split("/")
    if (!estimateId || !photoId) return
    const response = await fetch(
      `${this.config.baseUrl}/api/sales-brain/photos/${encodeURIComponent(estimateId)}/${encodeURIComponent(photoId)}`,
      { method: "DELETE", credentials: "include" },
    )
    if (response.status === 404) return
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) throw new Error(payload.error || "Unable to remove inspection photo.")
  }
}
