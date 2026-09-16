import assert from "node:assert/strict"
import test from "node:test"
import { resolveOpsBrainUrl } from "../src/services/opsBrain/appUrls.ts"

test("standalone customer document and image links retain their API host and encoded keys", () => {
  const path = "/api/download?key=customer%2Freport%20one.pdf"
  assert.equal(resolveOpsBrainUrl(path, "https://ops.holloman-ext.com"), "https://ops.holloman-ext.com" + path)
  assert.equal(resolveOpsBrainUrl(path, ""), path)
  assert.equal(resolveOpsBrainUrl("blob:https://sales.holloman-ext.com/example", "https://ops.holloman-ext.com"), "blob:https://sales.holloman-ext.com/example")
});
