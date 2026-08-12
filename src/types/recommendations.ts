/**
 * Recommended Service domain models.
 *
 * Phase 1 does NOT implement pricing logic or a pricebook -- these types
 * exist so the Recommended Service step has a stable shape to render against
 * once Ops Brain's pricebook and BugMan Intelligence's suggestion service are
 * connected (Phase 5). A human always approves the final recommendation;
 * `suggestedByIntelligence` is informational only and never implies
 * auto-approval.
 */

export interface ServiceLineItem {
  id: string;
  label: string;
  /** Cents, to avoid floating point drift. Left optional until pricebook integration lands. */
  amountCents?: number;
}

export type RecommendationStatus = "suggested" | "approved" | "dismissed";

export interface ServiceRecommendation {
  id: string;
  /** A report-local service. It must never modify the shared Pricebook. */
  isCustom?: boolean;
  /** Human-readable service name, e.g. "Whole-home protection". */
  name: string;
  description: string;
  /** Findings this recommendation addresses. */
  findingIds: string[];
  lineItems: ServiceLineItem[];
  totalCents?: number;
  status: RecommendationStatus;
  suggestedByIntelligence: boolean;
  approvedBy?: string;
  approvedAt?: string;
}
