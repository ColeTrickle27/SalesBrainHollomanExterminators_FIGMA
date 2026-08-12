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
