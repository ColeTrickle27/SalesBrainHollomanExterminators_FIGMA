/**
 * Ops Brain uses signed, HTTP-only, origin-scoped session cookies (see
 * docs/SALES_BRAIN_ARCHITECTURE.md, section 4). Sales Brain does not own
 * authentication itself, so when Ops Brain says a request is unauthenticated
 * or the session has expired, the correct move is to tell the technician to
 * sign in at Ops Brain -- never to build a competing login flow here.
 *
 * `HttpCustomerFilesService` throws this specifically on a 401 so the UI can
 * show that guidance instead of a generic error message.
 */
export class OpsBrainAuthError extends Error {
  constructor(message = "Your Ops Brain session has expired. Sign in and try again.") {
    super(message);
    this.name = "OpsBrainAuthError";
  }
}
