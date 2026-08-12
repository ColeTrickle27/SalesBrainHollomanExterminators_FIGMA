/**
 * The five approved, visible workflow steps. Do not add or remove steps here
 * without updating the approved Sales Brain workflow -- see docs/SALES_BRAIN_ARCHITECTURE.md.
 */
export const WORKFLOW_STEPS = [
  "customer",
  "property",
  "inspectionFindings",
  "recommendedService",
  "reviewAndSend",
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number];

export const WORKFLOW_STEP_LABELS: Record<WorkflowStepId, string> = {
  customer: "Customer",
  property: "Property",
  inspectionFindings: "Inspection findings",
  recommendedService: "Recommended service",
  reviewAndSend: "Review & send",
};

export const WORKFLOW_STEP_DESCRIPTIONS: Record<WorkflowStepId, string> = {
  customer: "Bill-To and Location selected from Customer Files",
  property: "Address, square footage & construction",
  inspectionFindings: "Document concerns found during inspection",
  recommendedService: "Match treatment and material requirements",
  reviewAndSend: "Pricing, terms & homeowner report",
};
