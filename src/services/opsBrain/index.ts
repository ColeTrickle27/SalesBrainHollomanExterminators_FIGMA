export type { CustomerFilesService } from "./customerFilesService"
export type { CustomerIdentityService } from "./customerIdentityService"

export type { CurrentUserService } from "./currentUserService"

export type {
  SalesBrainEstimatesService,
  SalesBrainEstimateListItem,
} from "./salesBrainEstimatesService"

export type { SalesBrainPricebookService } from "./salesBrainPricebookService"
export type { SalesBrainOperationsService } from "./salesBrainOperationsService"
export type { QuoteEngineService } from "./quoteEngineService"
export { OpsBrainAuthError } from "./errors"

export { HttpCustomerFilesService } from "./httpCustomerFilesService"
export { HttpCustomerIdentityService } from "./httpCustomerIdentityService"

export { MockCustomerFilesService } from "./mockCustomerFilesService"
export { MockCustomerIdentityService } from "./mockCustomerIdentityService"

export { HttpCurrentUserService } from "./httpCurrentUserService"

export { MockCurrentUserService } from "./mockCurrentUserService"

export { HttpSalesBrainEstimatesService } from "./httpSalesBrainEstimatesService"

export { MockSalesBrainEstimatesService } from "./mockSalesBrainEstimatesService"

export { HttpSalesBrainPricebookService } from "./httpSalesBrainPricebookService"

export { MockSalesBrainPricebookService } from "./mockSalesBrainPricebookService"
export { HttpSalesBrainOperationsService } from "./httpSalesBrainOperationsService"
export { MockSalesBrainOperationsService } from "./mockSalesBrainOperationsService"
export { HttpQuoteEngineService } from "./httpQuoteEngineService"
export * from "./types"

import { HttpCustomerFilesService } from "./httpCustomerFilesService"
import { HttpCustomerIdentityService } from "./httpCustomerIdentityService"

import { MockCustomerFilesService } from "./mockCustomerFilesService"
import { MockCustomerIdentityService } from "./mockCustomerIdentityService"

import { HttpCurrentUserService } from "./httpCurrentUserService"

import { MockCurrentUserService } from "./mockCurrentUserService"

import { HttpSalesBrainEstimatesService } from "./httpSalesBrainEstimatesService"

import { MockSalesBrainEstimatesService } from "./mockSalesBrainEstimatesService"

import { HttpSalesBrainPricebookService } from "./httpSalesBrainPricebookService"

import { MockSalesBrainPricebookService } from "./mockSalesBrainPricebookService"

import type { CustomerFilesService } from "./customerFilesService"
import type { CustomerIdentityService } from "./customerIdentityService"

import type { CurrentUserService } from "./currentUserService"

import type { SalesBrainEstimatesService } from "./salesBrainEstimatesService"

import type { SalesBrainPricebookService } from "./salesBrainPricebookService"
import { HttpSalesBrainOperationsService } from "./httpSalesBrainOperationsService"
import { MockSalesBrainOperationsService } from "./mockSalesBrainOperationsService"
import type { SalesBrainOperationsService } from "./salesBrainOperationsService"
import { HttpQuoteEngineService } from "./httpQuoteEngineService"
import type { QuoteEngineService } from "./quoteEngineService"

/**
 * Active Customer Files service instance.
 *
 * Phase 2 decision (see docs/SALES_BRAIN_ARCHITECTURE.md §4): Sales Brain is
 * planned to eventually be *mounted under Ops Brain's own origin* (the same
 * way /bugman-graphs/ is today), which sidesteps Ops Brain's
 * SameSite=Strict session cookie and its per-route CORS allowlist entirely --
 * no code in holloman-ops-brain needs to change for this. That mounting /
 * deploy work itself is out of scope here and tracked separately; this
 * factory just prepares Sales Brain to work correctly once it happens.
 *
 * Defaults:
 *  - Production build (`import.meta.env.PROD`): HttpCustomerFilesService,
 *    with baseUrl "" so requests are same-origin relative paths
 *    (`/api/search`, etc.) -- correct once mounted under Ops Brain, and also
 *    fine if Sales Brain is temporarily reverse-proxied under Ops Brain's
 *    origin some other way.
 *  - Dev server (`npm run dev`): MockCustomerFilesService, since there is no
 *    same-origin Ops Brain to call from the sandbox/local dev server.
 *
 * Both can be overridden explicitly with env vars so you're never stuck:
 *  - VITE_CUSTOMER_FILES_MODE="mock" | "http"
 *  - VITE_OPS_BRAIN_BASE_URL="https://ops.holloman-ext.com" (only relevant
 *    in "http" mode; leave unset for same-origin relative requests)
 */

export function createCustomerFilesService(): CustomerFilesService {
  const mode =
    import.meta.env.VITE_CUSTOMER_FILES_MODE ??
    (import.meta.env.PROD ? "http" : "mock")

  if (mode === "http") {
    return new HttpCustomerFilesService({
      baseUrl: import.meta.env.VITE_OPS_BRAIN_BASE_URL ?? "",
    })
  }

  return new MockCustomerFilesService()
}

/** Canonical customer selection for modern quotes; never falls back to Customer Files. */
export function createCustomerIdentityService(): CustomerIdentityService {
  const mode =
    import.meta.env.VITE_CUSTOMER_IDENTITY_MODE ??
    (import.meta.env.PROD ? "http" : "mock")

  if (mode === "http") {
    return new HttpCustomerIdentityService({
      baseUrl: import.meta.env.VITE_OPS_BRAIN_BASE_URL ?? "",
    })
  }

  return new MockCustomerIdentityService()
}

/**
 * Active CurrentUserService instance. Same mode/env-var pattern as
 * createCustomerFilesService() above -- production talks to Ops Brain's
 * real GET /api/me over the shared session cookie once mounted at
 * /sales-brain/; dev mode uses an obviously-labeled preview account since
 * there's no same-origin Ops Brain session to read locally.
 *
 *  - VITE_CURRENT_USER_MODE="mock" | "http" (falls back to
 *    VITE_CUSTOMER_FILES_MODE, then PROD, if unset)
 *  - VITE_OPS_BRAIN_BASE_URL (shared with Customer Files; leave unset for
 *    same-origin relative requests)
 */

export function createCurrentUserService(): CurrentUserService {
  const mode =
    import.meta.env.VITE_CURRENT_USER_MODE ??
    import.meta.env.VITE_CUSTOMER_FILES_MODE ??
    (import.meta.env.PROD ? "http" : "mock")

  if (mode === "http") {
    return new HttpCurrentUserService({
      baseUrl: import.meta.env.VITE_OPS_BRAIN_BASE_URL ?? "",
    })
  }

  return new MockCurrentUserService()
}

/**
 * Active Sales Brain estimate persistence adapter. Uses real same-origin Ops
 * Brain persistence in production and the in-memory adapter only in local dev.
 *
 * VITE_SALES_BRAIN_ESTIMATES_MODE="mock" | "http" can force either adapter.
 * VITE_OPS_BRAIN_BASE_URL is shared with the other Ops Brain HTTP adapters.
 */

export function createSalesBrainEstimatesService(): SalesBrainEstimatesService {
  const mode =
    import.meta.env.VITE_SALES_BRAIN_ESTIMATES_MODE ??
    (import.meta.env.PROD ? "http" : "mock")

  if (mode === "http") {
    return new HttpSalesBrainEstimatesService({
      baseUrl: import.meta.env.VITE_OPS_BRAIN_BASE_URL ?? "",
    })
  }

  return new MockSalesBrainEstimatesService()
}

/** Active Pricebook adapter. Production uses the authenticated same-origin API; local development uses preview entries. */

export function createSalesBrainPricebookService(): SalesBrainPricebookService {
  const mode =
    import.meta.env.VITE_SALES_BRAIN_PRICEBOOK_MODE ??
    (import.meta.env.PROD ? "http" : "mock")

  if (mode === "http")
    return new HttpSalesBrainPricebookService({
      baseUrl: import.meta.env.VITE_OPS_BRAIN_BASE_URL ?? "",
    })

  return new MockSalesBrainPricebookService()
}

export function createSalesBrainOperationsService(): SalesBrainOperationsService {
  const mode =
    import.meta.env.VITE_SALES_BRAIN_OPERATIONS_MODE ??
    (import.meta.env.PROD ? "http" : "mock")
  if (mode === "http")
    return new HttpSalesBrainOperationsService({
      baseUrl: import.meta.env.VITE_OPS_BRAIN_BASE_URL ?? "",
    })
  return new MockSalesBrainOperationsService()
}

/**
 * Quote calculations have no browser fallback. Even in local development this
 * adapter calls the configured OpsBrain origin, so SalesBrain never becomes a
 * competing costing engine.
 */
export function createQuoteEngineService(): QuoteEngineService {
  return new HttpQuoteEngineService({
    baseUrl: import.meta.env.VITE_OPS_BRAIN_BASE_URL ?? "",
  })
}
