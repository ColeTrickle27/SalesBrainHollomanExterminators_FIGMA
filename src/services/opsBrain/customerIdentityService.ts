import type { CustomerIdentitySearchResult } from "../../types/customer"

/** Read-only boundary for OpsBrain's canonical D1 customer Location lookup. */
export interface CustomerIdentityService {
  searchCustomerIdentities(query: string): Promise<CustomerIdentitySearchResult[]>
}
