import assert from "node:assert/strict"
import test from "node:test"

import {
  calculateCosting,
  CONSTRUCTION_OPTIONS,
  CRAWLSPACE_ACCESS_OPTIONS,
  createEmptyStructure,
  LEAD_TYPE_OPTIONS,
  normalizeSalesBrainWorkflowData,
  OCCUPANCY_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  STRUCTURE_TYPE_OPTIONS,
} from "../src/types/figma-workflow.ts"
import { annotationsToMarkers, inspectionMarkersToFindings } from "../src/services/bugmanGraphs/markerAdapter.ts"

test("legacy version-1 structure data normalizes into a stable-ID structures array", () => {
  const normalized = normalizeSalesBrainWorkflowData({
    version: 1,
    currentStep: 2,
    completedSteps: [1],
    customer: { phone: "", email: "", preferredContact: "Text", referralSource: "Call-In", referralSourceOther: "", serviceAddress: "", accountNotes: "" },
    structure: { structureType: "Home / Main Structure", structureOther: "", construction: "Brick Veneer", occupancy: "Owner-Occupied", squareFootage: "1800", perimeterLinearFeet: "200", wallHeightFeet: "3", access: "Low Crawlspace Height" },
  })
  assert.equal(normalized.version, 3)
  assert.equal(normalized.structures.length, 1)
  assert.ok(normalized.structures[0].id)
  assert.equal(normalized.structures[0].structureType, "Home / Main Structure")
  assert.equal(normalized.selectedStructureId, normalized.structures[0].id)
  assert.equal(normalized.customer.streetAddress, "")
  assert.equal(normalized.customer.state, "NC")
  assert.equal(normalized.quoteOptions[0].kind, "chocolate")
  assert.equal(normalized.quoteOptions[1].kind, "vanilla")
})

test("structure creation and button catalogs expose the approved Figma choices", () => {
  const first = createEmptyStructure("Main Structure")
  const second = createEmptyStructure("Detached Garage")
  assert.notEqual(first.id, second.id)
  assert.deepEqual(PREFERRED_CONTACT_OPTIONS, ["Text", "Call", "Email"])
  assert.deepEqual(LEAD_TYPE_OPTIONS, ["New Customer", "Existing Customer"])
  assert.ok(REFERRAL_SOURCE_OPTIONS.includes("Existing Customer Add Service"))
  assert.ok(STRUCTURE_TYPE_OPTIONS.includes("Storage Units"))
  assert.deepEqual(CONSTRUCTION_OPTIONS, ["Brick Veneer", "Slab", "Basement", "Combination"])
  assert.ok(OCCUPANCY_OPTIONS.includes("Tenant-Occupied"))
  assert.deepEqual(CRAWLSPACE_ACCESS_OPTIONS, ["Not Accessible", "Low Crawlspace Height", "Optimal Crawlspace Height"])
})

test("job costing calculates direct cost, target price, profit, and margin from snapshotted inputs", () => {
  const result = calculateCosting({
    productUsage: [{ id: "p1", productName: "Termiticide", sku: "T1", plannedQuantity: 2, unit: "gal", catalogCostCents: 10000 }],
    laborUsage: [{ id: "l1", role: "Technician", service: "Treatment", hours: 10, loadedRateCents: 5000 }],
    equipmentTravelDisposalCents: 5000,
    equipmentCents: 0,
    travelCents: 0,
    disposalCents: 0,
    overheadPercent: 10,
    contingencyPercent: 5,
    targetMarginPercent: 40,
    sellingPriceCents: 126000,
  })
  assert.equal(result.materialsCents, 20000)
  assert.equal(result.laborCents, 50000)
  assert.equal(result.directCostCents, 86625)
  assert.equal(result.recommendedMinimumCents, 144375)
  assert.equal(result.grossProfitCents, 39375)
  assert.equal(Number(result.grossMarginPercent.toFixed(2)), 31.25)
})

test("canonical graph markers keep full names and only inspection categories qualify as findings", () => {
  const annotations = [
    { id: "at", kind: "marker", markerType: "activeTermites", label: "AT", x: 0, y: 0 },
    { id: "wdf", kind: "marker", markerType: "woodFungi", label: "WDF", x: 0, y: 0 },
    { id: "wall", kind: "marker", markerType: "door", label: "DR", x: 0, y: 0 },
    { id: "treatment", kind: "marker", markerType: "trenchAndTreat", label: "TT", x: 0, y: 0 },
    { id: "note", kind: "marker", markerType: "treatmentNote", label: "TXT", note: "Staff treatment note", x: 0, y: 0 },
  ]
  const markers = annotationsToMarkers("graph-1", annotations, "tech", new Date().toISOString())
  assert.equal(markers.find((item) => item.id === "at").title, "Active Termites")
  assert.equal(markers.find((item) => item.id === "wdf").title, "Wood Destroying Fungi")
  assert.equal(markers.find((item) => item.id === "wall").category, "structureDetails")
  assert.equal(markers.find((item) => item.id === "treatment").category, "treatment")
  assert.equal(markers.find((item) => item.id === "note").category, "review")
  const findingMarkers = markers.filter((item) => ["insectFindings", "structureFindings", "moistureFindings"].includes(item.category))
  assert.deepEqual(findingMarkers.map((item) => item.id), ["at", "wdf"])
})

test("multiple graph markers of one type create one details card while non-findings remain excluded", () => {
  const annotations = [
    { id: "at-1", kind: "marker", markerType: "activeTermites", label: "AT", note: "Front sill plate", x: 0, y: 0 },
    { id: "at-2", kind: "marker", markerType: "activeTermites", label: "AT", note: "Rear band", x: 10, y: 10 },
    { id: "door-1", kind: "marker", markerType: "door", label: "DR", x: 20, y: 20 },
    { id: "treatment-1", kind: "marker", markerType: "trenchAndTreat", label: "TT", x: 30, y: 30 },
  ]
  const markers = annotationsToMarkers("graph-1", annotations, "tech", new Date().toISOString())
  const findings = inspectionMarkersToFindings("graph-key", markers)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].title, "Active Termites")
  assert.deepEqual(findings[0].markerIds, ["at-1", "at-2"])
  assert.match(findings[0].summary, /Front sill plate/)
  assert.match(findings[0].summary, /Rear band/)
})

test("separate equipment, travel, and disposal costs replace the legacy combined cost", () => {
  const result = calculateCosting({
    productUsage: [], laborUsage: [], equipmentTravelDisposalCents: 99999,
    equipmentCents: 1000, travelCents: 2000, disposalCents: 3000,
    overheadPercent: 0, contingencyPercent: 0, targetMarginPercent: 50, sellingPriceCents: 12000,
  })
  assert.equal(result.otherCostsCents, 6000)
  assert.equal(result.directCostCents, 6000)
  assert.equal(result.grossMarginPercent, 50)
})
