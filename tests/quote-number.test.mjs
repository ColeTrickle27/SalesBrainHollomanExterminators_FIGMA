import assert from "node:assert/strict"
import test from "node:test"
import { customerQuoteNumber } from "../src/features/sales/quoteNumber.ts"

test("quote labels follow the requested personal and company examples", () => {
  assert.equal(customerQuoteNumber({lastName:"Matthews",serviceName:"QPC",createdAt:"2026-09-09T12:00:00Z"}, "DRAFT"), "Matthews-QPC-09.09.26")
  assert.equal(customerQuoteNumber({company:"Holloman Exterminators",serviceName:"Encapsulation",createdAt:"2026-02-28T12:00:00Z"}, "DRAFT"), "HollomanExterminators-Encapsulation-02.28.26")
})
test("labels cap service at fifteen characters and retain the backend eighty character limit", () => {
  const label = customerQuoteNumber({company:"A".repeat(100),serviceName:"B".repeat(100),createdAt:"2026-09-09T12:00:00Z"}, "DRAFT")
  assert.equal(label.length, 80)
  assert.equal(label.split("-")[1].length, 15)
})
test("incomplete drafts keep their existing label and dates use Holloman local time", () => {
  assert.equal(customerQuoteNumber({createdAt:"invalid"}, "DRAFT-123"), "DRAFT-123")
  assert.equal(customerQuoteNumber({lastName:"Matthews",createdAt:"2026-09-09T12:00:00Z"}, "DRAFT-123"), "DRAFT-123")
  assert.equal(customerQuoteNumber({lastName:"Matthews",serviceName:"QPC",createdAt:"2026-09-10T01:00:00Z"}, "DRAFT"), "Matthews-QPC-09.09.26")
})
