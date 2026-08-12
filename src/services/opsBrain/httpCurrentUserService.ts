/**
 * Real HTTP implementation of CurrentUserService, calling Ops Brain's
 * GET /api/me (functions/api/[[path]].js in ColeTrickle27/holloman-ops-brain).
 * Same same-origin / session-cookie dependency as HttpCustomerFilesService
 * (see that file's header comment) -- this only resolves a real user once
 * Sales Brain is served from Ops Brain's own origin (the /sales-brain/
 * mount), where the browser sends Ops Brain's existing hob_session cookie
 * automatically.
 */

import type { OpsBrainUser } from "../../types/user";
import type { CurrentUserService } from "./currentUserService";

export class HttpCurrentUserService implements CurrentUserService {
  constructor(private readonly config: { baseUrl: string }) {}

  async getCurrentUser(): Promise<OpsBrainUser | null> {
    const response = await fetch(`${this.config.baseUrl}/api/me`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    // No session, or the session was rejected -- not signed in. This is a
    // normal state (e.g. before Ops Brain login, or after it expires), not
    // an error to surface as a crash.
    if (response.status === 401) return null;
    if (!response.ok) {
      throw new Error(`Ops Brain /me request failed (${response.status}).`);
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("Ops Brain returned an unexpected (non-JSON) response for /me. Check the configured baseUrl / mounting.");
    }
    const user = (payload as { user?: OpsBrainUser } | undefined)?.user;
    return user ?? null;
  }
}
