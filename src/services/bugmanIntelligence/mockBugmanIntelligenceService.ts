/**
 * Placeholder implementation. Deliberately simple and deterministic (no LLM
 * call) so it's obvious this is not production AI -- see the interface's
 * doc comment for the hard constraints any real implementation must respect.
 */

import type { InspectionFinding, InspectionMarker } from "../../types/findings";
import type { ServiceRecommendation } from "../../types/recommendations";
import type { BugManIntelligenceService } from "./bugmanIntelligenceService";

export class MockBugManIntelligenceService implements BugManIntelligenceService {
  /**
   * Deterministic, template-based rewording -- no LLM call. Wraps the
   * technician's own observation in homeowner-friendly framing without
   * adding, removing, or altering any fact. Clearly a placeholder so it's
   * never mistaken for a real AI rewrite.
   */
  async polishFinding(finding: InspectionFinding): Promise<{ customerFacingSummary: string }> {
    const observation = finding.summary.trim().replace(/\.$/, "");
    return {
      customerFacingSummary: `During today's visit, our technician noted: ${observation}. This has been factored into your recommended service plan.`,
    };
  }

  async analyzeFindings(markers: InspectionMarker[]): Promise<InspectionFinding[]> {
    const now = new Date().toISOString();
    return markers.map((marker) => ({
      id: `finding-${marker.id}`,
      title: marker.title,
      summary: marker.observation,
      category: marker.category,
      severity: marker.severity,
      tag: marker.category === "insectFindings" ? "Priority" : marker.category === "moistureFindings" ? "Watch" : "Repair",
      markerIds: [marker.id],
      photoIds: marker.photoIds,
      status: "pending_review",
      polishedByIntelligence: false,
      createdAt: now,
      updatedAt: now,
    }));
  }

  async suggestRecommendations(findings: InspectionFinding[]): Promise<ServiceRecommendation[]> {
    if (findings.length === 0) return [];
    return [
      {
        id: "rec-suggested-1",
        name: "Whole-home protection",
        description: "Placeholder suggestion generated without a connected AI model -- for review only.",
        findingIds: findings.map((finding) => finding.id),
        lineItems: [],
        status: "suggested",
        suggestedByIntelligence: true,
      },
    ];
  }
}
