export const PREFERRED_CONTACT_OPTIONS = ["Text", "Call", "Email"] as const

export const LEAD_TYPE_OPTIONS = ["New Customer", "Existing Customer"] as const

export const REFERRAL_SOURCE_OPTIONS = [
  "Customer Referral",
  "Web Lead",
  "Call-In",
  "Self-Solicit",
  "Existing Customer Add Service",
  "Other",
] as const

export const STRUCTURE_TYPE_OPTIONS = [
  "Home / Main Structure",
  "Detached Structure",
  "Duplex",
  "Apartment Building",
  "Apartment Unit",
  "Townhome",
  "Warehouse",
  "Restaurant",
  "Office Building",
  "Storage Units",
  "School",
  "Other",
] as const

export const CONSTRUCTION_OPTIONS = ["Brick Veneer", "Slab", "Basement", "Combination"] as const
export const OCCUPANCY_OPTIONS = ["Owner-Occupied", "Vacant", "Tenant-Occupied", "Other"] as const
export const CRAWLSPACE_ACCESS_OPTIONS = ["Not Accessible", "Low Crawlspace Height", "Optimal Crawlspace Height"] as const

export interface SalesBrainCustomerDetails {
  leadType: string
  company: string
  first: string
  last: string
  phone: string
  email: string
  preferredContact: string
  referralSource: string
  referralSourceOther: string
  locationName: string
  streetAddress: string
  city: string
  /** SalesBrain operates in North Carolina; this value is immutable in the UI and API. */
  state: "NC"
  zip: string
  /** Legacy display value retained while version-1 and version-2 quotes are normalized. */
  serviceAddress?: string
  accountNotes: string
}

export interface SalesBrainStructureDetails {
  id: string
  name: string
  structureType: string
  structureOther: string
  construction: string
  occupancy: string
  squareFootage: string
  perimeterLinearFeet: string
  wallHeightFeet: string
  access: string
  crawlspaceHeight: string
  acreage: string
  bedrooms: string
}

export interface SalesBrainMoistureReading {
  id: string
  location: string
  material: string
  value: number
  unit: string
  category: "OK" | "Elevated" | "High Risk"
  temperature?: number
  photoIds?: string[]
}

export interface SalesBrainMoistureDetails {
  conditions: Record<string, string>
  readings: SalesBrainMoistureReading[]
  growthObservation: string
}

export interface EstimatedProductUsage {
  id: string
  productId?: string
  productName: string
  sku: string
  plannedQuantity: number
  unit: string
  catalogCostCents: number
}

export interface EstimatedLaborUsage {
  id: string
  laborRoleId?: string
  role: string
  service: string
  hours: number
  loadedRateCents: number
}

export interface SalesBrainCostingDetails {
  productUsage: EstimatedProductUsage[]
  laborUsage: EstimatedLaborUsage[]
  equipmentTravelDisposalCents: number
  equipmentCents: number
  travelCents: number
  disposalCents: number
  overheadPercent: number
  contingencyPercent: number
  targetMarginPercent: number
  sellingPriceCents: number
}

export interface SalesBrainQuoteOption {
  id: string
  name: string
  description: string
  serviceIds: string[]
  oneTimePriceCents: number
  recurringPriceCents: number
  warranty: string
  highlights: string[]
  recommended: boolean
  kind?: "chocolate" | "vanilla" | "customer-specified"
  packageId?: string
}

export interface SalesBrainAcceptanceDetails {
  captured: boolean
  printedName: string
  signedAt: string
  acknowledgements: boolean[]
}

/**
 * Version 4 is the nine-stage SalesBrain workflow. `structure` remains optional
 * solely so saved version-1 records can be normalized without data loss.
 */
export interface SalesBrainWorkflowData {
  version: 1 | 2 | 3 | 4
  currentStep: number
  completedSteps: number[]
  customer: SalesBrainCustomerDetails
  structure?: Omit<SalesBrainStructureDetails, "id" | "name">
  structures: SalesBrainStructureDetails[]
  selectedStructureId: string
  moisture: SalesBrainMoistureDetails
  /** Customer visibility for Graph Notes, keyed by graph marker id. Defaults to true. */
  graphNoteVisibility: Record<string, boolean>
  estimatedProductUsage?: EstimatedProductUsage[]
  costing: SalesBrainCostingDetails
  quoteOptions: SalesBrainQuoteOption[]
  selectedQuoteOptionId?: string
  acceptance: SalesBrainAcceptanceDetails
}

export function createEmptyStructure(name = "Main Structure"): SalesBrainStructureDetails {
  return {
    id: crypto.randomUUID(),
    name,
    structureType: "",
    structureOther: "",
    construction: "",
    occupancy: "",
    squareFootage: "",
    perimeterLinearFeet: "",
    wallHeightFeet: "",
    access: "",
    crawlspaceHeight: "",
    acreage: "",
    bedrooms: "",
  }
}

export function createEmptySalesBrainWorkflowData(): SalesBrainWorkflowData {
  const structure = createEmptyStructure()
  return {
    version: 4,
    currentStep: 1,
    completedSteps: [],
    customer: {
      leadType: "New Customer",
      company: "",
      first: "",
      last: "",
      phone: "",
      email: "",
      preferredContact: "",
      referralSource: "",
      referralSourceOther: "",
      locationName: "",
      streetAddress: "",
      city: "",
      state: "NC",
      zip: "",
      serviceAddress: "",
      accountNotes: "",
    },
    structures: [structure],
    selectedStructureId: structure.id,
    moisture: { conditions: {}, readings: [], growthObservation: "" },
    graphNoteVisibility: {},
    costing: {
      productUsage: [],
      laborUsage: [],
      equipmentTravelDisposalCents: 0,
      equipmentCents: 0,
      travelCents: 0,
      disposalCents: 0,
      overheadPercent: 10,
      contingencyPercent: 5,
      targetMarginPercent: 50,
      sellingPriceCents: 0,
    },
    quoteOptions: [
      { id: "option-chocolate", name: "Chocolate", description: "Complete corrective recommendation", serviceIds: [], oneTimePriceCents: 0, recurringPriceCents: 0, warranty: "", highlights: [], recommended: true, kind: "chocolate" },
      { id: "option-vanilla", name: "Vanilla", description: "Practical short-term recommendation", serviceIds: [], oneTimePriceCents: 0, recurringPriceCents: 0, warranty: "", highlights: [], recommended: false, kind: "vanilla" },
    ],
    acceptance: {
      captured: false,
      printedName: "",
      signedAt: "",
      acknowledgements: [false, false, false],
    },
  }
}

function remapVersionThreeStep(step: number) {
  if (step <= 3) return Math.max(1, step)
  if (step <= 6) return 4
  return Math.min(9, step - 2)
}

/** Converts legacy records into the current nine-stage shape without losing quote data. */
export function normalizeSalesBrainWorkflowData(input?: Partial<SalesBrainWorkflowData> | null): SalesBrainWorkflowData {
  const empty = createEmptySalesBrainWorkflowData()
  if (!input) return empty
  const legacyStructure = input.structure
  const structures = Array.isArray(input.structures) && input.structures.length
    ? input.structures.map((item, index) => ({
      ...createEmptyStructure(index === 0 ? "Main Structure" : `Structure ${index + 1}`),
      ...item,
      id: item.id || crypto.randomUUID(),
      name: item.name || (index === 0 ? "Main Structure" : `Structure ${index + 1}`),
    }))
    : [{ ...empty.structures[0], ...(legacyStructure || {}) }]
  const legacyProducts = Array.isArray(input.estimatedProductUsage) ? input.estimatedProductUsage : []
  const suppliedOptions = Array.isArray(input.quoteOptions) ? input.quoteOptions.map((option, index) => ({
    ...option,
    kind: option.kind || (index === 0 ? "chocolate" as const : index === 1 ? "vanilla" as const : "customer-specified" as const),
    name: option.kind || index > 1 ? option.name : index === 0 ? "Chocolate" : "Vanilla",
  })) : []
  const chocolate = suppliedOptions.find((option) => option.kind === "chocolate") || empty.quoteOptions[0]
  const vanilla = suppliedOptions.find((option) => option.kind === "vanilla") || empty.quoteOptions[1]
  const customerSpecified = suppliedOptions.filter((option) => option.kind === "customer-specified")
  const currentStep = input.version === 3
    ? remapVersionThreeStep(input.currentStep || 1)
    : Math.min(9, Math.max(1, input.currentStep || 1))
  const completedSteps = Array.from(new Set(
    (Array.isArray(input.completedSteps) ? input.completedSteps : [])
      .filter((step) => input.version !== 3 || (step !== 4 && step !== 5))
      .map((step) => input.version === 3 ? remapVersionThreeStep(step) : Math.min(9, Math.max(1, step))),
  )).sort((a, b) => a - b)
  return {
    ...empty,
    ...input,
    version: 4,
    currentStep,
    completedSteps,
    customer: {
      ...empty.customer,
      ...(input.customer || {}),
      state: "NC",
      streetAddress: input.customer?.streetAddress || input.customer?.serviceAddress || "",
    },
    structures,
    selectedStructureId: structures.some((item) => item.id === input.selectedStructureId)
      ? input.selectedStructureId!
      : structures[0].id,
    moisture: {
      ...empty.moisture,
      ...(input.moisture || {}),
      conditions: { ...empty.moisture.conditions, ...(input.moisture?.conditions || {}) },
      readings: Array.isArray(input.moisture?.readings) ? input.moisture!.readings! : [],
    },
    graphNoteVisibility: { ...empty.graphNoteVisibility, ...(input.graphNoteVisibility || {}) },
    costing: {
      ...empty.costing,
      ...(input.costing || {}),
      productUsage: input.costing?.productUsage || legacyProducts.map((item) => ({ ...item, sku: item.sku || "" })),
      laborUsage: input.costing?.laborUsage || [],
    },
    quoteOptions: [chocolate, vanilla, ...customerSpecified],
    acceptance: { ...empty.acceptance, ...(input.acceptance || {}) },
  }
}

export function calculateCosting(costing: SalesBrainCostingDetails) {
  const materialsCents = costing.productUsage.reduce((sum, row) => sum + Math.round(row.plannedQuantity * row.catalogCostCents), 0)
  const laborCents = costing.laborUsage.reduce((sum, row) => sum + Math.round(row.hours * row.loadedRateCents), 0)
  const separatedOtherCosts = (costing.equipmentCents || 0) + (costing.travelCents || 0) + (costing.disposalCents || 0)
  const otherCostsCents = separatedOtherCosts || costing.equipmentTravelDisposalCents
  const subtotalCents = materialsCents + laborCents + otherCostsCents
  const overheadCents = Math.round(subtotalCents * costing.overheadPercent / 100)
  const contingencyCents = Math.round((subtotalCents + overheadCents) * costing.contingencyPercent / 100)
  const directCostCents = subtotalCents + overheadCents + contingencyCents
  const safeMargin = Math.min(95, Math.max(0, costing.targetMarginPercent))
  const recommendedMinimumCents = directCostCents === 0 ? 0 : Math.ceil(directCostCents / (1 - safeMargin / 100))
  const sellingPriceCents = Math.max(0, costing.sellingPriceCents)
  const grossProfitCents = sellingPriceCents - directCostCents
  const grossMarginPercent = sellingPriceCents > 0 ? grossProfitCents / sellingPriceCents * 100 : 0
  return { materialsCents, laborCents, otherCostsCents, overheadCents, contingencyCents, directCostCents, recommendedMinimumCents, sellingPriceCents, grossProfitCents, grossMarginPercent }
}
