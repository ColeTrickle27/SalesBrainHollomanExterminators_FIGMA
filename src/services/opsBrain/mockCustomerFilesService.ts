/**
 * In-memory CustomerFilesService used for local development and the demo
 * data currently shown in the UI. Swap for HttpCustomerFilesService once
 * Sales Brain is served from an origin Ops Brain trusts (see that file's
 * header comment).
 */

import type {
  CreateBillToInput,
  CreateLocationInput,
  CustomerBillTo,
  CustomerLocation,
  CustomerSearchResult,
} from "../../types/customer";
import type { CustomerFilesService } from "./customerFilesService";

const DEMO_BILL_TO: CustomerBillTo = {
  billToNumber: "1042",
  billToName: "Parker, Morgan",
  accountType: "individual",
  customerFirstName: "Morgan",
  customerLastName: "Parker",
};

const DEMO_LOCATION: CustomerLocation = {
  billToNumber: "1042",
  billToName: "Parker, Morgan",
  locationNumber: "3",
  locationName: "1842 Linden Lane",
  locationAddress: "1842 Linden Lane, Tulsa, OK 74104",
  lastModified: new Date().toISOString(),
  prefix: "bill-tos/1042 - Parker, Morgan/3 - 1842 Linden Lane/",
};

export class MockCustomerFilesService implements CustomerFilesService {
  private billTos = new Map<string, CustomerBillTo>([[DEMO_BILL_TO.billToNumber, DEMO_BILL_TO]]);
  private locations = new Map<string, CustomerLocation>([
    [`${DEMO_LOCATION.billToNumber}:${DEMO_LOCATION.locationNumber}`, DEMO_LOCATION],
  ]);

  async searchCustomers(query: string): Promise<CustomerSearchResult[]> {
    const q = query.trim().toLowerCase();
    const results: CustomerSearchResult[] = [];
    for (const location of this.locations.values()) {
      const billTo = this.billTos.get(location.billToNumber);
      if (!billTo) continue;
      const haystack = `${billTo.billToName} ${location.locationName} ${location.locationAddress ?? ""}`.toLowerCase();
      if (!q || haystack.includes(q)) results.push({ billTo, location });
    }
    return results;
  }

  async getBillTo(billToNumber: string): Promise<CustomerBillTo | null> {
    return this.billTos.get(billToNumber) ?? null;
  }

  async getLocations(billToNumber: string): Promise<CustomerLocation[]> {
    return [...this.locations.values()].filter((loc) => loc.billToNumber === billToNumber);
  }

  async getLocation(billToNumber: string, locationNumber: string): Promise<CustomerLocation | null> {
    return this.locations.get(`${billToNumber}:${locationNumber}`) ?? null;
  }

  async createBillTo(input: CreateBillToInput): Promise<CustomerBillTo> {
    const billTo: CustomerBillTo = { billToNumber: input.billToNumber, billToName: input.billToName, accountType: input.accountType ?? "company" };
    this.billTos.set(billTo.billToNumber, billTo);
    return billTo;
  }

  async createLocation(input: CreateLocationInput): Promise<CustomerLocation> {
    if (!this.billTos.has(input.billToNumber)) {
      throw new Error(`Bill-To ${input.billToNumber} must exist before creating a Location under it.`);
    }
    const billTo = this.billTos.get(input.billToNumber)!;
    const location: CustomerLocation = {
      billToNumber: input.billToNumber,
      billToName: billTo.billToName,
      locationNumber: input.locationNumber,
      locationName: input.locationName,
      locationAddress: input.locationAddress,
      lastModified: new Date().toISOString(),
      prefix: `bill-tos/${input.billToNumber} - ${billTo.billToName}/${input.locationNumber} - ${input.locationName}/`,
    };
    this.locations.set(`${input.billToNumber}:${input.locationNumber}`, location);
    return location;
  }
}
