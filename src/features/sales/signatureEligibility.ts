export function signatureSendingBlocked(
  quote: { status?: string; signatureStatus?: string },
  signatureRequest?: { status: string } | null,
): boolean {
  return quote.status === "accepted" ||
    ["signed", "completed"].includes(quote.signatureStatus || "") ||
    Boolean(signatureRequest &&
      !["declined", "expired", "send_failed", "revoked"].includes(signatureRequest.status))
}
