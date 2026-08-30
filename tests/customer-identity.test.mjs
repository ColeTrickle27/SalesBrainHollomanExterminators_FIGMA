import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  canonicalCustomerContext,
  canonicalCustomerSelectionChanged,
} from "../src/features/sales/quoteWorkspace.ts"
import { OpsBrainAuthError } from "../src/services/opsBrain/errors.ts"
import { HttpCustomerIdentityService } from "../src/services/opsBrain/httpCustomerIdentityService.ts"
import { MockSalesBrainEstimatesService } from "../src/services/opsBrain/mockSalesBrainEstimatesService.ts"
import {
  createEmptyQuoteEngineInput,
  hasQuoteEngineQuoteContext,
  quoteEngineInputForSave,
} from "../src/types/quote-engine.ts"

const customerSearchSource = readFileSync(
  new URL("../src/screens/CustomerSearch.tsx", import.meta.url),
  "utf8",
)
const estimatesHttpSource = readFileSync(
  new URL("../src/services/opsBrain/httpSalesBrainEstimatesService.ts", import.meta.url),
  "utf8",
)

const apiIdentity = {
  locationId: "location-7001",
  billToId: "bill-to-5001",
  identityState: "permanent",
  customerName: "O'Connor Services",
  locationName: "Main Service Location",
  serviceAddress: "901 Long Customer Road, Raleigh, NC 27601",
  phone: "919-555-0101",
  email: "ops@oconnor.example",
  pestpacBillToNumber: "5001",
  pestpacLocationNumber: "7001",
}

function identityResult(overrides = {}) {
  const row = { ...apiIdentity, ...overrides }
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
      locationAddress: row.serviceAddress,
    },
  }
}

function inspection(overrides = {}) {
  const now = "2026-08-30T12:00:00.000Z"
  return {
    id: "quote-1",
    estimateNumber: "DRAFT-QUOTE-1",
    markers: [],
    findings: [],
    photos: [],
    recommendations: [],
    activeStep: "customer",
    completedSteps: [],
    status: "draft",
    createdBy: "preview",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

async function withFetch(t, handler) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = handler
  t.after(() => {
    globalThis.fetch = originalFetch
  })
}

test("canonical identity service uses only the encoded D1 identity endpoint and maps Location ownership", async (t) => {
  let requestedUrl = ""
  let requestedInit
  await withFetch(t, async (url, init) => {
    requestedUrl = String(url)
    requestedInit = init
    return new Response(JSON.stringify({ results: [apiIdentity] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  })

  const service = new HttpCustomerIdentityService({
    baseUrl: "https://ops.example.test",
  })
  const [result] = await service.searchCustomerIdentities("O'Connor & Sons")

  assert.equal(
    requestedUrl,
    "https://ops.example.test/api/customer-identity/search?q=O'Connor%20%26%20Sons",
  )
  assert.doesNotMatch(requestedUrl, /\/api\/search(?:\?|$)/)
  assert.equal(requestedInit.credentials, "include")
  assert.equal(result.customerLocationId, apiIdentity.locationId)
  assert.equal(result.billToId, apiIdentity.billToId)
  assert.equal(result.identityState, "permanent")
  assert.equal(result.billTo.billToNumber, "5001")
  assert.equal(result.location.locationNumber, "7001")
  assert.equal(result.customerName, apiIdentity.customerName)
  assert.equal(result.locationName, apiIdentity.locationName)
  assert.equal(result.serviceAddress, apiIdentity.serviceAddress)
  assert.equal(result.phone, apiIdentity.phone)
  assert.equal(result.email, apiIdentity.email)
  assert.equal(Object.hasOwn(result.billTo, "accountType"), false)
})

test("canonical identity service preserves unavailable PestPac numbers without fabricating values", async (t) => {
  await withFetch(t, async () =>
    new Response(
      JSON.stringify({
        results: [
          {
            ...apiIdentity,
            identityState: "temporary",
            pestpacBillToNumber: null,
            pestpacLocationNumber: null,
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  )

  const [result] = await new HttpCustomerIdentityService({ baseUrl: "" })
    .searchCustomerIdentities("temporary")
  assert.equal(result.identityState, "temporary")
  assert.equal(result.pestpacBillToNumber, null)
  assert.equal(result.pestpacLocationNumber, null)
  assert.equal(result.billTo.billToNumber, "")
  assert.equal(result.location.locationNumber, "")
})

test("canonical identity service surfaces authentication, API, and malformed-response failures", async (t) => {
  const responses = [
    new Response(JSON.stringify({ error: "Sign in required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
    new Response(JSON.stringify({ error: "Identity unavailable." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }),
    new Response(JSON.stringify({ results: [{ locationId: "incomplete" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  ]
  await withFetch(t, async () => responses.shift())
  const service = new HttpCustomerIdentityService({ baseUrl: "" })

  await assert.rejects(
    service.searchCustomerIdentities("first"),
    OpsBrainAuthError,
  )
  await assert.rejects(
    service.searchCustomerIdentities("second"),
    /Identity unavailable/,
  )
  await assert.rejects(
    service.searchCustomerIdentities("third"),
    /malformed customer identity results/,
  )
})

test("modern quote selection stores and safely replaces the canonical Location ID with its snapshots", () => {
  const first = identityResult()
  const second = identityResult({
    locationId: "location-8002",
    locationName: "Second Location",
    serviceAddress: "22 Second Street, Raleigh, NC 27602",
    pestpacLocationNumber: "8002",
  })
  const firstContext = canonicalCustomerContext(first)
  const active = inspection(firstContext)

  assert.equal(firstContext.customerLocationId, "location-7001")
  assert.equal(firstContext.billTo.billToNumber, "5001")
  assert.equal(firstContext.location.locationNumber, "7001")
  assert.equal(firstContext.leadId, undefined)
  assert.equal(canonicalCustomerSelectionChanged(active, first), false)
  assert.equal(canonicalCustomerSelectionChanged(active, second), true)

  const switched = { ...active, ...canonicalCustomerContext(second) }
  assert.equal(switched.customerLocationId, "location-8002")
  assert.equal(switched.location.locationNumber, "8002")
  assert.notEqual(switched.customerLocationId, active.customerLocationId)
})

test("save and reopen retain customerLocationId as a top-level quote field", async () => {
  const selected = inspection(canonicalCustomerContext(identityResult()))
  const submitted = JSON.parse(JSON.stringify(selected))
  const saved = submitted
  assert.match(estimatesHttpSource, /body: JSON\.stringify\(estimate\)/)
  assert.equal(submitted.customerLocationId, "location-7001")
  assert.equal(saved.customerLocationId, "location-7001")

  const mock = new MockSalesBrainEstimatesService()
  await mock.saveEstimate(saved)
  const reopened = await mock.getEstimate(saved.id)
  assert.equal(reopened.customerLocationId, "location-7001")
  assert.equal(reopened.estimateNumber, selected.estimateNumber)
})

test("note-only snapshot save omits unchanged Quote Engine input while retaining canonical identity", async () => {
  const selected = inspection({
    ...canonicalCustomerContext(identityResult()),
    quoteNotes: "Updated customer note only",
    quoteEngineInput: createEmptyQuoteEngineInput({ quoteId: "quote-1" }),
    quoteEngineSnapshot: { version: "opsbrain-quote-engine/v1" },
  })
  const input = quoteEngineInputForSave(
    { input: selected.quoteEngineInput, dirty: false },
    { snapshotBacked: true },
  )
  const mock = new MockSalesBrainEstimatesService()
  const saved = await mock.saveEstimate({ ...selected, quoteEngineInput: input })

  assert.equal(input, undefined)
  assert.equal(saved.quoteEngineInput, undefined)
  assert.equal(saved.customerLocationId, "location-7001")
})

test("lead-only and historical null-link quotes remain valid", async () => {
  assert.equal(hasQuoteEngineQuoteContext({ leadId: "lead-1" }), true)
  const leadOnly = inspection({ leadId: "lead-1" })
  assert.equal(leadOnly.customerLocationId, undefined)

  const mock = new MockSalesBrainEstimatesService()
  await mock.saveEstimate(inspection({ customerLocationId: null }))
  const reopened = await mock.getEstimate("quote-1")
  assert.equal(reopened.customerLocationId, null)
})

test("modern CustomerSearch exposes canonical lookup only and no manual mapping path", () => {
  assert.match(customerSearchSource, /createCustomerIdentityService/)
  assert.match(customerSearchSource, /searchCustomerIdentities/)
  assert.doesNotMatch(customerSearchSource, /createCustomerFilesService/)
  assert.doesNotMatch(customerSearchSource, /Create Ops Brain Mapping/)
  assert.doesNotMatch(customerSearchSource, /createBillTo|createLocation/)
})
