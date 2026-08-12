/**
 * Local-dev stand-in for CurrentUserService. Sales Brain's own dev server
 * has no same-origin Ops Brain session to read, so this returns an
 * obviously-labeled preview account rather than a real name -- it should
 * never be reachable from a production build (see createCurrentUserService
 * in ./index.ts, which only selects this in dev mode).
 */

import type { OpsBrainUser } from "../../types/user";
import type { CurrentUserService } from "./currentUserService";

const PREVIEW_USER: OpsBrainUser = { username: "preview", name: "Preview user", role: "technician" };

export class MockCurrentUserService implements CurrentUserService {
  async getCurrentUser(): Promise<OpsBrainUser | null> {
    return PREVIEW_USER;
  }
}
