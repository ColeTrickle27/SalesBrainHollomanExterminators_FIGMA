/**
 * Customer domain models.
 *
 * Existing-customer quotes use OpsBrain's canonical customer identity API,
 * while Customer Files continues to own its legacy R2 file operations.
 *
 * Sales Brain does NOT own customer data. It references Ops Brain's Bill-To /
 * Location records by id/code. Customers not yet represented by a permanent
 * PestPac-backed identity begin through New Lead in this phase. SalesBrain
 * must never invent or duplicate customer identity.
 */

export type CustomerAccountType = "individual" | "company";

/** A PestPac Bill-To account, as mirrored inside Ops Brain's Customer Files. */
export interface CustomerBillTo {
  /** PestPac Bill-To number. This is the durable identifier, not a UUID. */
  billToNumber: string;
  /** Display name for the Bill-To (company name, or "Last, First" for individuals). */
  billToName: string;
  /** Legacy Customer Files supplies this; canonical identity search does not. */
  accountType?: CustomerAccountType;
  customerFirstName?: string;
  customerLastName?: string;
}

/** A single serviceable location under a Bill-To. */
export interface CustomerLocation {
  billToNumber: string;
  billToName: string;
  /** PestPac location number, unique within the Bill-To. */
  locationNumber: string;
  locationName: string;
  locationAddress?: string;
  /** ISO 8601 timestamp of the last change recorded in Ops Brain's index. */
  lastModified?: string;
  /**
   * The Ops Brain R2 storage prefix for this location's files, e.g.
   * "bill-tos/1042 - Parker, Morgan/3 - 1842 Linden Lane/". Treat as an
   * opaque Ops Brain implementation detail -- Sales Brain should not
   * construct these itself, only pass through what Ops Brain returns.
   */
  prefix?: string;
}

/** Convenience shape for referencing a customer + location without the full records. */
export interface CustomerLocationRef {
  billToNumber: string;
  billToCode?: string;
  locationId: string;
  locationCode: string;
}

/** Result of a Customer Files search (see CustomerFilesService.searchCustomers). */
export interface CustomerSearchResult {
  billTo: CustomerBillTo;
  location: CustomerLocation;
}

export type CustomerIdentityState = "temporary" | "permanent";

/** Canonical OpsBrain D1 Location plus the copied display snapshot used by a quote. */
export interface CustomerIdentitySearchResult extends CustomerSearchResult {
  customerLocationId: string;
  billToId: string;
  identityState: CustomerIdentityState;
  customerName: string;
  locationName: string;
  serviceAddress: string;
  phone: string | null;
  email: string | null;
  pestpacBillToNumber: string | null;
  pestpacLocationNumber: string | null;
}

/** The modern New Quote picker accepts only complete permanent PestPac locations. */
export function isSelectableExistingCustomerIdentity(
  identity: CustomerIdentitySearchResult,
) {
  return Boolean(
    identity.identityState === "permanent" &&
      identity.customerLocationId.trim() &&
      identity.pestpacBillToNumber?.trim() &&
      identity.pestpacLocationNumber?.trim(),
  );
}

/** Input for creating a Bill-To / Location that already exists in PestPac but not yet in Ops Brain. */
export interface CreateBillToInput {
  billToNumber: string;
  billToName: string;
  accountType?: CustomerAccountType;
}

export interface CreateLocationInput {
  billToNumber: string;
  locationNumber: string;
  locationName: string;
  locationAddress?: string;
}
