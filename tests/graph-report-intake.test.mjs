import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { graphReportContext, exactGraphReportIdentity, verifyGraphReportOwnership } from "../src/features/sales/graphReportIntake.ts"

const context = { billToNumber: "123", locationNumber: "456", graphKey: "bill-tos/123/456/bugman-graphs/example.bgraph" }
const identity = { identityState: "permanent", pestpacBillToNumber: "123", pestpacLocationNumber: "456" }
test("graph intake requires complete decoded context", () => {
  assert.equal(graphReportContext("?billTo=123&graphKey=x"), null)
  assert.deepEqual(graphReportContext(`?billTo=123&location=456&graphKey=${encodeURIComponent(context.graphKey)}`), context)
})
test("graph intake requires one exact permanent identity", () => {
  assert.equal(exactGraphReportIdentity([identity], context), identity)
  for (const rows of [[], [identity, identity], [{ ...identity, identityState: "temporary" }], [{ ...identity, pestpacLocationNumber: "other" }]]) assert.throws(() => exactGraphReportIdentity(rows, context))
})
test("graph intake verifies graph key and both customer identifiers", () => {
  const row = { key: context.graphKey, billToNumber: "123", locationNumber: "456" }
  assert.doesNotThrow(() => verifyGraphReportOwnership([row], context))
  for (const rows of [[], [{ ...row, key: "other" }], [{ ...row, billToNumber: "other" }], [{ ...row, locationNumber: "other" }]]) assert.throws(() => verifyGraphReportOwnership(rows, context))
})
test("incoming graph requires explicit discard acknowledgement and validates before reset", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const workflow = readFileSync(new URL("../src/features/sales/useSalesWorkflow.ts", import.meta.url), "utf8")
  assert.match(app, /!replaceDraftConfirmed \|\| graphIntakeBusy/)
  assert.match(app, /workflow.restoringEstimate/)
  const intake = workflow.slice(workflow.indexOf("const startQuoteFromGraphReport"))
  assert.ok(intake.indexOf("verifyGraphReportOwnership") < intake.indexOf("startNewEstimate()"))
  assert.ok(intake.indexOf("const loaded = await") < intake.indexOf("startNewEstimate()"))
  assert.match(intake, /await importGraphData\(context.graphKey, loaded\)/)
})
