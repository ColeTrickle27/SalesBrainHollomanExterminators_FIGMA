/**
 * Real HTTP implementation of CustomerFilesService, calling Ops Brain's
 * Cloudflare Pages Functions API directly (functions/api/[[path]].js in
 * ColeTrickle27/holloman-ops-brain). Ops Brain's session cookie is
 * HTTP-only and origin-scoped, so this client relies on `credentials:
 * "include"` and same-site/cross-site cookie rules -- it will only work
 * once Sales Brain is served from an origin Ops Brain trusts (e.g. mounted
 * under Ops Brain itself per the long-term architecture, or added to Ops
 * Brain's CORS allowlist the way graphs.holloman-ext.com is today).
 *
 * Not wired up or exercised yet. Kept here, disconnected, as the concrete
 * target for Phase 2.
 */

import type {
  CreateBillToInput,
  CreateLocationInput,
  CustomerBillTo,
  CustomerLocation,
  CustomerSearchResult,
} from "../../types/customer";
import type { CustomerFilesService } from "./customerFilesService";
import { OpsBrainAuthError } from "./errors";
import { toBillTo, toLocation } from "./mappers";
import type {
  OpsBrainAccountsResponse,
  OpsBrainLocationResponse,
  OpsBrainSearchResponse,
} from "./types";

export interface OpsBrainClientConfig {
  /** Ops Brain origin, e.g. "https://ops.holloman-ext.com". No trailing slash. */
  baseUrl: string;
}

export class HttpCustomerFilesService implements CustomerFilesService {
  constructor(private readonly config: OpsBrainClientConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}/api${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    let payload: unknown;
    let parseError = false;
    try {
      payload = await response.json();
    } catch {
      parseError = true;
      payload = undefined;
    }
    const errorField = (payload as { error?: string } | undefined)?.error;
    if (!response.ok) {
      if (response.status === 401) {
        throw new OpsBrainAuthError(errorField);
      }
      throw new Error(errorField || `Ops Brain request failed (${response.status}).`);
    }
    if (parseError || payload == null) {
      // A 2xx response that isn't valid JSON means we're not actually
      // talking to Ops Brain's API (e.g. hitting a dev server's SPA
      // fallback HTML instead of a real route) -- fail loudly instead of
      // silently returning {} and crashing deeper in the caller on a
      // missing field.
      throw new Error("Ops Brain returned an unexpected (non-JSON) response. Check the configured baseUrl / mounting.");
    }
    return payload as T;
  }

  async searchCustomers(query: string): Promise<CustomerSearchResult[]> {
    const data = await this.request<OpsBrainSearchResponse>(
      `/search?q=${encodeURIComponent(query)}`,
    );
    return data.results.map((row) => ({ billTo: toBillTo(row), location: toLocation(row) }));
  }

  async getBillTo(billToNumber: string): Promise<CustomerBillTo | null> {
    const data = await this.request<OpsBrainAccountsResponse>(
      `/accounts?billTo=${encodeURIComponent(billToNumber)}`,
    );
    const first = data.accounts[0];
    return first ? toBillTo(first) : null;
  }

  async getLocations(billToNumber: string): Promise<CustomerLocation[]> {
    const data = await this.request<OpsBrainAccountsResponse>(
      `/accounts?billTo=${encodeURIComponent(billToNumber)}`,
    );
    return data.accounts.map(toLocation);
  }

  async getLocation(billToNumber: string, locationNumber: string): Promise<CustomerLocation | null> {
    try {
      const data = await this.request<OpsBrainLocationResponse>(
        `/location?billTo=${encodeURIComponent(billToNumber)}&location=${encodeURIComponent(locationNumber)}`,
      );
      return toLocation(data.location);
    } catch {
      return null;
    }
  }

  async createBillTo(input: CreateBillToInput): Promise<CustomerBillTo> {
    // Ops Brain has no standalone "create Bill-To" route today -- a Bill-To
    // is created implicitly the first time a Location under it is created.
    // Callers should collect the Bill-To fields in the UI, then call
    // createLocation() with both. This method exists so Sales Brain's own
    // "Create Bill-To / Location" flow doesn't need to change if Ops Brain
    // adds a dedicated endpoint later.
    return { billToNumber: input.billToNumber, billToName: input.billToName, accountType: input.accountType ?? "company" };
  }

  async createLocation(input: CreateLocationInput): Promise<CustomerLocation> {
    const data = await this.request<{ location?: OpsBrainIndexedLocationLike }>("/customer-location", {
      method: "POST",
      body: JSON.stringify({
        customerName: input.locationName,
        billToNumber: input.billToNumber,
        locationNumber: input.locationNumber,
        locationAddress: input.locationAddress,
      }),
    });
    return {
      billToNumber: input.billToNumber,
      billToName: data.location?.billToName ?? input.locationName,
      locationNumber: input.locationNumber,
      locationName: input.locationName,
      locationAddress: input.locationAddress,
      prefix: data.location?.prefix,
    };
  }
}

type OpsBrainIndexedLocationLike = {
  billToName?: string;
  prefix?: string;
};
