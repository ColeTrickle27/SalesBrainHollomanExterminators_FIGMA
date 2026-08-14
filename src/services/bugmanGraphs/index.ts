export type { BugManGraphListItem, BugManGraphsService, OpenInspectionOptions } from "./bugmanGraphsService";
export { HttpBugManGraphsService } from "./httpBugmanGraphsService";
export { MockBugManGraphsService } from "./mockBugmanGraphsService";
export { annotationToMarker, annotationsToMarkers, INSPECTION_FINDING_CATALOG, inspectionMarkersToFindings } from "./markerAdapter";
export * from "./types";

import { MockBugManGraphsService } from "./mockBugmanGraphsService";
import { HttpBugManGraphsService } from "./httpBugmanGraphsService";
import type { BugManGraphsService } from "./bugmanGraphsService";

/** Mounted production uses real Ops Brain graph data; local dev remains safe. */
export function createBugManGraphsService(): BugManGraphsService {
  if (import.meta.env.PROD || import.meta.env.VITE_BUGMAN_GRAPHS_MODE === "http") {
    return new HttpBugManGraphsService({
      baseUrl: import.meta.env.VITE_OPS_BRAIN_BASE_URL ?? "",
      editorUrl: import.meta.env.VITE_BUGMAN_GRAPHS_URL ?? "https://graphs.holloman-ext.com",
    });
  }
  return new MockBugManGraphsService();
}
