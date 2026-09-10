import assert from "node:assert/strict"
import test from "node:test"
import { signatureSendingBlocked } from "../src/features/sales/signatureEligibility.ts"

test("accepted quotes cannot send again even without a signature record or after a retryable status", () => {
  for (const status of [undefined, "declined", "expired", "send_failed", "revoked"]) {
    assert.equal(signatureSendingBlocked({ status: "accepted" }, status ? { status } : null), true)
  }
})
test("completed and signed signatures block sending before quote status catches up", () => {
  for (const status of ["signed", "completed"]) {
    assert.equal(signatureSendingBlocked({ status: "sent", signatureStatus: status }), true)
    assert.equal(signatureSendingBlocked({ status: "sent" }, { status }), true)
  }
})
test("draft invitations and failed invitation retries remain available; active requests block duplicates", () => {
  assert.equal(signatureSendingBlocked({ status: "draft" }), false)
  for (const status of ["declined", "expired", "send_failed", "revoked"]) {
    assert.equal(signatureSendingBlocked({ status: "sent" }, { status }), false)
  }
  for (const status of ["pending", "sent", "viewed"]) {
    assert.equal(signatureSendingBlocked({ status: "sent" }, { status }), true)
  }
})
