import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import ts from "typescript"

const source = readFileSync(new URL("../src/services/opsBrain/httpSalesBrainEstimatesService.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace('from "./errors"', `from "${new URL("../src/services/opsBrain/errors.ts", import.meta.url).href}"`)
const { HttpSalesBrainEstimatesService } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

test("copied photos keep finding identity but view and delete only the new stored object", async () => {
  const oldFetch = globalThis.fetch
  const calls = []
  const original = { id: "logical-photo", source: "sales-brain", storageKey: "sales-brain/photos/original/old-storage", url: "/api/sales-brain/photos/original/old-storage", caption: "Finding photo", findingIds: ["finding"] }
  const uploaded = { id: "new-storage", source: "sales-brain", storageKey: "sales-brain/photos/new-quote/new-storage", url: "/api/sales-brain/photos/new-quote/new-storage", thumbnailUrl: "/api/sales-brain/photos/new-quote/new-storage" }
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options })
    if (options.method === "POST") return Response.json({ photo: uploaded })
    if (options.method === "DELETE") return new Response(null, { status: 204 })
    return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "content-type": "image/png" } })
  }
  try {
    const service = new HttpSalesBrainEstimatesService({ baseUrl: "" })
    const copied = await service.copyPhotoToEstimate(original, "new-quote")
    assert.equal(copied.id, original.id)
    assert.equal(copied.url, uploaded.url)
    assert.equal(copied.thumbnailUrl, uploaded.thumbnailUrl)
    assert.equal(copied.storageKey, uploaded.storageKey)
    assert.deepEqual(copied.findingIds, original.findingIds)
    await service.deletePhoto(copied)
    assert.equal(calls[0].url, "/api/sales-brain/photos/original/old-storage")
    assert.equal(calls[1].url, "/api/sales-brain/estimates/new-quote/photos")
    assert.equal(calls[2].url, "/api/sales-brain/photos/new-quote/new-storage")
    assert.equal(calls[2].options.method, "DELETE")
    assert.ok(calls.every(({ options }) => options.credentials === "include"))
    assert.equal(original.storageKey, "sales-brain/photos/original/old-storage")
  } finally { globalThis.fetch = oldFetch }
})
