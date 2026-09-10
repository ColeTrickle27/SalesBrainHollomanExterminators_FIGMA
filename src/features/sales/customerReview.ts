import type { SalesInspection } from "../../types/sales-inspection"
import { normalizeSalesBrainWorkflowData } from "../../types/figma-workflow.ts"

export function customerReviewContent(inspection: Pick<SalesInspection, "findings" | "photos">) {
  return {
    findings: inspection.findings.filter((item) => !item.hidden && item.customerVisible !== false),
    photos: inspection.photos.filter((item) => item.customerVisible !== false && item.uploadStatus !== "error"),
  }
}

export function customerDecisionInspection(inspection: SalesInspection, status: "accepted" | "pending" | "declined", note: string, decidedAt: string): SalesInspection {
  if (inspection.status === "accepted" || ["signed", "completed"].includes(inspection.signatureStatus || "")) throw new Error("This agreement is already signed. Create a new quote for changes.")
  return { ...inspection, status: status === "pending" ? "sent" : status === "declined" ? "declined" : inspection.status,
    workflowData: { ...normalizeSalesBrainWorkflowData(inspection.workflowData), customerDecision: { status, note: note.trim().slice(0, 2000), decidedAt } } }
}

export function additionalQuoteInspection(saved: SalesInspection, fresh: SalesInspection): SalesInspection {
  const workflow = normalizeSalesBrainWorkflowData(saved.workflowData)
  return { ...fresh, billTo: saved.billTo, location: saved.location, customerLocationId: saved.customerLocationId, leadId: saved.leadId,
    property: saved.property, markers: saved.markers, findings: saved.findings, photos: saved.photos,
    excludedGraphPhotoIds: saved.excludedGraphPhotoIds, dismissedGraphFindingIds: saved.dismissedGraphFindingIds, hiddenFindingIds: saved.hiddenFindingIds,
    workflowData: { ...workflow, workspaceMode: "modern", customerGraphImage: undefined, reportPhotoImages: undefined, quoteOptions: [], selectedQuoteOptionId: "", customerDecision: undefined, acceptance: { captured: false, printedName: "", signedAt: "", acknowledgements: [] } },
  }
}

export function customerSaveIssue(inspection: Pick<SalesInspection, "photos" | "quoteEngineInput" | "quoteEngineSnapshot">): string | null {
  if (inspection.photos.some((photo) => photo.uploadStatus === "uploading" || photo.uploadStatus === "error")) return "Wait for photo uploads to finish or retry failed photos before saving. Your work is still here."
  const input = inspection.quoteEngineInput
  if (inspection.quoteEngineSnapshot && input && !input.services.length && !input.customLineItems.length) return "This saved quote has no remaining lines. Add a service or create a new quote before continuing; the previous saved quote is unchanged."
  return null
}
