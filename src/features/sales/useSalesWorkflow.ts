/**
 * Centralized workflow state for the Sales Brain UI shell.
 *
 * SalesInspection is the single live estimate record. UI-only state (open
 * dialogs, navigation, and current-user loading) stays separate, but every
 * workflow edit is reconciled into that one record before the UI derives its
 * completion state. This supports the nine-stage inspection-to-PestPac
 * workflow while keeping one record at the Ops Brain persistence boundary.
 */

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import type { CustomerSearchResult } from "../../types/customer"

import type { InspectionFinding } from "../../types/findings"

import type { PropertyInspection } from "../../types/property"

import type { SalesInspection } from "../../types/sales-inspection"
import {
  createEmptyQuoteEngineInput,
  customerPricingSnapshotFromQuoteEngine,
  hasQuoteEngineQuoteContext,
  initializeQuoteEngineInputFromRecommendation,
  quoteEngineEditableStateFromSavedSnapshot,
  quoteEngineInputForSave,
  quoteEngineInputHasLines,
  type QuoteEngineInput,
  type QuoteEngineSnapshot,
} from "../../types/quote-engine"
import type {
  PricebookService,
  PricebookServiceInput,
} from "../../types/pricebook"

import type { OpsBrainUser } from "../../types/user"

import {
  calculateCosting,
  createEmptySalesBrainWorkflowData,
  normalizeSalesBrainWorkflowData,
  type SalesBrainWorkflowData,
} from "../../types/figma-workflow"

import type {
  LeadActivity,
  LeadInput,
  SalesCostingSettings,
  SalesDashboardData,
  SalesLaborRole,
  SalesLaborRoleInput,
  SalesProduct,
  SalesProductInput,
  PestPacHandoff,
  SalesDeliveryEvent,
  SalesDeliveryInput,
  SalesDocumentType,
  SalesEmployeeProfile,
  SalesGeneratedDocument,
  SalesLead,
  SalesServicePackage,
  SalesServicePackageInput,
  SalesSignatureRequest,
} from "../../types/sales-operations"
import { quoteInspectionWithUpdatedLead } from "./quoteWorkspace"

interface PendingPhotoFile {
  file: File
  previewUrl: string
}

import { createBugManIntelligenceService } from "../../services/bugmanIntelligence"

import {
  createBugManGraphsService,
  INSPECTION_FINDING_CATALOG,
  inspectionMarkersToFindings,
  type BugManGraphListItem,
  type BugManGraphsService,
} from "../../services/bugmanGraphs"

import {
  createCurrentUserService,
  createQuoteEngineService,
  createSalesBrainEstimatesService,
  createSalesBrainOperationsService,
  createSalesBrainPricebookService,
  type SalesBrainEstimateListItem,
  type SalesBrainEstimatesService,
  type SalesBrainOperationsService,
  type SalesBrainPricebookService,
  type QuoteEngineService,
} from "../../services/opsBrain"
import {
  WORKFLOW_STEP_LABELS,
  WORKFLOW_STEPS,
  type WorkflowStepId,
} from "../../types/workflow"

import { getInitialFindings, shouldUseMockFindings } from "./mockData"

export const VISIT_STEPS = WORKFLOW_STEPS.map((id) => WORKFLOW_STEP_LABELS[id])

const LAST_OPEN_ESTIMATE_ID_KEY = "bugman-sales-brain:last-open-estimate-id"

function readLastOpenEstimateId() {
  try {
    return window.localStorage.getItem(LAST_OPEN_ESTIMATE_ID_KEY)
  } catch {
    return null
  }
}

function writeLastOpenEstimateId(id: string) {
  try {
    window.localStorage.setItem(LAST_OPEN_ESTIMATE_ID_KEY, id)
  } catch {
    // Local storage is a convenience pointer only. The saved record stays in
    // Ops Brain/R2 and a blocked storage write must never interrupt the visit.
  }
}

function clearLastOpenEstimateId() {
  try {
    window.localStorage.removeItem(LAST_OPEN_ESTIMATE_ID_KEY)
  } catch {
    // See writeLastOpenEstimateId: this is intentionally non-blocking.
  }
}

function createEstimateId() {
  return crypto.randomUUID().replace(/[^A-Za-z0-9_-]/g, "")
}

function pricingSnapshotFor(service: PricebookService, quotedAt: string) {
  return {
    currency: "USD" as const,

    totalCents: service.price,

    lineItems: [
      { id: service.id, label: service.name, amountCents: service.price },
    ],

    quotedAt,
  }
}

function recommendationFor(
  service: PricebookService,

  findings: InspectionFinding[],

  quotedAt: string,

  approved = false,

  approvedBy?: string,
) {
  return {
    id: service.id,

    name: service.name,

    description: service.description,

    findingIds: findings.map((finding) => finding.id),

    lineItems: [
      { id: service.id, label: service.name, amountCents: service.price },
    ],

    totalCents: service.price,

    status: approved ? "approved" as const : "suggested" as const,

    suggestedByIntelligence: false,

    ...(approved ? { approvedBy, approvedAt: quotedAt } : {}),
  }
}

function completedStepsFor(inspection: SalesInspection): WorkflowStepId[] {
  const completed = new Set<WorkflowStepId>()

  if (inspection.billTo && inspection.location) completed.add("customer")

  if (inspection.property?.hasGraph) completed.add("property")

  if (inspection.findings.length > 0) completed.add("inspectionFindings")

  const selectedRecommendation = inspection.recommendations.find(
    (item) => item.id === inspection.selectedRecommendationId,
  )

  if (selectedRecommendation?.status === "approved")
    completed.add("recommendedService")

  if (inspection.reportBuiltAt) completed.add("reviewAndSend")

  return WORKFLOW_STEPS.filter((step) => completed.has(step))
}

function reconcileInspection(inspection: SalesInspection): SalesInspection {
  const completedSteps = completedStepsFor(inspection)

  // Completion is derived, while activeStep is deliberately user-controlled.

  // A technician may revisit completed steps or work on a later optional step.

  const activeStep = WORKFLOW_STEPS.includes(inspection.activeStep)
    ? inspection.activeStep
    : WORKFLOW_STEPS[0]

  return { ...inspection, activeStep, completedSteps }
}

function normalizeInspection(inspection: SalesInspection): SalesInspection {
  return reconcileInspection({
    ...inspection,
    workflowData: normalizeSalesBrainWorkflowData(inspection.workflowData),
  })
}

/** A clean, legitimate draft record. The id/number are stable for the draft so
 * the eventual Save action can create once and subsequently overwrite the
 * same persisted record without duplicates. */

function createEmptySalesInspection(createdBy = "unassigned"): SalesInspection {
  const now = new Date().toISOString()

  const id = createEstimateId()

  const findings = getInitialFindings()

  return reconcileInspection({
    id,
    estimateNumber: `DRAFT-${id.slice(0, 8).toUpperCase()}`,

    markers: [],

    findings,

    photos: [],

    recommendations: [],
    quoteEngineInput: createEmptyQuoteEngineInput({
      quoteId: id,
      preparedBy: createdBy,
    }),
    workflowData: createEmptySalesBrainWorkflowData(),

    activeStep: "customer",

    completedSteps: [],

    status: "draft",

    createdBy,

    createdAt: now,

    updatedAt: now,
  })
}

function quoteEngineContextFor(
  inspection: SalesInspection,
  currentUser: OpsBrainUser | null,
) {
  return {
    quoteId: inspection.id,
    leadId: inspection.leadId,
    billToNumber: inspection.billTo?.billToNumber,
    locationNumber: inspection.location?.locationNumber,
    preparedBy: currentUser?.name || inspection.createdBy,
  }
}

function quoteEngineInputWithCurrentContext(
  input: QuoteEngineInput,
  inspection: SalesInspection,
  currentUser: OpsBrainUser | null,
): QuoteEngineInput {
  return { ...input, ...quoteEngineContextFor(inspection, currentUser) }
}

function selectedCustomerFor(
  inspection: SalesInspection,
): CustomerSearchResult | null {
  return inspection.billTo && inspection.location
    ? { billTo: inspection.billTo, location: inspection.location }
    : null
}

function propertyFor(
  inspection: SalesInspection,

  graphKey?: string,
): PropertyInspection | undefined {
  if (!inspection.billTo || !inspection.location) return inspection.property

  const now = new Date().toISOString()

  return {
    graphKey: graphKey ?? inspection.property?.graphKey,

    location: {
      billToNumber: inspection.billTo.billToNumber,

      billToCode: inspection.billTo.billToNumber,

      locationId: inspection.location.locationNumber,

      locationCode: inspection.location.locationNumber,
    },

    // BugMan Graphs does not currently expose a structure summary through its

    // saved event. Preserve an existing real summary if one arrives later;

    // otherwise keep this required reference field intentionally blank.

    structure: inspection.property?.structure ?? { structureType: "" },

    hasGraph: true,

    lastSyncedAt: now,
  }
}

export function graphFindingsFor(
  graphKey: string,

  markers: SalesInspection["markers"],
): InspectionFinding[] {
  return inspectionMarkersToFindings(graphKey, markers)
}

export function useSalesWorkflow() {
  const [activeNavItem, setActiveNavItem] = useState("Estimate builder")

  const [inspection, setInspection] = useState<SalesInspection>(() =>
    createEmptySalesInspection(),
  )

  const estimatesServiceRef = useRef<SalesBrainEstimatesService | null>(null)

  const pricebookServiceRef = useRef<SalesBrainPricebookService | null>(null)
  const quoteEngineServiceRef = useRef<QuoteEngineService | null>(null)
  const operationsServiceRef = useRef<SalesBrainOperationsService | null>(null)

  const graphServiceRef = useRef<BugManGraphsService | null>(null)

  if (!estimatesServiceRef.current) {
    estimatesServiceRef.current = createSalesBrainEstimatesService()
  }

  if (!pricebookServiceRef.current) {
    pricebookServiceRef.current = createSalesBrainPricebookService()
  }
  if (!quoteEngineServiceRef.current) {
    quoteEngineServiceRef.current = createQuoteEngineService()
  }
  if (!operationsServiceRef.current) {
    operationsServiceRef.current = createSalesBrainOperationsService()
  }

  if (!graphServiceRef.current)
    graphServiceRef.current = createBugManGraphsService()

  const saveInFlightRef = useRef(false)
  const quoteEngineRequestIdRef = useRef(0)
  const [showReport, setShowReport] = useState(false)

  const [bugmanGraphsOpen, setBugmanGraphsOpen] = useState(false)

  const [bugmanGraphChoiceOpen, setBugmanGraphChoiceOpen] = useState(false)

  const [bugmanGraphPickerOpen, setBugmanGraphPickerOpen] = useState(false)

  const [workspaceGraphKey, setWorkspaceGraphKey] = useState<string | null>(
    null,
  )

  const [propertyGraphs, setPropertyGraphs] = useState<BugManGraphListItem[]>(
    [],
  )

  const [propertyGraphsLoading, setPropertyGraphsLoading] = useState(false)

  const [propertyGraphsError, setPropertyGraphsError] = useState<string | null>(
    null,
  )

  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)

  const [openEstimatePickerOpen, setOpenEstimatePickerOpen] = useState(false)

  const [estimates, setEstimates] = useState<SalesBrainEstimateListItem[]>([])

  const [estimatesLoading, setEstimatesLoading] = useState(false)

  const [estimatesError, setEstimatesError] = useState<string | null>(null)

  const [dashboardData, setDashboardData] = useState<SalesDashboardData | null>(
    null,
  )

  const [operationsLoading, setOperationsLoading] = useState(false)

  const [operationsError, setOperationsError] = useState<string | null>(null)

  const [leadActivities, setLeadActivities] =
    useState<Record<string, LeadActivity[]>>({})

  const [products, setProducts] = useState<SalesProduct[]>([])

  const [laborRoles, setLaborRoles] = useState<SalesLaborRole[]>([])

  const [servicePackages, setServicePackages] = useState<SalesServicePackage[]>(
    [],
  )

  const [employeeProfile, setEmployeeProfile] =
    useState<SalesEmployeeProfile | null>(null)

  const [employeeProfiles, setEmployeeProfiles] =
    useState<SalesEmployeeProfile[]>([])

  const [generatedDocuments, setGeneratedDocuments] =
    useState<SalesGeneratedDocument[]>([])

  const [deliveries, setDeliveries] = useState<SalesDeliveryEvent[]>([])

  const [signatureRequest, setSignatureRequest] =
    useState<SalesSignatureRequest | null>(null)

  const [pestPacHandoff, setPestPacHandoff] = useState<PestPacHandoff | null>(
    null,
  )

  const [providerActionLoading, setProviderActionLoading] = useState(false)

  const [costingSettings, setCostingSettings] = useState<SalesCostingSettings>({
    equipmentTravelDisposalCents: 0,

    overheadPercent: 10,

    contingencyPercent: 5,

    targetMarginPercent: 50,
  })

  const [persistedInspections, setPersistedInspections] =
    useState<SalesInspection[]>([])

  const [persistedInspectionsLoading, setPersistedInspectionsLoading] =
    useState(false)

  const [persistedInspectionsError, setPersistedInspectionsError] =
    useState<string | null>(null)

  const [openingEstimateId, setOpeningEstimateId] = useState<string | null>(
    null,
  )

  const [isSaving, setIsSaving] = useState(false)

  const [savedAt, setSavedAt] = useState<string | null>(null)

  const [saveError, setSaveError] = useState<string | null>(null)
  const [quoteEngineCalculation, setQuoteEngineCalculation] =
    useState<QuoteEngineSnapshot | null>(null)
  const [quoteEngineCalculating, setQuoteEngineCalculating] = useState(false)
  const [quoteEngineCalculationError, setQuoteEngineCalculationError] =
    useState<string | null>(null)
  const [quoteEngineCalculationRevision, setQuoteEngineCalculationRevision] =
    useState(0)
  const [quoteEngineInputDirty, setQuoteEngineInputDirty] = useState(false)
  const [restoringEstimate, setRestoringEstimate] = useState(() =>
    Boolean(readLastOpenEstimateId()),
  )

  const [pricebookServices, setPricebookServices] =
    useState<PricebookService[]>([])

  const [pricebookLoading, setPricebookLoading] = useState(false)

  const [pricebookError, setPricebookError] = useState<string | null>(null)

  const [pricebookSaving, setPricebookSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const pendingPhotoFilesRef = useRef(new Map<string, PendingPhotoFile>())

  // Who is signed in is app-level context, not estimate data. It supplies the

  // creator of a new draft once Ops Brain returns the active user.

  const [currentUser, setCurrentUser] = useState<OpsBrainUser | null>(null)

  const [currentUserLoading, setCurrentUserLoading] = useState(true)

  const updateInspection = useCallback(
    (updater: (current: SalesInspection) => SalesInspection) => {
      setSavedAt(null)

      setSaveError(null)

      setInspection((current) =>
        reconcileInspection({
          ...updater(current),

          updatedAt: new Date().toISOString(),
        }),
      )
    },

    [],
  )

  const refreshPricebook = useCallback(async () => {
    setPricebookLoading(true)

    setPricebookError(null)

    try {
      setPricebookServices(await pricebookServiceRef.current!.listServices())
    } catch (error) {
      setPricebookError(
        error instanceof Error
          ? error.message
          : "Could not load the Pricebook. Try again.",
      )
    } finally {
      setPricebookLoading(false)
    }
  }, [])

  const refreshOperations = useCallback(async () => {
    setOperationsLoading(true)

    setOperationsError(null)

    try {
      const [
        dashboard,
        allLeads,
        productRows,
        laborRows,
        settings,
        packageRows,
        employee,
      ] = await Promise.all([
        operationsServiceRef.current!.loadDashboard(),

        operationsServiceRef.current!.listLeads(),

        operationsServiceRef.current!.listProducts(),

        operationsServiceRef.current!.listLaborRoles(),

        operationsServiceRef.current!.getCostingSettings(),

        operationsServiceRef.current!.listServicePackages(),

        operationsServiceRef.current!.getMyEmployeeProfile(),
      ])

      setDashboardData({ ...dashboard, leads: allLeads })

      setProducts(productRows)

      setLaborRoles(laborRows)

      setCostingSettings(settings)

      setServicePackages(packageRows)

      setEmployeeProfile(employee)
    } catch (error) {
      setOperationsError(
        error instanceof Error
          ? error.message
          : "Could not load Sales Brain operating data.",
      )
    } finally {
      setOperationsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshPricebook()

    void refreshOperations()
  }, [refreshOperations, refreshPricebook])

  useEffect(() => {
    let cancelled = false

    const service = createCurrentUserService()

    setCurrentUserLoading(true)

    service

      .getCurrentUser()

      .then((user) => {
        if (cancelled) return

        setCurrentUser(user)

        if (user) {
          setInspection((current) =>
            current.createdBy === "unassigned"
              ? {
                  ...current,
                  createdBy: user.username,
                  quoteEngineInput: current.quoteEngineInput
                    ? quoteEngineInputWithCurrentContext(
                        current.quoteEngineInput,
                        { ...current, createdBy: user.username },
                        user,
                      )
                    : undefined,
                }
              : current.quoteEngineInput
                ? {
                    ...current,
                    quoteEngineInput: quoteEngineInputWithCurrentContext(
                      current.quoteEngineInput,
                      current,
                      user,
                    ),
                  }
                : current,
          )
        }
      })

      .catch(() => {
        if (!cancelled) setCurrentUser(null)
      })

      .finally(() => {
        if (!cancelled) setCurrentUserLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // R2/Ops Brain remains the source of truth. The browser retains only a

  // pointer to the last active record, then asks the estimates service for the

  // complete inspection on each app load.

  useEffect(() => {
    const lastOpenEstimateId = readLastOpenEstimateId()

    if (!lastOpenEstimateId) return

    let cancelled = false

    setRestoringEstimate(true)

    estimatesServiceRef

      .current!.getEstimate(lastOpenEstimateId)

      .then((savedInspection) => {
        if (cancelled) return

        if (savedInspection) {
          const savedEditableState = quoteEngineEditableStateFromSavedSnapshot(
            savedInspection.quoteEngineSnapshot,
            savedInspection.quoteEngineInput,
          )
          setInspection(
            normalizeInspection({
              ...savedInspection,
              quoteEngineInput: savedEditableState.input,
            }),
          )
          setQuoteEngineCalculation(savedInspection.quoteEngineSnapshot ?? null)
          setQuoteEngineInputDirty(savedEditableState.dirty)

          setSavedAt(savedInspection.updatedAt)

          setSaveError(null)

          return
        }

        clearLastOpenEstimateId()
      })

      .catch(() => {
        // A missing or unreachable record should never prevent the technician

        // from beginning a clean estimate. Keep the initial draft in place.

        if (!cancelled) clearLastOpenEstimateId()
      })

      .finally(() => {
        if (!cancelled) setRestoringEstimate(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const completedSteps = useMemo(
    () => new Set<WorkflowStepId>(inspection.completedSteps),

    [inspection.completedSteps],
  )

  const currentStepIndex = useMemo(() => {
    const current = WORKFLOW_STEPS.indexOf(inspection.activeStep)

    return current === -1 ? 0 : current
  }, [inspection.activeStep])

  const selectedCustomer = useMemo(
    () => selectedCustomerFor(inspection),

    [inspection],
  )

  const selectedRecommendation = useMemo(
    () =>
      inspection.recommendations.find(
        (item) => item.id === inspection.selectedRecommendationId,
      ),

    [inspection.recommendations, inspection.selectedRecommendationId],
  )

  const solution =
    selectedRecommendation?.name ??
    inspection.pricingSnapshot?.lineItems[0]?.label ??
    null

  const totalCents =
    inspection.pricingSnapshot?.totalCents ??
    selectedRecommendation?.totalCents ??
    0

  const total = totalCents / 100

  const selectedPricebookServiceId =
    inspection.pricingSnapshot?.lineItems[0]?.id ?? null

  const propertyGraphSaved = Boolean(inspection.property?.hasGraph)

  const propertyGraphKey = inspection.property?.graphKey ?? null

  const photos = useMemo(
    () => inspection.photos.map((photo) => photo.url),

    [inspection.photos],
  )

  const goToStep = (step: WorkflowStepId) => {
    updateInspection((current) => ({ ...current, activeStep: step }))
  }

  const stepSummaries = useMemo<Partial<Record<WorkflowStepId, string>>>(() => {
    const summaries: Partial<Record<WorkflowStepId, string>> = {}

    if (selectedCustomer) {
      summaries.customer = [
        selectedCustomer.billTo.billToName,

        selectedCustomer.location.locationAddress,
      ]

        .filter(Boolean)

        .join(" · ")
    }

    if (propertyGraphSaved) {
      summaries.property = propertyGraphKey
        ? `Property graph saved (${propertyGraphKey})`
        : "Property graph saved"
    }

    if (inspection.findings.length > 0) {
      summaries.inspectionFindings = `${inspection.findings.length} finding${
        inspection.findings.length === 1 ? "" : "s"
      } recorded`
    }

    if (selectedRecommendation?.status === "approved") {
      summaries.recommendedService = `${solution} confirmed`
    }

    if (inspection.reportBuiltAt) {
      summaries.reviewAndSend = `Report built · $${total.toLocaleString()}`
    }

    return summaries
  }, [
    inspection.findings.length,

    inspection.reportBuiltAt,

    propertyGraphKey,

    propertyGraphSaved,

    selectedCustomer,

    selectedRecommendation?.status,

    solution,

    total,
  ])

  const saveEstimate = async () => {
    if (saveInFlightRef.current) return

    if (!hasQuoteEngineQuoteContext(quoteEngineContextFor(inspection, currentUser))) {
      setSaveError(
        "Select an existing customer or start a SalesBrain lead quote before saving.",
      )
      return
    }

    if (
      inspection.quoteEngineInput &&
      !quoteEngineInputHasLines(inspection.quoteEngineInput)
    ) {
      setSaveError("Add a service or custom item before saving this quote.")
      return
    }

    saveInFlightRef.current = true

    setIsSaving(true)
    setSaveError(null)
    try {
      const currentInput = inspection.quoteEngineInput
      const quoteInputForSave = quoteEngineInputForSave(
        {
          input: currentInput,
          dirty: quoteEngineInputDirty,
        },
        { snapshotBacked: Boolean(inspection.quoteEngineSnapshot) },
      )
      const estimateForSave = normalizeInspection({
        ...inspection,
        quoteEngineInput: quoteInputForSave
          ? quoteEngineInputWithCurrentContext(
              quoteInputForSave,
              inspection,
              currentUser,
            )
          : undefined,
      })
      const savedInspection =
        await estimatesServiceRef.current!.saveEstimate(estimateForSave)
      const savedEditableState = quoteEngineEditableStateFromSavedSnapshot(
        savedInspection.quoteEngineSnapshot,
        savedInspection.quoteEngineInput ?? currentInput,
      )
      setInspection(
        normalizeInspection({
          ...savedInspection,
          quoteEngineInput: savedEditableState.input,
        }),
      )
      setQuoteEngineCalculation(savedInspection.quoteEngineSnapshot ?? null)
      setQuoteEngineInputDirty(savedEditableState.dirty)
      writeLastOpenEstimateId(savedInspection.id)

      setSavedAt(savedInspection.updatedAt)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save this estimate. Your work is still here; try again.",
      )
    } finally {
      saveInFlightRef.current = false

      setIsSaving(false)
    }
  }

  const loadEstimates = async () => {
    setEstimatesLoading(true)

    setEstimatesError(null)

    try {
      const savedEstimates = await estimatesServiceRef.current!.listEstimates()

      setEstimates(savedEstimates)
    } catch (error) {
      setEstimatesError(
        error instanceof Error
          ? error.message
          : "Could not load saved estimates. Try again.",
      )
    } finally {
      setEstimatesLoading(false)
    }
  }

  const deleteEstimate = async (id: string) => {
    setEstimatesError(null)

    try {
      await estimatesServiceRef.current!.deleteEstimate(id)

      setEstimates((current) => current.filter((item) => item.id !== id))

      setPersistedInspections((current) =>
        current.filter((item) => item.id !== id),
      )

      setDashboardData((current) =>
        current
          ? {
              ...current,

              drafts: current.drafts.filter((item) => item.id !== id),

              pending: current.pending.filter((item) => item.id !== id),
            }
          : current,
      )

      if (inspection.id === id) {
        setInspection(
          createEmptySalesInspection(currentUser?.username ?? "unassigned"),
        )

        clearLastOpenEstimateId()
      }
    } catch (error) {
      setEstimatesError(
        error instanceof Error
          ? error.message
          : "Could not delete that open quote.",
      )

      throw error
    }
  }

  /**
   * Management views need only one existing API capability beyond summaries:
   * fetch the full persisted estimate record. This deliberately composes the
   * Phase 1 listEstimates()/getEstimate() boundary rather than adding a
   * page-specific endpoint or allowing a component to fetch directly.
   */

  const loadPersistedInspections = useCallback(async () => {
    setPersistedInspectionsLoading(true)

    setPersistedInspectionsError(null)

    try {
      const savedEstimates = await estimatesServiceRef.current!.listEstimates()

      setEstimates(savedEstimates)

      const loaded = await Promise.all(
        savedEstimates.map((estimate) =>
          estimatesServiceRef.current!.getEstimate(estimate.id),
        ),
      )

      setPersistedInspections(
        loaded.filter(
          (estimate): estimate is SalesInspection => estimate !== null,
        ),
      )
    } catch (error) {
      setPersistedInspectionsError(
        error instanceof Error
          ? error.message
          : "Could not load saved estimate details. Try again.",
      )
    } finally {
      setPersistedInspectionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (
      activeNavItem === "Overview" ||
      activeNavItem === "Inspection photos" ||
      activeNavItem === "Documents"
    ) {
      void loadPersistedInspections()
    }
  }, [activeNavItem, loadPersistedInspections])

  const showOpenEstimatePicker = () => {
    setOpenEstimatePickerOpen(true)

    void loadEstimates()
  }

  const openEstimate = async (id: string) => {
    if (openingEstimateId) return null

    setOpeningEstimateId(id)

    setEstimatesError(null)

    try {
      const savedInspection = await estimatesServiceRef.current!.getEstimate(id)

      if (!savedInspection) {
        setEstimatesError(
          "That estimate is no longer available. Refresh the list and try again.",
        )

        await loadEstimates()

        return null
      }

      const savedEditableState = quoteEngineEditableStateFromSavedSnapshot(
        savedInspection.quoteEngineSnapshot,
        savedInspection.quoteEngineInput,
      )
      const openedInspection = normalizeInspection({
        ...savedInspection,
        quoteEngineInput: savedEditableState.input,
      })
      setInspection(openedInspection)
      setQuoteEngineCalculation(savedInspection.quoteEngineSnapshot ?? null)
      setQuoteEngineCalculationError(null)
      setQuoteEngineCalculating(false)
      setQuoteEngineCalculationRevision(0)
      setQuoteEngineInputDirty(savedEditableState.dirty)
      writeLastOpenEstimateId(savedInspection.id)

      setSavedAt(savedInspection.updatedAt)

      setSaveError(null)

      setShowReport(false)

      setBugmanGraphsOpen(false)

      setBugmanGraphChoiceOpen(false)

      setBugmanGraphPickerOpen(false)

      setWorkspaceGraphKey(null)

      setCustomerSearchOpen(false)

      setOpenEstimatePickerOpen(false)

      setActiveNavItem("Estimate builder")
      return openedInspection
    } catch (error) {
      setEstimatesError(
        error instanceof Error
          ? error.message
          : "Could not open that estimate. Try again.",
      )
      return null
    } finally {
      setOpeningEstimateId(null)
    }
  }

  const startNewEstimate = () => {
    const freshInspection = createEmptySalesInspection(
      currentUser?.username ?? "unassigned",
    )

    setInspection(freshInspection)

    writeLastOpenEstimateId(freshInspection.id)

    setSavedAt(null)

    setSaveError(null)
    setQuoteEngineCalculation(null)
    setQuoteEngineCalculationError(null)
    setQuoteEngineCalculating(false)
    setQuoteEngineCalculationRevision(0)
    setQuoteEngineInputDirty(false)
    setShowReport(false)

    setBugmanGraphsOpen(false)

    setBugmanGraphChoiceOpen(false)

    setBugmanGraphPickerOpen(false)

    setWorkspaceGraphKey(null)

    setCustomerSearchOpen(false)
  }

  const startQuoteForLead = (lead: SalesLead) => {
    const freshInspection = createEmptySalesInspection(
      currentUser?.username ?? "unassigned",
    )
    const leadInspection = reconcileInspection(
      quoteInspectionWithUpdatedLead(
        {
          ...freshInspection,
          leadId: lead.id,
          quoteEngineInput: createEmptyQuoteEngineInput({
            ...quoteEngineContextFor(freshInspection, currentUser),
            leadId: lead.id,
          }),
        },
        lead,
      ),
    )

    setInspection(leadInspection)
    writeLastOpenEstimateId(leadInspection.id)
    setSavedAt(null)
    setSaveError(null)
    setQuoteEngineCalculation(null)
    setQuoteEngineCalculationError(null)
    setQuoteEngineCalculating(false)
    setQuoteEngineCalculationRevision(0)
    setQuoteEngineInputDirty(false)
    setShowReport(false)
    setBugmanGraphsOpen(false)
    setBugmanGraphChoiceOpen(false)
    setBugmanGraphPickerOpen(false)
    setWorkspaceGraphKey(null)
    setCustomerSearchOpen(false)
    setActiveNavItem("Estimate builder")
  }

  /** Selecting a different Bill-To/Location clears every downstream domain
   * value that belongs to the previous property while retaining the prior
   * behavior of leaving photos untouched until an explicit New Estimate. */

  const selectCustomer = (customer: CustomerSearchResult) => {
    const selected = selectedCustomerFor(inspection)
    const customerChanged =
      selected === null ||
      selected.billTo.billToNumber !== customer.billTo.billToNumber ||
      selected.location.locationNumber !== customer.location.locationNumber

    updateInspection((previous) => {
      const changed = customerChanged

      if (!changed)
        return {
          ...previous,

          leadId: undefined,

          billTo: customer.billTo,

          location: customer.location,

          workflowData: normalizeSalesBrainWorkflowData({
            ...previous.workflowData,

            customer: {
              ...normalizeSalesBrainWorkflowData(previous.workflowData)
                .customer,

              leadType: "Existing Customer",

              company:
                customer.billTo.accountType === "company"
                  ? customer.billTo.billToName
                  : "",

              first: customer.billTo.customerFirstName || "",

              last: customer.billTo.customerLastName || "",

              locationName: customer.location.locationName || "",

              streetAddress: customer.location.locationAddress || "",

              state: "NC",
            },
          }),
          quoteEngineInput: previous.quoteEngineInput
            ? quoteEngineInputWithCurrentContext(
                previous.quoteEngineInput,
              {
                ...previous,
                leadId: undefined,
                billTo: customer.billTo,
                location: customer.location,
                },
                currentUser,
              )
            : undefined,
        }

      const findings = getInitialFindings()

      return {
        ...previous,

        leadId: undefined,

        billTo: customer.billTo,

        location: customer.location,

        workflowData: normalizeSalesBrainWorkflowData({
          ...previous.workflowData,

          customer: {
            ...normalizeSalesBrainWorkflowData(previous.workflowData).customer,

            leadType: "Existing Customer",

            company:
              customer.billTo.accountType === "company"
                ? customer.billTo.billToName
                : "",

            first: customer.billTo.customerFirstName || "",

            last: customer.billTo.customerLastName || "",

            locationName: customer.location.locationName || "",

            streetAddress: customer.location.locationAddress || "",

            state: "NC",
          },
        }),

        property: undefined,

        markers: [],

        findings,

        recommendations: [],

        selectedRecommendationId: undefined,

        pricingSnapshot: undefined,
        quoteNotes: undefined,
        quoteEngineInput: createEmptyQuoteEngineInput(
          quoteEngineContextFor(
            {
              ...previous,
              leadId: undefined,
              billTo: customer.billTo,
              location: customer.location,
            },
            currentUser,
          ),
        ),
        quoteEngineSnapshot: undefined,
        reportBuiltAt: undefined,
      }
    })

    if (customerChanged) {
      quoteEngineRequestIdRef.current += 1
      setQuoteEngineCalculation(null)
      setQuoteEngineCalculationError(null)
      setQuoteEngineCalculating(false)
      setQuoteEngineCalculationRevision(0)
      setQuoteEngineInputDirty(false)
    }

    setShowReport(false)

    setBugmanGraphChoiceOpen(false)

    setBugmanGraphPickerOpen(false)
  }

  const openBugmanGraphsChoice = () => {
    if (!inspection.billTo || !inspection.location) return

    setBugmanGraphChoiceOpen(true)
  }

  const loadPropertyGraphs = async () => {
    if (!inspection.billTo || !inspection.location) return

    setPropertyGraphsLoading(true)

    setPropertyGraphsError(null)

    try {
      setPropertyGraphs(
        await graphServiceRef.current!.listGraphsForProperty({
          billToNumber: inspection.billTo.billToNumber,

          locationNumber: inspection.location.locationNumber,
        }),
      )
    } catch (error) {
      setPropertyGraphsError(
        error instanceof Error
          ? error.message
          : "Could not load saved BugMan Graphs.",
      )
    } finally {
      setPropertyGraphsLoading(false)
    }
  }

  const showExistingGraphPicker = () => {
    setBugmanGraphChoiceOpen(false)

    setBugmanGraphPickerOpen(true)

    void loadPropertyGraphs()
  }

  const createNewGraph = () => {
    setBugmanGraphChoiceOpen(false)

    setBugmanGraphPickerOpen(false)

    setWorkspaceGraphKey(null)

    setBugmanGraphsOpen(true)
  }

  const selectExistingGraph = (graph: BugManGraphListItem) => {
    updateInspection((previous) => ({
      ...previous,

      property: propertyFor(previous, graph.key),
    }))

    setWorkspaceGraphKey(graph.key)

    setBugmanGraphPickerOpen(false)

    setBugmanGraphsOpen(true)

    void importGraphData(graph.key)
  }

  const closeBugmanGraphsWorkspace = () => {
    setBugmanGraphsOpen(false)

    setWorkspaceGraphKey(null)
  }

  /** Real Property completion signal from BugManGraphsWorkspace's saved-graph
   * postMessage handshake; no manual completion path exists. */

  const handleGraphSaved = async ({ graphKey }: { graphKey?: string }) => {
    updateInspection((previous) => ({
      ...previous,

      property: propertyFor(previous, graphKey),
    }))

    if (graphKey) {
      setWorkspaceGraphKey(graphKey)

      await importGraphData(graphKey)

      setBugmanGraphsOpen(false)

      setWorkspaceGraphKey(null)
    }
  }

  /** Merge graph-owned facts without recreating user edits or previously
   * dismissed graph photos. A graph refresh is optional and never clears a
   * manually entered note/photo when it fails. */

  const importGraphData = async (graphKey: string) => {
    try {
      const [markers, graphPhotos] = await Promise.all([
        graphServiceRef.current!.getMarkers(graphKey),

        graphServiceRef.current!.getPhotos(graphKey),
      ])

      updateInspection((previous) => {
        const imported = graphFindingsFor(graphKey, markers)

        const existingById = new Map(
          previous.findings.map((item) => [item.id, item]),
        )

        const existingGraphFindings = previous.findings.filter(
          (item) => item.source === "graph" && item.sourceGraphKey === graphKey,
        )

        const mergedFindings = imported.map((item) => {
          const existing =
            existingById.get(item.id) ??
            existingGraphFindings.find(
              (candidate) =>
                candidate.markerType === item.markerType ||
                candidate.markerIds.some((markerId) =>
                  item.markerIds.includes(markerId),
                ),
            )

          // Earlier releases used one finding per marker. Keep edited wording

          // while collapsing that old data into its type-based finding.

          return existing
            ? {
                ...item,

                id: existing.id,

                summary: existing.userEdited ? existing.summary : item.summary,

                userEdited: existing.userEdited,

                hidden: existing.hidden,

                customerVisible: existing.customerVisible ?? true,

                createdAt: existing.createdAt,

                updatedAt: existing.userEdited
                  ? existing.updatedAt
                  : item.updatedAt,
              }
            : item
        })

        const retainedFindings = previous.findings.filter(
          (item) => item.source !== "graph" || item.sourceGraphKey !== graphKey,
        )

        const excluded = new Set(previous.excludedGraphPhotoIds ?? [])

        const retainedPhotos = previous.photos.filter(
          (photo) =>
            photo.source !== "bugman-graph" ||
            photo.sourceGraphKey !== graphKey,
        )

        return {
          ...previous,

          property: propertyFor(previous, graphKey),

          markers,

          findings: [...retainedFindings, ...mergedFindings],

          photos: [
            ...retainedPhotos,
            ...graphPhotos
              .filter((photo) => !excluded.has(photo.id))
              .map((photo) => ({
                ...photo,
                customerVisible: photo.customerVisible ?? true,
                uploadStatus: "ready" as const,
              })),
          ],
        }
      })
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? `Some graph details could not be loaded: ${error.message}`
          : "Some graph photos could not be loaded.",
      )
    }
  }

  const chooseRecommendation = (
    service: PricebookService,

    approved: boolean,
  ) => {
    updateInspection((previous) => {
      const now = new Date().toISOString()

      const recommendation = recommendationFor(
        service,

        previous.findings,

        now,

        approved,

        currentUser?.username,
      )

      return {
        ...previous,

        recommendations: [recommendation],

        selectedRecommendationId: recommendation.id,

        pricingSnapshot: pricingSnapshotFor(service, now),
      }
    })
  }

  /** A human approval is the only action that completes Recommended Service. */

  const confirmRecommendation = (service: PricebookService) =>
    chooseRecommendation(service, true)

  const addCustomRecommendation = (description: string, priceCents: number) => {
    const normalized = description.trim()

    if (!normalized || !Number.isSafeInteger(priceCents) || priceCents < 0) {
      throw new Error("Enter a custom service description and a valid price.")
    }

    updateInspection((previous) => {
      const now = new Date().toISOString()

      const id = `custom-${createEstimateId()}`

      const recommendation = {
        ...recommendationFor(
          {
            id,
            name: normalized,
            description: normalized,
            price: priceCents,
            category: "Custom",
            priceBy: "variable",
            productIds: [],
            active: true,
            createdAt: now,
            updatedAt: now,
          },

          previous.findings,

          now,

          true,

          currentUser?.username,
        ),

        isCustom: true,
      }

      return {
        ...previous,

        recommendations: [...previous.recommendations, recommendation],

        selectedRecommendationId: id,

        pricingSnapshot: {
          currency: "USD",
          totalCents: priceCents,
          lineItems: [{ id, label: normalized, amountCents: priceCents }],
          quotedAt: now,
        },
      }
    })
  }

  const updateCustomRecommendation = (
    id: string,
    description: string,
    priceCents: number,
  ) => {
    const normalized = description.trim()

    if (!normalized || !Number.isSafeInteger(priceCents) || priceCents < 0) {
      throw new Error("Enter a custom service description and a valid price.")
    }

    updateInspection((previous) => {
      const updated = previous.recommendations.map((item) =>
        item.id === id && item.isCustom
          ? {
              ...item,
              name: normalized,
              description: normalized,
              totalCents: priceCents,
              lineItems: [{ id, label: normalized, amountCents: priceCents }],
            }
          : item,
      )

      return {
        ...previous,

        recommendations: updated,

        pricingSnapshot:
          previous.selectedRecommendationId === id
            ? {
                currency: "USD",
                totalCents: priceCents,
                lineItems: [{ id, label: normalized, amountCents: priceCents }],
                quotedAt: new Date().toISOString(),
              }
            : previous.pricingSnapshot,
      }
    })
  }

  const removeCustomRecommendation = (id: string) => {
    updateInspection((previous) => ({
      ...previous,

      recommendations: previous.recommendations.filter(
        (item) => item.id !== id || !item.isCustom,
      ),

      selectedRecommendationId:
        previous.selectedRecommendationId === id
          ? undefined
          : previous.selectedRecommendationId,

      pricingSnapshot:
        previous.selectedRecommendationId === id
          ? undefined
          : previous.pricingSnapshot,
    }))
  }

  const selectCustomRecommendation = (id: string) => {
    updateInspection((previous) => {
      const recommendation = previous.recommendations.find(
        (item) => item.id === id && item.isCustom,
      )

      if (!recommendation) return previous

      const totalCents = recommendation.totalCents ?? 0

      return {
        ...previous,

        selectedRecommendationId: id,

        pricingSnapshot: {
          currency: "USD",
          totalCents,
          lineItems: recommendation.lineItems.map((item) => ({
            id: item.id,
            label: item.label,
            amountCents: item.amountCents ?? 0,
          })),
          quotedAt: new Date().toISOString(),
        },
      }
    })
  }

  const createPricebookService = async (input: PricebookServiceInput) => {
    setPricebookSaving(true)

    setPricebookError(null)

    try {
      const service = await pricebookServiceRef.current!.createService(input)

      setPricebookServices((current) =>
        [...current, service].sort(
          (a, b) =>
            Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
        ),
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not create the Pricebook service."

      setPricebookError(message)

      throw new Error(message)
    } finally {
      setPricebookSaving(false)
    }
  }

  const updatePricebookService = async (
    id: string,

    input: PricebookServiceInput,
  ) => {
    setPricebookSaving(true)

    setPricebookError(null)

    try {
      const service = await pricebookServiceRef.current!.updateService(
        id,

        input,
      )

      setPricebookServices((current) =>
        current

          .map((item) => (item.id === id ? service : item))

          .sort(
            (a, b) =>
              Number(b.active) - Number(a.active) ||
              a.name.localeCompare(b.name),
          ),
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not update the Pricebook service."

      setPricebookError(message)

      throw new Error(message)
    } finally {
      setPricebookSaving(false)
    }
  }

  const deactivatePricebookService = async (id: string) => {
    setPricebookSaving(true)

    setPricebookError(null)

    try {
      const service = await pricebookServiceRef.current!.deactivateService(id)

      setPricebookServices((current) =>
        current

          .map((item) => (item.id === id ? service : item))

          .sort(
            (a, b) =>
              Number(b.active) - Number(a.active) ||
              a.name.localeCompare(b.name),
          ),
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not deactivate the Pricebook service."

      setPricebookError(message)
    } finally {
      setPricebookSaving(false)
    }
  }

  const createLead = async (input: LeadInput) => {
    const lead = await operationsServiceRef.current!.createLead(input)

    await refreshOperations()

    return lead
  }

  const updateLead = async (id: string, input: Partial<LeadInput>) => {
    const lead = await operationsServiceRef.current!.updateLead(id, input)

    await refreshOperations()

    return lead
  }

  const updateActiveQuoteLead = async (input: Partial<LeadInput>) => {
    const leadId = inspection.leadId
    if (!leadId) throw new Error("This quote is not linked to a SalesBrain lead.")

    const lead = await updateLead(leadId, input)
    updateInspection((current) => quoteInspectionWithUpdatedLead(current, lead))
    return lead
  }

  const loadLeadActivities = async (leadId: string) => {
    const activities =
      await operationsServiceRef.current!.listActivities(leadId)

    setLeadActivities((current) => ({ ...current, [leadId]: activities }))

    return activities
  }

  const addLeadActivity = async (
    leadId: string,
    input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">,
  ) => {
    const activity = await operationsServiceRef.current!.addActivity(
      leadId,
      input,
    )

    setLeadActivities((current) => ({
      ...current,
      [leadId]: [activity, ...(current[leadId] || [])],
    }))

    await refreshOperations()

    return activity
  }

  const createProduct = async (input: SalesProductInput) => {
    const product = await operationsServiceRef.current!.createProduct(input)

    setProducts((current) => [...current, product])
  }

  const updateProduct = async (id: string, input: SalesProductInput) => {
    const product = await operationsServiceRef.current!.updateProduct(id, input)

    setProducts((current) =>
      current.map((item) => (item.id === id ? product : item)),
    )
  }

  const deactivateProduct = async (id: string) => {
    const product = await operationsServiceRef.current!.deactivateProduct(id)

    setProducts((current) =>
      current.map((item) => (item.id === id ? product : item)),
    )
  }

  const createLaborRole = async (input: SalesLaborRoleInput) => {
    const role = await operationsServiceRef.current!.createLaborRole(input)

    setLaborRoles((current) => [...current, role])
  }

  const updateLaborRole = async (id: string, input: SalesLaborRoleInput) => {
    const role = await operationsServiceRef.current!.updateLaborRole(id, input)

    setLaborRoles((current) =>
      current.map((item) => (item.id === id ? role : item)),
    )
  }

  const deactivateLaborRole = async (id: string) => {
    const role = await operationsServiceRef.current!.deactivateLaborRole(id)

    setLaborRoles((current) =>
      current.map((item) => (item.id === id ? role : item)),
    )
  }

  const saveCostingSettings = async (input: SalesCostingSettings) => {
    setCostingSettings(
      await operationsServiceRef.current!.updateCostingSettings(input),
    )
  }

  const createServicePackage = async (input: SalesServicePackageInput) => {
    const item = await operationsServiceRef.current!.createServicePackage(input)

    setServicePackages((current) => [...current, item])
  }

  const updateServicePackage = async (
    id: string,
    input: SalesServicePackageInput,
  ) => {
    const item = await operationsServiceRef.current!.updateServicePackage(
      id,
      input,
    )

    setServicePackages((current) =>
      current.map((entry) => (entry.id === id ? item : entry)),
    )
  }

  const deactivateServicePackage = async (id: string) => {
    const item =
      await operationsServiceRef.current!.deactivateServicePackage(id)

    setServicePackages((current) =>
      current.map((entry) => (entry.id === id ? item : entry)),
    )
  }

  const loadEmployeeProfiles = useCallback(async () => {
    const rows = await operationsServiceRef.current!.listEmployeeProfiles()

    setEmployeeProfiles(rows)

    return rows
  }, [])

  const updateEmployeeProfile = async (
    username: string,
    input: Omit<SalesEmployeeProfile, "username" | "updatedAt" | "updatedBy">,
  ) => {
    const item = await operationsServiceRef.current!.updateEmployeeProfile(
      username,
      input,
    )

    setEmployeeProfiles((current) =>
      [...current.filter((entry) => entry.username !== username), item].sort(
        (a, b) => a.displayName.localeCompare(b.displayName),
      ),
    )

    if (username === currentUser?.username) setEmployeeProfile(item)

    return item
  }

  const deleteEmployeeProfile = async (username: string) => {
    await operationsServiceRef.current!.deleteEmployeeProfile(username)

    setEmployeeProfiles((current) =>
      current.filter((entry) => entry.username !== username),
    )

    if (username === currentUser?.username) setEmployeeProfile(null)
  }

  const migrateLegacyData = async () => {
    const result = await operationsServiceRef.current!.migrateLegacyData()

    await Promise.all([
      loadEstimates(),
      refreshOperations(),
      refreshPricebook(),
    ])

    return result
  }

  const loadProviderState = useCallback(
    async (quoteId = inspection.id) => {
      try {
        const [documents, deliveryRows, signature] = await Promise.all([
          estimatesServiceRef.current!.listDocuments(quoteId),

          estimatesServiceRef.current!.listDeliveries(quoteId),

          estimatesServiceRef.current!.getSignatureRequest(quoteId),
        ])

        setGeneratedDocuments(documents)

        setDeliveries(deliveryRows)

        setSignatureRequest(signature)

        if (signature?.status === "completed")
          setPestPacHandoff(
            await estimatesServiceRef.current!.getPestPacHandoff(quoteId),
          )
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Unable to load delivery and signature status.",
        )
      }
    },
    [inspection.id],
  )

  const createCustomerDocument = async (type: SalesDocumentType) => {
    setProviderActionLoading(true)

    try {
      await saveEstimate()

      const result = await estimatesServiceRef.current!.createDocument(
        inspection.id,
        type,
      )

      setGeneratedDocuments((current) => [result.document, ...current])

      return result
    } finally {
      setProviderActionLoading(false)
    }
  }

  const sendCustomerDocument = async (input: SalesDeliveryInput) => {
    setProviderActionLoading(true)

    try {
      const result = await estimatesServiceRef.current!.sendDelivery(
        inspection.id,
        input,
      )

      setDeliveries((current) => [
        result.delivery,
        ...current.filter((item) => item.id !== result.delivery.id),
      ])

      const refreshed = await estimatesServiceRef.current!.getEstimate(
        inspection.id,
      )

      if (refreshed) {
        const savedEditableState = quoteEngineEditableStateFromSavedSnapshot(
          refreshed.quoteEngineSnapshot,
          refreshed.quoteEngineInput,
        )
        setInspection(
          normalizeInspection({
            ...refreshed,
            quoteEngineInput: savedEditableState.input,
          }),
        )
        setQuoteEngineCalculation(refreshed.quoteEngineSnapshot ?? null)
        setQuoteEngineInputDirty(savedEditableState.dirty)
      }

      await Promise.all([loadEstimates(), refreshOperations()])

      return result
    } finally {
      setProviderActionLoading(false)
    }
  }

  const requestCustomerSignature = async (input: {
    customerEmail: string
    customerName: string
    selectedOptionId: string
    message: string
    idempotencyKey: string
  }) => {
    setProviderActionLoading(true)

    try {
      await saveEstimate()

      const result = await estimatesServiceRef.current!.createSignatureRequest(
        inspection.id,
        input,
      )

      setSignatureRequest(result.signatureRequest)

      await loadProviderState(inspection.id)

      return result
    } finally {
      setProviderActionLoading(false)
    }
  }

  const savePestPacHandoffRecord = async (
    input: PestPacHandoff & { complete?: boolean },
  ) => {
    setProviderActionLoading(true)

    try {
      const saved = await estimatesServiceRef.current!.savePestPacHandoff(
        inspection.id,
        input,
      )

      setPestPacHandoff(saved)

      return saved
    } finally {
      setProviderActionLoading(false)
    }
  }

  const createProposalPdf = async () => {
    await saveEstimate()

    const result = await estimatesServiceRef.current!.createProposalPdf(
      inspection.id,
    )

    updateInspection((current) => ({
      ...current,
      proposalR2Key: result.key,
      reportBuiltAt: new Date().toISOString(),
    }))

    return result
  }

  const previewReport = () => setShowReport(true)

  /** Building the report is the only action that completes Review & Send. */

  const buildReport = () => {
    if (
      !inspection.billTo ||
      !inspection.location ||
      !inspection.pricingSnapshot
    ) {
      setSaveError(
        "Complete the customer and recommended service before building the report.",
      )

      return
    }

    updateInspection((previous) => ({
      ...previous,

      reportBuiltAt: new Date().toISOString(),
    }))

    setShowReport(true)
  }

  const [polishingFindingId, setPolishingFindingId] = useState<string | null>(
    null,
  )

  const polishFindingWording = async (findingId: string) => {
    const finding = inspection.findings.find((item) => item.id === findingId)

    if (!finding) return

    setPolishingFindingId(findingId)

    try {
      const service = createBugManIntelligenceService()

      const { customerFacingSummary } = await service.polishFinding(finding)

      updateInspection((current) => ({
        ...current,

        findings: current.findings.map((item) =>
          item.id === findingId
            ? {
                ...item,

                customerFacingSummary,

                polishedByIntelligence: true,

                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      }))
    } finally {
      setPolishingFindingId(null)
    }
  }

  const updateFindingSummary = (findingId: string, summary: string) => {
    updateInspection((current) => ({
      ...current,

      findings: current.findings.map((item) =>
        item.id === findingId
          ? {
              ...item,
              summary,
              userEdited: true,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }))
  }

  const updateFindingDetails = (
    findingId: string,
    patch: Partial<InspectionFinding>,
  ) => {
    updateInspection((current) => ({
      ...current,

      findings: current.findings.map((item) =>
        item.id === findingId
          ? {
              ...item,
              ...patch,
              userEdited: true,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }))
  }

  const removeFinding = (findingId: string) => {
    updateInspection((current) => ({
      ...current,

      findings: current.findings.map((item) =>
        item.id === findingId
          ? { ...item, hidden: true, updatedAt: new Date().toISOString() }
          : item,
      ),

      hiddenFindingIds: [
        ...new Set([...(current.hiddenFindingIds ?? []), findingId]),
      ],
    }))
  }

  const availableGraphFindings = useMemo(() => {
    const graphKey = inspection.property?.graphKey || "manual"

    const detected = new Map(
      graphFindingsFor(graphKey, inspection.markers).map((finding) => [
        finding.markerType,
        finding,
      ]),
    )

    return INSPECTION_FINDING_CATALOG.map(
      (catalogItem) =>
        detected.get(catalogItem.type) || {
          id: `finding-${catalogItem.type}`,

          source: "custom" as const,

          markerType: catalogItem.type,

          title: catalogItem.title,

          summary: "",

          category: catalogItem.category,

          tag:
            catalogItem.category === "insectFindings"
              ? "Priority"
              : catalogItem.category === "moistureFindings"
                ? "Watch"
                : "Inspection",

          markerIds: [],

          photoIds: [],

          status: "pending_review" as const,

          customerVisible: true,

          createdAt: new Date().toISOString(),

          updatedAt: new Date().toISOString(),
        },
    )
  }, [inspection.markers, inspection.property?.graphKey])

  const toggleGraphFinding = (findingId: string) => {
    const candidate = availableGraphFindings.find(
      (finding) => finding.id === findingId,
    )

    if (!candidate) return

    const selected = inspection.findings.find(
      (finding) =>
        finding.id === findingId || finding.markerType === candidate.markerType,
    )

    if (selected && !selected.hidden) {
      removeFinding(selected.id)

      return
    }

    updateInspection((current) => ({
      ...current,

      findings: selected
        ? current.findings.map((item) =>
            item.id === selected.id
              ? { ...item, hidden: false, updatedAt: new Date().toISOString() }
              : item,
          )
        : [...current.findings, candidate],

      hiddenFindingIds: (current.hiddenFindingIds ?? []).filter(
        (id) => id !== selected?.id,
      ),
    }))
  }

  const updateWorkflowData = (workflowData: SalesBrainWorkflowData) => {
    const normalized = normalizeSalesBrainWorkflowData(workflowData)

    const costing = calculateCosting(normalized.costing)

    updateInspection((current) => ({
      ...current,
      workflowData: normalized,
      pricingSnapshot:
        !current.quoteEngineInput &&
        current.pricingSnapshot &&
        costing.sellingPriceCents > 0
          ? {
              ...current.pricingSnapshot,
              totalCents: costing.sellingPriceCents,
            }
          : current.pricingSnapshot,
    }))
  }

  const updateQuoteNotes = (quoteNotes: string) => {
    updateInspection((current) => ({ ...current, quoteNotes }))
  }

  const updateQuoteEngineInput = (
    updater: (current: QuoteEngineInput) => QuoteEngineInput,
  ) => {
    updateInspection((current) => {
      const base =
        current.quoteEngineInput ??
        createEmptyQuoteEngineInput(quoteEngineContextFor(current, currentUser))
      return {
        ...current,
        quoteEngineInput: quoteEngineInputWithCurrentContext(
          updater(base),
          current,
          currentUser,
        ),
      }
    })
    setQuoteEngineInputDirty(true)
    setQuoteEngineCalculation(null)
    setQuoteEngineCalculationError(null)
    setQuoteEngineCalculationRevision((revision) => revision + 1)
  }

  useEffect(() => {
    const selected = inspection.recommendations.find(
      (item) =>
        item.id === inspection.selectedRecommendationId &&
        item.status === "approved",
    )
    const service = selected
      ? pricebookServices.find((item) => item.id === selected.id && item.active)
      : undefined
    if (
      !service ||
      !hasQuoteEngineQuoteContext(
        quoteEngineContextFor(inspection, currentUser),
      ) ||
      quoteEngineInputHasLines(inspection.quoteEngineInput)
    )
      return
    const initialized = initializeQuoteEngineInputFromRecommendation(
      inspection.quoteEngineInput,
      quoteEngineContextFor(inspection, currentUser),
      service,
    )
    if (!initialized) return
    updateInspection((current) =>
      quoteEngineInputHasLines(current.quoteEngineInput)
        ? current
        : { ...current, quoteEngineInput: initialized },
    )
    setQuoteEngineInputDirty(true)
    setQuoteEngineCalculation(null)
    setQuoteEngineCalculationError(null)
    setQuoteEngineCalculationRevision((revision) => revision + 1)
  }, [
    currentUser,
    inspection.id,
    inspection.leadId,
    inspection.billTo?.billToNumber,
    inspection.location?.locationNumber,
    inspection.quoteEngineInput,
    inspection.recommendations,
    inspection.selectedRecommendationId,
    pricebookServices,
    updateInspection,
  ])

  useEffect(() => {
    if (
      quoteEngineCalculationRevision === 0 ||
      !hasQuoteEngineQuoteContext(
        quoteEngineContextFor(inspection, currentUser),
      ) ||
      !quoteEngineInputHasLines(inspection.quoteEngineInput)
    ) {
      return
    }
    const requestId = ++quoteEngineRequestIdRef.current
    const input = quoteEngineInputWithCurrentContext(
      inspection.quoteEngineInput!,
      inspection,
      currentUser,
    )
    let cancelled = false
    setQuoteEngineCalculating(true)
    const timeout = window.setTimeout(() => {
      void quoteEngineServiceRef
        .current!.calculate(input)
        .then((calculation) => {
          if (cancelled || requestId !== quoteEngineRequestIdRef.current) return
          setQuoteEngineCalculation(calculation)
          setQuoteEngineCalculationError(null)
          const pricingSnapshot =
            customerPricingSnapshotFromQuoteEngine(calculation)
          if (pricingSnapshot) {
            setInspection((current) => ({ ...current, pricingSnapshot }))
          }
        })
        .catch((error) => {
          if (cancelled || requestId !== quoteEngineRequestIdRef.current) return
          setQuoteEngineCalculationError(
            error instanceof Error
              ? error.message
              : "Quote Engine calculation failed. Your quote details are still here.",
          )
        })
        .finally(() => {
          if (!cancelled && requestId === quoteEngineRequestIdRef.current) {
            setQuoteEngineCalculating(false)
          }
        })
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [
    currentUser,
    inspection.billTo?.billToNumber,
    inspection.createdBy,
    inspection.id,
    inspection.leadId,
    inspection.location?.locationNumber,
    inspection.quoteEngineInput,
    quoteEngineCalculationRevision,
  ])

  const setEstimateStatus = async (status: SalesInspection["status"]) => {
    if (!hasQuoteEngineQuoteContext(quoteEngineContextFor(inspection, currentUser))) {
      setSaveError(
        "Select an existing customer or start a SalesBrain lead quote before updating quote status.",
      )
      return
    }

    const now = new Date().toISOString()

    updateInspection((current) => ({
      ...current,

      status,

      ...(status === "sent" ? { sentAt: now } : {}),

      ...(status === "accepted" ? { acceptedAt: now } : {}),

      ...(status === "declined" ? { declinedAt: now } : {}),
    }))

    try {
      const quoteInputForSave = quoteEngineInputForSave(
        {
          input: inspection.quoteEngineInput,
          dirty: quoteEngineInputDirty,
        },
        { snapshotBacked: Boolean(inspection.quoteEngineSnapshot) },
      )
      const saved = await estimatesServiceRef.current!.saveEstimate(
        normalizeInspection({
          ...inspection,

          quoteEngineInput: quoteInputForSave
            ? quoteEngineInputWithCurrentContext(
                quoteInputForSave,
                inspection,
                currentUser,
              )
            : undefined,

          status,

          updatedAt: now,

          ...(status === "sent" ? { sentAt: now } : {}),

          ...(status === "accepted" ? { acceptedAt: now } : {}),

          ...(status === "declined" ? { declinedAt: now } : {}),
        }),
      )

      const savedEditableState = quoteEngineEditableStateFromSavedSnapshot(
        saved.quoteEngineSnapshot,
        saved.quoteEngineInput ?? inspection.quoteEngineInput,
      )
      setInspection(
        normalizeInspection({
          ...saved,
          quoteEngineInput: savedEditableState.input,
        }),
      )
      setQuoteEngineCalculation(saved.quoteEngineSnapshot ?? null)
      setQuoteEngineInputDirty(savedEditableState.dirty)

      await Promise.all([loadEstimates(), refreshOperations()])
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to update quote status.",
      )
    }
  }

  const addCustomNote = (summary = "") => {
    const existing = inspection.findings.find(
      (item) =>
        item.source === "custom" &&
        item.title === "Additional Inspection Finding or Comment",
    )

    if (existing) {
      updateInspection((current) => ({
        ...current,

        findings: current.findings.map((item) =>
          item.id === existing.id ? { ...item, hidden: false } : item,
        ),
      }))

      return
    }

    updateInspection((current) => {
      const now = new Date().toISOString()

      return {
        ...current,

        findings: [
          ...current.findings,
          {
            id: `custom-note-${createEstimateId()}`,

            source: "custom",

            title: "Additional Inspection Finding or Comment",

            summary: summary.trim(),

            category: "review",

            tag: "Note",

            customerVisible: true,

            markerIds: [],

            photoIds: [],

            status: "pending_review",

            createdAt: now,

            updatedAt: now,
          },
        ],
      }
    })
  }

  const uploadQueuedPhoto = async (photoId: string) => {
    const pending = pendingPhotoFilesRef.current.get(photoId)

    if (!pending) return

    updateInspection((current) => ({
      ...current,
      photos: current.photos.map((item) =>
        item.id === photoId
          ? { ...item, uploadStatus: "uploading", uploadError: undefined }
          : item,
      ),
    }))

    try {
      const photo = await estimatesServiceRef.current!.uploadPhoto(
        inspection.id,
        pending.file,
      )

      updateInspection((current) => ({
        ...current,

        photos: current.photos.map((item) =>
          item.id === photoId
            ? {
                ...photo,
                caption: item.caption || photo.caption,
                customerVisible: item.customerVisible ?? true,
                findingIds: item.findingIds,
                uploadStatus: "ready",
              }
            : item,
        ),
      }))

      URL.revokeObjectURL(pending.previewUrl)

      pendingPhotoFilesRef.current.delete(photoId)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save inspection photo."

      updateInspection((current) => ({
        ...current,
        photos: current.photos.map((item) =>
          item.id === photoId
            ? { ...item, uploadStatus: "error", uploadError: message }
            : item,
        ),
      }))

      setSaveError(message)
    }
  }

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 4)

    event.target.value = ""

    const queued = files.map((file) => ({
      file,

      preview: {
        id: `upload-${createEstimateId()}`,

        source: "legacy-inline" as const,

        url: URL.createObjectURL(file),

        caption: file.name,

        byteSize: file.size,

        customerVisible: true,

        uploadStatus: "uploading" as const,
      },
    }))

    queued.forEach(({ file, preview }) =>
      pendingPhotoFilesRef.current.set(preview.id, {
        file,
        previewUrl: preview.url,
      }),
    )

    updateInspection((current) => ({
      ...current,
      photos: [...current.photos, ...queued.map((item) => item.preview)],
    }))

    void Promise.all(queued.map(({ preview }) => uploadQueuedPhoto(preview.id)))
  }

  const retryPhoto = async (photoId: string) => uploadQueuedPhoto(photoId)

  const updatePhoto = (
    photoId: string,
    patch: Partial<Pick<SalesInspection["photos"][number], "caption" | "customerVisible" | "findingIds">>,
  ) => {
    updateInspection((current) => ({
      ...current,
      photos: current.photos.map((photo) =>
        photo.id === photoId ? { ...photo, ...patch } : photo,
      ),
    }))
  }

  const removePhoto = async (photoId: string) => {
    const photo = inspection.photos.find((item) => item.id === photoId)

    if (!photo) return

    pendingPhotoFilesRef.current.delete(photoId)

    if (photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url)

    updateInspection((current) => ({
      ...current,

      photos: current.photos.filter((item) => item.id !== photoId),

      excludedGraphPhotoIds:
        photo.source === "bugman-graph"
          ? [...new Set([...(current.excludedGraphPhotoIds ?? []), photoId])]
          : current.excludedGraphPhotoIds,
    }))

    try {
      await estimatesServiceRef.current!.deletePhoto(photo)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to remove inspection photo.",
      )
    }
  }

  return {
    activeNavItem,

    setActiveNavItem,

    inspection,

    completedSteps,

    currentStepIndex,

    goToStep,

    solution,

    selectedPricebookServiceId,

    confirmRecommendation,

    addCustomRecommendation,

    updateCustomRecommendation,

    removeCustomRecommendation,

    selectCustomRecommendation,

    photos,

    addPhotos,

    updatePhoto,

    retryPhoto,

    removePhoto,

    fileInputRef,

    polishFindingWording,

    polishingFindingId,

    showReport,

    setShowReport,

    previewReport,

    buildReport,

    bugmanGraphsOpen,

    setBugmanGraphsOpen,

    bugmanGraphChoiceOpen,

    setBugmanGraphChoiceOpen,

    bugmanGraphPickerOpen,

    setBugmanGraphPickerOpen,

    workspaceGraphKey,

    propertyGraphs,

    propertyGraphsLoading,

    propertyGraphsError,

    openBugmanGraphsChoice,

    showExistingGraphPicker,

    createNewGraph,

    selectExistingGraph,

    loadPropertyGraphs,

    closeBugmanGraphsWorkspace,

    customerSearchOpen,

    setCustomerSearchOpen,

    selectedCustomer,

    selectCustomer,

    propertyGraphKey,

    propertyGraphSaved,

    handleGraphSaved,

    findings: inspection.findings,

    availableGraphFindings,

    toggleGraphFinding,

    addCustomNote,

    updateFindingSummary,

    updateFindingDetails,

    removeFinding,

    isMockFindingsData: shouldUseMockFindings(),

    stepSummaries,

    startNewEstimate,
    startQuoteForLead,

    updateWorkflowData,
    updateQuoteNotes,
    updateQuoteEngineInput,
    quoteEngineCalculation:
      quoteEngineCalculation ?? inspection.quoteEngineSnapshot ?? null,
    quoteEngineCalculating,
    quoteEngineCalculationError,
    setEstimateStatus,

    createProposalPdf,

    saveEstimate,

    isSaving,

    savedAt,

    saveError,

    restoringEstimate,

    openEstimatePickerOpen,

    setOpenEstimatePickerOpen,

    estimates,

    estimatesLoading,

    estimatesError,

    openingEstimateId,

    showOpenEstimatePicker,

    loadEstimates,

    deleteEstimate,

    openEstimate,

    persistedInspections,

    persistedInspectionsLoading,

    persistedInspectionsError,

    loadPersistedInspections,

    currentUser,

    currentUserLoading,

    total,

    pricebookServices,

    pricebookLoading,

    pricebookError,

    pricebookSaving,

    refreshPricebook,

    createPricebookService,

    updatePricebookService,

    deactivatePricebookService,

    dashboardData,

    operationsLoading,

    operationsError,

    refreshOperations,

    createLead,

    updateLead,

    updateActiveQuoteLead,

    leadActivities,

    loadLeadActivities,

    addLeadActivity,

    products,

    laborRoles,

    costingSettings,

    createProduct,

    updateProduct,

    deactivateProduct,

    createLaborRole,

    updateLaborRole,

    deactivateLaborRole,

    saveCostingSettings,

    servicePackages,

    employeeProfile,

    employeeProfiles,

    generatedDocuments,

    deliveries,

    signatureRequest,

    pestPacHandoff,

    providerActionLoading,

    createServicePackage,

    updateServicePackage,

    deactivateServicePackage,

    loadEmployeeProfiles,

    updateEmployeeProfile,

    deleteEmployeeProfile,

    migrateLegacyData,

    loadProviderState,

    createCustomerDocument,

    sendCustomerDocument,

    requestCustomerSignature,

    savePestPacHandoffRecord,

    graphNotes: inspection.markers.filter(
      (marker) =>
        marker.type === "treatmentNote" || marker.type === "notePoint",
    ),
  }
}

export type SalesWorkflow = ReturnType<typeof useSalesWorkflow>
