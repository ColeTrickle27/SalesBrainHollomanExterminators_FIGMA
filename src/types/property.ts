/**
 * Property domain models.
 *
 * Sales Brain does not implement its own structure-drawing or diagramming
 * system. Property inspection is owned by BugMan Graphs (the Flutter app in
 * ColeTrickle27/BugManInspects, deployed as a web build and already embedded
 * into Ops Brain at /bugman-graphs/). `PropertyInspection` is the thin
 * reference Sales Brain keeps to a BugMan Graph document -- not a
 * reimplementation of it.
 */

import type { CustomerLocationRef } from "./customer";

export interface PropertyStructureSummary {
  structureType: string;
  squareFootage?: number;
  yearBuilt?: number;
  stories?: number;
  foundationType?: string;
}

/**
 * Sales Brain's reference to a BugMan Graph. Mirrors the identifiers used by
 * Ops Brain's `/api/bugman-graphs/save|load|upload` routes and the
 * `GraphDocument` / `GraphCustomerInfo` models in BugManInspects
 * (lib/models/graph_document.dart).
 */
export interface PropertyInspection {
  /** Matches GraphDocument.id from BugMan Graphs. */
  graphId?: string;
  /**
   * The Ops Brain R2 object key for the saved .bgraph file, e.g.
   * "company/BugMan Graphs Uploads/2026-08-06T.._BT 1042 - Parker - BugMan Graph.bgraph".
   * Present once the graph has been saved at least once.
   */
  graphKey?: string;
  location: CustomerLocationRef;
  structure: PropertyStructureSummary;
  /** True once a BugMan Graph has been opened/saved for this inspection. */
  hasGraph: boolean;
  lastSyncedAt?: string;
}

export interface PhotoReference {
  id: string;
  /** Sales Brain asset, BugMan Graph reference, or legacy inline photo. */
  source?: "sales-brain" | "bugman-graph" | "legacy-inline";
  /** R2 object key only for Sales Brain-owned uploads. Never set for graph photos. */
  storageKey?: string;
  /** Saved graph that owns this image when source is bugman-graph. */
  sourceGraphKey?: string;
  /** Matches GraphAttachment.id from BugMan Graphs when the photo originated on a graph marker. */
  attachmentId?: string;
  /** Marker this photo is attached to, if any (see InspectionMarker.id). */
  markerId?: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  width?: number;
  height?: number;
  byteSize?: number;
  uploadedAt?: string;
  uploadedBy?: string;
}
