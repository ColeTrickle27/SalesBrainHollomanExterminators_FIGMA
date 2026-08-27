import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  customerPricingSnapshotFromQuoteEngine,
  initializeQuoteEngineInputFromRecommendation,
  quoteEngineInputFromSnapshot,
  quoteEngineMarginMessage,
} from "../src/types/quote-engine.ts"

const mixedSnapshot = {
  version: "opsbrain-quote-engine/v1",
  calculatedAt: "2026-08-26T14:00:00.000Z",
  quote: {
    quoteId: "quote-1",
    billToNumber: "100",
    locationNumber: "200",
    preparedBy: "Alex Estimator",
  },
  customerFacing: {
    quoteTotalCents: 50000,
    lines: [
      {
        lineId: "gpc",
        serviceName: "Quarterly Pest Control",
        description: "Quarterly protection",
        sellingPriceCents: 10000,
      },
      {
        lineId: "termite",
        serviceName: "Termite Treatment",
        description: "Treat active termites",
        sellingPriceCents: 40000,
      },
    ],
  },
  internal: {
    quoteOtherDirectCosts: [],
    knownDirectJobCostCents: 20000,
    directJobCostCents: 20000,
    grossProfitCents: 20000,
    grossMarginPercent: 50,
    marginStatus: "available",
    marginWarning: null,
    marginMessage: null,
    lines: [
      {
        lineId: "gpc",
        serviceId: "service-gpc",
        serviceName: "Quarterly Pest Control",
        pricingType: "fixed",
        materialBreakdown: [],
        labor: null,
        otherDirectCosts: [],
        directJobCostCents: null,
        grossProfitCents: null,
        grossMarginPercent: null,
        marginStatus: "excluded",
        marginWarning: null,
        marginMessage: "Margin unavailable — General Pest Control excluded.",
      },
      {
        lineId: "termite",
        serviceId: "service-termite",
        serviceName: "Termite Treatment",
        pricingType: "fixed",
        materialBreakdown: [
          {
            productId: "product-1",
            productName: "Termiticide",
            sku: "T-1",
            estimatedConsumption: 0.6,
            consumptionUnit: "gallon",
            packageContentQuantity: 1,
            packageContentUnit: "gallon",
            wholePackageQuantity: 1,
            purchaseUnitCostCents: 10000,
            purchaseCostCents: 10000,
            unavailableReason: null,
          },
        ],
        labor: {
          onsiteHours: 2,
          employeeCount: 2,
          travelHoursExcluded: 0,
          employeeHours: 4,
          loadedRateCents: 2500,
          costCents: 10000,
          unavailableReasons: [],
        },
        otherDirectCosts: [],
        directJobCostCents: 20000,
        grossProfitCents: 20000,
        grossMarginPercent: 50,
        marginStatus: "available",
        marginWarning: null,
        marginMessage: null,
      },
    ],
  },
  catalogReferences: [],
}

test("Quote Engine HTTP client uses the same-origin calculate route and session credentials", () => {
  const source = readFileSync(
    new URL(
      "../src/services/opsBrain/httpQuoteEngineService.ts",
      import.meta.url,
    ),
    "utf8",
  )
  const input = {
    quoteId: "quote-1",
    services: [
      {
        lineId: "termite",
        serviceId: "service-termite",
        customerDescription: "Treat active termites",
        sellingPriceCents: 40000,
        materialOverrides: [
          {
            productId: "product-1",
            estimatedConsumption: 0.6,
            consumptionUnit: "gallon",
          },
        ],
        laborOverride: { onsiteHours: 2, employeeCount: 2 },
      },
    ],
    customLineItems: [
      {
        lineId: "custom-1",
        name: "Custom cleanup",
        description: "Customer-requested cleanup",
        sellingPriceCents: 5000,
      },
    ],
  }
  assert.match(source, /\/api\/sales-brain\/quote\/calculate/)
  assert.match(source, /credentials:\s*"include"/)
  assert.match(source, /method:\s*"POST"/)
  assert.match(source, /body:\s*JSON\.stringify\(input\)/)
  const body = structuredClone(input)
  assert.deepEqual(Object.keys(body.services[0].materialOverrides[0]).sort(), [
    "consumptionUnit",
    "estimatedConsumption",
    "productId",
  ])
  assert.deepEqual(Object.keys(body.services[0].laborOverride).sort(), [
    "employeeCount",
    "onsiteHours",
  ])
  assert.equal(
    JSON.stringify(body).match(
      /unitCost|packageContent|loadedRate|overhead|contingency|targetMargin/i,
    ),
    null,
  )
})

test("an approved active Pricebook recommendation initializes a first Quote Engine line without overwriting existing lines", () => {
  const context = { quoteId: "quote-1", preparedBy: "Alex Estimator" }
  const initialized = initializeQuoteEngineInputFromRecommendation(
    undefined,
    context,
    { id: "service-termite", active: true },
  )
  assert.equal(initialized.services.length, 1)
  assert.equal(initialized.services[0].serviceId, "service-termite")
  assert.equal(initialized.services[0].customerDescription, undefined)

  const existing = {
    ...initialized,
    services: [
      ...initialized.services,
      { lineId: "other", serviceId: "service-other" },
    ],
  }
  assert.equal(
    initializeQuoteEngineInputFromRecommendation(existing, context, {
      id: "service-new",
      active: true,
    }),
    existing,
  )
  assert.equal(
    initializeQuoteEngineInputFromRecommendation(undefined, context, {
      id: "inactive",
      active: false,
    }),
    undefined,
  )
})

test("server snapshot restores quote choices without changing unavailable economics into zero", () => {
  const incomplete = structuredClone(mixedSnapshot)
  incomplete.internal.directJobCostCents = null
  incomplete.internal.grossProfitCents = null
  incomplete.internal.grossMarginPercent = null
  incomplete.internal.marginStatus = "incomplete"
  incomplete.internal.marginMessage =
    "Margin unavailable — cost data incomplete."
  incomplete.internal.lines[1].directJobCostCents = null
  incomplete.internal.lines[1].grossProfitCents = null
  incomplete.internal.lines[1].grossMarginPercent = null
  incomplete.internal.lines[1].marginStatus = "incomplete"

  const restored = quoteEngineInputFromSnapshot(incomplete)
  assert.equal(restored.services.length, 2)
  assert.deepEqual(restored.services[1].materialOverrides, [
    {
      productId: "product-1",
      estimatedConsumption: 0.6,
      consumptionUnit: "gallon",
    },
  ])
  assert.deepEqual(restored.services[1].laborOverride, {
    onsiteHours: 2,
    employeeCount: 2,
  })
  assert.equal(incomplete.internal.directJobCostCents, null)
  assert.equal(incomplete.internal.grossProfitCents, null)
  assert.equal(incomplete.internal.grossMarginPercent, null)
  assert.equal(
    quoteEngineMarginMessage(
      incomplete.internal.marginStatus,
      incomplete.internal.marginMessage,
    ),
    "Margin unavailable — cost data incomplete",
  )
})

test("mixed General Pest Control quotes keep the full customer total while margin uses the saved eligible basis", () => {
  const pricingSnapshot = customerPricingSnapshotFromQuoteEngine(mixedSnapshot)
  assert.equal(pricingSnapshot.totalCents, 50000)
  assert.deepEqual(
    pricingSnapshot.lineItems.map((line) => line.amountCents),
    [10000, 40000],
  )
  assert.equal(mixedSnapshot.internal.directJobCostCents, 20000)
  assert.equal(mixedSnapshot.internal.grossMarginPercent, 50)
  assert.equal(
    quoteEngineMarginMessage(
      mixedSnapshot.internal.lines[0].marginStatus,
      mixedSnapshot.internal.lines[0].marginMessage,
    ),
    "Margin excluded — General Pest Control",
  )
})

test("compatibility customer pricing snapshot contains no internal cost or margin data", () => {
  const pricingSnapshot = customerPricingSnapshotFromQuoteEngine(mixedSnapshot)
  assert.deepEqual(Object.keys(pricingSnapshot).sort(), [
    "currency",
    "lineItems",
    "quotedAt",
    "totalCents",
  ])
  assert.deepEqual(Object.keys(pricingSnapshot.lineItems[0]).sort(), [
    "amountCents",
    "id",
    "label",
  ])
  assert.equal(
    JSON.stringify(pricingSnapshot).match(
      /directJobCost|grossProfit|grossMargin|loadedRate|purchaseCost/i,
    ),
    null,
  )
})
