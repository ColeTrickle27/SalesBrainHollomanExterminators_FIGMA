/**
 * Remaining Phase 1 demo/mock content. Customer-identity demo data (the old
 * DEMO_ESTIMATE / Morgan Parker fixture and its per-step checklist override)
 * was removed once Customer Files went live in Phase 2. Inspection Findings'
 * DEMO_ISSUES fixture was removed in the same spirit once it was flagged as
 * always-visible fake termite/moisture/damage findings -- see
 * docs/SALES_BRAIN_ARCHITECTURE.md §18. What's left here (mock findings,
 * pricing, nav items) is still legitimately mocked because the real
 * BugMan Graphs -> BugMan Intelligence findings pipeline and Recommended
 * Service pricing are later-phase work, not yet wired end-to-end.
 */

import type { InspectionFinding } from "../../types/findings"

/**
 * Decides whether InspectionNotesCard/CustomerReportModal should render
 * MOCK_FINDINGS below instead of real (currently always-empty) findings.
 * Same override chain as createCustomerFilesService()/createCurrentUserService():
 *
 *  - VITE_INSPECTION_FINDINGS_MODE="mock" forces the mock on (e.g. to demo
 *    a populated screen in a production-mode build).
 *  - VITE_INSPECTION_FINDINGS_MODE="empty" forces it off.
 *  - Otherwise: on for `npm run dev` (PROD is false), off for production
 *    builds -- so a real deploy NEVER shows fabricated termite/moisture/
 *    damage findings before an actual inspection has produced any.
 */
export function shouldUseMockFindings(): boolean {
  const override = (import.meta.env
    .VITE_INSPECTION_FINDINGS_MODE as string | undefined)?.toLowerCase()
  if (override === "mock") return true
  if (override === "empty") return false
  return !import.meta.env.PROD
}

// Fixed timestamp -- this is static mock data, not something generated per
// render/session, so there's no reason for createdAt/updatedAt to drift.
const MOCK_FINDING_TIMESTAMP = "2026-01-01T00:00:00.000Z"

/**
 * Dev/mock-only placeholder findings, shaped as real InspectionFinding
 * records (not a separate ad-hoc type) so InspectionNotesCard and
 * CustomerReportModal render identically whether the data is mock or real.
 * Never returned by shouldUseMockFindings() in a production build.
 */
export const MOCK_FINDINGS: InspectionFinding[] = [
  {
    id: "mock-finding-1",
    title: "Active termite activity",
    summary: "Evidence observed at south sill plate",
    category: "insectFindings",
    tag: "Priority",
    markerIds: [],
    photoIds: [],
    status: "pending_review",
    createdAt: MOCK_FINDING_TIMESTAMP,
    updatedAt: MOCK_FINDING_TIMESTAMP,
  },
  {
    id: "mock-finding-2",
    title: "Moisture intrusion",
    summary: "Elevated reading near utility room",
    category: "moistureFindings",
    tag: "Watch",
    markerIds: [],
    photoIds: [],
    status: "pending_review",
    createdAt: MOCK_FINDING_TIMESTAMP,
    updatedAt: MOCK_FINDING_TIMESTAMP,
  },
  {
    id: "mock-finding-3",
    title: "Damaged wood",
    summary: "Localized fascia deterioration",
    category: "structureFindings",
    tag: "Repair",
    markerIds: [],
    photoIds: [],
    status: "pending_review",
    createdAt: MOCK_FINDING_TIMESTAMP,
    updatedAt: MOCK_FINDING_TIMESTAMP,
  },
]

/** Real starting point for a new estimate's findings: empty unless mock mode is on. */
export function getInitialFindings(): InspectionFinding[] {
  return shouldUseMockFindings() ? MOCK_FINDINGS : []
}

// Pricebook services now come from SalesBrainPricebookService; no hardcoded solution or price map remains.
