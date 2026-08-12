/**
 * Customer Files service boundary.
 *
 * Ops Brain (ColeTrickle27/holloman-ops-brain) is the system that mirrors
 * PestPac's Bill-To / Location structure today. Sales Brain never owns or
 * invents customer records -- it searches, reads, and (when a technician
 * confirms PestPac identifiers for a customer Ops Brain doesn't know about
 * yet) creates Bill-Tos and Locations through this interface, which is a
 * thin adapter over Ops Brain's real `/api/search`, `/api/accounts`,
 * `/api/location`, and `/api/customer-location` routes.
 *
 * There is currently no PestPac API. If a Bill-To/Location isn't found here,
 * the UI must prompt the technician to create it using the exact PestPac
 * identifiers -- never auto-generate or guess one.
 */

import type {
  CreateBillToInput,
  CreateLocationInput,
  CustomerBillTo,
  CustomerLocation,
  CustomerSearchResult,
} from "../../types/customer";

export interface CustomerFilesService {
  /** Free-text search across Bill-To name, Location name/address, and customer name. */
  searchCustomers(query: string): Promise<CustomerSearchResult[]>;

  /** Look up a single Bill-To by its PestPac Bill-To number. */
  getBillTo(billToNumber: string): Promise<CustomerBillTo | null>;

  /** All Locations under a Bill-To. */
  getLocations(billToNumber: string): Promise<CustomerLocation[]>;

  /** A single Bill-To/Location pair, if it already exists in Ops Brain. */
  getLocation(billToNumber: string, locationNumber: string): Promise<CustomerLocation | null>;

  /**
   * Registers a Bill-To that exists in PestPac but not yet in Ops Brain.
   * Ops Brain currently creates Bill-Tos implicitly as part of creating a
   * Location (see createLocation) -- this is kept as a distinct method so
   * Sales Brain's UI flow (prompt for Bill-To, then Location) doesn't need
   * to change if Ops Brain later adds a standalone endpoint.
   */
  createBillTo(input: CreateBillToInput): Promise<CustomerBillTo>;

  /** Creates a Location (and its parent Bill-To, if needed) using PestPac identifiers. */
  createLocation(input: CreateLocationInput): Promise<CustomerLocation>;
}
