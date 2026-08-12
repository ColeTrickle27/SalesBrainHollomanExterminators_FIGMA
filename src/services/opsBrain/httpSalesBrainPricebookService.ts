import type {
  PricebookService,
  PricebookServiceInput,
} from "../../types/pricebook"
import { OpsBrainAuthError } from "./errors"
import type { OpsBrainClientConfig } from "./httpCustomerFilesService"
import type { SalesBrainPricebookService } from "./salesBrainPricebookService"

type ServiceResponse = { service: PricebookService }
type ListResponse = {
  services: PricebookService[]
  truncated?: boolean
  cursor?: string | null
}

/** HTTP contract: GET/POST /api/sales-brain/pricebook and PATCH/DELETE /:id. */
export class HttpSalesBrainPricebookService
  implements SalesBrainPricebookService
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

  async listServices(): Promise<PricebookService[]> {
    return (await this.request<ListResponse>("/sales-brain/pricebook")).services
  }

  async createService(input: PricebookServiceInput): Promise<PricebookService> {
    return (
      await this.request<ServiceResponse>("/sales-brain/pricebook", {
        method: "POST",
        body: JSON.stringify(input),
      })
    ).service
  }

  async updateService(
    id: string,
    input: PricebookServiceInput,
  ): Promise<PricebookService> {
    return (
      await this.request<ServiceResponse>(
        `/sales-brain/pricebook/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      )
    ).service
  }

  async deactivateService(id: string): Promise<PricebookService> {
    return (
      await this.request<ServiceResponse>(
        `/sales-brain/pricebook/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      )
    ).service
  }
}
