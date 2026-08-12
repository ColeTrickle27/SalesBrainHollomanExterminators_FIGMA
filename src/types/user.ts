/**
 * The signed-in Ops Brain user, as returned by GET /api/me
 * (functions/api/[[path]].js's `publicUser()` in holloman-ops-brain).
 * This is the *real* identity of whoever is operating Sales Brain --
 * see docs/SALES_BRAIN_ARCHITECTURE.md §17 for why this replaced the
 * hardcoded "Jordan Reyes" placeholder.
 */
export interface OpsBrainUser {
  username: string;
  name: string;
  role: string;
}
