import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import ts from "typescript"
import { OpsBrainAuthError } from "../src/services/opsBrain/errors.ts"

const source = readFileSync(new URL("../src/services/opsBrain/httpSalesBrainEstimatesService.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace('from "./errors"', `from "${new URL("../src/services/opsBrain/errors.ts", import.meta.url).href}"`)
const { HttpSalesBrainEstimatesService } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

async function withResponse(response, check) {
  const previous = globalThis.fetch
  globalThis.fetch = async () => response
  try { await check(new HttpSalesBrainEstimatesService({ baseUrl: "" })) } finally { globalThis.fetch = previous }
}
test("401 is an authentication error even when the response cannot be parsed as JSON", async () => {
  let parsed = false
  await withResponse({ status: 401, json: async () => { parsed = true; throw new Error("HTML") } }, async (service) => {
    await assert.rejects(service.listDocuments("quote"), (error) => error instanceof OpsBrainAuthError && /work is still here/.test(error.message))
  })
  assert.equal(parsed, false)
})
test("non-JSON forbidden and unavailable responses give actionable messages without mounting jargon", async () => {
  for (const [status, expected] of [[403, /do not have access/], [503, /temporarily unavailable/], [200, /could not complete this request/]]) {
    await withResponse(new Response("<html>Gateway error</html>", { status }), async (service) => {
      await assert.rejects(service.listDocuments("quote"), (error) => expected.test(error.message) && /work is still here/.test(error.message) && !/baseUrl|mounting|non-JSON|html/.test(error.message))
    })
  }
})
test("normal JSON success and validation failures retain the existing contract", async () => {
  await withResponse(Response.json({ documents: [{ id: "saved" }] }), async (service) => assert.deepEqual(await service.listDocuments("quote"), [{ id: "saved" }]))
  await withResponse(Response.json({ error: "Save a quote first." }, { status: 400 }), async (service) => assert.rejects(service.listDocuments("quote"), /Save a quote first/))
})

const workflowSource = readFileSync(new URL("../src/features/sales/useSalesWorkflow.ts", import.meta.url), "utf8")
const refreshSource = /const refreshOperations = useCallback\((async \(\) => \{[\s\S]*?\n  \}), \[\]\)/.exec(workflowSource)?.[1]
assert.ok(refreshSource, "Read the actual refreshOperations callback for its isolated request test")
async function runRefresh(overrides, initialProfile) {
  const state = { profile: initialProfile, error: null, loading: false }
  const noop = () => {}
  const context = {
    operationsServiceRef: { current: { loadDashboard: async () => ({}), listLeads: async () => [], listProducts: async () => [], listLaborRoles: async () => [], getCostingSettings: async () => ({}), listServicePackages: async () => [], getMyEmployeeProfile: async () => ({ username: "current", active: true }), ...overrides } },
    setOperationsLoading: (value) => { state.loading = value },
    setOperationsError: (value) => { state.error = typeof value === "function" ? value(state.error) : value },
    setEmployeeProfile: (value) => { state.profile = value },
    setDashboardData: noop, setProducts: noop, setLaborRoles: noop, setCostingSettings: noop, setServicePackages: noop,
  }
  await new Function(...Object.keys(context), ts.transpileModule(`const run = ${refreshSource}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + "; return run;")(...Object.values(context))()
  return state
}
test("an unrelated dashboard failure cannot discard a successful sender profile", async () => {
  const result = await runRefresh({ loadDashboard: async () => { throw new Error("Dashboard unavailable") } }, null)
  assert.deepEqual(result.profile, { username: "current", active: true })
  assert.equal(result.error, "Dashboard unavailable")
  assert.equal(result.loading, false)
})
test("a failed profile refresh retains the known profile instead of clearing it", async () => {
  const old = { username: "current", active: true, gmailEnabled: true }
  const result = await runRefresh({ getMyEmployeeProfile: async () => { throw new Error("Network error") } }, old)
  assert.equal(result.profile, old)
  assert.match(result.error, /profile could not be refreshed/)
  assert.equal(result.loading, false)
})
