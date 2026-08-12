import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Save, Camera, Plus, X, AlertTriangle, CheckCircle,
  Package, DollarSign, Thermometer, Droplets, Home, Bug, Lock, Info, ClipboardList, Tag, Trash2
} from 'lucide-react'
import { sampleCustomer, sampleStructure, sampleFindings, sampleMoisture, sampleServices, sampleProducts, internalCostData, sampleQuoteOptions } from '../data/sample'

const STEPS = [
  { num: 1, label: 'Customer' },
  { num: 2, label: 'Structure' },
  { num: 3, label: 'Findings' },
  { num: 4, label: 'Moisture' },
  { num: 5, label: 'Services' },
  { num: 6, label: 'Costing' },
  { num: 7, label: 'Quote' },
  { num: 8, label: 'Review' },
  { num: 9, label: 'Sign' },
]

interface Props {
  onPresentation: () => void
  onProposal: () => void
  onPhotoAnnotation?: () => void
  onServiceBundles?: () => void
  initialStep?: number
  customerName?: string
}

export default function InspectionWizard({ onPresentation, onProposal, onPhotoAnnotation, onServiceBundles, initialStep = 1, customerName }: Props) {
  const [step, setStep] = useState(initialStep)
  const [savedSteps, setSavedSteps] = useState<number[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>(['svc-001', 'svc-002'])
  const [signatureCaptured, setSignatureCaptured] = useState(false)
  const [selectedQuoteOption, setSelectedQuoteOption] = useState('opt-recommended')

  const saveStep = () => {
    setSavedSteps(prev => prev.includes(step) ? prev : [...prev, step])
  }

  const next = () => { saveStep(); setStep(s => Math.min(9, s + 1)) }
  const prev = () => setStep(s => Math.max(1, s - 1))

  return (
    <div className="pb-28 flex flex-col min-h-screen">
      {/* Step indicator */}
      <div className="bg-white border-b border-surface px-3 py-2 sticky top-0 z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {STEPS.map((s) => {
            const done = savedSteps.includes(s.num) || s.num < step
            const active = s.num === step
            return (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className="flex flex-col items-center gap-1 flex-shrink-0 px-1"
              >
                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  active ? 'step-active' : done ? 'step-done' : 'step-pending'
                }`}>
                  {done && !active ? <CheckCircle size={14} /> : s.num}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-brand-red' : done ? 'text-success' : 'text-silver'}`}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-1.5 h-0.5 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${((step - 1) / 8) * 100}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 pt-2">
        {step === 1 && <StepCustomer customerName={customerName} />}
        {step === 2 && <StepStructure />}
        {step === 3 && <StepFindings onAnnotate={onPhotoAnnotation} />}
        {step === 4 && <StepMoisture />}
        {step === 5 && <StepServices selectedServices={selectedServices} setSelectedServices={setSelectedServices} onBundles={onServiceBundles} />}
        {step === 6 && <StepCosting />}
        {step === 7 && <StepQuote selectedOption={selectedQuoteOption} setSelectedOption={setSelectedQuoteOption} />}
        {step === 8 && <StepReview onPresentation={onPresentation} />}
        {step === 9 && <StepSign signatureCaptured={signatureCaptured} setSignatureCaptured={setSignatureCaptured} onProposal={onProposal} />}
      </div>

      {/* Navigation footer */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface px-4 py-3 flex items-center gap-3 z-20">
        <button
          onClick={prev}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-surface text-steel font-semibold text-sm disabled:opacity-30 active:scale-97 transition-all hover:border-steel/40"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={saveStep}
          className="px-4 py-2.5 rounded-xl border border-surface text-steel font-semibold text-sm active:scale-97 transition-all hover:border-steel/40 flex items-center gap-1.5"
        >
          <Save size={16} />
          Save
        </button>
        <button
          onClick={step === 8 ? onPresentation : next}
          disabled={step === 9}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-red text-white font-bold font-display text-lg uppercase tracking-wide disabled:opacity-30 active:scale-97 transition-all"
        >
          {step === 8 ? 'Present' : step === 9 ? 'Done' : 'Next'}
          {step < 9 && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  )
}

/* ─── Step 1: Customer ─── */
function StepCustomer({ customerName }: { customerName?: string }) {
  const c = sampleCustomer
  const [name, setName] = useState(customerName || c.name)
  const [phone, setPhone] = useState(c.phone)
  const [email, setEmail] = useState(c.email)
  const [preferred, setPreferred] = useState(c.preferredContact)
  const [referral, setReferral] = useState(c.referralSource)
  const [address, setAddress] = useState(c.serviceAddress)
  const [notes, setNotes] = useState(c.accountNotes)
  const [pestPacBill, setPestPacBill] = useState('')
  const [pestPacLoc, setPestPacLoc] = useState('')

  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<Home size={20} className="text-white" />} title="Customer" sub="Search or create a customer record" />

      <div className="relative">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-surface rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-brand-red bg-white"
          placeholder="Search customers…"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center">
            <CheckCircle size={12} className="text-white" />
          </div>
        </div>
      </div>

      <div className="bg-success-light border border-success/20 rounded-xl px-3 py-2 flex items-center gap-2">
        <CheckCircle size={15} className="text-success" />
        <span className="text-sm text-success font-semibold">Existing customer found: {name}</span>
      </div>

      <FormCard title="Customer Information">
        <EditRow label="Full Name / Account" value={name} onChange={setName} />
        <EditRow label="Phone" value={phone} onChange={setPhone} type="tel" />
        <EditRow label="Email" value={email} onChange={setEmail} type="email" />
        <EditRowSelect label="Preferred Contact" value={preferred} onChange={setPreferred} options={['Text', 'Call', 'Email']} />
        <EditRowSelect label="Referral Source" value={referral} onChange={setReferral} options={['Customer Referral', 'Web Lead', 'Call-In', 'Self-Solicit', 'Existing Customer Add Service', 'Other']} />
      </FormCard>

      <FormCard title="Ops Brain Folder Mapping">
        <EditRow label="Bill-To Number" value={pestPacBill} onChange={setPestPacBill} placeholder="e.g. 100042" mono />
        <EditRow label="Location Number" value={pestPacLoc} onChange={setPestPacLoc} placeholder="e.g. 200017" mono />
        <div className="pt-2 flex items-center gap-2">
          <span className="text-xs text-silver">●</span>
          <span className="text-xs text-silver italic">Not Linked</span>
        </div>
        <p className="text-xs text-steel mt-1 italic">Optional — maps this customer to an existing Ops Brain folder</p>
      </FormCard>

      <FormCard title="Service Address">
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="w-full text-sm text-brand-dark border border-surface rounded-xl px-3 py-2 mt-1 focus:outline-none focus:border-brand-red"
        />
        <button className="text-xs text-brand-red font-semibold mt-2">+ Add different billing address</button>
      </FormCard>

      <FormCard title="Account Notes">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full text-sm text-brand-dark italic border border-surface rounded-xl px-3 py-2 mt-1 focus:outline-none focus:border-brand-red resize-none"
        />
      </FormCard>
    </div>
  )
}

/* ─── Step 2: Structure ─── */
const STRUCTURE_TYPES = [
  'Main Structure / Home', 'Detached Structure (Barn, Pump House, etc.)',
  'Duplex', 'Apartment Building', 'Apartment Unit', 'Townhome',
  'Warehouse', 'Restaurant', 'Office Building', 'Storage Units', 'School', 'Other',
]
const CONSTRUCTION_TYPES = ['Brick Veneer', 'Slab', 'Basement', 'Combination']
const OCCUPANCY_TYPES = ['Owner-Occupied', 'Vacant', 'Tenant-Occupied', 'Other']

function PickerSection({ label, options, value, onChange, otherValue, onOtherChange }: {
  label: string; options: string[]; value: string | null; onChange: (v: string) => void
  otherValue?: string; onOtherChange?: (v: string) => void
}) {
  const showOther = value === 'Other' && onOtherChange !== undefined
  return (
    <div>
      <span className="text-xs text-steel uppercase tracking-wider font-bold block mb-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border text-center leading-tight transition-all ${
              value === opt ? 'bg-brand-red border-brand-red text-white' : 'bg-white border-surface text-steel hover:border-steel/40'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {showOther && (
        <input
          autoFocus
          value={otherValue}
          onChange={e => onOtherChange(e.target.value)}
          placeholder="Describe structure type…"
          className="w-full mt-2 border border-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
        />
      )}
    </div>
  )
}

function StepStructure() {
  const s = sampleStructure
  const [structureType, setStructureType] = useState<string | null>('Main Structure / Home')
  const [structureOther, setStructureOther] = useState('')
  const [construction, setConstruction] = useState<string | null>('Brick Veneer')
  const [occupancy, setOccupancy] = useState<string | null>('Owner-Occupied')
  const [sqft, setSqft] = useState(s.sqft.toString())
  const [perimeterLF, setPerimeterLF] = useState(s.perimeterLF.toString())
  const [wallHeight, setWallHeight] = useState('')
  const [access, setAccess] = useState<string | null>(null)

  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<Home size={20} className="text-white" />} title="Location & Structure" sub="Record structure type, measurements, and access" />

      <PickerSection
        label="Structure Type"
        options={STRUCTURE_TYPES}
        value={structureType}
        onChange={setStructureType}
        otherValue={structureOther}
        onOtherChange={setStructureOther}
      />

      <PickerSection
        label="Construction / Foundation"
        options={CONSTRUCTION_TYPES}
        value={construction}
        onChange={setConstruction}
      />

      <PickerSection
        label="Occupancy"
        options={OCCUPANCY_TYPES}
        value={occupancy}
        onChange={setOccupancy}
      />

      <div>
        <span className="text-xs text-steel uppercase tracking-wider font-bold block mb-2">Measurements</span>
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-0">
          <EditRow label="Structure Sq Ft" value={sqft} onChange={setSqft} mono />
          <EditRow label="Linear Footage (perimeter)" value={perimeterLF} onChange={setPerimeterLF} mono />
          <EditRow label="Foundation Wall Height (ft)" value={wallHeight} onChange={setWallHeight} placeholder="optional" mono />
        </div>
      </div>

      <div>
        <span className="text-xs text-steel uppercase tracking-wider font-bold block mb-2">Crawlspace Access</span>
        <div className="grid grid-cols-3 gap-2">
          {['Not Accessible', 'Low Crawlspace Height', 'Optimal Crawlspace Height'].map(opt => (
            <button
              key={opt}
              onClick={() => setAccess(access === opt ? null : opt)}
              className={`py-3 px-2 rounded-xl text-xs font-bold border text-center leading-tight transition-all ${
                access === opt ? 'bg-brand-red border-brand-red text-white' : 'bg-white border-surface text-steel hover:border-steel/40'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button className="w-full border-2 border-dashed border-surface rounded-xl py-2.5 text-sm text-steel font-semibold flex items-center justify-center gap-2 hover:border-brand-red/40 hover:text-brand-red transition-all active:scale-97">
        <Plus size={16} />
        Add Structure / Treatment Zone
      </button>
    </div>
  )
}

/* ─── Step 3: Findings ─── */
type Finding = typeof sampleFindings[0] & { evidence: string; damage: string; conduciveConditions: string; includeInReport: boolean; techNotes: string }

function StepFindings({ onAnnotate }: { onAnnotate?: () => void }) {
  const [selectedCategories, setSelectedCategories] = useState(['Termite Activity', 'Moisture / Elevated Humidity'])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['f-001', 'f-002']))
  const toggleExpanded = (id: string) => setExpandedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const [findings, setFindings] = useState<Finding[]>(
    sampleFindings.map(f => ({ ...f, evidence: f.evidence, damage: f.damage, conduciveConditions: f.conduciveConditions, includeInReport: f.includeInReport, techNotes: f.techNotes ?? '' }))
  )
  const categories = [
    'Termite Activity', 'Moisture / Elevated Humidity', 'General Pests', 'Bed Bugs',
    'Fleas', 'German Roaches', 'Rodent Infestation', 'Wood Decaying Fungi',
    'Fire Ants', 'Wasps / Hornets / Yellow Jackets', 'Carpenter Bees',
    'PowderPost Beetles', 'Old House Borer Beetles',
    'Faulty Insulation', 'Moisture Barrier in Disrepair', 'Crawlspace Door in Disrepair',
    'Standing Water', 'Possible Leak', 'HVAC Condensation',
    'Inoperable Sump Pump', 'Inoperable Dehumidifier',
    'Extensive Crawlspace Debris', 'Wood to Soil Contact',
    'Foundation Penetrations / Cracks', 'HVAC Disconnected / Hanging / Disrepair',
    'Wildlife', 'Wood Decay', 'Structural Concern',
  ]

  const updateFinding = (idx: number, patch: Partial<Finding>) => {
    setFindings(fs => fs.map((f, i) => i === idx ? { ...f, ...patch } : f))
  }

  const addFinding = () => {
    const newCat = categories.find(c => !findings.some(f => f.category === c)) || 'New Finding'
    setFindings(fs => [...fs, {
      id: `finding-${Date.now()}`, category: newCat, severity: 'Active', area: 'To be completed',
      evidence: '', damage: '', conduciveConditions: '', includeInReport: true, techNotes: '', photos: []
    } as Finding])
  }

  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<Bug size={20} className="text-white" />} title="Inspection Findings" sub="Select categories and record evidence, photos, and notes" />

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedCategories.includes(cat) ? 'bg-brand-red border-brand-red text-white' : 'bg-white border-surface text-steel'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {findings.map((finding, idx) => {
        const expanded = expandedIds.has(finding.id)
        const accentBg = idx === 0 ? 'bg-brand-red' : 'bg-amber'
        return (
        <div key={finding.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div
            className={`px-3 py-2 flex items-center justify-between cursor-pointer select-none ${accentBg}`}
            onClick={() => toggleExpanded(finding.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <select
                value={finding.severity}
                onChange={e => updateFinding(idx, { severity: e.target.value })}
                onClick={e => e.stopPropagation()}
                className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border-0 focus:outline-none cursor-pointer flex-shrink-0"
              >
                {['Active', 'Elevated', 'Potential', 'Monitor'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                value={finding.category}
                onChange={e => updateFinding(idx, { category: e.target.value })}
                onClick={e => e.stopPropagation()}
                className="font-display text-base font-bold text-white uppercase tracking-wide bg-transparent border-0 focus:outline-none focus:bg-white/10 rounded px-1 min-w-0"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={e => { e.stopPropagation(); updateFinding(idx, { includeInReport: !finding.includeInReport }) }}
                className={`text-xs px-2 py-0.5 rounded-full font-bold transition-all ${finding.includeInReport ? 'bg-white/30 text-white' : 'bg-black/20 text-white/60'}`}
              >
                {finding.includeInReport ? '✓ In Report' : '✗ Internal'}
              </button>
              <button onClick={e => { e.stopPropagation(); setFindings(fs => fs.filter((_, i) => i !== idx)) }} className="text-white/60 hover:text-white transition-all">
                <Trash2 size={14} />
              </button>
              <ChevronRight size={16} className={`text-white/70 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
            </div>
          </div>

          {expanded && <div className="p-3 space-y-2.5">
            <input
              value={finding.area}
              onChange={e => updateFinding(idx, { area: e.target.value })}
              className="w-full bg-surface rounded-xl px-3 py-2 text-xs text-steel font-semibold uppercase tracking-wider focus:outline-none focus:border focus:border-brand-red/40"
              placeholder="Location / Area"
            />

            <div>
              <span className="text-xs text-steel uppercase tracking-wider font-semibold">Evidence Observed</span>
              <textarea
                value={finding.evidence}
                onChange={e => updateFinding(idx, { evidence: e.target.value })}
                rows={2}
                className="w-full text-sm text-brand-dark border border-surface rounded-xl px-3 py-2 mt-1 focus:outline-none focus:border-brand-red resize-none"
                placeholder="Describe observed evidence…"
              />
            </div>

            <div>
              <span className="text-xs text-steel uppercase tracking-wider font-semibold">Damage Assessment</span>
              <textarea
                value={finding.damage}
                onChange={e => updateFinding(idx, { damage: e.target.value })}
                rows={2}
                className="w-full text-sm text-brand-dark border border-surface rounded-xl px-3 py-2 mt-1 focus:outline-none focus:border-brand-red resize-none"
                placeholder="Describe damage observed…"
              />
            </div>

            <div>
              <span className="text-xs text-steel uppercase tracking-wider font-semibold">Conducive Conditions</span>
              <textarea
                value={finding.conduciveConditions}
                onChange={e => updateFinding(idx, { conduciveConditions: e.target.value })}
                rows={2}
                className="w-full text-sm text-brand-dark border border-surface rounded-xl px-3 py-2 mt-1 focus:outline-none focus:border-brand-red resize-none"
                placeholder="List conducive conditions…"
              />
            </div>

            {/* Photo grid */}
            <div>
              <span className="text-xs text-steel uppercase tracking-wider font-semibold block mb-2">Photos ({finding.photos.length})</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {finding.photos.map((_p, pi) => (
                  <div key={pi} className={`w-20 h-20 flex-shrink-0 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                    pi % 3 === 0 ? 'bg-brand-charcoal' : pi % 3 === 1 ? 'bg-brand-dark' : 'bg-steel'
                  }`}>
                    <div className="text-center">
                      <Camera size={18} className="mx-auto mb-1 opacity-60" />
                      <span className="opacity-60">Photo {pi + 1}</span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={onAnnotate}
                  className="w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-surface flex items-center justify-center text-steel hover:border-brand-red/40 hover:text-brand-red transition-all"
                >
                  <div className="text-center">
                    <Camera size={18} className="mx-auto mb-1" />
                    <span className="text-xs">Add / Edit</span>
                  </div>
                </button>
              </div>
            </div>

            {!finding.includeInReport && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Lock size={13} className="text-amber" />
                  <span className="text-xs font-bold text-amber">INTERNAL NOTE — not included in customer report</span>
                </div>
                <textarea
                  value={finding.techNotes}
                  onChange={e => updateFinding(idx, { techNotes: e.target.value })}
                  rows={2}
                  className="w-full text-xs text-brand-dark bg-amber-light border border-amber/30 rounded-xl px-3 py-2 focus:outline-none focus:border-amber resize-none"
                  placeholder="Internal technician note…"
                />
              </div>
            )}
          </div>}
        </div>
        )
      })}

      <button
        onClick={onAnnotate}
        className="w-full bg-brand-dark text-white font-display text-base font-bold uppercase tracking-wide py-3 rounded-xl flex items-center justify-center gap-2 active:scale-97 transition-all"
      >
        <Camera size={18} />
        Open Photo Annotation Tool
      </button>

      <button
        onClick={addFinding}
        className="w-full border-2 border-dashed border-surface rounded-xl py-3 text-sm text-steel font-semibold flex items-center justify-center gap-2 hover:border-brand-red/40 hover:text-brand-red transition-all active:scale-97"
      >
        <Plus size={16} />
        Add Finding Category
      </button>
    </div>
  )
}

/* ─── Step 4: Moisture & Crawlspace ─── */
interface MoistureReading {
  id: string; location: string; material: string; value: number; unit: string;
  category: string; riskColor: string; temp?: number | null
}

function StepMoisture() {
  const m = sampleMoisture
  const riskColors: Record<string, string> = {
    'ok': 'bg-success-light text-success',
    'Elevated': 'bg-amber-light text-amber',
    'High Risk': 'bg-danger-light text-danger',
  }

  const [conditions, setConditions] = useState({
    foundationType: m.foundationType,
    approxArea: m.approxArea,
    clearance: m.clearance,
    access: m.access,
    groundCover: m.groundCover,
    standingWater: m.standingWater,
    drainage: m.drainage,
    insulationCondition: m.insulationCondition,
    vents: m.vents,
    vaporBarrierCondition: m.vaporBarrierCondition,
    odor: m.odor,
  })

  const [readings, setReadings] = useState<MoistureReading[]>(m.readings.map(r => ({ ...r, temp: r.temp ?? undefined })))
  const [growthNote, setGrowthNote] = useState(m.moldLikeGrowth)

  const updateReading = (idx: number, patch: Partial<MoistureReading>) => {
    setReadings(rs => rs.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  const addReading = () => {
    setReadings(rs => [...rs, {
      id: `r-${Date.now()}`, location: 'New Location', material: '', value: 0, unit: '%RH',
      category: 'Elevated', riskColor: 'amber', temp: undefined
    }])
  }

  const removeReading = (idx: number) => setReadings(rs => rs.filter((_, i) => i !== idx))

  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<Droplets size={20} className="text-white" />} title="Moisture & Crawlspace" sub="Crawlspace assessment and moisture readings" />

      <div className="bg-info-light border border-info/20 rounded-xl p-3 flex items-start gap-2">
        <Info size={15} className="text-info flex-shrink-0 mt-0.5" />
        <p className="text-xs text-info">
          <strong>Reference:</strong> Wood moisture content above 19% supports decay fungi. Relative humidity above 60% is considered elevated for crawlspaces. Do not diagnose mold or make health claims — use "microbial growth / discoloration" language.
        </p>
      </div>

      <FormCard title="Crawlspace Conditions">
        <div className="space-y-2">
          {(Object.entries(conditions) as [string, string][]).map(([key, val]) => (
            <EditRow
              key={key}
              label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              value={val}
              onChange={v => setConditions(c => ({ ...c, [key]: v }))}
            />
          ))}
        </div>
      </FormCard>

      {/* Moisture readings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-lg font-bold text-brand-dark uppercase tracking-wide">Moisture Readings</span>
          <button onClick={addReading} className="flex items-center gap-1 text-xs text-brand-red font-semibold active:scale-95 transition-all">
            <Plus size={14} /> Add Reading
          </button>
        </div>

        <div className="space-y-3">
          {readings.map((r, idx) => (
            <div key={r.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-start gap-3">
              <div className={`flex-shrink-0 rounded-lg text-center min-w-[72px] ${
                r.riskColor === 'red' ? 'bg-danger-light' : r.riskColor === 'amber' ? 'bg-amber-light' : 'bg-success-light'
              }`}>
                <input
                  type="number"
                  value={r.value}
                  onChange={e => updateReading(idx, { value: Number(e.target.value) })}
                  className={`w-full font-mono text-xl font-bold text-center bg-transparent border-0 focus:outline-none py-1.5 ${r.riskColor === 'red' ? 'text-danger' : r.riskColor === 'amber' ? 'text-amber' : 'text-success'}`}
                />
                <select
                  value={r.unit}
                  onChange={e => updateReading(idx, { unit: e.target.value })}
                  className={`text-xs font-semibold bg-transparent border-0 focus:outline-none pb-1.5 cursor-pointer ${r.riskColor === 'red' ? 'text-danger' : r.riskColor === 'amber' ? 'text-amber' : 'text-success'}`}
                >
                  {['%RH', '%MC', '°F', 'ppm'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <input
                  value={r.location}
                  onChange={e => updateReading(idx, { location: e.target.value })}
                  className="font-semibold text-sm text-brand-dark w-full border-0 border-b border-surface focus:outline-none focus:border-brand-red bg-transparent pb-0.5"
                  placeholder="Location"
                />
                <input
                  value={r.material}
                  onChange={e => updateReading(idx, { material: e.target.value })}
                  className="text-xs text-steel w-full border-0 focus:outline-none bg-transparent mt-0.5"
                  placeholder="Material"
                />
                {r.temp !== undefined && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-silver">
                    <Thermometer size={11} />
                    <input
                      type="number"
                      value={r.temp ?? ''}
                      onChange={e => updateReading(idx, { temp: Number(e.target.value) })}
                      className="w-14 border-0 border-b border-surface focus:outline-none text-silver bg-transparent text-xs"
                    />
                    <span>°F ambient</span>
                  </div>
                )}
                <select
                  value={r.category}
                  onChange={e => {
                    const cat = e.target.value
                    const color = cat === 'High Risk' ? 'red' : cat === 'Elevated' ? 'amber' : 'green'
                    updateReading(idx, { category: cat, riskColor: color })
                  }}
                  className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full border-0 focus:outline-none cursor-pointer ${riskColors[r.category] || 'bg-surface text-steel'}`}
                >
                  {['ok', 'Elevated', 'High Risk'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={() => removeReading(idx)} className="text-silver hover:text-danger transition-all p-1 flex-shrink-0 active:scale-90">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs text-steel uppercase tracking-wider font-semibold block mb-2">Discoloration / Microbial Growth Observation</span>
        <textarea
          value={growthNote}
          onChange={e => setGrowthNote(e.target.value)}
          rows={3}
          className="w-full bg-amber-light border border-amber/30 rounded-xl p-3 text-sm text-brand-dark focus:outline-none focus:border-amber resize-none"
          placeholder="Describe discoloration or microbial growth observed…"
        />
        <p className="text-xs text-steel mt-1.5 italic">
          ⚠ Use approved language only. Do not state or imply mold diagnosis in customer-facing documents.
        </p>
      </div>
    </div>
  )
}

/* ─── Step 5: Services ─── */
function StepServices({ selectedServices, setSelectedServices, onBundles }: { selectedServices: string[], setSelectedServices: (v: string[]) => void, onBundles?: () => void }) {
  const toggle = (id: string) => {
    setSelectedServices(selectedServices.includes(id) ? selectedServices.filter(s => s !== id) : [...selectedServices, id])
  }

  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<ClipboardList size={20} className="text-white" />} title="Services & Treatment" sub="Choose services or apply a pre-configured bundle" />

      <button
        onClick={onBundles}
        className="w-full bg-white border border-surface rounded-xl px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-98"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-red rounded-xl flex items-center justify-center">
            <Tag size={16} className="text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-brand-dark text-sm">View Service Bundles</div>
            <div className="text-xs text-steel">Pre-configured plans with bundled savings</div>
          </div>
        </div>
        <ChevronRight size={18} className="text-silver" />
      </button>

      {sampleServices.map(svc => {
        const selected = selectedServices.includes(svc.id)
        const products = sampleProducts.filter(p => svc.products.includes(p.id))
        return (
          <div key={svc.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all ${selected ? 'border-brand-red' : 'border-transparent'}`}>
            <button
              onClick={() => toggle(svc.id)}
              className="w-full p-4 flex items-start gap-3 text-left"
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${selected ? 'border-brand-red bg-brand-red' : 'border-surface'}`}>
                {selected && <CheckCircle size={14} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-lg font-bold text-brand-dark uppercase tracking-wide leading-tight">{svc.name}</div>
                    <span className="inline-block bg-surface text-steel text-xs px-2 py-0.5 rounded-full font-semibold mt-1">{svc.category}</span>
                  </div>
                  {selected && <span className="text-xs bg-brand-red text-white px-2.5 py-1 rounded-full font-bold flex-shrink-0">Selected</span>}
                </div>
                <p className="text-sm text-steel mt-2 leading-relaxed">{svc.method}</p>
              </div>
            </button>

            {selected && (
              <div className="border-t border-surface px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-steel font-semibold">Labor Hours</span><div className="font-mono text-brand-dark mt-0.5">{svc.laborHours} hrs × {svc.crewSize} crew</div></div>
                  <div><span className="text-steel font-semibold">Frequency</span><div className="text-brand-dark mt-0.5">{svc.frequency}</div></div>
                  <div className="col-span-2"><span className="text-steel font-semibold">Warranty</span><div className="text-brand-dark mt-0.5">{svc.warranty}</div></div>
                  <div className="col-span-2">
                    <span className="text-steel font-semibold">Preparation Required</span>
                    <div className="text-brand-dark mt-0.5">{svc.prepRequired}</div>
                  </div>
                </div>
                {products.length > 0 && (
                  <div>
                    <span className="text-xs text-steel uppercase tracking-wider font-semibold block mb-2">Products Planned</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {products.map(prod => (
                        <div key={prod.id} className="flex-shrink-0 w-32 rounded-xl overflow-hidden border border-surface">
                          <div className="h-16 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: prod.imageColor }}>
                            {prod.imageLabel}
                          </div>
                          <div className="p-2">
                            <div className="text-xs font-semibold text-brand-dark leading-tight">{prod.name}</div>
                            <div className="text-xs text-steel mt-0.5 leading-snug">{prod.purpose}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Step 6: Internal Costing ─── */
type MaterialRow = typeof internalCostData.materials[0] & { qtyPull: number }

function StepCosting() {
  const data = internalCostData
  const [materials, setMaterials] = useState<MaterialRow[]>(data.materials.map(m => ({ ...m })))

  const updateMaterial = (idx: number, patch: Partial<MaterialRow>) =>
    setMaterials(ms => ms.map((m, i) => i === idx ? { ...m, ...patch } : m))

  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<Package size={20} className="text-white" />} title="Job Costing" sub="Estimated product usage, labor, and cost summary" />

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-brand-charcoal">
          <span className="font-display text-sm font-bold text-white uppercase tracking-wider">Estimated Product Usage</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface">
                <th className="text-left px-2.5 py-2 text-steel font-semibold">Product</th>
                <th className="text-right px-2.5 py-2 text-steel font-semibold">Planned Qty</th>
                <th className="text-right px-2.5 py-2 text-steel font-semibold">Unit Cost</th>
                <th className="text-right px-2.5 py-2 text-steel font-semibold">Est. Extended Cost</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={i} className="border-t border-surface">
                  <td className="px-2.5 py-2">
                    <div className="font-semibold text-brand-dark">{m.product}</div>
                    <div className="text-silver font-mono">{m.sku}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      value={m.qtyPull}
                      onChange={e => updateMaterial(i, { qtyPull: Number(e.target.value) })}
                      className="w-16 font-mono font-bold text-brand-dark text-right bg-surface rounded px-1 py-0.5 border-0 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                    <span className="ml-1 text-steel">{m.unit}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-steel">${m.unitCost.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-brand-dark">${(m.qtyPull * m.unitCost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-brand-charcoal">
          <span className="font-display text-sm font-bold text-white uppercase tracking-wider">Labor Plan</span>
        </div>
        {data.labor.map((l, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 border-t border-surface text-sm">
            <div>
              <span className="font-semibold text-brand-dark">{l.role}</span>
              <span className="text-steel ml-2 text-xs">{l.service}</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-steel text-xs">{l.hours}h × ${l.rate}/hr</span>
              <div className="font-mono font-bold text-brand-dark">${l.total.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-brand-charcoal">
          <span className="font-display text-sm font-bold text-white uppercase tracking-wider">Job Cost Summary</span>
        </div>
        <div className="p-3 space-y-1.5">
          {[
            ['Materials', data.summary.materials],
            ['Labor', data.summary.labor],
            ['Equipment / Travel / Disposal', data.summary.other],
            ['Overhead Allocation', data.summary.overhead],
            ['Contingency', data.summary.contingency],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between text-sm">
              <span className="text-steel">{label as string}</span>
              <span className="font-mono text-brand-dark">${(val as number).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-surface pt-2 mt-2 flex justify-between font-bold">
            <span className="text-brand-dark">Total Direct Cost</span>
            <span className="font-mono text-brand-dark">${data.summary.totalDirectCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-steel">Recommended Min. Price ({data.summary.targetMarginPct}% target)</span>
            <span className="font-mono text-steel">${data.summary.recommendedMinPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-1">
            <span className="text-brand-dark">Quoted Price</span>
            <span className="font-mono text-brand-red">${data.summary.quotedPrice.toFixed(2)}</span>
          </div>
          <div className="bg-surface rounded-xl p-3 mt-2 grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="font-mono text-xl font-bold text-success">${data.summary.grossProfitDollars.toFixed(0)}</div>
              <div className="text-xs text-steel">Gross Profit</div>
            </div>
            <div>
              <div className={`font-mono text-xl font-bold ${data.summary.grossMarginPct >= data.summary.targetMarginPct ? 'text-success' : 'text-amber'}`}>
                {data.summary.grossMarginPct}%
              </div>
              <div className="text-xs text-steel">Gross Margin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 7: Quote Builder ─── */
function StepQuote({ selectedOption, setSelectedOption }: { selectedOption: string, setSelectedOption: (v: string) => void }) {
  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<DollarSign size={20} className="text-white" />} title="Quote Options" sub="Build and compare pricing options for the customer" />

      <p className="text-xs text-steel">Select up to 3 options. The <strong>Recommended</strong> option will be highlighted in the customer proposal.</p>

      {sampleQuoteOptions.map(opt => (
        <button
          key={opt.id}
          onClick={() => setSelectedOption(opt.id)}
          className={`w-full bg-white rounded-2xl shadow-sm overflow-hidden border-2 text-left transition-all active:scale-98 ${
            selectedOption === opt.id ? 'border-brand-red' : 'border-transparent'
          }`}
        >
          <div className="p-3 flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{ borderColor: selectedOption === opt.id ? '#C11A1A' : '#E4E4E7', backgroundColor: selectedOption === opt.id ? '#C11A1A' : 'transparent' }}
            >
              {selectedOption === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">{opt.label}</span>
                {opt.isRecommended && (
                  <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-steel mt-0.5">{opt.tagline}</p>
              <div className="mt-3 flex items-end gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-2xl font-bold text-brand-dark">${opt.oneTimePrice.toLocaleString()}</div>
                  <div className="text-xs text-steel">one-time treatment</div>
                </div>
                <div className="text-steel">+</div>
                <div>
                  <div className="font-mono text-lg font-bold text-steel">${opt.recurringPrice}/yr</div>
                  <div className="text-xs text-steel">{opt.recurringFrequency}</div>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {opt.highlights.map((h, i) => (
                  <li key={i} className={`flex items-start gap-2 text-xs ${i === 0 && opt.highlights[0].startsWith('Everything') ? 'text-steel italic' : 'text-brand-dark'}`}>
                    <CheckCircle size={12} className="text-success flex-shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs text-steel">
                <span className="font-semibold">Warranty: </span>{opt.warranty}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

/* ─── Step 8: Review & Present ─── */
function StepReview({ onPresentation }: { onPresentation: () => void }) {
  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<CheckCircle size={20} className="text-white" />} title="Review & Present" sub="Review the quote and enter customer presentation" />

      <div className="bg-success-light border border-success/20 rounded-xl p-3 flex items-center gap-2">
        <CheckCircle size={16} className="text-success" />
        <span className="text-sm text-success font-semibold">Quote JQ-2026-0847 is ready for customer presentation</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-3 space-y-2">
        <div className="font-display text-lg font-bold text-brand-dark uppercase tracking-wide mb-3">Validation Summary</div>
        {[
          { label: 'Customer info complete', ok: true },
          { label: 'Structure measurements recorded', ok: true },
          { label: 'Inspection findings captured (2 categories)', ok: true },
          { label: 'Photos attached (5 photos, 2 findings)', ok: true },
          { label: 'Moisture readings recorded (5 readings)', ok: true },
          { label: 'Services selected (2 services)', ok: true },
          { label: 'Internal costing complete', ok: true },
          { label: 'Quote options built (3 options)', ok: true },
          { label: 'Inventory shortage: HDPE Drainage Mat', ok: false, warning: true },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item.ok ? <CheckCircle size={16} className="text-success flex-shrink-0" /> :
             item.warning ? <AlertTriangle size={16} className="text-amber flex-shrink-0" /> :
             <X size={16} className="text-danger flex-shrink-0" />}
            <span className={`text-sm ${item.ok ? 'text-brand-dark' : item.warning ? 'text-amber' : 'text-danger'}`}>{item.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onPresentation}
        className="w-full bg-brand-red text-white font-display text-xl font-bold uppercase tracking-wider py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-97 transition-all shadow-lg"
      >
        <Lock size={20} />
        Enter Customer Presentation Mode
      </button>

      <p className="text-xs text-steel text-center">
        Presentation mode hides all internal costs, margins, inventory data, and staff notes. Only customer-safe information is visible.
      </p>
    </div>
  )
}

/* ─── Step 9: Signature & Accept ─── */
function StepSign({ signatureCaptured, setSignatureCaptured, onProposal }: {
  signatureCaptured: boolean, setSignatureCaptured: (v: boolean) => void, onProposal: () => void
}) {
  const [selectedOption, setSelectedOption] = useState('opt-recommended')
  const [printedName, setPrintedName] = useState('Sarah Chen')
  const [signDate, setSignDate] = useState('07/23/2026')
  const [initialed, setInitialed] = useState<boolean[]>([false, false, false])
  const opt = sampleQuoteOptions.find(o => o.id === selectedOption)!

  const toggleInitial = (i: number) => setInitialed(arr => arr.map((v, idx) => idx === i ? !v : v))

  return (
    <div className="space-y-3 pb-3">
      <StepHeader icon={<CheckCircle size={20} className="text-white" />} title="Accept & Sign" sub="Customer selects an option and signs to accept" />

      <div>
        <p className="text-xs text-steel uppercase tracking-wider font-semibold mb-2">Customer Selected Option</p>
        {sampleQuoteOptions.map(o => (
          <button
            key={o.id}
            onClick={() => setSelectedOption(o.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 mb-2 text-left transition-all ${selectedOption === o.id ? 'border-brand-red bg-brand-red/5' : 'border-surface bg-white'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedOption === o.id ? 'border-brand-red bg-brand-red' : 'border-silver'}`}>
              {selectedOption === o.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1">
              <span className="font-bold text-brand-dark">{o.label}</span>
              {o.isRecommended && <span className="ml-2 text-xs text-brand-red font-bold">(Recommended)</span>}
              <div className="font-mono text-sm text-steel">${o.oneTimePrice.toLocaleString()} + ${o.recurringPrice}/yr</div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-3 shadow-sm space-y-2">
        <div className="font-display text-lg font-bold text-brand-dark uppercase tracking-wide">Acceptance Summary</div>
        <div className="text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-steel">Selected Option</span><span className="font-bold text-brand-dark">{opt.label}</span></div>
          <div className="flex justify-between"><span className="text-steel">One-Time Total</span><span className="font-mono font-bold text-brand-dark">${opt.oneTimePrice.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-steel">Annual Renewal</span><span className="font-mono text-steel">${opt.recurringPrice}/yr</span></div>
          <div className="flex justify-between"><span className="text-steel">Warranty</span><span className="text-brand-dark text-right max-w-[60%]">{opt.warranty}</span></div>
        </div>
        <div className="border-t border-surface pt-2">
          <div className="text-xs text-steel">{`Quote expires: August 7, 2026 · Prepared: July 23, 2026`}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <div className="font-display text-base font-bold text-brand-dark uppercase tracking-wide mb-3">Customer Acknowledgments</div>
        {[
          'I have reviewed the inspection findings and recommended treatment plan.',
          'I understand the scope of work, preparation requirements, and follow-up schedule.',
          'I acknowledge that results may vary based on conditions present at time of service.',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3 mb-3">
            <button
              onClick={() => toggleInitial(i)}
              className={`w-12 h-8 border-2 rounded-lg flex items-center justify-center text-xs font-mono flex-shrink-0 transition-all ${initialed[i] ? 'border-success bg-success-light text-success font-bold' : 'border-silver text-steel'}`}
            >
              {initialed[i] ? '✓' : 'Init.'}
            </button>
            <p className="text-xs text-brand-dark flex-1">{text}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <div className="font-display text-base font-bold text-brand-dark uppercase tracking-wide mb-3">Customer Signature</div>

        {!signatureCaptured ? (
          <>
            <div
              className="border-2 border-dashed border-surface rounded-xl h-32 flex flex-col items-center justify-center text-steel hover:border-brand-red/30 transition-all cursor-pointer"
              onClick={() => setSignatureCaptured(true)}
            >
              <div className="text-3xl font-display italic text-silver mb-1">Sign Here</div>
              <div className="text-xs text-silver">Tap to capture signature</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-steel font-semibold">Printed Name</label>
                <input
                  value={printedName}
                  onChange={e => setPrintedName(e.target.value)}
                  className="w-full border border-surface rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:border-brand-red"
                />
              </div>
              <div>
                <label className="text-xs text-steel font-semibold">Date</label>
                <input
                  value={signDate}
                  onChange={e => setSignDate(e.target.value)}
                  className="w-full border border-surface rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="border-2 border-success rounded-xl p-3 flex items-center gap-3">
            <CheckCircle size={24} className="text-success flex-shrink-0" />
            <div>
              <div className="font-bold text-success">Signature Captured</div>
              <div className="text-xs text-steel">{`${printedName} · ${signDate}`}</div>
            </div>
          </div>
        )}
      </div>

      {signatureCaptured && (
        <button
          onClick={onProposal}
          className="w-full bg-brand-red text-white font-display text-xl font-bold uppercase tracking-wider py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-97 transition-all shadow-lg"
        >
          <FileTextIcon size={20} />
          Generate & Send Proposal
        </button>
      )}
    </div>
  )
}

/* ─── Shared sub-components ─── */
function StepHeader({ icon, title, sub }: { icon: React.ReactNode, title: string, sub: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-8 h-8 bg-brand-red rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide leading-tight">{title}</div>
        <div className="text-xs text-steel mt-0.5">{sub}</div>
      </div>
    </div>
  )
}

function FormCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-3 py-1.5 bg-surface border-b border-surface">
        <span className="text-xs text-steel uppercase tracking-wider font-bold">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

function EditRow({ label, value, onChange, type = 'text', mono = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; mono?: boolean; placeholder?: string
}) {
  return (
    <div className="py-1 border-b border-surface last:border-0 flex items-center justify-between gap-3">
      <span className="text-xs text-steel flex-shrink-0 w-28">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 text-sm text-brand-dark text-right bg-transparent border-0 border-b border-transparent focus:border-brand-red focus:outline-none transition-colors ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}

function EditRowSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div className="py-1 border-b border-surface last:border-0 flex items-center justify-between gap-3">
      <span className="text-xs text-steel flex-shrink-0 w-28">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-sm text-brand-dark text-right bg-transparent border-0 focus:outline-none cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function FileTextIcon({ size, className }: { size: number, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}
