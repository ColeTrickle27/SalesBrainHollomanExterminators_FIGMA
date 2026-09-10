import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import ts from "typescript"

const serviceSource = readFileSync(new URL("../src/services/opsBrain/httpSalesBrainOperationsService.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(serviceSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace('from "./errors"', `from "${new URL("../src/services/opsBrain/errors.ts", import.meta.url).href}"`)
const { HttpSalesBrainOperationsService } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

test("intake issues use the authenticated metadata endpoint", async () => {
  const previous = globalThis.fetch
  const issues = [{ messageId: "review-1", reason: "Outside the service area; review required.", receivedAt: "2026-09-09T15:00:00Z", status: "review" }, { messageId: "excluded-1", reason: "Excluded submission.", receivedAt: "2026-09-09T14:00:00Z", status: "excluded" }]
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/sales-brain/lead-intake-issues")
    assert.equal(options.credentials, "include")
    assert.equal(options.method, undefined)
    return Response.json({ issues })
  }
  try { assert.deepEqual(await new HttpSalesBrainOperationsService({ baseUrl: "" }).listLeadIntakeIssues(), issues) } finally { globalThis.fetch = previous }
})
test("only administrators mount the review panel; review and excluded counts remain separate", () => {
  const admin = readFileSync(new URL("../src/screens/AdminDetail.tsx", import.meta.url), "utf8")
  const panel = readFileSync(new URL("../src/screens/LeadIntakeReview.tsx", import.meta.url), "utf8")
  assert.match(admin, /const isAdmin = props.currentUser\?\.role === "admin"/)
  assert.match(admin, /\{isAdmin && <LeadIntakeReview/)
  assert.match(panel, /status === "review"/)
  assert.match(panel, /status === "excluded"/)
  assert.match(panel, /issue\.receivedAt/)
  assert.match(panel, /issue\.reason/)
  assert.doesNotMatch(panel, /dangerouslySetInnerHTML|rawEmail|createLead/)
})
