/**
 * Real HTTP implementation, calling Ops Brain's
 * /api/bugman-graphs/save|load|upload routes -- the same routes
 * HttpBugManPortalService in BugManInspects (Dart) calls. Request/response
 * envelopes below match functions/api/[[path]].js exactly:
 *
 *   POST /api/bugman-graphs/save?key=<existingKey?>
 *     body:  { type: "bugman-graph", version: 1, document, blobs }
 *     resp:  { ok: true, key, name, message }  (201)
 *   GET  /api/bugman-graphs/load?key=<key>
 *     resp:  { graph: { document, blobs }, name }
 *   error:   { error: string }  (400/403/404/413/500)
 *
 * Mounted SalesBrain uses this implementation in production. The standalone
 * editor origin is CSP-allowlisted and the verified save bridge returns the
 * canonical R2 key to the mounted Ops Brain origin.
 */

import type { InspectionMarker } from "../../types/findings";
import type { PhotoReference } from "../../types/property";
import type { BugManGraphListItem, BugManGraphsService, OpenInspectionOptions } from "./bugmanGraphsService";
import { annotationsToMarkers } from "./markerAdapter";
import type { BugManGraphDocument, BugManGraphEnvelope } from "./types";

export interface OpsBrainGraphsClientConfig {
  /** Ops Brain origin, e.g. "https://ops.holloman-ext.com". */
  baseUrl: string;
  /** Standalone Flutter editor origin. */
  editorUrl: string;
}

export class HttpBugManGraphsService implements BugManGraphsService {
  constructor(private readonly config: OpsBrainGraphsClientConfig) {}

  async listGraphsForProperty({ billToNumber, locationNumber }: Pick<OpenInspectionOptions, "billToNumber" | "locationNumber">): Promise<BugManGraphListItem[]> {
    const params = new URLSearchParams({ billTo: billToNumber, location: locationNumber });
    const response = await fetch(`${this.config.baseUrl}/api/bugman-graphs/list?${params.toString()}`, {
      credentials: "include",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || "Failed to load saved BugMan Graphs.");
    return Array.isArray(payload.graphs) ? payload.graphs as BugManGraphListItem[] : [];
  }

  async openInspection({ billToNumber, locationNumber, graphKey }: OpenInspectionOptions) {
    const params = new URLSearchParams({ billTo: billToNumber, location: locationNumber });
    // BugManInspects reads the existing R2 key from `graph`, not `key`.
    if (graphKey) params.set("graph", graphKey);
    if (typeof window !== "undefined") params.set("returnOrigin", window.location.origin);
    return { url: `${this.config.editorUrl.replace(/\/$/, "")}/?${params.toString()}`, graphKey };
  }

  async saveGraph(graphKey: string | undefined, document: BugManGraphDocument, blobs: Record<string, string>) {
    const body: BugManGraphEnvelope = { type: "bugman-graph", version: 1, document, blobs };
    const params = graphKey ? `?key=${encodeURIComponent(graphKey)}` : "";
    const response = await fetch(`${this.config.baseUrl}/api/bugman-graphs/save${params}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload?.error || "Failed to save BugMan Graph.");
    return { graphKey: payload.key as string, name: payload.name as string };
  }

  async loadGraph(graphKey: string) {
    const response = await fetch(
      `${this.config.baseUrl}/api/bugman-graphs/load?key=${encodeURIComponent(graphKey)}`,
      { credentials: "include" },
    );
    if (response.status === 404) return null;
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || "Failed to load BugMan Graph.");
    return { document: payload.graph.document as BugManGraphDocument, blobs: payload.graph.blobs as Record<string, string>, name: payload.name as string };
  }

  async getMarkers(graphKey: string): Promise<InspectionMarker[]> {
    const loaded = await this.loadGraph(graphKey);
    if (!loaded) return [];
    return annotationsToMarkers(
      loaded.document.id,
      loaded.document.graphObjects.annotations,
      loaded.document.customer.createdBy,
      loaded.document.updatedAt,
    );
  }

  async saveMarkers(): Promise<void> {
    // Sales Brain does not write marker geometry back to BugMan Graphs in
    // Phase 1. When this lands, it must round-trip through saveGraph() with
    // the full document (Ops Brain has no partial-update route for graphs).
    throw new Error("saveMarkers is not implemented until BugMan Graphs write-back is designed (post-Phase 1).");
  }

  async getPhotos(graphKey: string): Promise<PhotoReference[]> {
    const loaded = await this.loadGraph(graphKey);
    if (!loaded) return [];
    return loaded.document.attachments.map((attachment) => ({
      // Do not carry the graph's embedded base64 blobs into a Sales Brain
      // report. The graph remains the owner; this same-origin URL resolves
      // the asset only when it is displayed.
      id: `graph-${graphKey}-${attachment.id}`,
      source: "bugman-graph" as const,
      sourceGraphKey: graphKey,
      attachmentId: attachment.id,
      url: `${this.config.baseUrl}/api/bugman-graphs/photo?${new URLSearchParams({ key: graphKey, attachment: attachment.id })}`,
      thumbnailUrl: attachment.thumbnailKey
        ? `${this.config.baseUrl}/api/bugman-graphs/photo?${new URLSearchParams({ key: graphKey, attachment: attachment.id, variant: "thumbnail" })}`
        : undefined,
      caption: attachment.name,
      width: attachment.width,
      height: attachment.height,
      byteSize: attachment.byteSize,
    }));
  }
}
