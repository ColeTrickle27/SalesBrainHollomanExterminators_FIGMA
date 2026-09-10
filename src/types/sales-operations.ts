import type { SalesBrainEstimateListItem } from "../services/opsBrain/salesBrainEstimatesService"

export type LeadTemperature = "hot" | "warm" | "cold"
export type LeadStatus = "open" | "sold" | "lost" | "ex_dated"

export interface SalesLead {
  assignmentNotificationStatus?: "queued" | "sent" | "failed"
  assignedTo?: string | null
  assignedToName?: string
  source?: "manual" | "quote" | "hubspot_form"
  receivedAt?: string
  serviceRequested?: string
  serviceNeeded?: string
  id: string
  leadType: "New Customer" | "Existing Customer"
  customerName: string
  company: string
  first: string
  last: string
  locationName: string
  streetAddress: string
  city: string
  state: "NC"
  zip: string
  /** Legacy alias retained for records created before the split-name migration. */
  companyName: string
  phone: string
  email: string
  preferredContact: string
  referralSource: string
  referralSourceOther: string
  temperature: LeadTemperature
  status: LeadStatus
  notes: string
  billToNumber?: string
  locationNumber?: string
  customerType?: "" | "Residential" | "Commercial"
  contactName?: string
  contactPhone?: string
  serviceIds?: string[]
  nextTouchPoint?: "" | "Contact" | "Inspect" | "Send Quote" | "Follow-Up" | "X-Date"
  statusNote?: string
  nextTouchNote?: string
  exDate?: string
  exDateNote?: string
  lastUpdateNote?: string
  lastUpdateAt?: string
  nextFollowUpAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  lastInteractionAt?: string
}

export type LeadInput = Omit<SalesLead, "id" | "createdBy" | "createdAt" | "updatedAt" | "lastInteractionAt" | "lastUpdateAt" | "lastUpdateNote" | "assignedToName" | "source" | "receivedAt" | "assignmentNotificationStatus">

export interface LeadActivity {
  createdByName?: string
  id: string
  leadId: string
  type: string
  note: string
  happenedAt: string
  quoteId?: string
  createdBy: string
  createdAt: string
}

export interface SalesDashboardData {
  leads: SalesLead[]
  drafts: SalesBrainEstimateListItem[]
  pending: SalesBrainEstimateListItem[]
  metrics: {
    acceptedCount: number
    acceptedRevenueCents: number
    closeRatePercent: number | null
    averageMarginPercent: number | null
  }
}

export interface SalesProduct {
  id: string
  name: string
  sku: string
  unit: string
  unitCostCents: number
  packageContentQuantity?: number | null
  packageContentUnit?: string | null
  costAvailable?: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export type SalesProductInput = Pick<SalesProduct, "name" | "sku" | "unit" | "unitCostCents">

export interface SalesLaborRole {
  id: string
  name: string
  loadedRateCents: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type SalesLaborRoleInput = Pick<SalesLaborRole, "name" | "loadedRateCents">

export interface SalesCostingSettings {
  equipmentTravelDisposalCents: number
  overheadPercent: number
  contingencyPercent: number
  targetMarginPercent: number
  updatedAt?: string
  updatedBy?: string
}

export interface SalesServicePackage {
  id: string
  name: string
  description: string
  serviceIds: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export type SalesServicePackageInput = Pick<SalesServicePackage, "name" | "description" | "serviceIds">

export interface LeadAssignee { username: string; displayName: string; email: string }

export interface SalesEmployeeProfile {
  username: string
  displayName: string
  email: string
  active: boolean
  gmailEnabled: boolean
  updatedAt?: string
  updatedBy?: string
}

export interface SalesBrainMigrationCounts {
  imported: number
  skipped: number
  d1Count: number
}

export interface SalesBrainMigrationResult {
  estimates: SalesBrainMigrationCounts
  pricebookServices: SalesBrainMigrationCounts
  sourceObjectsDeleted: 0
}

export type SalesDocumentType = "inspection-report" | "quote-options" | "bundle" | "agreement"

export interface SalesGeneratedDocument {
  id: string
  quoteId: string
  type: SalesDocumentType
  r2Key: string
  filename: string
  createdBy: string
  createdAt: string
}

export interface SalesDeliveryEvent {
  id: string
  quoteId: string
  documentType: Exclude<SalesDocumentType, "agreement">
  provider: "gmail"
  status: "pending" | "sent" | "failed"
  recipient: string
  cc: string[]
  bcc: string[]
  subject: string
  message?: string
  providerMessageId?: string
  error?: string
  createdAt: string
  completedAt?: string
}

export interface SalesDeliveryInput {
  documentType: Exclude<SalesDocumentType, "agreement">
  documentIds: string[]
  to: string
  cc: string[]
  bcc: string[]
  subject: string
  message: string
  idempotencyKey: string
}

export interface SalesSignatureRequest {
  deliveryMode?: "email" | "in_person"
  id: string
  quoteId: string
  provider: "boldsign" | "signwell"
  signatureEnvelopeId?: string
  providerDocumentId?: string
  status: "pending" | "sent" | "viewed" | "signed" | "completed" | "declined" | "expired" | "send_failed" | "revoked"
  customerEmail: string
  selectedOptionId: string
  signedAgreementUrl?: string
  auditTrailUrl?: string
  createdAt: string
  updatedAt: string
}

export interface PestPacHandoff {
  quoteId: string
  status: "pending" | "completed"
  billToNumber: string
  locationNumber: string
  pestPacReferenceNumber: string
  selectedOptionName: string
  agreementDate: string
  signatureDate: string
  boldSignDocumentId: string
  signatureEnvelopeId?: string
  signatureProvider?: "boldsign" | "signwell"
  signedAgreementR2Key: string
  auditTrailR2Key: string
  checklist: {
    customerLocationMatches: boolean
    serviceScopeMatches: boolean
    pricingMatches: boolean
    signedAgreementRecorded: boolean
  }
  completedBy?: string
  completedAt?: string
}

export const LEAD_ACTIVITY_TYPES = [
  "Comment",
  "Called",
  "Left Voicemail",
  "Texted",
  "Emailed",
  "Incoming Contact",
  "Inspection Scheduled",
  "Inspection Rescheduled",
  "Inspection Completed",
  "Quote Sent",
  "Quote Follow-Up",
  "Customer Requested Changes",
  "Other",
] as const

export interface LeadIntakeIssue { messageId: string; reason: string; receivedAt: string; status: "review" | "excluded" }
