import type { SalesBrainEstimateListItem } from "../services/opsBrain/salesBrainEstimatesService"

export type LeadTemperature = "hot" | "warm" | "cold"
export type LeadStatus = "open" | "sold" | "lost"

export interface SalesLead {
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
  nextFollowUpAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  lastInteractionAt?: string
}

export type LeadInput = Omit<SalesLead, "id" | "createdBy" | "createdAt" | "updatedAt" | "lastInteractionAt">

export interface LeadActivity {
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
  id: string
  quoteId: string
  provider: "boldsign"
  providerDocumentId?: string
  status: "pending" | "sent" | "viewed" | "signed" | "completed" | "declined" | "expired" | "send_failed" | "revoked"
  customerEmail: string
  selectedOptionId: string
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
