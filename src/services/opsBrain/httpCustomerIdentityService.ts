import type {
  CustomerIdentitySearchResult,
  CustomerIdentityState,
} from "../../types/customer"
import type { CustomerIdentityService } from "./customerIdentityService"
import { OpsBrainAuthError } from "./errors.ts"
import type { OpsBrainClientConfig } from "./httpCustomerFilesService"

interface OpsBrainCustomerIdentityRow {
  locationId: string
  billToId: string
  identityState: CustomerIdentityState
  customerName: string
  locationName: string
  serviceAddress: string
  phone: string | null
  email: string | null
  pestpacBillToNumber: string | null
  pestpacLocationNumber: string | null
}

interface OpsBrainCustomerIdentityResponse {
  results: OpsBrainCustomerIdentityRow[]
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null
}

function isCustomerIdentityRow(value: unknown): value is OpsBrainCustomerIdentityRow {
  if (!value || typeof value !== "object") return false
  const row = value as Record<string, unknown>
  return (
    typeof row.locationId === "string" &&
    typeof row.billToId === "string" &&
    (row.identityState === "temporary" || row.identityState === "permanent") &&
    typeof row.customerName === "string" &&
    typeof row.locationName === "string" &&
    typeof row.serviceAddress === "string" &&
    isNullableString(row.phone) &&
    isNullableString(row.email) &&
    isNullableString(row.pestpacBillToNumber) &&
    isNullableString(row.pestpacLocationNumber)
  )
}

export function toCustomerIdentitySearchResult(
  row: OpsBrainCustomerIdentityRow,
): CustomerIdentitySearchResult {
  return {
    ...row,
    customerLocationId: row.locationId,
    billTo: {
      billToNumber: row.pestpacBillToNumber ?? "",
      billToName: row.customerName,
    },
    location: {
      billToNumber: row.pestpacBillToNumber ?? "",
      billToName: row.customerName,
      locationNumber: row.pestpacLocationNumber ?? "",
      locationName: row.locationName,
      locationAddress: row.serviceAddress || undefined,
    },
  }
}

export class HttpCustomerIdentityService implements CustomerIdentityService {
  private readonly config: OpsBrainClientConfig

  constructor(config: OpsBrainClientConfig) {
    this.config = config
  }

  async searchCustomerIdentities(
    query: string,
  ): Promise<CustomerIdentitySearchResult[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/customer-identity/search?q=${encodeURIComponent(query)}`,
      { credentials: "include" },
    )

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error(
        "Ops Brain returned an unexpected response. Check the configured customer identity service.",
      )
    }

    const error = (payload as { error?: string } | undefined)?.error
    if (!response.ok) {
      if (response.status === 401) throw new OpsBrainAuthError(error)
      throw new Error(
        error || `Ops Brain customer identity search failed (${response.status}).`,
      )
    }

    const results = (payload as Partial<OpsBrainCustomerIdentityResponse>)?.results
    if (!Array.isArray(results) || !results.every(isCustomerIdentityRow)) {
      throw new Error("Ops Brain returned malformed customer identity results.")
    }

    return results.map(toCustomerIdentitySearchResult)
  }
}
