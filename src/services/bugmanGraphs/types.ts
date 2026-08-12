/**
 * JSON mirrors of BugManInspects' Dart models (lib/models/graph_document.dart,
 * lib/models/graph_annotation.dart), typed just deeply enough for Sales
 * Brain to read markers and customer info back out. Sales Brain must never
 * reconstruct or validate the full graph geometry (wall segments, shapes,
 * freehand strokes) -- those fields are passed through opaquely.
 */

export interface BugManGraphCustomerInfo {
  name: string;
  serviceAddress: string;
  pestPacLocationNumber: string;
  pestPacBillToNumber: string;
  serviceType: string;
  createdBy: string;
}

export interface BugManGraphAnnotation {
  id: string;
  kind: "marker" | "photo" | "text";
  point: { x: number; y: number };
  label: string;
  markerType: string;
  note: string;
  attachmentIds: string[];
  /** Carries fields BugMan Graphs doesn't have a typed slot for yet (e.g. severity). */
  [extra: string]: unknown;
}

export interface BugManGraphAttachment {
  id: string;
  name: string;
  annotationId: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  blobKey: string;
  thumbnailKey: string;
  uri?: string | null;
}

/** Matches GraphDocument.toJson()'s top-level shape. Geometry fields are opaque. */
export interface BugManGraphDocument {
  id: string;
  schemaVersion: number;
  customer: BugManGraphCustomerInfo;
  graphObjects: {
    wallSegments: unknown[];
    annotations: BugManGraphAnnotation[];
    shapes: unknown[];
    freehandStrokes: unknown[];
  };
  layers: Record<string, { visible: boolean; locked: boolean }>;
  attachments: BugManGraphAttachment[];
  traces: unknown[];
  measurementCalibration: unknown;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * The envelope Ops Brain's /api/bugman-graphs/save|upload routes expect and
 * /load returns, matching HttpBugManPortalService in BugManInspects
 * (lib/services/bugman_portal_service_web.dart).
 */
export interface BugManGraphEnvelope {
  type: "bugman-graph";
  version: 1;
  document: BugManGraphDocument;
  /** base64-encoded blob contents, keyed by GraphAttachment.blobKey/thumbnailKey. */
  blobs: Record<string, string>;
}

export interface BugManGraphSavedPackage {
  document: BugManGraphDocument;
  blobs: Record<string, string>;
  name: string;
}
