import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  canonicalCustomerContext,
  canonicalCustomerSelectionChanged,
  canonicalCustomerWorkflowDetails,
} from "../src/features/sales/quoteWorkspace.ts"
import {
  customerSearchShortQueryState,
  customerSearchStatusLabel,
} from "../src/features/sales/customerSearchState.ts"
import { OpsBrainAuthError } from "../src/services/opsBrain/errors.ts"
import { HttpCustomerIdentityService } from "../src/services/opsBrain/httpCustomerIdentityService.ts"
import { MockSalesBrainEstimatesService } from "../src/services/opsBrain/mockSalesBrainEstimatesService.ts"
import {
  createEmptyQuoteEngineInput,
  hasQuoteEngineQuoteContext,
  quoteEngineInputForSave,
} from "../src/types/quote-engine.ts"
import { isSelectableExistingCustomerIdentity } from "../src/types/customer.ts"

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

function workflowCustomer(overrides = {}) {
  return {
    leadType: "Existing Customer",
    company: "",
    first: "",
    last: "",
    phone: "",
    email: "",
    preferredContact: "",
    referralSource: "",
    referralSourceOther: "",
    locationName: "",
    streetAddress: "",
    city: "",
    state: "NC",
    zip: "",
    serviceAddress: "",
    accountNotes: "",
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
  assert.equal(isSelectableExistingCustomerIdentity(result), false)
})

test("modern New Quote makes only complete permanent PestPac identities selectable", () => {
  assert.equal(isSelectableExistingCustomerIdentity(identityResult()), true)
  assert.equal(
    isSelectableExistingCustomerIdentity(
      identityResult({ identityState: "temporary" }),
    ),
    false,
  )
  assert.equal(
    isSelectableExistingCustomerIdentity(
      identityResult({ pestpacBillToNumber: null }),
    ),
    false,
  )
  assert.equal(
    isSelectableExistingCustomerIdentity(
      identityResult({ pestpacLocationNumber: "" }),
    ),
    false,
  )
  assert.equal(
    isSelectableExistingCustomerIdentity(
      identityResult({ locationId: "" }),
    ),
    false,
  )
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

test("same PestPac snapshots attach a canonical Location ID without resetting quote work", () => {
  const first = identityResult()
  const historical = inspection({
    billTo: first.billTo,
    location: first.location,
    customerLocationId: null,
    quoteNotes: "Keep this quote note",
    property: { graphKey: "property-graph" },
    quoteEngineInput: { services: [{ lineId: "service-1" }], customLineItems: [{ lineId: "custom-1" }] },
    quoteEngineSnapshot: { version: "opsbrain-quote-engine/v1" },
  })

  assert.equal(canonicalCustomerSelectionChanged(historical, first), false)
  const updated = { ...historical, ...canonicalCustomerContext(first) }
  assert.equal(updated.customerLocationId, "location-7001")
  assert.equal(updated.quoteNotes, "Keep this quote note")
  assert.deepEqual(updated.property, historical.property)
  assert.deepEqual(updated.quoteEngineInput, historical.quoteEngineInput)
  assert.deepEqual(updated.quoteEngineSnapshot, historical.quoteEngineSnapshot)

  const updatedCustomer = canonicalCustomerWorkflowDetails(
    first,
    workflowCustomer({
      company: "Historic Bill-To Name",
      first: "Morgan",
      last: "Parker",
      city: "Raleigh",
      zip: "27601",
      accountNotes: "Keep historical customer note",
    }),
    { preserveNameSnapshot: true },
  )
  assert.equal(updatedCustomer.company, "Historic Bill-To Name")
  assert.equal(updatedCustomer.first, "Morgan")
  assert.equal(updatedCustomer.last, "Parker")
  assert.equal(updatedCustomer.phone, apiIdentity.phone)
  assert.equal(updatedCustomer.email, apiIdentity.email)
  assert.equal(updatedCustomer.streetAddress, apiIdentity.serviceAddress)
  assert.equal(updatedCustomer.accountNotes, "Keep historical customer note")

  assert.equal(
    canonicalCustomerSelectionChanged(
      inspection({ ...canonicalCustomerContext(first) }),
      first,
    ),
    false,
  )
})

test("new canonical customer uses the canonical display name without inventing structured fields", () => {
  const selected = canonicalCustomerWorkflowDetails(
    identityResult(),
    workflowCustomer(),
  )

  assert.equal(selected.company, apiIdentity.customerName)
  assert.equal(selected.first, "")
  assert.equal(selected.last, "")
  assert.equal(Object.hasOwn(selected, "accountType"), false)
})

test("different Bill-To or Location keeps the safe property-change reset path", () => {
  const first = identityResult()
  const differentLocation = identityResult({
    locationId: "location-8002",
    locationName: "Second Location",
    serviceAddress: "22 Second Street, Raleigh, NC 27602",
    pestpacLocationNumber: "8002",
  })
  const differentBillTo = identityResult({
    locationId: "location-9003",
    billToId: "bill-to-9003",
    pestpacBillToNumber: "9003",
    pestpacLocationNumber: "7001",
  })
  const active = inspection(canonicalCustomerContext(first))

  assert.equal(canonicalCustomerSelectionChanged(active, differentLocation), true)
  assert.equal(canonicalCustomerSelectionChanged(active, differentBillTo), true)
  const selected = canonicalCustomerWorkflowDetails(
    differentLocation,
    workflowCustomer({
      company: "Old Customer",
      first: "Old",
      last: "Customer",
      phone: "919-555-0000",
      email: "old@example.test",
      locationName: "Old Location",
      streetAddress: "1 Old Street",
      city: "Durham",
      zip: "27701",
      serviceAddress: "1 Old Street, Durham, NC 27701",
      accountNotes: "Old customer note",
    }),
  )
  assert.equal(selected.company, apiIdentity.customerName)
  assert.equal(selected.first, "")
  assert.equal(selected.last, "")
  assert.equal(selected.phone, apiIdentity.phone)
  assert.equal(selected.email, apiIdentity.email)
  assert.equal(selected.locationName, "Second Location")
  assert.equal(selected.streetAddress, "22 Second Street, Raleigh, NC 27602")
  assert.equal(selected.city, "")
  assert.equal(selected.zip, "")
  assert.equal(selected.accountNotes, "")
  assert.match(
    customerSearchSource + readFileSync(new URL("../src/features/sales/useSalesWorkflow.ts", import.meta.url), "utf8"),
    /quoteEngineSnapshot: undefined/,
  )
})

test("shortening a canonical search clears the loading status", () => {
  const cleared = customerSearchShortQueryState()

  assert.deepEqual(cleared.results, [])
  assert.equal(cleared.loading, false)
  assert.equal(cleared.error, null)
  assert.equal(cleared.authExpired, false)
  assert.equal(
    customerSearchStatusLabel({
      loading: cleared.loading,
      query: "a",
      resultCount: cleared.results.length,
    }),
    "Enter at least 2 characters",
  )
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
  assert.match(customerSearchSource, /isSelectableExistingCustomerIdentity/)
  assert.match(customerSearchSource, /selectableResults\.map/)
  assert.doesNotMatch(customerSearchSource, /createCustomerFilesService/)
  assert.doesNotMatch(customerSearchSource, /Create Ops Brain Mapping/)
  assert.doesNotMatch(customerSearchSource, /createBillTo|createLocation/)
})
