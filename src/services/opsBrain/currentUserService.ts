import type { OpsBrainUser } from "../../types/user";

export interface CurrentUserService {
  /**
   * Resolves to the signed-in Ops Brain user, or `null` when there is no
   * active session (not signed in, or the session cookie was rejected).
   * `null` is a normal, expected result -- not an error -- callers should
   * render an honest "not signed in" state rather than treat it as a
   * failure.
   */
  getCurrentUser(): Promise<OpsBrainUser | null>;
}
