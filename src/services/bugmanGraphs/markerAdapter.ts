/**
 * Converts BugMan Graph annotations into Sales Brain InspectionMarkers.
 * This is the only place that should know about GraphAnnotation's JSON
 * shape -- everything downstream works with InspectionMarker.
 */

import type { InspectionMarker, MarkerCategory } from "../../types/findings";
import type { BugManGraphAnnotation } from "./types";

// Mirrors GraphMarkerTypeMetadata.category in BugManInspects
// (lib/models/graph_annotation.dart). Kept as data here so adding a new
// marker type upstream only requires adding one line, not new logic.
//
// VERIFY BEFORE PHASE 3: only termiteActivity, termiteDamage, moisture,
// treatmentArea, baitStation, and damage were directly confirmed against the
// live GraphMarkerType enum during the Phase 1 inspection (~70 values total
// exist in graph_annotation.dart / graph_marker_catalog.dart). Every other
// key below is a reasonable best-effort guess at naming conventions the real
// enum likely follows, NOT a verified value -- diff this map against the
// actual Dart enum before relying on it. Any unrecognized type safely falls
// back to the "review" category (see categoryFor) in the meantime.
const CATEGORY_BY_MARKER_TYPE: Record<string, MarkerCategory> = {
  termiteActivity: "insectFindings",
  activeTermites: "insectFindings",
  oldTermiteActivity: "insectFindings",
  mudTube: "insectFindings",
  carpenterAntEvidence: "insectFindings",
  carpenterBeeEvidence: "insectFindings",
  roachActivity: "insectFindings",
  rodentActivity: "insectFindings",
  generalPestActivity: "insectFindings",
  otherPestEvidence: "insectFindings",
  oldHouseBorers: "insectFindings",
  powderPostBeetles: "insectFindings",

  woodDecay: "structureFindings",
  rot: "structureFindings",
  oldDamage: "structureFindings",
  damage: "structureFindings",
  termiteDamage: "structureFindings",
  woodToGroundContact: "structureFindings",
  foundationCrack: "structureFindings",
  plumbingPenetration: "structureFindings",
  utilityPenetration: "structureFindings",
  expansionJoint: "structureFindings",
  structuralConcern: "structureFindings",
  pestEntryPoint: "structureFindings",
  entryPoint: "structureFindings",
  conduciveCondition: "structureFindings",
  crawlspaceIssue: "structureFindings",
  insulationIssue: "structureFindings",

  moisture: "moistureFindings",
  moistureReading: "moistureFindings",
  highMoisture: "moistureFindings",
  standingWater: "moistureFindings",
  activeLeak: "moistureFindings",
  plumbingLeak: "moistureFindings",
  condensation: "moistureFindings",
  hvacCondensation: "moistureFindings",
  woodFungi: "moistureFindings",
  drainageConcern: "moistureFindings",
  vaporBarrierIssue: "moistureFindings",

  accessPoint: "structureDetails",
  crawlspaceAccess: "structureDetails",
  vent: "structureDetails",
  door: "structureDetails",
  window: "structureDetails",
  garageDoor: "structureDetails",
  steps: "structureDetails",
  hvacUnit: "structureDetails",
  gasLine: "structureDetails",
  waterLine: "structureDetails",
  wellOrCistern: "structureDetails",
  deckSupport: "structureDetails",
  pier: "structureDetails",
  foundationVent: "structureDetails",

  treatmentArea: "treatment",
  baitStation: "treatment",
  verticalDrill: "treatment",
  horizontalDrill: "treatment",
  trenchAndTreat: "treatment",
  rodInjection: "treatment",
  foamApplication: "treatment",
  liquidTreatmentZone: "treatment",
  interiorBaitPlacement: "treatment",
  dustApplication: "treatment",
  exclusionPoint: "treatment",
  rodentBox: "treatment",
  rodentTrap: "treatment",

  photoPoint: "review",
  notePoint: "review",
  recommendationPoint: "review",
  camera: "review",
  treatmentNote: "review",
};

function categoryFor(markerType: string): MarkerCategory {
  return CATEGORY_BY_MARKER_TYPE[markerType] ?? "review";
}

export function annotationToMarker(
  graphId: string,
  annotation: BugManGraphAnnotation,
  createdBy: string,
  createdAt: string,
): InspectionMarker | null {
  if (annotation.kind !== "marker") return null;
  const severity = typeof annotation.severity === "string" ? (annotation.severity as InspectionMarker["severity"]) : undefined;
  return {
    id: annotation.id,
    type: annotation.markerType,
    category: categoryFor(annotation.markerType),
    title: annotation.label || annotation.markerType,
    graphRef: { graphId, annotationId: annotation.id },
    observation: annotation.note,
    severity,
    notes: annotation.note,
    photoIds: annotation.attachmentIds ?? [],
    createdBy,
    createdAt,
  };
}

export function annotationsToMarkers(
  graphId: string,
  annotations: BugManGraphAnnotation[],
  createdBy: string,
  createdAt: string,
): InspectionMarker[] {
  return annotations
    .map((annotation) => annotationToMarker(graphId, annotation, createdBy, createdAt))
    .filter((marker): marker is InspectionMarker => marker !== null);
}
