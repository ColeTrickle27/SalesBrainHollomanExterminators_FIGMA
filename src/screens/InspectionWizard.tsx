import { useEffect, useState, type ChangeEvent, type ReactNode, type RefObject } from "react"
import {
  AlertTriangle,
  Bug,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSignature,
  Home,
  Link2,
  Lock,
  Mail,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react"

import type { InspectionFinding, InspectionMarker, MarkerCategory } from "../types/findings"
import type { PricebookService } from "../types/pricebook"
import type { PhotoReference } from "../types/property"
import type { SalesInspection } from "../types/sales-inspection"
import { CurrencyInput } from "../components/forms/CurrencyInput"
import {
  LEAD_ACTIVITY_TYPES,
  type LeadActivity,
  type PestPacHandoff,
  type SalesDeliveryEvent,
  type SalesDeliveryInput,
  type SalesDocumentType,
  type SalesEmployeeProfile,
  type SalesGeneratedDocument,
  type SalesServicePackage,
  type SalesSignatureRequest,
} from "../types/sales-operations"
import type { OpsBrainUser } from "../types/user"
import {
  CONSTRUCTION_OPTIONS,
  CRAWLSPACE_ACCESS_OPTIONS,
  createEmptyStructure,
  LEAD_TYPE_OPTIONS,
  normalizeSalesBrainWorkflowData,
  OCCUPANCY_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  STRUCTURE_TYPE_OPTIONS,
  type SalesBrainMoistureReading,
  type SalesBrainQuoteOption,
  type SalesBrainStructureDetails,
  type SalesBrainWorkflowData,
} from "../types/figma-workflow"

const STEPS = [
  "Customer",
  "Structures & Graph",
  "Findings & Moisture",
  "Inspection Photos",
  "Review",
  "Customer Presentation",
  "Send to Customer",
  "Accept & Sign",
  "PestPac Handoff",
]

const DOCUMENT_LABELS: Record<Exclude<SalesDocumentType, "agreement">, string> = {
  "inspection-report": "Inspection & Findings Report",
  "quote-options": "Quote Options",
  bundle: "Bundled Report + Quote",
}

interface Props {
  inspection: SalesInspection
  workflowData?: SalesBrainWorkflowData
  pricebookServices: PricebookService[]
  pricebookLoading: boolean
  pricebookError: string | null
  servicePackages: SalesServicePackage[]
  currentUser: OpsBrainUser | null
  employeeProfile: SalesEmployeeProfile | null
  generatedDocuments: SalesGeneratedDocument[]
  deliveries: SalesDeliveryEvent[]
  signatureRequest: SalesSignatureRequest | null
  pestPacHandoff: PestPacHandoff | null
  providerActionLoading: boolean
  graphNotes: InspectionMarker[]
  availableGraphFindings: InspectionFinding[]
  onWorkflowDataChange: (data: SalesBrainWorkflowData) => void
  onSelectService: (service: PricebookService) => void
  onSave: () => void
  isSaving: boolean
  savedAt: string | null
  saveError: string | null
  onPresentation: () => void
  onProposal: () => void
  onOpenGraph: () => void
  onAddFinding: (summary: string) => void
  onUpdateFinding: (id: string, summary: string) => void
  onUpdateFindingDetails: (id: string, patch: Partial<InspectionFinding>) => void
  onRemoveFinding: (id: string) => void
  onToggleGraphFinding: (id: string) => void
  onAddPhotos: (event: ChangeEvent<HTMLInputElement>) => void
  onUpdatePhoto: (id: string, patch: Partial<Pick<PhotoReference, "caption" | "customerVisible" | "findingIds">>) => void
  onRetryPhoto: (id: string) => void | Promise<void>
  onRemovePhoto: (id: string) => void
  photoInputRef: RefObject<HTMLInputElement | null>
  onStatusChange: (status: SalesInspection["status"]) => void | Promise<void>
  onAddQuoteActivity: (input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">) => Promise<void>
  onLoadProviderState: () => void | Promise<void>
  onCreateDocument: (type: SalesDocumentType) => Promise<unknown>
  onSendDelivery: (input: SalesDeliveryInput) => Promise<unknown>
  onRequestSignature: (input: { customerEmail: string; customerName: string; selectedOptionId: string; message: string; idempotencyKey: string }) => Promise<unknown>
  onSavePestPacHandoff: (input: PestPacHandoff & { complete?: boolean }) => Promise<unknown>
}

export interface QuoteInspectionProps {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  graphNotes: InspectionMarker[]
  availableGraphFindings: InspectionFinding[]
  onWorkflowDataChange: (data: SalesBrainWorkflowData) => void
  onOpenGraph: () => void
  onAddFinding: (summary: string) => void
  onUpdateFinding: (id: string, summary: string) => void
  onUpdateFindingDetails: (
    id: string,
    patch: Partial<InspectionFinding>,
  ) => void
  onRemoveFinding: (id: string) => void
  onToggleGraphFinding: (id: string) => void
  onAddPhotos: (event: ChangeEvent<HTMLInputElement>) => void
  onUpdatePhoto: (
    id: string,
    patch: Partial<
      Pick<PhotoReference, "caption" | "customerVisible" | "findingIds">
    >,
  ) => void
  onRetryPhoto: (id: string) => void | Promise<void>
  onRemovePhoto: (id: string) => void
  photoInputRef: RefObject<HTMLInputElement | null>
}

export default function InspectionWizard(props: Props) {
  const data = normalizeSalesBrainWorkflowData(props.workflowData)
  const step = Math.min(STEPS.length, Math.max(1, data.currentStep || 1))
  const update = (patch: Partial<SalesBrainWorkflowData>) => props.onWorkflowDataChange({ ...data, ...patch })
  const updateStep = (next: number) => update({ currentStep: Math.min(STEPS.length, Math.max(1, next)) })
  const complete = (next?: number) => update({
    completedSteps: data.completedSteps.includes(step) ? data.completedSteps : [...data.completedSteps, step],
    ...(next ? { currentStep: next } : {}),
  })

  useEffect(() => {
    if (step >= 7) void props.onLoadProviderState()
  }, [step, props.inspection.id, props.onLoadProviderState])

  return <div className="pb-32 flex flex-col min-h-screen">
    <div className="bg-white border-b border-surface px-3 py-2 sticky top-0 z-10">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide lg:justify-center">
        {STEPS.map((label, index) => {
          const number = index + 1
          const done = data.completedSteps.includes(number)
          const active = step === number
          return <button key={label} onClick={() => updateStep(number)} className="flex flex-col items-center gap-1 flex-shrink-0 px-1" aria-current={active ? "step" : undefined}>
            <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${active ? "step-active" : done ? "step-done" : "step-pending"}`}>{done && !active ? <CheckCircle size={14} /> : number}</div>
            <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-brand-red" : done ? "text-success" : "text-silver"}`}>{label}</span>
          </button>
        })}
      </div>
      <div className="mt-1.5 h-0.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-brand-red transition-all" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} /></div>
    </div>

    <div className="flex-1 px-4 pt-3 max-w-5xl w-full mx-auto">
      {step === 1 ? <CustomerStep inspection={props.inspection} data={data} onChange={props.onWorkflowDataChange} /> : null}
      {step === 2 ? <StructuresStep inspection={props.inspection} data={data} onChange={props.onWorkflowDataChange} onOpenGraph={props.onOpenGraph} /> : null}
      {step === 3 ? <FindingsMoistureStep {...props} data={data} /> : null}
      {step === 4 ? <PhotosStep {...props} /> : null}
      {step === 5 ? <ReviewStep inspection={props.inspection} data={data} onStatusChange={props.onStatusChange} onAddQuoteActivity={props.onAddQuoteActivity} /> : null}
      {step === 6 ? <PresentationStep inspection={props.inspection} data={data} services={props.pricebookServices} packages={props.servicePackages} loading={props.pricebookLoading} error={props.pricebookError} onChange={props.onWorkflowDataChange} onSelectService={props.onSelectService} onPresentation={props.onPresentation} /> : null}
      {step === 7 ? <SendToCustomerStep {...props} data={data} /> : null}
      {step === 8 ? <AcceptSignStep {...props} data={data} /> : null}
      {step === 9 ? <PestPacHandoffStep {...props} data={data} /> : null}
    </div>

    <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface px-4 py-3 z-20">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <button onClick={() => updateStep(step - 1)} disabled={step === 1} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-surface text-steel font-semibold text-sm disabled:opacity-30"><ChevronLeft size={18} /> Back</button>
        <button onClick={() => { complete(); props.onSave() }} disabled={props.isSaving} className="px-4 py-2.5 rounded-xl border border-surface text-steel font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50"><Save size={16} /> {props.isSaving ? "Saving..." : "Save"}</button>
        <button onClick={() => { if (step < STEPS.length) complete(step + 1) }} disabled={step === STEPS.length} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-red text-white font-bold font-display text-lg uppercase disabled:opacity-30">{step === STEPS.length ? "Complete in PestPac" : "Next"}{step < STEPS.length ? <ChevronRight size={18} /> : null}</button>
      </div>
      {props.saveError ? <div className="max-w-5xl mx-auto mt-2 text-xs text-danger">{props.saveError}</div> : props.savedAt ? <div className="max-w-5xl mx-auto mt-2 text-xs text-success">Saved {new Date(props.savedAt).toLocaleTimeString()}</div> : null}
    </div>
  </div>
}

const QUOTE_INSPECTION_SECTIONS = [
  { id: "structures", label: "Structures / Graph" },
  { id: "findings", label: "Findings / Moisture" },
  { id: "photos", label: "Photos" },
] as const

export function QuoteInspection(props: QuoteInspectionProps) {
  const [section, setSection] = useState<
    (typeof QUOTE_INSPECTION_SECTIONS)[number]["id"]
  >("structures")
  const data = normalizeSalesBrainWorkflowData(props.workflowData)

  return (
    <div className="space-y-4" data-quote-inspection="optional">
      <div className="rounded-2xl bg-info-light border border-info/20 p-3 text-sm text-info">
        Inspection details are optional. Add them when they help document the
        property; they are not required to build or save a quote.
      </div>
      <div
        className="grid grid-cols-3 gap-1 rounded-xl bg-white p-1 shadow-sm"
        aria-label="Inspection sections"
      >
        {QUOTE_INSPECTION_SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            aria-pressed={section === item.id}
            className={`rounded-lg px-2 py-2.5 text-xs font-bold ${
              section === item.id
                ? "bg-brand-dark text-white"
                : "text-steel hover:bg-surface"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {section === "structures" ? (
        <StructuresStep
          inspection={props.inspection}
          data={data}
          onChange={props.onWorkflowDataChange}
          onOpenGraph={props.onOpenGraph}
        />
      ) : null}
      {section === "findings" ? (
        <FindingsMoistureStep {...props} data={data} />
      ) : null}
      {section === "photos" ? <PhotosStep {...props} /> : null}
    </div>
  )
}

function CustomerStep({ inspection, data, onChange }: { inspection: SalesInspection; data: SalesBrainWorkflowData; onChange: (data: SalesBrainWorkflowData) => void }) {
  const customer = data.customer
  const patch = (field: keyof typeof customer, value: string) => onChange({ ...data, customer: { ...customer, [field]: value, state: "NC" } })
  return <StepContainer icon={<Home size={20} />} title="Customer" sub="Customer identity, contact preferences, and service location">
    <div className="bg-success-light border border-success/20 rounded-xl p-3 flex gap-2"><Link2 size={16} className="text-success mt-0.5" /><div><div className="text-sm text-success font-semibold">{inspection.billTo?.billToName || "Unlinked lead"}</div><div className="text-xs text-success/80">Bill-To {inspection.billTo?.billToNumber || "Not linked"} · Location {inspection.location?.locationNumber || "Not linked"}</div></div></div>
    <FormCard title="Customer Information">
      <TextRow label="Company" value={customer.company} onChange={(value) => patch("company", value)} />
      <TextRow label="First" value={customer.first} onChange={(value) => patch("first", value)} />
      <TextRow label="Last" value={customer.last} onChange={(value) => patch("last", value)} />
      <TextRow label="Phone" value={customer.phone} onChange={(value) => patch("phone", value)} />
      <TextRow label="Email" value={customer.email} type="email" onChange={(value) => patch("email", value)} />
      <ChoiceRow label="Preferred Contact" value={customer.preferredContact} options={PREFERRED_CONTACT_OPTIONS} onChange={(value) => patch("preferredContact", value)} />
      <ChoiceRow label="Lead Type" value={customer.leadType} options={LEAD_TYPE_OPTIONS} onChange={(value) => patch("leadType", value)} />
      <ChoiceRow label="Referral Source" value={customer.referralSource} options={REFERRAL_SOURCE_OPTIONS} onChange={(value) => patch("referralSource", value)} />
      {customer.referralSource === "Other" ? <TextRow label="Other Referral Source" value={customer.referralSourceOther} onChange={(value) => patch("referralSourceOther", value)} /> : null}
    </FormCard>
    <FormCard title="Service Address">
      <TextRow label="Location Name" value={customer.locationName} onChange={(value) => patch("locationName", value)} />
      <TextRow label="Street Address" value={customer.streetAddress} onChange={(value) => patch("streetAddress", value)} />
      <TextRow label="City" value={customer.city} onChange={(value) => patch("city", value)} />
      <ReadOnlyRow label="State" value="NC" />
      <TextRow label="ZIP" value={customer.zip} inputMode="numeric" onChange={(value) => patch("zip", value)} />
    </FormCard>
    <FormCard title="Internal Account Notes"><textarea value={customer.accountNotes} onChange={(event) => patch("accountNotes", event.target.value)} rows={3} className="w-full text-sm border border-surface rounded-xl px-3 py-2 resize-none" /><p className="text-xs text-steel mt-1">Internal only; excluded from customer output.</p></FormCard>
  </StepContainer>
}

function StructuresStep({ inspection, data, onChange, onOpenGraph }: { inspection: SalesInspection; data: SalesBrainWorkflowData; onChange: (data: SalesBrainWorkflowData) => void; onOpenGraph: () => void }) {
  const selected = data.structures.find((item) => item.id === data.selectedStructureId) || data.structures[0]
  const updateStructure = (patch: Partial<SalesBrainStructureDetails>) => onChange({ ...data, structures: data.structures.map((item) => item.id === selected.id ? { ...item, ...patch } : item) })
  const addStructure = () => { const item = createEmptyStructure(`Structure ${data.structures.length + 1}`); onChange({ ...data, structures: [...data.structures, item], selectedStructureId: item.id }) }
  const slab = selected.construction.toLowerCase() === "slab"
  const setConstruction = (value: string) => updateStructure(value.toLowerCase() === "slab" ? { construction: value, access: "", crawlspaceHeight: "" } : { construction: value })
  return <StepContainer icon={<Home size={20} />} title="Structures & Graph" sub="Stable treatment zones linked to BugMan Graphs">
    <div className={`rounded-2xl p-4 border ${inspection.property?.hasGraph ? "bg-success-light border-success/20" : "bg-white border-surface"} flex items-center justify-between gap-3`}><div><div className="font-semibold text-brand-dark">BugMan Graphs</div><div className="text-xs text-steel mt-1">{inspection.property?.hasGraph ? `Linked · ${inspection.property.graphKey || "saved graph"}` : "No graph linked yet"}</div></div><button onClick={onOpenGraph} disabled={!inspection.billTo || !inspection.location} className="bg-brand-dark text-white text-sm font-bold px-4 py-2.5 rounded-xl disabled:opacity-40">{inspection.property?.hasGraph ? "Open Graph" : "Create or Choose Graph"}</button></div>
    <div className="flex gap-2 overflow-x-auto">{data.structures.map((item) => <button key={item.id} onClick={() => onChange({ ...data, selectedStructureId: item.id })} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${item.id === selected.id ? "bg-brand-dark border-brand-dark text-white" : "bg-white border-surface text-steel"}`}>{item.name}</button>)}<button onClick={addStructure} className="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border-2 border-dashed border-brand-red text-brand-red"><Plus size={13} className="inline mr-1" />Add Structure / Treatment Zone</button></div>
    <FormCard title={selected.name}>
      <TextRow label="Zone Name" value={selected.name} onChange={(value) => updateStructure({ name: value })} />
      <ChoiceRow label="Structure Type" value={selected.structureType} options={STRUCTURE_TYPE_OPTIONS} onChange={(value) => updateStructure({ structureType: value })} />
      {selected.structureType === "Other" ? <TextRow label="Other Structure" value={selected.structureOther} onChange={(value) => updateStructure({ structureOther: value })} /> : null}
      <ChoiceRow label="Construction / Foundation" value={selected.construction} options={CONSTRUCTION_OPTIONS} onChange={setConstruction} />
      <ChoiceRow label="Occupancy" value={selected.occupancy} options={OCCUPANCY_OPTIONS} onChange={(value) => updateStructure({ occupancy: value })} />
      <ChoiceRow label="Crawlspace Access" value={selected.access} options={CRAWLSPACE_ACCESS_OPTIONS} onChange={(value) => updateStructure({ access: value })} disabled={slab} />
      <TextRow label="Crawlspace Height" value={selected.crawlspaceHeight} onChange={(value) => updateStructure({ crawlspaceHeight: value })} disabled={slab} />
      {slab ? <p className="py-2 text-xs text-steel">Crawlspace fields are inactive for slab foundations.</p> : null}
      <TextRow label="Structure Sq Ft" value={selected.squareFootage} type="number" onChange={(value) => updateStructure({ squareFootage: value })} />
      <TextRow label="Perimeter Linear Feet" value={selected.perimeterLinearFeet} type="number" onChange={(value) => updateStructure({ perimeterLinearFeet: value })} />
      <TextRow label="Acreage" value={selected.acreage} type="number" onChange={(value) => updateStructure({ acreage: value })} />
      <TextRow label="Bedrooms" value={selected.bedrooms} type="number" onChange={(value) => updateStructure({ bedrooms: value })} />
      <TextRow label="Foundation Wall Height" value={selected.wallHeightFeet} type="number" onChange={(value) => updateStructure({ wallHeightFeet: value })} />
    </FormCard>
    {data.structures.length > 1 ? <button onClick={() => { const remaining = data.structures.filter((item) => item.id !== selected.id); onChange({ ...data, structures: remaining, selectedStructureId: remaining[0].id }) }} className="text-sm text-danger font-bold flex items-center gap-1"><Trash2 size={14} /> Remove this structure</button> : null}
  </StepContainer>
}

function FindingsMoistureStep(
  props: Omit<QuoteInspectionProps, "workflowData"> & {
    data: SalesBrainWorkflowData
  },
) {
  const { inspection, data } = props
  const grouped = groupFindings(props.availableGraphFindings)
  const moisture = data.moisture
  const setMoisture = (patch: Partial<typeof moisture>) => props.onWorkflowDataChange({ ...data, moisture: { ...moisture, ...patch } })
  const setConditions = (patch: Record<string, string>) => setMoisture({ conditions: { ...moisture.conditions, ...patch } })
  const setGraphNoteVisibility = (id: string, visible: boolean) => props.onWorkflowDataChange({ ...data, graphNoteVisibility: { ...data.graphNoteVisibility, [id]: visible } })
  const addReading = () => setMoisture({ readings: [...moisture.readings, { id: crypto.randomUUID(), location: "", material: "", value: 0, unit: "%", category: "Elevated" }] })
  const updateReading = (id: string, patch: Partial<SalesBrainMoistureReading>) => setMoisture({ readings: moisture.readings.map((item) => item.id === id ? { ...item, ...patch } : item) })
  const activeFindings = inspection.findings.filter((finding) => !finding.hidden)
  return <StepContainer icon={<Bug size={20} />} title="Findings & Moisture" sub="One persistent detail card per inspection finding type">
    <FormCard title="Crawlspace Conditions">
      <ChoiceRow label="Foundation" value={moisture.conditions.foundationType || ""} options={["Crawlspace", "Slab", "Basement", "Combination"]} onChange={(value) => setConditions({ foundationType: value })} />
      <ChoiceRow label="Existing Moisture Barrier Coverage" value={moisture.conditions.groundCover || ""} options={["None", "Partial", "Complete"]} onChange={(value) => setConditions({ groundCover: value })} />
      <ChoiceRow label="Existing Moisture Barrier Thickness (estimated)" value={moisture.conditions.barrierThickness || ""} options={["6-8 mil", "10-12 mil", "15+ mil"]} onChange={(value) => setConditions({ barrierThickness: value })} />
      <ChoiceRow label="Condition of Existing Moisture Barrier" value={moisture.conditions.barrierCondition || ""} options={["Poor", "Good", "Excellent"]} onChange={(value) => setConditions({ barrierCondition: value })} />
      <ChoiceRow label="Standing Water" value={moisture.conditions.standingWater || ""} options={["None", "Present", "Evidence Only"]} onChange={(value) => setConditions({ standingWater: value })} />
      <ChoiceRow label="Drainage" value={moisture.conditions.drainage || ""} options={["Adequate", "Needs Attention", "Not Observed"]} onChange={(value) => setConditions({ drainage: value })} />
      <TextRow label="Odor / Conditions" value={moisture.conditions.odor || ""} onChange={(value) => setConditions({ odor: value })} />
      <label className="py-3 block"><span className="text-xs text-steel font-semibold">Discoloration / Microbial Growth Observation</span><textarea value={moisture.growthObservation} onChange={(event) => setMoisture({ growthObservation: event.target.value })} rows={3} className="mt-2 w-full text-sm border border-surface rounded-xl px-3 py-2 resize-none" /><span className="text-xs text-steel">Use factual observation language; do not make health claims.</span></label>
    </FormCard>
    {props.graphNotes.length ? <FormCard title="Graph Notes"><div className="space-y-3">{props.graphNotes.map((note) => { const visible = data.graphNoteVisibility[note.id] !== false; return <div key={note.id} className="text-sm text-brand-dark border-l-2 border-amber pl-3"><div className="flex items-center justify-between gap-3"><strong>{note.title || "Graph Note"}</strong><button onClick={() => setGraphNoteVisibility(note.id, !visible)} className={`px-3 py-1 rounded-lg text-xs font-bold ${visible ? "bg-success-light text-success" : "bg-surface text-steel"}`}>{visible ? "Visible to Customer" : "Hidden from Customer"}</button></div>{note.observation || note.notes ? <p className="text-steel mt-1">{note.observation || note.notes}</p> : null}</div> })}</div><p className="text-xs text-steel mt-3">Graph Notes are visible in customer documents by default. Hide individual notes when they are staff-only.</p></FormCard> : null}
    <div className="bg-info-light border border-info/20 rounded-xl p-3 text-xs text-info"><strong>Graph filter:</strong> every canonical inspection marker type is listed below. Only insect, structural-condition, and moisture markers are imported; drawings and treatment markers are excluded.</div>
    {(["insectFindings", "structureFindings", "moistureFindings"] as MarkerCategory[]).map((category) => <div key={category}><div className="text-xs font-bold uppercase tracking-wide text-steel mb-2">{categoryLabel(category)}</div><div className="flex flex-wrap gap-2">{(grouped[category] || []).map((finding) => { const selected = inspection.findings.some((item) => (item.id === finding.id || item.markerType === finding.markerType) && !item.hidden); return <button key={finding.id} onClick={() => props.onToggleGraphFinding(finding.id)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${selected ? "bg-brand-red border-brand-red text-white" : "bg-white border-surface text-steel"}`}>{selected ? "✓ " : "+ "}{finding.title}</button> })}</div></div>)}
    {activeFindings.map((finding) => <FindingDetailCard key={finding.id} finding={finding} moisture={moisture} onUpdate={props.onUpdateFinding} onUpdateDetails={props.onUpdateFindingDetails} onRemove={props.onRemoveFinding} addReading={addReading} updateReading={updateReading} setMoisture={setMoisture} />)}
    <div><div className="text-xs font-bold uppercase tracking-wide text-steel mb-2">Manual Findings</div><button onClick={() => props.onAddFinding("")} className="w-full border-2 border-dashed border-surface rounded-xl py-3 text-sm text-steel font-semibold"><Plus size={16} className="inline mr-1" />Add Technician Finding</button></div>
  </StepContainer>
}

function FindingDetailCard({ finding, moisture, onUpdate, onUpdateDetails, onRemove, addReading, updateReading, setMoisture }: {
  finding: InspectionFinding
  moisture: SalesBrainWorkflowData["moisture"]
  onUpdate: Props["onUpdateFinding"]
  onUpdateDetails: Props["onUpdateFindingDetails"]
  onRemove: Props["onRemoveFinding"]
  addReading: () => void
  updateReading: (id: string, patch: Partial<SalesBrainMoistureReading>) => void
  setMoisture: (patch: Partial<SalesBrainWorkflowData["moisture"]>) => void
}) {
  const isMoistureCard = finding.markerType === "moisture" || finding.title === "Moisture"
  return <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-brand-charcoal flex items-center justify-between gap-3"><div><div className="font-display text-base font-bold text-white uppercase">{finding.title}</div><div className="text-xs text-white/65">{finding.source === "graph" ? `${finding.markerIds.length} graph marker${finding.markerIds.length === 1 ? "" : "s"} summarized` : "Technician-added finding"}</div></div><button onClick={() => onRemove(finding.id)} className="text-white/60" aria-label={`Hide ${finding.title}`}><Trash2 size={15} /></button></div>
    <div className="p-3 space-y-3">
      <label className="block"><span className="text-xs text-steel font-semibold">Technician finding summary</span><textarea value={finding.summary} onChange={(event) => onUpdate(finding.id, event.target.value)} rows={4} placeholder="Describe what was observed, where it was found, and why it matters." className="mt-1 w-full text-sm border border-surface rounded-xl px-3 py-2 resize-none" /></label>
      <div className="flex flex-wrap items-center gap-2"><button disabled className="px-3 py-2 rounded-xl bg-surface text-silver text-xs font-bold cursor-not-allowed">AI Polish — Coming Later</button><label className="text-xs text-steel flex items-center gap-2"><input type="checkbox" checked={finding.customerVisible !== false} onChange={(event) => onUpdateDetails(finding.id, { customerVisible: event.target.checked })} /> Visible to customer</label></div>
      {isMoistureCard ? <div className="border-t border-surface pt-3"><div className="flex items-center justify-between"><strong className="text-sm text-brand-dark">Moisture Readings</strong><button onClick={addReading} className="text-xs text-brand-red font-semibold"><Plus size={14} className="inline" /> Reading</button></div><div className="space-y-2 mt-2">{moisture.readings.map((reading) => <div key={reading.id} className="grid sm:grid-cols-[90px_1fr_1fr_130px_auto] gap-2"><input type="number" value={reading.value} onChange={(event) => updateReading(reading.id, { value: Number(event.target.value) })} className="border border-surface rounded-lg px-2 py-2 font-mono" /><input value={reading.location} onChange={(event) => updateReading(reading.id, { location: event.target.value })} placeholder="Location" className="border border-surface rounded-lg px-2 py-2 text-sm" /><input value={reading.material} onChange={(event) => updateReading(reading.id, { material: event.target.value })} placeholder="Material" className="border border-surface rounded-lg px-2 py-2 text-sm" /><select value={reading.category} onChange={(event) => updateReading(reading.id, { category: event.target.value as SalesBrainMoistureReading["category"] })} className="border border-surface rounded-lg px-2 py-2 text-sm"><option>OK</option><option>Elevated</option><option>High Risk</option></select><button onClick={() => setMoisture({ readings: moisture.readings.filter((item) => item.id !== reading.id) })} className="text-danger"><Trash2 size={15} /></button></div>)}</div></div> : null}
    </div>
  </article>
}

function ServiceOptionsEditor({ data, services, packages, loading, error, onChange, onSelectService }: { data: SalesBrainWorkflowData; services: PricebookService[]; packages: SalesServicePackage[]; loading: boolean; error: string | null; onChange: (data: SalesBrainWorkflowData) => void; onSelectService: (service: PricebookService) => void }) {
  const options = data.quoteOptions.filter((item) => item.kind === "chocolate" || item.kind === "vanilla")
  const quantityFor = (service: PricebookService) => data.structures.reduce((sum, structure) => sum + (service.priceBy === "per_lf" ? numberValue(structure.perimeterLinearFeet) : service.priceBy === "per_sf" ? numberValue(structure.squareFootage) : service.priceBy === "per_acre" ? numberValue(structure.acreage) : service.priceBy === "per_bedroom" ? numberValue(structure.bedrooms) : 0), 0) || 1
  const calculatedPrice = (ids: string[]) => ids.reduce((sum, id) => { const service = services.find((item) => item.id === id); return sum + (service ? Math.round(service.price * quantityFor(service)) : 0) }, 0)
  const updateOption = (id: string, patch: Partial<SalesBrainQuoteOption>) => onChange({ ...data, quoteOptions: data.quoteOptions.map((item) => item.id === id ? { ...item, ...patch } : item) })
  const setServices = (option: SalesBrainQuoteOption, serviceIds: string[], packageId?: string) => updateOption(option.id, { serviceIds, packageId, oneTimePriceCents: calculatedPrice(serviceIds) })
  const toggleService = (option: SalesBrainQuoteOption, service: PricebookService) => { const next = option.serviceIds.includes(service.id) ? option.serviceIds.filter((id) => id !== service.id) : [...option.serviceIds, service.id]; setServices(option, next); if (option.kind === "chocolate" && next.includes(service.id)) onSelectService({ ...service, price: calculatedPrice(next) }) }
  return <div className="space-y-3">
    {error ? <div className="text-sm text-danger">{error}</div> : null}{loading ? <div className="text-sm text-steel">Loading Pricebook...</div> : null}
    <div className="bg-info-light border border-info/20 rounded-xl p-3 text-xs text-info">Prices use the inspection measurements for each service's Price By rule. Authorized staff can override the final selling price on each option.</div>
    <div className="grid lg:grid-cols-2 gap-4">{options.map((option) => <article key={option.id} className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${option.kind === "chocolate" ? "border-brand-red" : "border-surface"}`}><div className="flex items-start justify-between gap-3"><div><div className="text-xs text-steel font-bold">RECOMMENDATION</div><h3 className="font-display text-2xl font-bold text-brand-dark uppercase">{option.name}</h3><p className="text-xs text-steel">{option.description}</p></div><span className={`px-2 py-1 text-xs font-bold rounded-lg ${option.kind === "chocolate" ? "bg-brand-red text-white" : "bg-surface text-steel"}`}>{option.kind === "chocolate" ? "Full Solution" : "Short Term"}</span></div>
      {packages.filter((item) => item.active).length ? <label className="block mt-3 text-xs text-steel font-semibold">Prebuilt Service Package<select value={option.packageId || ""} onChange={(event) => { const item = packages.find((entry) => entry.id === event.target.value); if (item) setServices(option, item.serviceIds, item.id); else updateOption(option.id, { packageId: undefined }) }} className="mt-1 w-full border border-surface rounded-xl px-3 py-2 text-sm"><option value="">Build manually</option>{packages.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}
      <div className="space-y-2 mt-3">{services.filter((item) => item.active).map((service) => { const selected = option.serviceIds.includes(service.id); const quantity = quantityFor(service); return <button key={service.id} onClick={() => toggleService(option, service)} className={`w-full text-left border rounded-xl p-3 ${selected ? "border-brand-red bg-brand-red/5" : "border-surface"}`}><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-brand-dark">{selected ? "✓ " : "+ "}{service.name}</div><div className="text-xs text-steel">{service.description}</div></div><div className="text-right"><div className="font-mono text-sm font-bold">${((service.price * quantity) / 100).toLocaleString()}</div><div className="text-[10px] text-steel">{priceByLabel(service.priceBy)}{service.priceBy !== "variable" ? ` × ${quantity}` : ""}</div></div></div></button> })}</div>
      <div className="mt-3"><MoneyEditRow label="Selling Price Override" cents={option.oneTimePriceCents} onChange={(value) => updateOption(option.id, { oneTimePriceCents: value })} /><MoneyEditRow label="Recurring / Renewal" cents={option.recurringPriceCents} onChange={(value) => updateOption(option.id, { recurringPriceCents: value })} /><TextRow label="Warranty / Follow-Up" value={option.warranty} onChange={(value) => updateOption(option.id, { warranty: value })} /><TextRow label="Highlights (semicolon separated)" value={option.highlights.join("; ")} onChange={(value) => updateOption(option.id, { highlights: value.split(";").map((item) => item.trim()).filter(Boolean) })} /></div>
    </article>)}</div>
  </div>
}

function PhotosStep(props: Omit<QuoteInspectionProps, "workflowData">) {
  return <StepContainer icon={<Camera size={20} />} title="Inspection Photos" sub="Upload, caption, assign, and approve customer-facing evidence">
    <input ref={props.photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={props.onAddPhotos} />
    <button onClick={() => props.photoInputRef.current?.click()} className="w-full bg-brand-dark text-white font-display font-bold uppercase py-3 rounded-xl"><Camera size={18} className="inline mr-2" />Add Inspection Photos</button>
    <div className="grid sm:grid-cols-2 gap-3">{props.inspection.photos.map((photo) => <PhotoCard key={photo.id} photo={photo} findings={props.inspection.findings.filter((finding) => !finding.hidden)} onUpdate={props.onUpdatePhoto} onRetry={props.onRetryPhoto} onRemove={props.onRemovePhoto} />)}</div>
    {props.inspection.photos.length === 0 ? <EmptyState title="No inspection photos" detail="Upload photos here or import customer-approved graph photos." /> : null}
  </StepContainer>
}

function ReviewStep({ inspection, data, onStatusChange, onAddQuoteActivity }: { inspection: SalesInspection; data: SalesBrainWorkflowData; onStatusChange: Props["onStatusChange"]; onAddQuoteActivity: Props["onAddQuoteActivity"] }) {
  const checks = [["Customer and service address complete", Boolean((data.customer.company || data.customer.first || data.customer.last) && data.customer.streetAddress && data.customer.city && data.customer.zip)], ["Structure documented", data.structures.some((item) => item.structureType)], ["Findings reviewed", inspection.findings.some((item) => !item.hidden)]] as const
  const ready = checks.every((item) => item[1])
  const [activityOpen, setActivityOpen] = useState(false)
  const [activityType, setActivityType] = useState("Quote Follow-Up")
  const [activityNote, setActivityNote] = useState("")
  return <StepContainer icon={<CheckCircle size={20} />} title="Review" sub="Staff-only completeness check before customer presentation">
    <div className={`rounded-xl p-3 flex items-center gap-2 ${ready ? "bg-success-light text-success" : "bg-amber-light text-amber"}`}>{ready ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}<span className="text-sm font-semibold">{ready ? `${inspection.estimateNumber} is ready for customer presentation` : "Resolve the warnings below before presenting"}</span></div>
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">{checks.map(([label, value]) => <div key={label} className="flex items-center gap-2">{value ? <CheckCircle size={16} className="text-success" /> : <AlertTriangle size={16} className="text-amber" />}<span className="text-sm">{label}</span></div>)}</div>
    <div className="grid sm:grid-cols-3 gap-3"><Summary label="Findings" value={inspection.findings.filter((item) => !item.hidden).length.toString()} /><Summary label="Customer Photos" value={inspection.photos.filter((photo) => photo.customerVisible !== false && photo.uploadStatus !== "error").length.toString()} /><Summary label="Structures" value={data.structures.length.toString()} /></div>
    <div className="grid sm:grid-cols-2 gap-2"><button onClick={() => void onStatusChange("declined")} className="rounded-xl border border-danger text-danger py-2.5 font-bold">Record Customer Declined</button><button onClick={() => setActivityOpen((value) => !value)} disabled={!inspection.leadId} className="rounded-xl bg-brand-dark text-white py-2.5 font-bold disabled:opacity-40">Add Customer Interaction</button></div>
    {activityOpen ? <FormCard title="Customer Interaction"><ChoiceRow label="Touch Point" value={activityType} options={LEAD_ACTIVITY_TYPES} onChange={setActivityType} /><TextRow label="Notes" value={activityNote} onChange={setActivityNote} /><button onClick={async () => { await onAddQuoteActivity({ type: activityType, note: activityNote, happenedAt: new Date().toISOString(), quoteId: inspection.id }); setActivityNote(""); setActivityOpen(false) }} className="w-full bg-brand-red text-white rounded-xl py-2.5 font-bold">Log Interaction</button></FormCard> : null}
    <p className="text-xs text-steel">There is no manual “Mark Sent” button. SalesBrain records Sent only after Gmail accepts the message.</p>
  </StepContainer>
}

function PresentationStep({ inspection, data, services, packages, loading, error, onChange, onSelectService, onPresentation }: { inspection: SalesInspection; data: SalesBrainWorkflowData; services: PricebookService[]; packages: SalesServicePackage[]; loading: boolean; error: string | null; onChange: (data: SalesBrainWorkflowData) => void; onSelectService: (service: PricebookService) => void; onPresentation: () => void }) {
  const customerOption = data.quoteOptions.find((item) => item.kind === "customer-specified")
  const choose = (id: string) => onChange({ ...data, selectedQuoteOptionId: id })
  const ensureCustomerOption = () => {
    if (customerOption) { choose(customerOption.id); return }
    const option: SalesBrainQuoteOption = { id: crypto.randomUUID(), name: "Other — Customer Specified", description: "Services selected by the customer", serviceIds: [], oneTimePriceCents: 0, recurringPriceCents: 0, warranty: "", highlights: [], recommended: false, kind: "customer-specified" }
    onChange({ ...data, quoteOptions: [...data.quoteOptions, option], selectedQuoteOptionId: option.id })
  }
  const selectedCustom = data.quoteOptions.find((item) => item.kind === "customer-specified")
  const toggleCustomService = (service: PricebookService) => { if (!selectedCustom) return; const serviceIds = selectedCustom.serviceIds.includes(service.id) ? selectedCustom.serviceIds.filter((id) => id !== service.id) : [...selectedCustom.serviceIds, service.id]; const total = serviceIds.reduce((sum, id) => sum + (services.find((item) => item.id === id)?.price || 0), 0); onChange({ ...data, quoteOptions: data.quoteOptions.map((item) => item.id === selectedCustom.id ? { ...item, serviceIds, oneTimePriceCents: total } : item) }) }
  return <StepContainer icon={<Home size={20} />} title="Customer Presentation" sub="Findings first, then photos and simple service choices">
    <div className="grid sm:grid-cols-3 gap-3"><Summary label="Approved Findings" value={inspection.findings.filter((item) => !item.hidden && item.customerVisible !== false).length.toString()} /><Summary label="Approved Photos" value={inspection.photos.filter((item) => item.customerVisible !== false && item.uploadStatus !== "error").length.toString()} /><Summary label="Visible Graph Notes" value={Object.values(data.graphNoteVisibility).filter((value) => value !== false).length.toString()} /></div>
    <div><h3 className="font-display text-xl font-bold text-brand-dark uppercase mb-3">Customer Service Options</h3><ServiceOptionsEditor data={data} services={services} packages={packages} loading={loading} error={error} onChange={onChange} onSelectService={onSelectService} /></div>
    <button onClick={ensureCustomerOption} className={`bg-white rounded-2xl p-4 text-left border-2 ${selectedCustom && data.selectedQuoteOptionId === selectedCustom.id ? "border-brand-red" : "border-surface"}`}><div className="text-xs text-steel">Optional Customer Choice</div><div className="font-display text-xl font-bold text-brand-dark uppercase">Other — Customer Specified</div><div className="text-xs text-steel mt-2">Build a custom combination of services.</div></button>
    {selectedCustom && data.selectedQuoteOptionId === selectedCustom.id ? <FormCard title="Customer-Specified Services"><div className="flex flex-wrap gap-2 py-2">{services.filter((item) => item.active).map((service) => <button key={service.id} onClick={() => toggleCustomService(service)} className={`px-3 py-2 rounded-xl border text-xs font-bold ${selectedCustom.serviceIds.includes(service.id) ? "bg-brand-dark border-brand-dark text-white" : "border-surface text-steel"}`}>{selectedCustom.serviceIds.includes(service.id) ? "✓ " : "+ "}{service.name}</button>)}</div><MoneyEditRow label="Customer-Specified Price" cents={selectedCustom.oneTimePriceCents} onChange={(value) => onChange({ ...data, quoteOptions: data.quoteOptions.map((item) => item.id === selectedCustom.id ? { ...item, oneTimePriceCents: value } : item) })} /></FormCard> : null}
    <button onClick={onPresentation} className="w-full bg-brand-red text-white font-display text-xl font-bold uppercase py-3 rounded-2xl"><Lock size={20} className="inline mr-2" />Open Customer Presentation Mode</button>
  </StepContainer>
}

function SendToCustomerStep(props: Props & { data: SalesBrainWorkflowData }) {
  const typeOptions = Object.keys(DOCUMENT_LABELS) as Array<Exclude<SalesDocumentType, "agreement">>
  const [documentType, setDocumentType] = useState<Exclude<SalesDocumentType, "agreement">>("bundle")
  const [to, setTo] = useState(props.data.customer.email)
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState(`${DOCUMENT_LABELS[documentType]} — Holloman Exterminators`)
  const [message, setMessage] = useState("Thank you for choosing Holloman Exterminators. Please review the attached inspection and service information.")
  const [result, setResult] = useState("")
  const selected = props.data.quoteOptions.find((item) => item.id === props.data.selectedQuoteOptionId)
  const latest = props.generatedDocuments.find((item) => item.type === documentType)
  const act = async (work: () => Promise<unknown>, success: string) => { setResult(""); try { await work(); setResult(success) } catch (error) { setResult(error instanceof Error ? error.message : "The action could not be completed.") } }
  const changeType = (value: string) => { const next = value as Exclude<SalesDocumentType, "agreement">; setDocumentType(next); setSubject(`${DOCUMENT_LABELS[next]} — Holloman Exterminators`) }
  return <StepContainer icon={<Mail size={20} />} title="Send to Customer" sub="Generate customer documents, then send them through the logged-in employee's Gmail">
    {selected ? <div className="bg-white rounded-2xl p-4 shadow-sm"><div className="text-xs text-steel">Selected Customer Option</div><div className="font-display text-xl font-bold text-brand-dark uppercase">{selected.name}</div><div className="font-mono text-3xl font-bold mt-2">${(selected.oneTimePriceCents / 100).toLocaleString()}</div></div> : <EmptyState title="No customer option selected" detail="Return to Customer Presentation and select Chocolate, Vanilla, or Customer Specified." />}
    <FormCard title="1. Generate / Save"><ChoiceRow label="Document" value={documentType} options={typeOptions} optionLabel={(value) => DOCUMENT_LABELS[value as keyof typeof DOCUMENT_LABELS]} onChange={changeType} /><button onClick={() => void act(() => props.onCreateDocument(documentType), `${DOCUMENT_LABELS[documentType]} generated and saved.`)} disabled={props.providerActionLoading || !selected} className="w-full bg-brand-dark text-white rounded-xl py-3 font-bold disabled:opacity-40"><Save size={17} className="inline mr-2" />Generate / Save PDF</button>{latest ? <p className="text-xs text-success mt-2">Saved: {latest.filename}</p> : <p className="text-xs text-steel mt-2">Generate this document before sending it.</p>}</FormCard>
    <FormCard title="2. Send through Gmail">
      <ReadOnlyRow label="From" value={props.employeeProfile?.email || `${props.currentUser?.name || "Current employee"} — Gmail profile not configured`} />
      <TextRow label="To" value={to} type="email" onChange={setTo} />
      <TextRow label="CC" value={cc} onChange={setCc} />
      <TextRow label="BCC" value={bcc} onChange={setBcc} />
      <TextRow label="Subject" value={subject} onChange={setSubject} />
      <label className="py-2 block"><span className="text-xs text-steel font-semibold">Message</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="mt-1 w-full border border-surface rounded-xl p-3 text-sm" /></label>
      <ReadOnlyRow label="Fixed Attachment" value={latest?.filename || "Generate the selected PDF first"} />
      <button onClick={() => latest && void act(() => props.onSendDelivery({ documentType, documentIds: [latest.id], to, cc: splitEmails(cc), bcc: splitEmails(bcc), subject, message, idempotencyKey: crypto.randomUUID() }), "Gmail accepted the message. SalesBrain recorded it as Sent.")} disabled={props.providerActionLoading || !latest || !to || !props.employeeProfile?.active || !props.employeeProfile.gmailEnabled} className="w-full bg-brand-red text-white rounded-xl py-3 font-bold disabled:opacity-40"><Send size={17} className="inline mr-2" />Send through Gmail</button>
      {!props.employeeProfile?.gmailEnabled ? <p className="text-xs text-amber mt-2">An Admin must activate the current employee's Gmail sender profile before Send is available.</p> : null}
    </FormCard>
    {result ? <div className="rounded-xl bg-surface p-3 text-sm text-brand-dark">{result}</div> : null}
    {props.deliveries.length ? <FormCard title="Delivery History"><div className="space-y-2">{props.deliveries.map((delivery) => <div key={delivery.id} className="py-2 flex items-start justify-between gap-3"><div><div className="text-sm font-bold">{DOCUMENT_LABELS[delivery.documentType]} to {delivery.recipient}</div><div className="text-xs text-steel">{new Date(delivery.createdAt).toLocaleString()}{delivery.providerMessageId ? ` · Gmail ID ${delivery.providerMessageId}` : ""}</div></div><span className={`text-xs font-bold uppercase ${delivery.status === "sent" ? "text-success" : delivery.status === "failed" ? "text-danger" : "text-amber"}`}>{delivery.status}</span></div>)}</div></FormCard> : null}
    <p className="text-xs text-steel">“Sent” means Gmail accepted the message. SalesBrain does not claim end-recipient delivery confirmation.</p>
  </StepContainer>
}

function AcceptSignStep(props: Props & { data: SalesBrainWorkflowData }) {
  const selected = props.data.quoteOptions.find((item) => item.id === props.data.selectedQuoteOptionId)
  const customerName = [props.data.customer.company, props.data.customer.first, props.data.customer.last].filter(Boolean).join(" ")
  const [message, setMessage] = useState("Please review and sign the attached Holloman Exterminators service agreement.")
  const [result, setResult] = useState("")
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const request = async () => { setResult(""); try { await props.onRequestSignature({ customerEmail: props.data.customer.email, customerName, selectedOptionId: selected!.id, message, idempotencyKey }); setResult("BoldSign request created. The asynchronous webhook will confirm when the invitation is sent.") } catch (error) { setResult(error instanceof Error ? error.message : "BoldSign could not create the signature request.") } }
  return <StepContainer icon={<FileSignature size={20} />} title="Accept & Sign" sub="BoldSign sends the official invitation, signature fields, and reminders">
    {selected ? <div className="bg-white rounded-2xl p-4 shadow-sm"><div className="font-display text-xl font-bold text-brand-dark uppercase">{selected.name}</div><div className="font-mono text-3xl font-bold mt-2">${(selected.oneTimePriceCents / 100).toLocaleString()}</div><div className="text-xs text-steel mt-2">{selected.serviceIds.length} included service{selected.serviceIds.length === 1 ? "" : "s"}</div></div> : <EmptyState title="No selected service option" detail="Select a customer option before requesting a signature." />}
    <FormCard title="BoldSign Invitation"><ReadOnlyRow label="Customer" value={customerName || "Customer name required"} /><ReadOnlyRow label="Email" value={props.data.customer.email || "Customer email required"} /><label className="py-2 block"><span className="text-xs text-steel font-semibold">Invitation Message</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="mt-1 w-full border border-surface rounded-xl p-3 text-sm" /></label><button onClick={() => void request()} disabled={props.providerActionLoading || !selected || !customerName || !props.data.customer.email || Boolean(props.signatureRequest && !["declined", "expired", "send_failed", "revoked"].includes(props.signatureRequest.status))} className="w-full bg-brand-red text-white rounded-xl py-3 font-bold disabled:opacity-40"><FileSignature size={17} className="inline mr-2" />Send for Signature through BoldSign</button></FormCard>
    {props.signatureRequest ? <div className="bg-white rounded-2xl p-4 shadow-sm"><div className="flex items-center justify-between"><strong>BoldSign Status</strong><span className="uppercase text-sm font-bold text-brand-red">{props.signatureRequest.status.replace("_", " ")}</span></div><div className="text-xs text-steel mt-2">Document ID: {props.signatureRequest.providerDocumentId || "Waiting for provider"}</div>{props.signatureRequest.status === "completed" ? <p className="text-sm text-success mt-2">Signed agreement and audit trail saved. The quote is Accepted and PestPac handoff is ready.</p> : null}</div> : null}
    {result ? <div className="rounded-xl bg-surface p-3 text-sm">{result}</div> : null}
    <p className="text-xs text-steel">The quote is not marked Accepted until BoldSign's verified Completed webhook arrives.</p>
  </StepContainer>
}

function PestPacHandoffStep(props: Props & { data: SalesBrainWorkflowData }) {
  const authorized = props.currentUser?.role === "admin" || props.currentUser?.role === "office"
  const selected = props.data.quoteOptions.find((item) => item.id === props.data.selectedQuoteOptionId)
  const initial = props.pestPacHandoff || createEmptyHandoff(props, selected)
  const [handoff, setHandoff] = useState(initial)
  const [result, setResult] = useState("")
  useEffect(() => { if (props.pestPacHandoff) setHandoff(props.pestPacHandoff) }, [props.pestPacHandoff])
  if (!authorized) return <StepContainer icon={<Lock size={20} />} title="PestPac Handoff" sub="Office-owned operational record"><EmptyState title="Office or Admin access required" detail="A technician can finish the signed workflow; office staff owns the final PestPac verification." /></StepContainer>
  if (props.signatureRequest?.status !== "completed") return <StepContainer icon={<Lock size={20} />} title="PestPac Handoff" sub="Available after verified BoldSign completion"><EmptyState title="Waiting for completed signature" detail="BoldSign must report Completed before the office handoff opens." /></StepContainer>
  const patch = (next: Partial<PestPacHandoff>) => setHandoff((current) => ({ ...current, ...next }))
  const setCheck = (key: keyof PestPacHandoff["checklist"], value: boolean) => setHandoff((current) => ({ ...current, checklist: { ...current.checklist, [key]: value } }))
  const save = async (complete: boolean) => { setResult(""); try { const saved = await props.onSavePestPacHandoff({ ...handoff, complete }); setResult(complete ? "PestPac handoff verified and completed." : "PestPac handoff saved."); if (saved) setHandoff(saved as PestPacHandoff) } catch (error) { setResult(error instanceof Error ? error.message : "Unable to save the PestPac handoff.") } }
  return <StepContainer icon={<ClipboardList size={20} />} title="PestPac Handoff" sub="Office verifies the permanent operational record">
    <div className="bg-amber-light border border-amber/25 rounded-xl p-3 text-sm text-amber"><strong>Office owner:</strong> enter or confirm the PestPac records, compare scope and price, attach the signed files when supported, then complete the checklist.</div>
    <FormCard title="PestPac Record"><TextRow label="Bill-To Number" value={handoff.billToNumber} onChange={(value) => patch({ billToNumber: value })} /><TextRow label="Location Number" value={handoff.locationNumber} onChange={(value) => patch({ locationNumber: value })} /><TextRow label="Service / Order / Agreement Reference" value={handoff.pestPacReferenceNumber} onChange={(value) => patch({ pestPacReferenceNumber: value })} /><ReadOnlyRow label="Selected Option" value={selected?.name || handoff.selectedOptionName} /><ReadOnlyRow label="One-Time Price" value={selected ? `$${(selected.oneTimePriceCents / 100).toLocaleString()}` : "—"} /><ReadOnlyRow label="Recurring Price" value={selected ? `$${(selected.recurringPriceCents / 100).toLocaleString()}` : "—"} /><ReadOnlyRow label="BoldSign Document ID" value={handoff.boldSignDocumentId} /><TextRow label="Agreement Date" type="date" value={handoff.agreementDate} onChange={(value) => patch({ agreementDate: value })} /><TextRow label="Signature Date" type="date" value={handoff.signatureDate} onChange={(value) => patch({ signatureDate: value })} /></FormCard>
    <FormCard title="Document References"><ReadOnlyRow label="Signed Agreement" value={handoff.signedAgreementR2Key || "Not saved"} /><ReadOnlyRow label="Audit Trail" value={handoff.auditTrailR2Key || "Not saved"} /><p className="py-2 text-xs text-steel">Upload these to PestPac if its attachment area supports them. Otherwise record the BoldSign ID and Customer Files reference in PestPac notes.</p></FormCard>
    <FormCard title="Office Verification Checklist">{([["customerLocationMatches", "PestPac customer and location match SalesBrain"], ["serviceScopeMatches", "Service scope and measurements match"], ["pricingMatches", "One-time and recurring pricing match"], ["signedAgreementRecorded", "Signed agreement and audit trail are attached or referenced"]] as Array<[keyof PestPacHandoff["checklist"], string]>).map(([key, label]) => <label key={key} className="py-3 flex items-start gap-3"><input type="checkbox" checked={handoff.checklist[key]} onChange={(event) => setCheck(key, event.target.checked)} className="mt-1" /><span className="text-sm">{label}</span></label>)}</FormCard>
    <div className="grid sm:grid-cols-2 gap-2"><button onClick={() => void save(false)} disabled={props.providerActionLoading} className="rounded-xl border border-surface text-steel py-3 font-bold">Save Handoff</button><button onClick={() => void save(true)} disabled={props.providerActionLoading || handoff.status === "completed"} className="rounded-xl bg-brand-red text-white py-3 font-bold disabled:opacity-40">Complete PestPac Verification</button></div>
    {result ? <div className="rounded-xl bg-surface p-3 text-sm">{result}</div> : null}
  </StepContainer>
}

function createEmptyHandoff(props: Props, selected?: SalesBrainQuoteOption): PestPacHandoff {
  return { quoteId: props.inspection.id, status: "pending", billToNumber: props.inspection.billTo?.billToNumber || "", locationNumber: props.inspection.location?.locationNumber || "", pestPacReferenceNumber: "", selectedOptionName: selected?.name || "", agreementDate: new Date().toISOString().slice(0, 10), signatureDate: "", boldSignDocumentId: props.signatureRequest?.providerDocumentId || "", signedAgreementR2Key: "", auditTrailR2Key: "", checklist: { customerLocationMatches: false, serviceScopeMatches: false, pricingMatches: false, signedAgreementRecorded: false } }
}

function PhotoCard({ photo, findings, onUpdate, onRetry, onRemove }: { photo: PhotoReference; findings: InspectionFinding[]; onUpdate: Props["onUpdatePhoto"]; onRetry: Props["onRetryPhoto"]; onRemove: Props["onRemovePhoto"] }) {
  const [expanded, setExpanded] = useState(false)
  return <article className="bg-white rounded-2xl p-3 shadow-sm"><button onClick={() => setExpanded(true)} className="relative block w-full"><img src={photo.thumbnailUrl || photo.url} alt={photo.caption || "Inspection photo"} className="w-full h-44 object-cover rounded-xl bg-surface" />{photo.uploadStatus === "uploading" ? <div className="absolute inset-0 bg-black/55 text-white grid place-items-center rounded-xl text-sm font-bold">Uploading…</div> : null}{photo.uploadStatus === "error" ? <div className="absolute inset-0 bg-danger/80 text-white grid place-items-center rounded-xl p-3 text-center"><div><div className="text-sm font-bold">{photo.uploadError || "Upload failed"}</div><button onClick={(event) => { event.stopPropagation(); void onRetry(photo.id) }} className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-danger">Retry Upload</button></div></div> : null}</button><input value={photo.caption || ""} onChange={(event) => onUpdate(photo.id, { caption: event.target.value })} placeholder="Photo caption" className="w-full mt-2 border border-surface rounded-lg px-2 py-2 text-sm" /><select value={photo.findingIds?.[0] || ""} onChange={(event) => onUpdate(photo.id, { findingIds: event.target.value ? [event.target.value] : [] })} className="w-full mt-2 border border-surface rounded-lg px-2 py-2 text-xs"><option value="">General inspection photo</option>{findings.map((finding) => <option key={finding.id} value={finding.id}>{finding.title}</option>)}</select><div className="flex items-center justify-between mt-2"><label className="text-xs text-steel flex items-center gap-2"><input type="checkbox" checked={photo.customerVisible !== false} onChange={(event) => onUpdate(photo.id, { customerVisible: event.target.checked })} /> Include in customer report</label><button onClick={() => onRemove(photo.id)} className="text-danger"><Trash2 size={15} /></button></div>{expanded ? <div className="fixed inset-0 z-50 bg-black/85 p-4 grid place-items-center" onClick={() => setExpanded(false)}><img src={photo.url} alt={photo.caption || "Inspection photo full size"} className="max-w-full max-h-full object-contain" /></div> : null}</article>
}

function groupFindings(findings: InspectionFinding[]) { const grouped: Partial<Record<MarkerCategory, InspectionFinding[]>> = {}; for (const finding of findings) (grouped[finding.category] ||= []).push(finding); return grouped }
function categoryLabel(category: MarkerCategory) { return category === "insectFindings" ? "Insect / Pest Findings" : category === "structureFindings" ? "Structure / Condition Findings" : category === "moistureFindings" ? "Moisture / Crawlspace Findings" : "Manual Findings" }
function numberValue(value: string) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : 0 }
function priceByLabel(value: PricebookService["priceBy"]) { return value === "per_lf" ? "Per LF" : value === "per_sf" ? "Per SF" : value === "per_acre" ? "Per Acre" : value === "per_bedroom" ? "Per Bedroom" : "Variable" }
function splitEmails(value: string) { return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean) }
function StepContainer({ icon, title, sub, children }: { icon: ReactNode; title: string; sub: string; children: ReactNode }) { return <div className="space-y-3 pb-3"><div className="bg-brand-charcoal rounded-2xl p-4 flex items-center gap-3"><div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center text-white">{icon}</div><div><h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">{title}</h2><p className="text-xs text-silver">{sub}</p></div></div>{children}</div> }
function FormCard({ title, children }: { title: string; children: ReactNode }) { return <div className="bg-white rounded-2xl shadow-sm p-4"><h3 className="font-display text-base font-bold text-brand-dark uppercase tracking-wide mb-2">{title}</h3><div className="divide-y divide-surface">{children}</div></div> }
function ChoiceRow({ label, value, options, onChange, disabled = false, optionLabel }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; disabled?: boolean; optionLabel?: (value: string) => string }) { return <div className={`py-3 ${disabled ? "opacity-45" : ""}`}><div className="text-xs text-steel font-semibold mb-2">{label}</div><div className="flex flex-wrap gap-2">{options.map((option) => <button type="button" key={option} disabled={disabled} onClick={() => onChange(option)} className={`px-3 py-2 rounded-xl text-xs font-bold border disabled:cursor-not-allowed ${value === option ? "bg-brand-dark border-brand-dark text-white" : "bg-white border-surface text-steel"}`}>{optionLabel ? optionLabel(option) : option}</button>)}</div></div> }
function TextRow({ label, value, onChange, type = "text", disabled = false, inputMode }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean; inputMode?: "numeric" | "text" | "email" }) { return <label className={`py-2 grid sm:grid-cols-[190px_1fr] gap-2 items-center ${disabled ? "opacity-45" : ""}`}><span className="text-xs text-steel font-semibold">{label}</span><input type={type} inputMode={inputMode} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="w-full text-sm border border-surface rounded-xl px-3 py-2 disabled:bg-surface disabled:cursor-not-allowed" /></label> }
function MoneyEditRow({ label, cents, onChange }: { label: string; cents: number; onChange: (value: number) => void }) { return <div className="py-2 grid grid-cols-[1fr_150px] gap-3 items-center"><span className="text-sm text-steel">{label}</span><CurrencyInput ariaLabel={label} cents={cents} onChange={onChange} className="border border-surface rounded-lg px-2 py-2 text-right font-mono min-w-0" /></div> }
function ReadOnlyRow({ label, value }: { label: string; value: string }) { return <div className="py-2 grid sm:grid-cols-[190px_1fr] gap-2"><span className="text-xs text-steel font-semibold">{label}</span><span className="text-sm text-brand-dark break-all">{value}</span></div> }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="bg-white rounded-2xl p-6 text-center"><div className="font-semibold text-brand-dark">{title}</div><p className="text-sm text-steel mt-1">{detail}</p></div> }
function Summary({ label, value }: { label: string; value: string }) { return <div className="bg-white rounded-2xl p-4 shadow-sm text-center"><div className="font-display text-2xl font-bold text-brand-dark">{value}</div><div className="text-xs text-steel">{label}</div></div> }
