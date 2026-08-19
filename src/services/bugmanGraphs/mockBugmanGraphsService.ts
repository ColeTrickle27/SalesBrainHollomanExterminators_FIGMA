/**
 * In-memory BugMan Graphs service for local development. Returns a small
 * fabricated graph so the Property/Findings steps have something realistic
 * to render without a live Ops Brain + BugMan Graphs deployment.
 */

import type { InspectionMarker } from "../../types/findings";
import type { PhotoReference } from "../../types/property";
import type { BugManGraphListItem, BugManGraphsService, OpenInspectionOptions } from "./bugmanGraphsService";
import { annotationsToMarkers } from "./markerAdapter";
import type { BugManGraphDocument } from "./types";

function buildDemoDocument(billToNumber: string, locationNumber: string): BugManGraphDocument {
  const now = new Date().toISOString();
  return {
    id: "demo-graph-1",
    schemaVersion: 5,
    customer: {
      name: "Morgan Parker",
      serviceAddress: "1842 Linden Lane, Tulsa, OK 74104",
      pestPacBillToNumber: billToNumber,
      pestPacLocationNumber: locationNumber,
      serviceType: "Termite Inspection",
      createdBy: "demo",
    },
    graphObjects: {
      wallSegments: [],
      annotations: [
        {
          id: "ann-1",
          kind: "marker",
          point: { x: 120, y: 240 },
          label: "Active termite activity",
          markerType: "termiteActivity",
          note: "Mud tubes along the south foundation wall near the crawlspace access.",
          attachmentIds: [],
        },
        {
          id: "ann-2",
          kind: "marker",
          point: { x: 300, y: 90 },
          label: "Moisture intrusion",
          markerType: "moisture",
          note: "Elevated moisture reading near the utility room slab penetration.",
          attachmentIds: [],
        },
      ],
      shapes: [],
      freehandStrokes: [],
    },
    layers: {},
    attachments: [],
    traces: [],
    measurementCalibration: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

export class MockBugManGraphsService implements BugManGraphsService {
  private documents = new Map<string, BugManGraphDocument>();

  async listGraphsForProperty(): Promise<BugManGraphListItem[]> {
    // Local mode must not invent selectable records. Production uses the real
    // Ops Brain listing boundary; this empty result is an honest dev state.
    return [];
  }

  async openInspection({ billToNumber, locationNumber, graphKey, mode = "edit", visibleMarkerIds = [] }: OpenInspectionOptions) {
    const key = graphKey ?? `demo/${billToNumber}-${locationNumber}`;
    if (!this.documents.has(key)) this.documents.set(key, buildDemoDocument(billToNumber, locationNumber));
    const params = new URLSearchParams({ mode });
    visibleMarkerIds.forEach((id) => params.append("marker", id));
    return { url: `about:blank?${params.toString()}#bugman-graphs-demo/${key}`, graphKey: key };
  }

  async saveGraph(graphKey: string | undefined, document: BugManGraphDocument) {
    const key = graphKey ?? `demo/${document.id}`;
    this.documents.set(key, document);
    return { graphKey: key, name: `${document.customer.name} - BugMan Graph.bgraph` };
  }

  async loadGraph(graphKey: string) {
    const document = this.documents.get(graphKey);
    if (!document) return null;
    return { document, blobs: {}, name: `${document.customer.name} - BugMan Graph.bgraph` };
  }

  async getMarkers(graphKey: string): Promise<InspectionMarker[]> {
    const document = this.documents.get(graphKey);
    if (!document) return [];
    return annotationsToMarkers(document.id, document.graphObjects.annotations, document.customer.createdBy, document.updatedAt);
  }

  async saveMarkers(): Promise<void> {
    // See HttpBugManGraphsService.saveMarkers -- intentionally unimplemented in Phase 1.
  }

  async getPhotos(): Promise<PhotoReference[]> {
    return [];
  }
}
