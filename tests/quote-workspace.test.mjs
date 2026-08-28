import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  getQuoteWorkspaceReadiness,
  isQuoteEngineBackedQuote,
  quoteInspectionWithUpdatedLead,
  quoteWorkspaceCustomerFacingReview,
  resolveQuoteWorkspaceRoute,
  shouldRenderQuoteWorkspace,
} from "../src/features/sales/quoteWorkspace.ts"
import {
  quoteEngineEditableStateFromSavedSnapshot,
  quoteEngineInputForSave,
  quoteEngineMarginMessage,
} from "../src/types/quote-engine.ts"

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
const workspaceSource = readFileSync(
  new URL("../src/screens/QuoteWorkspace.tsx", import.meta.url),
  "utf8",
)
const reviewSource = readFileSync(
  new URL("../src/features/sales/components/QuoteReview.tsx", import.meta.url),
  "utf8",
)
const customerSummarySource = readFileSync(
  new URL(
    "../src/features/sales/components/QuoteCustomerSummary.tsx",
    import.meta.url,
  ),
  "utf8",
)
const quoteBuilderSource = readFileSync(
  new URL("../src/screens/JobCosting.tsx", import.meta.url),
  "utf8",
)
const dashboardSource = readFileSync(
  new URL("../src/screens/Dashboard.tsx", import.meta.url),
  "utf8",
)
const inspectionSource = readFileSync(
  new URL("../src/screens/InspectionWizard.tsx", import.meta.url),
  "utf8",
)
const workflowSource = readFileSync(
  new URL("../src/features/sales/useSalesWorkflow.ts", import.meta.url),
  "utf8",
)

const contextInput = {
  quoteId: "quote-1",
  services: [{ lineId: "service-line", serviceId: "service-1" }],
  customLineItems: [],
}

const snapshot = {
  version: "opsbrain-quote-engine/v1",
  calculatedAt: "2026-08-28T12:00:00.000Z",
  quote: { quoteId: "quote-1", leadId: "lead-1", preparedBy: "Estimator" },
  customerFacing: {
    quoteTotalCents: 25000,
    lines: [
      {
        lineId: "custom-1",
        serviceName: "Custom treatment",
        description: "Customer-facing scope",
        sellingPriceCents: 25000,
        custom: true,
      },
    ],
  },
  internal: {
    lines: [
      {
        lineId: "custom-1",
        serviceName: "Custom treatment",
        custom: true,
        materialBreakdown: [],
        labor: null,
        otherDirectCosts: [],
        directJobCostCents: 10000,
        grossProfitCents: 15000,
        grossMarginPercent: 60,
        marginStatus: "available",
        marginWarning: null,
        marginMessage: null,
      },
    ],
    quoteOtherDirectCosts: [],
    knownDirectJobCostCents: 10000,
    directJobCostCents: 10000,
    grossProfitCents: 15000,
    grossMarginPercent: 60,
    marginStatus: "available",
    marginWarning: null,
    marginMessage: null,
  },
  catalogReferences: [{ lineId: "custom-1", custom: true }],
}

const lead = {
  id: "lead-1",
  leadType: "New Customer",
  customerName: "Jamie Preview",
  company: "",
  companyName: "",
  first: "Jamie",
  last: "Preview",
  locationName: "Preview location",
  streetAddress: "123 Preview Street",
  city: "Raleigh",
  state: "NC",
  zip: "27601",
  phone: "919-555-0100",
  email: "jamie@example.test",
  preferredContact: "Text",
  referralSource: "Website",
  referralSourceOther: "",
  temperature: "warm",
  status: "open",
  notes: "Preview lead",
  nextFollowUpAt: "",
  createdBy: "preview",
  createdAt: "2026-08-28T12:00:00.000Z",
  updatedAt: "2026-08-28T12:00:00.000Z",
}

test("New Quote customer selection enters Quote Workspace", () => {
  assert.match(
    appSource,
    /const selectCustomer[\s\S]*workflow\.selectCustomer\(customer\)[\s\S]*go\("quote-workspace"\)/,
  )
  assert.match(dashboardSource, /New Quote/)
})

test("Lead Detail Start Quote enters the same Quote Workspace", () => {
  assert.match(
    appSource,
    /const startQuoteForLead[\s\S]*workflow\.startQuoteForLead\(lead\)[\s\S]*go\("quote-workspace"\)/,
  )
})

test("lead editing stays in the active workspace and preserves quote identity", () => {
  const inspection = {
    id: "quote-1",
    leadId: lead.id,
    workflowData: { customer: {} },
  }
  const updated = quoteInspectionWithUpdatedLead(inspection, {
    ...lead,
    phone: "919-555-0199",
  })

  assert.equal(updated.id, inspection.id)
  assert.equal(updated.leadId, inspection.leadId)
  assert.equal(updated.workflowData.customer.phone, "919-555-0199")
  assert.match(workspaceSource, /<LeadEditModal/)
  assert.match(dashboardSource, /title="Edit Lead"[\s\S]*showCancel/)
  assert.match(workflowSource, /updateActiveQuoteLead/)
  assert.doesNotMatch(appSource, /onEditLead=\{\(\) => go\("dashboard"\)\}/)
})

test("quote routing waits for restore and then redirects modern deprecated URLs", () => {
  for (const route of ["job-costing", "wizard", "presentation", "proposal"]) {
    assert.equal(
      resolveQuoteWorkspaceRoute({
        route,
        restoringEstimate: true,
        modernQuote: true,
      }),
      null,
    )
    assert.equal(
      resolveQuoteWorkspaceRoute({
        route,
        restoringEstimate: false,
        modernQuote: true,
      }),
      "quote-workspace",
    )
  }
})

test("modern saved quote refresh renders the workspace after restore", () => {
  assert.equal(
    shouldRenderQuoteWorkspace({
      route: "quote-workspace",
      restoringEstimate: true,
      modernQuote: true,
    }),
    false,
  )
  assert.equal(
    shouldRenderQuoteWorkspace({
      route: "quote-workspace",
      restoringEstimate: false,
      modernQuote: true,
    }),
    true,
  )
})

test("legacy saved quote refresh stays on Job Costing", () => {
  assert.equal(
    resolveQuoteWorkspaceRoute({
      route: "job-costing",
      restoringEstimate: false,
      modernQuote: false,
    }),
    null,
  )
  assert.equal(
    shouldRenderQuoteWorkspace({
      route: "job-costing",
      restoringEstimate: false,
      modernQuote: false,
    }),
    false,
  )
})

test("direct Quote Workspace cannot render a restored legacy quote", () => {
  assert.equal(
    resolveQuoteWorkspaceRoute({
      route: "quote-workspace",
      restoringEstimate: false,
      modernQuote: false,
    }),
    "job-costing",
  )
  assert.equal(
    shouldRenderQuoteWorkspace({
      route: "quote-workspace",
      restoringEstimate: false,
      modernQuote: false,
    }),
    false,
  )
})

test("restored and explicitly reopened quotes use the persisted save time", () => {
  assert.ok(
    (workflowSource.match(/setSavedAt\(savedInspection\.updatedAt\)/g) || [])
      .length >= 2,
  )
  assert.match(workspaceSource, /Not saved yet/)
})

test("customer summary uses employee-facing context actions and warning", () => {
  assert.match(customerSummarySource, /"Edit Lead"/)
  assert.match(customerSummarySource, /"Change Customer"/)
  assert.match(customerSummarySource, /"Select Customer"/)
  assert.match(
    customerSummarySource,
    /Changing to a different customer or location will clear quote details/,
  )
  assert.doesNotMatch(customerSummarySource, /Permanent customer identity/)
})

test("failed photo uploads are excluded from Review's visible photo count", () => {
  assert.match(
    reviewSource,
    /photo\.customerVisible !== false && photo\.uploadStatus !== "error"/,
  )
})

test("saved modern and legacy quotes route by their saved Quote Engine authority", () => {
  assert.equal(isQuoteEngineBackedQuote({ quoteEngineSnapshot: snapshot }), true)
  assert.equal(isQuoteEngineBackedQuote({ quoteEngineInput: contextInput }), true)
  assert.equal(isQuoteEngineBackedQuote({}), false)
  assert.match(
    appSource,
    /isQuoteEngineBackedQuote\(opened\) \? "quote-workspace" : "job-costing"/,
  )
})

test("Home drafts and Quote History use the same openEstimate router", () => {
  assert.equal(
    (appSource.match(/onOpenEstimate=\{\(id\) => void openEstimate\(id\)\}/g) || [])
      .length,
    1,
  )
  assert.match(appSource, /onOpen=\{\(id\) => void openEstimate\(id\)\}/)
  assert.match(
    dashboardSource,
    /const drafts = estimates\.filter\(\(item\) => item\.status === "draft"\)/,
  )
})

test("primary navigation contains only Home, Quotes, and Admin", () => {
  const navSource = appSource.slice(
    appSource.indexOf("const NAV_ITEMS"),
    appSource.indexOf("function screenFromLocation"),
  )
  assert.match(navSource, /label: "Home"/)
  assert.match(navSource, /label: "Quotes"/)
  assert.match(navSource, /label: "Admin"/)
  assert.doesNotMatch(navSource, /Active Quote|Quote Builder/)
})

test("modern Review exposes only Quote Engine customer-facing lines and total", () => {
  const review = quoteWorkspaceCustomerFacingReview(snapshot)
  assert.equal(review, snapshot.customerFacing)
  assert.equal(review.quoteTotalCents, 25000)
  assert.deepEqual(review.lines, snapshot.customerFacing.lines)
  assert.match(reviewSource, /data-review-pricing-source="quote-engine-customer-facing"/)
})

test("legacy quote options cannot participate in modern Review pricing", () => {
  assert.doesNotMatch(
    workspaceSource + reviewSource,
    /quoteOptions|Chocolate|Vanilla|Customer Specified/,
  )
  assert.equal(
    resolveQuoteWorkspaceRoute({
      route: "presentation",
      restoringEstimate: false,
      modernQuote: true,
    }),
    "quote-workspace",
  )
  assert.doesNotMatch(reviewSource, /pricebookServices\.map|calculatedPrice/)
})

test("leadId-only quote context is ready when it has lines and a calculation", () => {
  const readiness = getQuoteWorkspaceReadiness({
    inspection: { leadId: "lead-1", quoteEngineInput: contextInput },
    calculation: snapshot,
    calculating: false,
  })
  assert.equal(readiness.hasContext, true)
  assert.equal(readiness.ready, true)
})

test("Bill-To plus Location quote context is valid", () => {
  const readiness = getQuoteWorkspaceReadiness({
    inspection: {
      billTo: { billToNumber: "100" },
      location: { locationNumber: "200" },
      quoteEngineInput: contextInput,
    },
    calculation: snapshot,
    calculating: false,
  })
  assert.equal(readiness.hasContext, true)
  assert.equal(readiness.ready, true)
})

test("context-free modern quotes cannot add lines or save", () => {
  const readiness = getQuoteWorkspaceReadiness({
    inspection: { quoteEngineInput: contextInput },
    calculation: snapshot,
    calculating: false,
  })
  assert.equal(readiness.hasContext, false)
  assert.equal(readiness.ready, false)
  assert.match(quoteBuilderSource, /disabled=\{!hasQuoteContext \|\| !serviceToAdd\}/)
  assert.match(quoteBuilderSource, /disabled=\{!hasQuoteContext\}/)
  assert.match(workspaceSource, /!readiness\.hasContext \|\|/)
})

test("inspection is optional for calculated quote readiness", () => {
  const readiness = getQuoteWorkspaceReadiness({
    inspection: { leadId: "lead-1", quoteEngineInput: contextInput },
    calculation: snapshot,
    calculating: false,
  })
  assert.equal(readiness.ready, true)
  assert.match(inspectionSource, /Inspection details are optional/)
  assert.match(reviewSource, /This does not block quote review or\s+\s*saving/)
})

test("Review includes inspection summary only when inspection evidence exists", () => {
  assert.match(reviewSource, /activeFindings/)
  assert.match(reviewSource, /visiblePhotos/)
  assert.match(reviewSource, /inspection\.property\?\.hasGraph/)
  assert.match(reviewSource, /Optional Inspection Summary/)
})

test("legacy quotes remain a labeled historical compatibility view", () => {
  assert.match(quoteBuilderSource, /Legacy Job Costing/)
  assert.match(
    quoteBuilderSource,
    /Historical costing remains available without recalculating it/,
  )
  assert.match(quoteBuilderSource, /if \(quoteEngineBacked\) return <QuoteBuilderPanel/)
})

test("snapshot-backed note saves preserve historical economics while edits resubmit input", () => {
  const editable = quoteEngineEditableStateFromSavedSnapshot(snapshot)
  assert.equal(editable.dirty, false)
  assert.equal(quoteEngineInputForSave(editable), undefined)
  assert.equal(
    quoteEngineInputForSave({ input: editable.input, dirty: true }),
    editable.input,
  )
  assert.match(workflowSource, /setQuoteEngineInputDirty\(savedEditableState\.dirty\)/)
})

test("customer changes retain the reviewed same-context and reset protections", () => {
  assert.match(workflowSource, /const customerChanged =/)
  assert.match(workflowSource, /setQuoteEngineInputDirty\(false\)/)
  assert.match(workflowSource, /quoteEngineSnapshot: undefined/)
  assert.match(workflowSource, /quoteNotes: undefined/)
  assert.match(workflowSource, /leadId: undefined/)
})

test("incomplete, excluded, mixed, and low-margin business statuses remain non-blocking", () => {
  assert.equal(
    quoteEngineMarginMessage("incomplete"),
    "Margin unavailable — cost data incomplete",
  )
  assert.equal(
    quoteEngineMarginMessage("excluded"),
    "Margin excluded — General Pest Control",
  )
  const incomplete = structuredClone(snapshot)
  incomplete.internal.directJobCostCents = null
  incomplete.internal.grossProfitCents = null
  incomplete.internal.grossMarginPercent = null
  incomplete.internal.marginStatus = "incomplete"
  assert.equal(
    getQuoteWorkspaceReadiness({
      inspection: { leadId: "lead-1", quoteEngineInput: contextInput },
      calculation: incomplete,
      calculating: false,
    }).ready,
    true,
  )
  assert.equal(quoteWorkspaceCustomerFacingReview(incomplete).quoteTotalCents, 25000)
  assert.match(reviewSource, /marginMessage/)
})
