export interface SalesBrainCustomerDetails {
  phone: string
  email: string
  preferredContact: string
  referralSource: string
  serviceAddress: string
  accountNotes: string
}

export interface SalesBrainStructureDetails {
  structureType: string
  structureOther: string
  construction: string
  occupancy: string
  squareFootage: string
  perimeterLinearFeet: string
  wallHeightFeet: string
  access: string
}

export interface SalesBrainMoistureReading {
  id: string
  location: string
  material: string
  value: number
  unit: string
  category: "OK" | "Elevated" | "High Risk"
  temperature?: number
}

export interface SalesBrainMoistureDetails {
  conditions: Record<string, string>
  readings: SalesBrainMoistureReading[]
  growthObservation: string
}

export interface EstimatedProductUsage {
  id: string
  productName: string
  plannedQuantity: number
  unit: string
  catalogCostCents: number
}

export interface SalesBrainAcceptanceDetails {
  captured: boolean
  printedName: string
  signedAt: string
  acknowledgements: boolean[]
}

/**
 * Fields introduced by the redesigned nine-stage Figma workflow. They live
 * on the same saved SalesInspection record as the legacy integration data,
 * so the redesign does not create a second persistence model.
 */
export interface SalesBrainWorkflowData {
  version: 1
  currentStep: number
  completedSteps: number[]
  customer: SalesBrainCustomerDetails
  structure: SalesBrainStructureDetails
  moisture: SalesBrainMoistureDetails
  estimatedProductUsage: EstimatedProductUsage[]
  acceptance: SalesBrainAcceptanceDetails
}

export function createEmptySalesBrainWorkflowData(): SalesBrainWorkflowData {
  return {
    version: 1,
    currentStep: 1,
    completedSteps: [],
    customer: {
      phone: "",
      email: "",
      preferredContact: "",
      referralSource: "",
      serviceAddress: "",
      accountNotes: "",
    },
    structure: {
      structureType: "",
      structureOther: "",
      construction: "",
      occupancy: "",
      squareFootage: "",
      perimeterLinearFeet: "",
      wallHeightFeet: "",
      access: "",
    },
    moisture: {
      conditions: {},
      readings: [],
      growthObservation: "",
    },
    estimatedProductUsage: [],
    acceptance: {
      captured: false,
      printedName: "",
      signedAt: "",
      acknowledgements: [false, false, false],
    },
  }
}
