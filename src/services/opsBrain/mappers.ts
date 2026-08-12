import type { CustomerBillTo, CustomerLocation } from "../../types/customer";
import type { OpsBrainIndexedLocation } from "./types";

export function toBillTo(row: OpsBrainIndexedLocation): CustomerBillTo {
  return {
    billToNumber: row.billToNumber,
    billToName: row.billToName,
    accountType: row.accountType,
    customerFirstName: row.customerFirstName || undefined,
    customerLastName: row.customerLastName || undefined,
  };
}

export function toLocation(row: OpsBrainIndexedLocation): CustomerLocation {
  return {
    billToNumber: row.billToNumber,
    billToName: row.billToName,
    locationNumber: row.locationNumber,
    locationName: row.locationName,
    locationAddress: row.locationAddress || undefined,
    lastModified: row.lastModified || undefined,
    prefix: row.prefix || undefined,
  };
}
