/**
 * Converts BugMan Graph annotations into Sales Brain InspectionMarkers.
 * This is the only place that should know about GraphAnnotation's JSON
 * shape -- everything downstream works with InspectionMarker.
 */

import type { InspectionFinding, InspectionMarker, MarkerCategory } from "../../types/findings";
import type { BugManGraphAnnotation } from "./types";

// Mirrors GraphMarkerTypeMetadata.category in BugManInspects
// (lib/models/graph_annotation.dart). Kept as data here so adding a new
// marker type upstream only requires adding one line, not new logic.
//
// This list is kept in sync with the canonical GraphMarkerType enum and its
// GraphMarkerTypeMetadata.category switch in BugMan Graphs.
export const CATEGORY_BY_MARKER_TYPE: Record<string, MarkerCategory> = {
  termiteActivity: "insectFindings",
  termiteDamage: "insectFindings",
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
  circle: "treatment",
  triangle: "treatment",
  square: "treatment",

  photoPoint: "review",
  notePoint: "review",
  recommendationPoint: "review",
  camera: "review",
  treatmentNote: "review",
};

/** Canonical customer-readable labels from BugMan Graphs' GraphMarkerType. */
export const TITLE_BY_MARKER_TYPE: Record<string, string> = {
  termiteActivity: "Termite Activity", termiteDamage: "Termite Damage", moisture: "Moisture",
  standingWater: "Standing Water", conduciveCondition: "Conducive Condition", treatmentArea: "Treatment Area",
  baitStation: "Bait Station", crawlspaceIssue: "Crawlspace Issue", plumbingLeak: "Plumbing Leak",
  hvacCondensation: "HVAC Condensation", insulationIssue: "Insulation Issue", woodDecay: "Wood Decay",
  accessPoint: "Access Point", entryPoint: "Entry Point", rodentActivity: "Rodent Activity",
  generalPestActivity: "General Pest Activity", photoPoint: "Photo Insert", notePoint: "Inspection Note",
  recommendationPoint: "Recommendation", oldDamage: "Old Damage", damage: "Damage",
  activeTermites: "Active Termites", oldTermiteActivity: "Old Termite Activity", woodFungi: "Wood Destroying Fungi",
  oldHouseBorers: "Old House Borers", powderPostBeetles: "Powder Post Beetles", treatmentNote: "Treatment Note",
  mudTube: "Mud Tube", carpenterAntEvidence: "Carpenter Ant Evidence", carpenterBeeEvidence: "Carpenter Bee Evidence",
  roachActivity: "Roach Activity", otherPestEvidence: "Other Pest Evidence", rot: "Wood Rot",
  woodToGroundContact: "Wood-to-Ground Contact", foundationCrack: "Foundation Crack",
  plumbingPenetration: "Plumbing Penetration", utilityPenetration: "Utility Penetration",
  crawlspaceAccess: "Crawlspace Access", vent: "Vent", expansionJoint: "Expansion Joint",
  structuralConcern: "Structural Concern", pestEntryPoint: "Pest Entry Point", moistureReading: "Moisture Reading",
  highMoisture: "High Moisture", activeLeak: "Active Leak", condensation: "Condensation",
  drainageConcern: "Drainage Concern", vaporBarrierIssue: "Vapor Barrier Issue", door: "Door", window: "Window",
  garageDoor: "Garage Door", steps: "Steps", hvacUnit: "HVAC", gasLine: "Gas Line", waterLine: "Water Line",
  wellOrCistern: "Well or Cistern", deckSupport: "Deck Support", pier: "Pier", foundationVent: "Foundation Vent",
  verticalDrill: "Vertical Drill", horizontalDrill: "Horizontal Drill", trenchAndTreat: "Trench and Treat",
  rodInjection: "Rod Injection", foamApplication: "Foam Application", liquidTreatmentZone: "Liquid Treatment Zone",
  interiorBaitPlacement: "Interior Bait Placement", dustApplication: "Dust Application", exclusionPoint: "Exclusion Point",
  rodentBox: "Rodent Box", rodentTrap: "Rodent Trap", circle: "Circle", triangle: "Triangle", square: "Square",
  camera: "Camera",
};

export const INSPECTION_FINDING_CATALOG = Object.entries(CATEGORY_BY_MARKER_TYPE)
  .filter(([, category]) => category === "insectFindings" || category === "structureFindings" || category === "moistureFindings")
  .map(([type, category]) => ({ type, category, title: TITLE_BY_MARKER_TYPE[type] || type }));

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
    title: TITLE_BY_MARKER_TYPE[annotation.markerType] || annotation.label || annotation.markerType,
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

/** Groups reportable graph markers into exactly one persistent finding per canonical marker type. */
export function inspectionMarkersToFindings(graphKey: string, markers: InspectionMarker[]): InspectionFinding[] {
  const now = new Date().toISOString();
  const grouped = new Map<string, InspectionMarker[]>();
  for (const marker of markers.filter((item) => item.category === "insectFindings" || item.category === "structureFindings" || item.category === "moistureFindings")) {
    const current = grouped.get(marker.type);
    if (current) current.push(marker);
    else grouped.set(marker.type, [marker]);
  }
  return Array.from(grouped.values(), (group) => {
    const first = group[0];
    const observations = Array.from(new Set(group.map((marker) => [marker.area ? `${marker.area}:` : "", marker.observation || marker.notes || ""].filter(Boolean).join(" ")).filter(Boolean)));
    return {
      id: `finding-${first.type}`,
      source: "graph",
      sourceGraphKey: graphKey,
      markerType: first.type,
      customerVisible: true,
      title: first.title || first.type,
      summary: observations.join(" • "),
      category: first.category,
      severity: first.severity,
      tag: first.category === "insectFindings" ? "Priority" : first.category === "moistureFindings" ? "Watch" : "Inspection",
      markerIds: group.map((marker) => marker.id),
      photoIds: Array.from(new Set(group.flatMap((marker) => marker.photoIds))),
      status: "pending_review",
      createdAt: now,
      updatedAt: now,
    };
  });
}
