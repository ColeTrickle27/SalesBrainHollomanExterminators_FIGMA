/**
 * Response shapes matching Holloman Ops Brain's real API
 * (functions/api/[[path]].js in ColeTrickle27/holloman-ops-brain). Ops Brain
 * is a vanilla JS + Cloudflare Pages Functions app, NOT React -- Sales Brain
 * integrates with it purely over this HTTP/JSON contract, never by importing
 * its code. Success responses vary per-route (no generic envelope); errors
 * are always `{ error: string }` with a non-2xx status.
 */

export interface OpsBrainIndexedLocation {
  billToNumber: string;
  billToName: string;
  locationNumber: string;
  locationName: string;
  locationAddress: string;
  customerFirstName: string;
  customerLastName: string;
  accountType: "individual" | "company";
  lastModified: string;
  /** R2 storage prefix, e.g. "bill-tos/1042 - Parker, Morgan/3 - 1842 Linden Lane/". */
  prefix: string;
}

export interface OpsBrainSearchResponse {
  results: OpsBrainIndexedLocation[];
}

export interface OpsBrainAccountsResponse {
  accounts: (OpsBrainIndexedLocation & { locationCount?: number })[];
  mode: "bill-to" | "all";
  sort: string;
  truncated: boolean;
}

export interface OpsBrainLocationResponse {
  location: OpsBrainIndexedLocation;
}

export interface OpsBrainFolderCreatedResponse {
  ok: true;
  prefix: string;
  message: string;
}

export interface OpsBrainErrorResponse {
  error: string;
}
