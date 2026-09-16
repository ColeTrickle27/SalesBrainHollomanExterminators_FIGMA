/**
 * Calls the protected OpsBrain API with its existing HTTP-only session cookie.
 * Standalone SalesBrain uses the approved same-site origin sales.holloman-ext.com
 * and an explicit API base URL; compatibility mounts use relative requests.
 * The API validates the caller origin, session, and existing role permissions.
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
