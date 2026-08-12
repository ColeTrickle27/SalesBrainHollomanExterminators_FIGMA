/**
 * BugMan Graphs service boundary.
 *
 * BugMan Graphs is a Flutter web app (ColeTrickle27/BugManInspects), already
 * embedded inside Ops Brain at /bugman-graphs/ and reachable standalone at
 * graphs.holloman-ext.com. Sales Brain does NOT reimplement graphing,
 * diagramming, or marker placement -- Property (workflow step 2) hosts an
 * integration boundary (`<BugManGraphsWorkspace />`) that opens the real
 * BugMan Graphs app, and Sales Brain only reads back the saved document
 * through this service so Inspection Findings (step 3) never requires
 * duplicate data entry.
 */

import type { InspectionMarker } from "../../types/findings";
import type { PhotoReference } from "../../types/property";
import type { BugManGraphDocument } from "./types";

/** Real, compact graph identity returned by Ops Brain's property listing. */
export interface BugManGraphListItem {
  key: string;
  name: string;
  billToNumber: string;
  locationNumber: string;
  customerName: string | null;
  serviceAddress: string | null;
  updatedAt: string | null;
}

export interface OpenInspectionOptions {
  billToNumber: string;
  locationNumber: string;
  /** Existing graph key (R2 object key) to resume, if one exists. */
  graphKey?: string;
}

export interface BugManGraphsService {
  /** Lists real saved graph references for one PestPac Bill-To/Location. */
  listGraphsForProperty(options: Pick<OpenInspectionOptions, "billToNumber" | "locationNumber">): Promise<BugManGraphListItem[]>;

  /** Returns the URL to embed/launch for a given customer + location, per BugMan Graphs' own origin/path rules. */
  openInspection(options: OpenInspectionOptions): Promise<{ url: string; graphKey?: string }>;

  /** Persists a graph document + blobs, mirroring POST /api/bugman-graphs/save. */
  saveGraph(graphKey: string | undefined, document: BugManGraphDocument, blobs: Record<string, string>): Promise<{ graphKey: string; name: string }>;

  /** Reads back a saved graph, mirroring GET /api/bugman-graphs/load. */
  loadGraph(graphKey: string): Promise<{ document: BugManGraphDocument; blobs: Record<string, string>; name: string } | null>;

  /** Extracts InspectionMarkers from a saved graph's annotations -- the read side of the "no duplicate entry" rule. */
  getMarkers(graphKey: string): Promise<InspectionMarker[]>;

  /**
   * BugMan Graphs owns marker placement; Sales Brain never creates markers
   * directly. This exists only so a future adapter can push severity/notes
   * edited in Sales Brain back onto the graph's extraProperties bag without
   * Sales Brain needing to touch geometry it doesn't understand.
   */
  saveMarkers(graphKey: string, markers: InspectionMarker[]): Promise<void>;

  /** Photos attached to graph markers, resolved to signed/proxied URLs. */
  getPhotos(graphKey: string): Promise<PhotoReference[]>;
}
