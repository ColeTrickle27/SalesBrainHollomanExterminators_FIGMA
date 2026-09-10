import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { additionalQuoteInspection, customerDecisionInspection, customerReviewContent, customerSaveIssue } from "../src/features/sales/customerReview.ts"
import { isQuoteEngineBackedQuote } from "../src/features/sales/quoteWorkspace.ts"

const base = { id: "original", estimateNumber: "Original", status: "draft", findings: [], photos: [], markers: [], property: { graphKey: "private/graph" }, billTo: { billToNumber: "100" }, location: { locationNumber: "200" }, createdAt: "2026-09-09T15:00:00Z" }
test("customer review excludes hidden or staff-only findings and failed/private photos", () => {
  const content = customerReviewContent({ findings: [{ id: "visible" }, { id: "staff", customerVisible: false }, { id: "hidden", hidden: true }], photos: [{ id: "visible" }, { id: "staff", customerVisible: false }, { id: "failed", uploadStatus: "error" }] })
  assert.deepEqual(content.findings.map((item) => item.id), ["visible"])
  assert.deepEqual(content.photos.map((item) => item.id), ["visible"])
})
test("customer acceptance records intent without claiming a signed agreement", () => {
  const result = customerDecisionInspection(base, "accepted", "  ready  ", "2026-09-09T15:00:00Z")
  assert.equal(result.status, "draft")
  assert.deepEqual(result.workflowData.customerDecision, { status: "accepted", note: "ready", decidedAt: "2026-09-09T15:00:00Z" })
  assert.equal(base.workflowData, undefined)
  assert.equal(customerDecisionInspection(base, "pending", "", "now").status, "sent")
  assert.equal(customerDecisionInspection(base, "declined", "", "now").status, "declined")
  assert.throws(() => customerDecisionInspection({ ...base, status: "accepted" }, "pending", "", "now"), /already signed/)
  assert.throws(() => customerDecisionInspection({ ...base, signatureStatus: "completed" }, "declined", "", "now"), /already signed/)
})
test("a separate quote keeps inspection evidence while clearing old quote and signing ownership", () => {
  const saved = { ...base, status: "accepted", signatureStatus: "completed", quoteEngineSnapshot: { quoteId: "original" }, proposalR2Key: "old-pdf", findings: [{ id: "finding" }], photos: [{ id: "photo" }], workflowData: { customerDecision: { status: "accepted" }, acceptance: { captured: true }, quoteOptions: [{ id: "old-option" }] } }
  const result = additionalQuoteInspection(saved, { ...base, id: "new", estimateNumber: "New", status: "draft" })
  assert.equal(result.id, "new")
  assert.deepEqual(result.findings, saved.findings)
  assert.deepEqual(result.photos, saved.photos)
  assert.equal(result.property.graphKey, "private/graph")
  assert.equal(result.status, "draft")
  for (const field of ["signatureStatus", "quoteEngineSnapshot", "proposalR2Key"]) assert.equal(result[field], undefined)
  assert.equal(result.workflowData.customerDecision, undefined)
  assert.equal(result.workflowData.acceptance.captured, false)
  assert.deepEqual(result.workflowData.quoteOptions, [])
  assert.equal(saved.status, "accepted")
  assert.equal(isQuoteEngineBackedQuote(result), true)
})
test("customer outputs require successful saving and never continue after a swallowed save error", () => {
  const source = readFileSync(new URL("../src/features/sales/useSalesWorkflow.ts", import.meta.url), "utf8")
  assert.match(source, /if \(options.required\) throw error/)
  assert.match(source, /if \(options.required\) throw new Error\("A save is already in progress/)
  assert.match(source, /Your work changed while saving/)
  for (const name of ["prepareCustomerDocument", "requestCustomerSignature"]) {
    const block = source.slice(source.indexOf(`  const ${name} =`), source.indexOf("\n  const ", source.indexOf(`  const ${name} =`) + 1))
    assert.match(block, /await saveEstimate\(\{ required: true \}\)/, name)
  }
  const proposal = source.slice(source.indexOf("  const createProposalPdf"), source.indexOf("  const previewReport"))
  assert.match(proposal, /await prepareCustomerDocument\("bundle"\)/)
  const send = source.slice(source.indexOf("  const sendCustomerDocument"), source.indexOf("  const requestCustomerSignature"))
  assert.match(send, /await prepareCustomerDocument\(input.documentType\)/)
  assert.ok(send.indexOf("await prepareCustomerDocument") < send.indexOf("createDocument("))
  assert.ok(send.indexOf("createDocument(") < send.indexOf("sendDelivery("))
})

test("inspection-only saves are allowed but deleting every historical quote line cannot resurrect old pricing", () => {
  const input = { services: [], customLineItems: [] }
  assert.equal(customerSaveIssue({ photos: [], quoteEngineInput: input }), null)
  assert.match(customerSaveIssue({ photos: [], quoteEngineInput: input, quoteEngineSnapshot: {} }), /no remaining lines/)
  assert.equal(customerSaveIssue({ photos: [], quoteEngineInput: { ...input, services: [{ serviceId: "one" }] }, quoteEngineSnapshot: {} }), null)
  assert.match(customerSaveIssue({ photos: [{ uploadStatus: "uploading" }] }), /photo uploads/)
  assert.match(customerSaveIssue({ photos: [{ uploadStatus: "error" }] }), /retry failed photos/)
})
