export type { BugManIntelligenceService } from "./bugmanIntelligenceService";
export { MockBugManIntelligenceService } from "./mockBugmanIntelligenceService";

import { MockBugManIntelligenceService } from "./mockBugmanIntelligenceService";
import type { BugManIntelligenceService } from "./bugmanIntelligenceService";

/**
 * Active BugMan Intelligence service instance. Always the mock in Phase 1 --
 * no production AI model is connected. See bugmanIntelligenceService.ts for
 * the hard constraints any future real implementation must respect.
 */
export function createBugManIntelligenceService(): BugManIntelligenceService {
  return new MockBugManIntelligenceService();
}
