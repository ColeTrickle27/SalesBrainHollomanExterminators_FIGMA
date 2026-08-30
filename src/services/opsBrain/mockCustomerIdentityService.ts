import type { CustomerIdentityService } from "./customerIdentityService"
import { toCustomerIdentitySearchResult } from "./httpCustomerIdentityService"

const PREVIEW_IDENTITIES = [
  {
    locationId: "preview-location-1042-3",
    billToId: "preview-bill-to-1042",
    identityState: "permanent" as const,
    customerName: "Parker, Morgan",
    locationName: "1842 Linden Lane",
    serviceAddress: "1842 Linden Lane, Raleigh, NC 27601",
    phone: "919-555-0104",
    email: "morgan.parker@example.test",
    pestpacBillToNumber: "1042",
    pestpacLocationNumber: "3",
  },
]

export class MockCustomerIdentityService implements CustomerIdentityService {
  async searchCustomerIdentities(query: string) {
    const normalized = query.trim().toLowerCase()
    return PREVIEW_IDENTITIES.filter((identity) =>
      [
        identity.customerName,
        identity.locationName,
        identity.serviceAddress,
        identity.phone,
        identity.email,
        identity.pestpacBillToNumber,
        identity.pestpacLocationNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    ).map(toCustomerIdentitySearchResult)
  }
}
