import type { ChangeEvent, RefObject } from 'react'
import {
  AlertTriangle, Bug, Camera, CheckCircle, ChevronLeft, ChevronRight, ClipboardList,
  DollarSign, Droplets, Home, Info, Link2, Lock, Package, Plus, Save, Trash2,
} from 'lucide-react'

import type { PricebookService } from '../types/pricebook'
import type { SalesInspection } from '../types/sales-inspection'
import {
  createEmptySalesBrainWorkflowData,
  type EstimatedProductUsage,
  type SalesBrainMoistureReading,
  type SalesBrainWorkflowData,
} from '../types/figma-workflow'

const STEPS = [
  'Customer', 'Structure', 'Findings', 'Moisture', 'Services', 'Costing', 'Quote', 'Review', 'Sign',
]

interface Props {
  inspection: SalesInspection
  workflowData?: SalesBrainWorkflowData
  pricebookServices: PricebookService[]
  pricebookLoading: boolean
  pricebookError: string | null
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
  onRemoveFinding: (id: string) => void
  onAddPhotos: (event: ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: (id: string) => void
  photoInputRef: RefObject<HTMLInputElement | null>
  onAccept: () => void
}

export default function InspectionWizard(props: Props) {
  const data = props.workflowData ?? createEmptySalesBrainWorkflowData()
  const step = Math.min(9, Math.max(1, data.currentStep || 1))

  const update = (patch: Partial<SalesBrainWorkflowData>) => {
    props.onWorkflowDataChange({ ...data, ...patch })
  }
  const updateStep = (nextStep: number) => update({ currentStep: Math.min(9, Math.max(1, nextStep)) })
  const saveStep = () => {
    update({ completedSteps: data.completedSteps.includes(step) ? data.completedSteps : [...data.completedSteps, step] })
    props.onSave()
  }
  const next = () => {
    update({
      currentStep: Math.min(9, step + 1),
      completedSteps: data.completedSteps.includes(step) ? data.completedSteps : [...data.completedSteps, step],
    })
  }

  return (
    <div className="pb-32 flex flex-col min-h-screen">
      <div className="bg-white border-b border-surface px-3 py-2 sticky top-0 z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide lg:justify-center">
          {STEPS.map((label, index) => {
            const number = index + 1
            const done = data.completedSteps.includes(number)
            const active = number === step
            return (
              <button key={label} onClick={() => updateStep(number)} className="flex flex-col items-center gap-1 flex-shrink-0 px-1" aria-current={active ? 'step' : undefined}>
                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${active ? 'step-active' : done ? 'step-done' : 'step-pending'}`}>
                  {done && !active ? <CheckCircle size={14} /> : number}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-brand-red' : done ? 'text-success' : 'text-silver'}`}>{label}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-1.5 h-0.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${((step - 1) / 8) * 100}%` }} /></div>
      </div>

      <div className="flex-1 px-4 pt-3 max-w-5xl w-full mx-auto">
        {step === 1 ? <CustomerStep inspection={props.inspection} data={data} onChange={props.onWorkflowDataChange} /> : null}
        {step === 2 ? <StructureStep inspection={props.inspection} data={data} onChange={props.onWorkflowDataChange} onOpenGraph={props.onOpenGraph} /> : null}
        {step === 3 ? <FindingsStep inspection={props.inspection} onAdd={props.onAddFinding} onUpdate={props.onUpdateFinding} onRemove={props.onRemoveFinding} onAddPhotos={props.onAddPhotos} onRemovePhoto={props.onRemovePhoto} photoInputRef={props.photoInputRef} /> : null}
        {step === 4 ? <MoistureStep data={data} onChange={props.onWorkflowDataChange} /> : null}
        {step === 5 ? <ServicesStep services={props.pricebookServices} loading={props.pricebookLoading} error={props.pricebookError} selectedId={props.inspection.selectedRecommendationId} onSelect={props.onSelectService} /> : null}
        {step === 6 ? <CostingStep data={data} onChange={props.onWorkflowDataChange} /> : null}
        {step === 7 ? <QuoteStep services={props.pricebookServices} selectedId={props.inspection.selectedRecommendationId} onSelect={props.onSelectService} /> : null}
        {step === 8 ? <ReviewStep inspection={props.inspection} workflow={data} onPresentation={props.onPresentation} /> : null}
        {step === 9 ? <SignStep inspection={props.inspection} data={data} onChange={props.onWorkflowDataChange} onAccept={props.onAccept} onProposal={props.onProposal} /> : null}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface px-4 py-3 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => updateStep(step - 1)} disabled={step === 1} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-surface text-steel font-semibold text-sm disabled:opacity-30"><ChevronLeft size={18} /> Back</button>
          <button onClick={saveStep} disabled={props.isSaving} className="px-4 py-2.5 rounded-xl border border-surface text-steel font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50"><Save size={16} /> {props.isSaving ? 'Saving…' : 'Save'}</button>
          <button onClick={step === 8 ? props.onPresentation : next} disabled={step === 9} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-red text-white font-bold font-display text-lg uppercase tracking-wide disabled:opacity-30">
            {step === 8 ? 'Present' : step === 9 ? 'Done' : 'Next'}{step < 9 ? <ChevronRight size={18} /> : null}
          </button>
        </div>
        {props.saveError ? <div className="max-w-5xl mx-auto mt-2 text-xs text-danger">{props.saveError}</div> : props.savedAt ? <div className="max-w-5xl mx-auto mt-2 text-xs text-success">Saved {new Date(props.savedAt).toLocaleTimeString()}</div> : null}
      </div>
    </div>
  )
}

function CustomerStep({ inspection, data, onChange }: { inspection: SalesInspection; data: SalesBrainWorkflowData; onChange: (data: SalesBrainWorkflowData) => void }) {
  const customer = data.customer
  const patch = (field: keyof typeof customer, value: string) => onChange({ ...data, customer: { ...customer, [field]: value } })
  return (
    <StepContainer icon={<Home size={20} />} title="Customer" sub="Ops Brain identity and quote-specific contact details">
      <div className="bg-success-light border border-success/20 rounded-xl p-3 flex items-start gap-2">
        <Link2 size={16} className="text-success mt-0.5" />
        <div><div className="text-sm text-success font-semibold">{inspection.billTo?.billToName || 'No customer selected'}</div><div className="text-xs text-success/80 mt-0.5">Bill-To {inspection.billTo?.billToNumber || '—'} • Location {inspection.location?.locationNumber || '—'}</div></div>
      </div>
      <FormCard title="Customer Information">
        <ReadOnlyRow label="Account" value={inspection.billTo?.billToName || '—'} />
        <EditRow label="Phone" value={customer.phone} onChange={(value) => patch('phone', value)} />
        <EditRow label="Email" value={customer.email} onChange={(value) => patch('email', value)} />
        <EditRow label="Preferred Contact" value={customer.preferredContact} onChange={(value) => patch('preferredContact', value)} />
        <EditRow label="Referral Source" value={customer.referralSource} onChange={(value) => patch('referralSource', value)} />
      </FormCard>
      <FormCard title="Service Address"><ReadOnlyRow label="Ops Brain Location" value={inspection.location?.locationAddress || inspection.location?.locationName || '—'} /><EditRow label="Quote Address Note" value={customer.serviceAddress} onChange={(value) => patch('serviceAddress', value)} /></FormCard>
      <FormCard title="Internal Account Notes"><textarea value={customer.accountNotes} onChange={(event) => patch('accountNotes', event.target.value)} rows={3} className="w-full text-sm border border-surface rounded-xl px-3 py-2 focus:outline-none focus:border-brand-red resize-none" /><p className="text-xs text-steel mt-1">Internal only; excluded from customer presentation.</p></FormCard>
    </StepContainer>
  )
}

function StructureStep({ inspection, data, onChange, onOpenGraph }: { inspection: SalesInspection; data: SalesBrainWorkflowData; onChange: (data: SalesBrainWorkflowData) => void; onOpenGraph: () => void }) {
  const structure = data.structure
  const patch = (field: keyof typeof structure, value: string) => onChange({ ...data, structure: { ...structure, [field]: value } })
  return (
    <StepContainer icon={<Home size={20} />} title="Location & Structure" sub="Measurements stay linked to the durable BugMan Graph">
      <div className={`rounded-2xl p-4 border ${inspection.property?.hasGraph ? 'bg-success-light border-success/20' : 'bg-white border-surface'} flex items-center justify-between gap-3`}>
        <div><div className="font-semibold text-brand-dark">BugMan Graphs</div><div className="text-xs text-steel mt-1">{inspection.property?.hasGraph ? `Linked${inspection.property.graphKey ? ` • ${inspection.property.graphKey}` : ''}` : 'No graph linked yet'}</div></div>
        <button onClick={onOpenGraph} disabled={!inspection.billTo || !inspection.location} className="bg-brand-dark text-white text-sm font-bold px-4 py-2.5 rounded-xl disabled:opacity-40">{inspection.property?.hasGraph ? 'Open Graph' : 'Choose Graph'}</button>
      </div>
      <FormCard title="Structure Details">
        <EditRow label="Structure Type" value={structure.structureType} onChange={(value) => patch('structureType', value)} />
        <EditRow label="Construction / Foundation" value={structure.construction} onChange={(value) => patch('construction', value)} />
        <EditRow label="Occupancy" value={structure.occupancy} onChange={(value) => patch('occupancy', value)} />
        <EditRow label="Structure Sq Ft" value={structure.squareFootage} onChange={(value) => patch('squareFootage', value)} />
        <EditRow label="Perimeter Linear Feet" value={structure.perimeterLinearFeet} onChange={(value) => patch('perimeterLinearFeet', value)} />
        <EditRow label="Foundation Wall Height" value={structure.wallHeightFeet} onChange={(value) => patch('wallHeightFeet', value)} />
        <EditRow label="Access Notes" value={structure.access} onChange={(value) => patch('access', value)} />
      </FormCard>
    </StepContainer>
  )
}

function FindingsStep({ inspection, onAdd, onUpdate, onRemove, onAddPhotos, onRemovePhoto, photoInputRef }: {
  inspection: SalesInspection; onAdd: (summary: string) => void; onUpdate: (id: string, summary: string) => void; onRemove: (id: string) => void
  onAddPhotos: (event: ChangeEvent<HTMLInputElement>) => void; onRemovePhoto: (id: string) => void; photoInputRef: RefObject<HTMLInputElement | null>
}) {
  return (
    <StepContainer icon={<Bug size={20} />} title="Inspection Findings" sub="Graph-derived facts and technician-reviewed notes">
      <div className="bg-info-light border border-info/20 rounded-xl p-3 text-xs text-info"><strong>Human review required:</strong> findings may be imported from BugMan Graphs, but treatment and customer wording remain technician decisions.</div>
      {inspection.findings.length === 0 ? <EmptyState title="No findings recorded" detail="Open BugMan Graphs or add a technician note." /> : null}
      {inspection.findings.map((finding) => (
        <div key={finding.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-3 py-2 bg-brand-charcoal flex items-center justify-between"><div><div className="font-display text-base font-bold text-white uppercase">{finding.title}</div><div className="text-xs text-white/65">{finding.source === 'graph' ? 'Imported from BugMan Graphs' : 'Technician entry'}</div></div><button onClick={() => onRemove(finding.id)} className="text-white/60 hover:text-white" aria-label={`Remove ${finding.title}`}><Trash2 size={15} /></button></div>
          <div className="p-3"><textarea value={finding.summary} onChange={(event) => onUpdate(finding.id, event.target.value)} rows={3} className="w-full text-sm border border-surface rounded-xl px-3 py-2 focus:outline-none focus:border-brand-red resize-none" /><div className="mt-2 flex flex-wrap gap-2 text-xs text-steel"><span>{finding.category}</span>{finding.severity ? <span>• {finding.severity}</span> : null}<span>• {finding.markerIds.length} marker reference{finding.markerIds.length === 1 ? '' : 's'}</span></div></div>
        </div>
      ))}
      <button onClick={() => { const note = window.prompt('Enter the inspection finding or technician note.'); if (note) onAdd(note) }} className="w-full border-2 border-dashed border-surface rounded-xl py-3 text-sm text-steel font-semibold flex items-center justify-center gap-2"><Plus size={16} /> Add Technician Finding</button>
      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onAddPhotos} />
      <button onClick={() => photoInputRef.current?.click()} className="w-full bg-brand-dark text-white font-display font-bold uppercase py-3 rounded-xl flex items-center justify-center gap-2"><Camera size={18} /> Add Inspection Photos</button>
      {inspection.photos.length ? <div className="grid sm:grid-cols-2 gap-2">{inspection.photos.map((photo) => <div key={photo.id} className="bg-white rounded-xl p-3 flex items-center gap-3"><img src={photo.thumbnailUrl || photo.url} alt={photo.caption || 'Inspection photo'} className="w-16 h-16 rounded-lg object-cover bg-surface" /><div className="flex-1 min-w-0"><div className="text-sm font-semibold text-brand-dark truncate">{photo.caption || 'Inspection photo'}</div><div className="text-xs text-steel">{photo.source === 'bugman-graph' ? 'BugMan Graph reference' : 'Sales Brain upload'}</div></div><button onClick={() => onRemovePhoto(photo.id)} className="text-silver hover:text-danger"><Trash2 size={15} /></button></div>)}</div> : null}
    </StepContainer>
  )
}

function MoistureStep({ data, onChange }: { data: SalesBrainWorkflowData; onChange: (data: SalesBrainWorkflowData) => void }) {
  const moisture = data.moisture
  const setConditions = (conditions: Record<string, string>) => onChange({ ...data, moisture: { ...moisture, conditions } })
  const setReadings = (readings: SalesBrainMoistureReading[]) => onChange({ ...data, moisture: { ...moisture, readings } })
  const addReading = () => setReadings([...moisture.readings, { id: crypto.randomUUID(), location: '', material: '', value: 0, unit: '%RH', category: 'Elevated' }])
  const updateReading = (id: string, patch: Partial<SalesBrainMoistureReading>) => setReadings(moisture.readings.map((reading) => reading.id === id ? { ...reading, ...patch } : reading))
  return (
    <StepContainer icon={<Droplets size={20} />} title="Moisture & Crawlspace" sub="Crawlspace conditions and measured readings">
      <div className="bg-info-light border border-info/20 rounded-xl p-3 flex items-start gap-2 text-xs text-info"><Info size={15} className="mt-0.5" /><span>Record measurements without diagnosing mold or making health claims. Use “microbial growth / discoloration” language.</span></div>
      <FormCard title="Crawlspace Conditions">{['foundationType', 'approxArea', 'clearance', 'access', 'groundCover', 'standingWater', 'drainage', 'insulationCondition', 'vents', 'vaporBarrierCondition', 'odor'].map((key) => <EditRow key={key} label={key.replace(/([A-Z])/g, ' $1')} value={moisture.conditions[key] || ''} onChange={(value) => setConditions({ ...moisture.conditions, [key]: value })} />)}</FormCard>
      <div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold text-brand-dark uppercase">Moisture Readings</h3><button onClick={addReading} className="text-xs text-brand-red font-semibold flex items-center gap-1"><Plus size={14} /> Add Reading</button></div>
      {moisture.readings.length === 0 ? <EmptyState title="No moisture readings" detail="Add only readings taken during this inspection." /> : null}
      {moisture.readings.map((reading) => <div key={reading.id} className="bg-white rounded-2xl p-3 shadow-sm grid grid-cols-[90px_1fr_auto] gap-3 items-start"><div><input type="number" value={reading.value} onChange={(event) => updateReading(reading.id, { value: Number(event.target.value) })} className="w-full bg-surface rounded-lg px-2 py-2 font-mono font-bold text-center" /><input value={reading.unit} onChange={(event) => updateReading(reading.id, { unit: event.target.value })} className="w-full text-xs text-center mt-1" /></div><div><input value={reading.location} onChange={(event) => updateReading(reading.id, { location: event.target.value })} placeholder="Location" className="w-full font-semibold text-sm border-b border-surface focus:outline-none" /><input value={reading.material} onChange={(event) => updateReading(reading.id, { material: event.target.value })} placeholder="Material" className="w-full text-xs text-steel mt-2 focus:outline-none" /><select value={reading.category} onChange={(event) => updateReading(reading.id, { category: event.target.value as SalesBrainMoistureReading['category'] })} className="mt-2 text-xs bg-surface rounded-lg px-2 py-1"><option>OK</option><option>Elevated</option><option>High Risk</option></select></div><button onClick={() => setReadings(moisture.readings.filter((item) => item.id !== reading.id))} className="text-silver hover:text-danger"><Trash2 size={15} /></button></div>)}
      <FormCard title="Discoloration / Microbial Growth Observation"><textarea value={moisture.growthObservation} onChange={(event) => onChange({ ...data, moisture: { ...moisture, growthObservation: event.target.value } })} rows={3} className="w-full text-sm border border-surface rounded-xl px-3 py-2 resize-none" /></FormCard>
    </StepContainer>
  )
}

function ServicesStep({ services, loading, error, selectedId, onSelect }: { services: PricebookService[]; loading: boolean; error: string | null; selectedId?: string; onSelect: (service: PricebookService) => void }) {
  const active = services.filter((service) => service.active)
  return (
    <StepContainer icon={<ClipboardList size={20} />} title="Services & Treatment" sub="Select from the authenticated Sales Brain Pricebook">
      {error ? <div className="bg-danger-light border border-danger/25 rounded-xl p-3 text-sm text-danger">{error}</div> : null}
      {loading ? <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">Loading Pricebook…</div> : null}
      {!loading && active.length === 0 ? <EmptyState title="No active Pricebook services" detail="An administrator must add a service before a quote can be priced." /> : null}
      {active.map((service) => <button key={service.id} onClick={() => onSelect(service)} className={`w-full bg-white rounded-2xl shadow-sm p-4 text-left border-2 ${selectedId === service.id ? 'border-brand-red' : 'border-transparent'}`}><div className="flex items-start justify-between gap-3"><div><div className="font-display text-lg font-bold text-brand-dark uppercase">{service.name}</div><div className="text-xs text-steel mt-1">{service.category}</div></div><div className="font-mono text-lg font-bold text-brand-dark">${(service.price / 100).toLocaleString()}</div></div><p className="text-sm text-steel mt-3">{service.description}</p>{selectedId === service.id ? <div className="mt-3 text-xs text-success font-bold flex items-center gap-1"><CheckCircle size={13} /> Selected by technician</div> : null}</button>)}
      <div className="bg-info-light border border-info/20 rounded-xl p-3 text-xs text-info">Treatment and pricing decisions always require human selection. Sales Brain does not auto-select chemicals or service plans.</div>
    </StepContainer>
  )
}

function CostingStep({ data, onChange }: { data: SalesBrainWorkflowData; onChange: (data: SalesBrainWorkflowData) => void }) {
  const rows = data.estimatedProductUsage
  const setRows = (estimatedProductUsage: EstimatedProductUsage[]) => onChange({ ...data, estimatedProductUsage })
  const updateRow = (id: string, patch: Partial<EstimatedProductUsage>) => setRows(rows.map((row) => row.id === id ? { ...row, ...patch } : row))
  const totalCents = rows.reduce((sum, row) => sum + Math.round(row.plannedQuantity * row.catalogCostCents), 0)
  return (
    <StepContainer icon={<Package size={20} />} title="Job Costing" sub="Internal estimated product usage only">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden"><div className="px-3 py-2 bg-brand-charcoal flex items-center justify-between"><span className="font-display text-sm font-bold text-white uppercase tracking-wider">Estimated Product Usage</span><button onClick={() => setRows([...rows, { id: crypto.randomUUID(), productName: '', plannedQuantity: 1, unit: 'unit', catalogCostCents: 0 }])} className="text-xs text-white font-bold flex items-center gap-1"><Plus size={13} /> Add</button></div>{rows.length === 0 ? <div className="p-5 text-sm text-steel text-center">No estimated product usage entered.</div> : rows.map((row) => <div key={row.id} className="grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 p-3 border-t border-surface items-center"><input value={row.productName} onChange={(event) => updateRow(row.id, { productName: event.target.value })} placeholder="Product" className="border border-surface rounded-lg px-2 py-2 text-sm" /><input type="number" value={row.plannedQuantity} onChange={(event) => updateRow(row.id, { plannedQuantity: Number(event.target.value) })} className="border border-surface rounded-lg px-2 py-2 text-sm" /><input value={row.unit} onChange={(event) => updateRow(row.id, { unit: event.target.value })} className="border border-surface rounded-lg px-2 py-2 text-sm" /><input type="number" value={row.catalogCostCents / 100} onChange={(event) => updateRow(row.id, { catalogCostCents: Math.max(0, Math.round(Number(event.target.value) * 100)) })} className="border border-surface rounded-lg px-2 py-2 text-sm" /><button onClick={() => setRows(rows.filter((item) => item.id !== row.id))} className="text-silver hover:text-danger"><Trash2 size={15} /></button></div>)}</div>
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"><div><div className="font-display text-lg font-bold text-brand-dark uppercase">Estimated Product Cost</div><div className="text-xs text-steel">Quantity × catalog cost; no inventory claim</div></div><div className="font-mono text-2xl font-bold text-brand-dark">${(totalCents / 100).toLocaleString()}</div></div>
      <div className="bg-amber-light border border-amber/25 rounded-xl p-3 text-xs text-amber flex gap-2"><Lock size={14} />Internal costs never appear in customer presentation or proposal screens.</div>
    </StepContainer>
  )
}

function QuoteStep({ services, selectedId, onSelect }: { services: PricebookService[]; selectedId?: string; onSelect: (service: PricebookService) => void }) {
  return (
    <StepContainer icon={<DollarSign size={20} />} title="Quote Options" sub="Choose the actual saved pricing snapshot">
      {services.filter((service) => service.active).map((service) => <button key={service.id} onClick={() => onSelect(service)} className={`w-full bg-white rounded-2xl p-4 shadow-sm border-2 text-left ${selectedId === service.id ? 'border-brand-red' : 'border-transparent'}`}><div className="flex items-start justify-between gap-3"><div><div className="font-display text-xl font-bold text-brand-dark uppercase">{service.name}</div><div className="text-sm text-steel mt-1">{service.description}</div></div><div className="font-mono text-2xl font-bold text-brand-dark">${(service.price / 100).toLocaleString()}</div></div>{selectedId === service.id ? <div className="mt-3 bg-brand-red text-white text-xs font-bold inline-flex px-2.5 py-1 rounded-full">Selected</div> : null}</button>)}
    </StepContainer>
  )
}

function ReviewStep({ inspection, workflow, onPresentation }: { inspection: SalesInspection; workflow: SalesBrainWorkflowData; onPresentation: () => void }) {
  const checks = [
    ['Customer selected', Boolean(inspection.billTo && inspection.location)],
    ['Structure or BugMan Graph recorded', Boolean(inspection.property?.hasGraph || workflow.structure.structureType)],
    ['Inspection findings reviewed', inspection.findings.length > 0],
    ['Recommended service selected', Boolean(inspection.selectedRecommendationId && inspection.pricingSnapshot)],
  ] as const
  const ready = checks.every(([, value]) => value)
  return (
    <StepContainer icon={<CheckCircle size={20} />} title="Review & Present" sub="Confirm evidence and customer-safe output">
      <div className={`rounded-xl p-3 flex items-center gap-2 ${ready ? 'bg-success-light text-success' : 'bg-amber-light text-amber'}`}>{ready ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}<span className="text-sm font-semibold">{ready ? `${inspection.estimateNumber} is ready for customer presentation` : 'Complete the required evidence and pricing before presenting'}</span></div>
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">{checks.map(([label, value]) => <div key={label} className="flex items-center gap-2">{value ? <CheckCircle size={16} className="text-success" /> : <AlertTriangle size={16} className="text-amber" />}<span className="text-sm text-brand-dark">{label}</span></div>)}</div>
      <button onClick={onPresentation} disabled={!ready} className="w-full bg-brand-red text-white font-display text-xl font-bold uppercase tracking-wider py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40"><Lock size={20} /> Enter Customer Presentation Mode</button>
      <p className="text-xs text-steel text-center">Presentation mode hides internal costs, formulas, and staff notes. Only customer-safe information is visible.</p>
    </StepContainer>
  )
}

function SignStep({ inspection, data, onChange, onAccept, onProposal }: { inspection: SalesInspection; data: SalesBrainWorkflowData; onChange: (data: SalesBrainWorkflowData) => void; onAccept: () => void; onProposal: () => void }) {
  const acceptance = data.acceptance
  const selected = inspection.recommendations.find((item) => item.id === inspection.selectedRecommendationId)
  const atbs = /ATBS|Termite Protection Plan/i.test(selected?.name || '')
  const acknowledgements = [
    'I reviewed the inspection findings and selected service plan.',
    'I understand the scope, preparation requirements, and follow-up schedule.',
    atbs ? 'I understand the ATBS Termite Protection Plan requires EFT/ACH AutoPay.' : 'I understand results depend on conditions present at the time of service.',
  ]
  const patch = (next: Partial<typeof acceptance>) => onChange({ ...data, acceptance: { ...acceptance, ...next } })
  const canAccept = Boolean(selected && acceptance.printedName.trim() && acceptance.acknowledgements.every(Boolean))
  const capture = () => {
    if (!canAccept) return
    patch({ captured: true, signedAt: new Date().toISOString() })
    onAccept()
  }
  return (
    <StepContainer icon={<CheckCircle size={20} />} title="Accept & Sign" sub="Simple Sales Brain acceptance for ordinary agreements">
      {!selected ? <EmptyState title="No quote option selected" detail="Return to Quote and select a service." /> : <div className="bg-white rounded-2xl p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><div className="font-display text-xl font-bold text-brand-dark uppercase">{selected.name}</div><div className="text-sm text-steel mt-1">{selected.description}</div></div><div className="font-mono text-2xl font-bold text-brand-dark">${((inspection.pricingSnapshot?.totalCents || 0) / 100).toLocaleString()}</div></div></div>}
      <div className="bg-white rounded-2xl p-4 shadow-sm"><div className="font-display text-base font-bold text-brand-dark uppercase mb-3">Customer Acknowledgments</div>{acknowledgements.map((text, index) => <div key={text} className="flex items-start gap-3 mb-3"><button onClick={() => patch({ acknowledgements: acceptance.acknowledgements.map((value, itemIndex) => itemIndex === index ? !value : value) })} className={`w-12 h-8 border-2 rounded-lg text-xs font-mono flex-shrink-0 ${acceptance.acknowledgements[index] ? 'border-success bg-success-light text-success font-bold' : 'border-silver text-steel'}`}>{acceptance.acknowledgements[index] ? '✓' : 'Init.'}</button><p className="text-xs text-brand-dark flex-1">{text}</p></div>)}</div>
      <div className="bg-white rounded-2xl p-4 shadow-sm"><label className="text-xs text-steel font-semibold">Printed Name<input value={acceptance.printedName} onChange={(event) => patch({ printedName: event.target.value })} className="w-full border border-surface rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:border-brand-red" /></label>{acceptance.captured ? <div className="mt-3 border-2 border-success rounded-xl p-3 flex items-center gap-3"><CheckCircle size={24} className="text-success" /><div><div className="font-bold text-success">Acceptance Captured</div><div className="text-xs text-steel">{acceptance.printedName} • {new Date(acceptance.signedAt).toLocaleString()}</div></div></div> : <button onClick={capture} disabled={!canAccept} className="mt-3 w-full border-2 border-dashed border-surface rounded-xl h-24 text-steel font-display text-xl italic disabled:opacity-40">Tap to Accept & Sign</button>}</div>
      {acceptance.captured ? <button onClick={onProposal} className="w-full bg-brand-red text-white font-display text-xl font-bold uppercase py-3 rounded-2xl">Generate Proposal</button> : null}
      {atbs ? <div className="bg-info-light border border-info/20 rounded-xl p-3 text-xs text-info">Future validated termite-contract signatures may use DocuSign; no live DocuSign connection is claimed here.</div> : null}
    </StepContainer>
  )
}

function StepContainer({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return <div className="space-y-3 pb-3"><div className="bg-brand-charcoal rounded-2xl p-4 flex items-center gap-3"><div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center text-white">{icon}</div><div><h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">{title}</h2><p className="text-xs text-silver mt-0.5">{sub}</p></div></div>{children}</div>
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl shadow-sm p-4"><h3 className="font-display text-base font-bold text-brand-dark uppercase tracking-wide mb-2">{title}</h3><div className="divide-y divide-surface">{children}</div></div>
}

function EditRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="py-2 grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-3 items-center"><span className="text-xs text-steel font-semibold capitalize">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="w-full text-sm text-brand-dark border border-surface rounded-xl px-3 py-2 focus:outline-none focus:border-brand-red" /></label>
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return <div className="py-2 grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-3"><span className="text-xs text-steel font-semibold">{label}</span><span className="text-sm text-brand-dark">{value}</span></div>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="bg-white rounded-2xl p-6 text-center shadow-sm"><div className="font-semibold text-brand-dark">{title}</div><p className="text-sm text-steel mt-1">{detail}</p></div>
}
