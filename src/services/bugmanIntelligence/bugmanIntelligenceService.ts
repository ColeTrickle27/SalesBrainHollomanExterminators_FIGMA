/**
 * BugMan Intelligence service boundary.
 *
 * This is a FUTURE AI layer. It must NEVER: invent findings, change
 * inspection facts, approve pricing, choose treatments, or replace human
 * decisions. Every method here is advisory only -- callers must treat the
 * return values as suggestions a technician can accept, edit, or ignore.
 *
 * Phase 1 defines this interface only. No production AI is connected;
 * MockBugManIntelligenceService below returns clearly-labeled, deterministic
 * placeholder output so the UI has something to render.
 */

import type { InspectionFinding, InspectionMarker } from "../../types/findings";
import type { ServiceRecommendation } from "../../types/recommendations";

export interface BugManIntelligenceService {
  /**
   * Generates a homeowner-facing rewording of a finding. Must preserve the
   * underlying facts (category, severity, markerIds) unchanged and must
   * NEVER overwrite `summary` -- the technician's original observation --
   * only ever return a separate `customerFacingSummary` for the UI to show
   * alongside it. Result must be reviewed by a human before it's considered
   * final (see InspectionFinding.status).
   */
  polishFinding(finding: InspectionFinding): Promise<{ customerFacingSummary: string }>;

  /**
   * Groups/summarizes raw markers into candidate findings for a technician
   * to review. Does not persist anything and does not set status to
   * "approved" -- output always starts at "pending_review".
   */
  analyzeFindings(markers: InspectionMarker[]): Promise<InspectionFinding[]>;

  /**
   * Suggests candidate service recommendations from approved findings.
   * Never returns a recommendation with status other than "suggested", and
   * never attaches pricing (see ServiceRecommendation -- pricing/pricebook
   * integration is Phase 5, not owned by this service).
   */
  suggestRecommendations(findings: InspectionFinding[]): Promise<ServiceRecommendation[]>;
}
