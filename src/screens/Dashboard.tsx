import { useMemo, useState, type ReactNode } from "react"
import { AlertTriangle, CalendarClock, CheckCircle, ChevronRight, FileText, Flame, MapPin, MessageSquarePlus, Plus, RefreshCw, Search, Snowflake, Sun, X } from "lucide-react"

import type { SalesBrainEstimateListItem } from "../services/opsBrain"
import { LEAD_TYPE_OPTIONS, PREFERRED_CONTACT_OPTIONS, REFERRAL_SOURCE_OPTIONS } from "../types/figma-workflow"
import { LEAD_ACTIVITY_TYPES, type LeadActivity, type LeadInput, type SalesDashboardData, type SalesLead } from "../types/sales-operations"
import type { OpsBrainUser } from "../types/user"

interface DashboardProps {
  user: OpsBrainUser | null
  userLoading: boolean
  estimates: SalesBrainEstimateListItem[]
  data: SalesDashboardData | null
  loading: boolean
  error: string | null
  leadActivities: Record<string, LeadActivity[]>
  onStartInspection: () => void
  onOpenEstimate: (id: string) => void
  onRefresh: () => void
  onCreateLead: (input: LeadInput) => Promise<SalesLead>
  onUpdateLead: (id: string, input: Partial<LeadInput>) => Promise<SalesLead>
  onLoadActivities: (leadId: string) => Promise<LeadActivity[]>
  onAddActivity: (leadId: string, input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">) => Promise<LeadActivity>
}

const temperatureStyle = {
  hot: { className: "bg-danger-light text-danger", icon: Flame },
  warm: { className: "bg-amber-light text-amber", icon: Sun },
  cold: { className: "bg-info-light text-info", icon: Snowflake },
} as const

const leadStatusStyle = {
  open: "bg-info-light text-info",
  sold: "bg-success-light text-success",
  lost: "bg-danger-light text-danger",
} as const

export default function Dashboard(props: DashboardProps) {
  const { user, userLoading, estimates, data, loading, error, onStartInspection, onOpenEstimate, onRefresh } = props
  const [leadQuery, setLeadQuery] = useState("")
  const [leadStatus, setLeadStatus] = useState("all")
  const [temperature, setTemperature] = useState("all")
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null)
  const leads = data?.leads ?? []
  const drafts = data?.drafts ?? estimates.filter((item) => item.status === "draft")
  const pending = data?.pending ?? estimates.filter((item) => item.status === "sent")
  const filteredLeads = useMemo(() => {
    const query = leadQuery.trim().toLowerCase()
    return leads.filter((lead) => (leadStatus === "all" || lead.status === leadStatus) && (temperature === "all" || lead.temperature === temperature) && (!query || `${lead.customerName} ${lead.companyName} ${lead.phone} ${lead.email}`.toLowerCase().includes(query)))
  }, [leadQuery, leads, leadStatus, temperature])
  const firstName = user?.name?.split(/\s+/)[0] || "there"
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  const openLead = async (lead: SalesLead) => {
    setSelectedLead(lead)
    await props.onLoadActivities(lead.id).catch(() => [])
  }

  return (
    <div className="pb-24">
      <div className="bg-brand-charcoal px-5 pt-5 pb-6">
        <div className="text-silver text-xs uppercase tracking-widest font-semibold font-mono mb-0.5">{today}</div>
        <div className="font-display text-3xl font-bold text-white tracking-wide">{userLoading ? "Loading your workspace..." : `Good morning, ${firstName}`}</div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <Stat label="Open Leads" value={leads.filter((lead) => lead.status === "open").length} />
          <Stat label="Open Drafts" value={drafts.length} />
          <Stat label="Pending Quotes" value={pending.length} />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => setLeadFormOpen(true)} className="bg-brand-red rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm">
            <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center"><Plus size={22} className="text-white" /></div>
            <div><div className="font-display text-lg font-bold text-white uppercase">New Lead</div><div className="text-white/70 text-xs">Capture an opportunity before customer setup</div></div>
          </button>
          <button onClick={onStartInspection} className="bg-brand-dark rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><FileText size={21} className="text-white" /></div>
            <div><div className="font-display text-lg font-bold text-white uppercase">Start Inspection</div><div className="text-white/65 text-xs">Quote an existing Ops Brain customer</div></div>
          </button>
        </div>

        {error ? <div className="bg-danger-light border border-danger/25 rounded-2xl p-4 flex gap-2 text-sm text-danger"><AlertTriangle size={17} />{error}</div> : null}

        <section>
          <SectionHeading title="Leads" count={filteredLeads.length} onRefresh={onRefresh} />
          <div className="grid md:grid-cols-[1fr_auto] gap-2 mb-3">
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" /><input value={leadQuery} onChange={(event) => setLeadQuery(event.target.value)} className="w-full bg-white border border-surface rounded-xl pl-8 pr-3 py-2.5 text-sm" placeholder="Search leads..." /></div>
            <div className="flex gap-2 overflow-x-auto">{["all", "open", "sold", "lost"].map((value) => <button key={value} onClick={() => setLeadStatus(value)} className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${leadStatus === value ? "bg-brand-dark border-brand-dark text-white" : "bg-white border-surface text-steel"}`}>{value}</button>)}</div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto mb-3"><span className="text-xs font-semibold text-steel">Temperature</span>{["all", "hot", "warm", "cold"].map((value) => <button key={value} onClick={() => setTemperature(value)} className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${temperature === value ? "bg-brand-dark border-brand-dark text-white" : "bg-white border-surface text-steel"}`}>{value}</button>)}</div>
          {loading ? <Loading label="Loading SalesBrain dashboard..." /> : null}
          {!loading && filteredLeads.length === 0 ? <Empty title="No matching leads" detail="Change the status, temperature, or search filters to view other leads." /> : null}
          <div className="grid lg:grid-cols-2 gap-3">{filteredLeads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={() => void openLead(lead)} />)}</div>
        </section>

        <QuoteSection title="Open Drafts" items={drafts} empty="No quote drafts are open." onOpen={onOpenEstimate} />
        <QuoteSection title="Pending Quotes" items={pending} empty="No sent quotes are awaiting a decision." onOpen={onOpenEstimate} />

        <div className="flex flex-wrap items-center justify-between gap-2 bg-success-light border border-success/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2"><CheckCircle size={16} className="text-success" /><span className="text-sm text-success font-semibold">Connected to Ops Brain storage</span></div>
          <span className="text-xs text-success/70 font-mono">D1 records + R2 files</span>
        </div>
      </div>

      {leadFormOpen ? <LeadForm onClose={() => setLeadFormOpen(false)} onSave={async (input) => { await props.onCreateLead(input); setLeadFormOpen(false) }} /> : null}
      {selectedLead ? <LeadDetail lead={selectedLead} activities={props.leadActivities[selectedLead.id] || []} onClose={() => setSelectedLead(null)} onUpdate={async (input) => { const updated = await props.onUpdateLead(selectedLead.id, input); setSelectedLead(updated) }} onAddActivity={async (input) => { await props.onAddActivity(selectedLead.id, input) }} /> : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="min-w-0 bg-white/8 rounded-xl p-3 text-center"><div className="font-display text-3xl font-bold text-white leading-none">{value}</div><div className="text-silver text-xs mt-1 leading-tight">{label}</div></div>
}

function SectionHeading({ title, count, onRefresh }: { title: string; count: number; onRefresh: () => void }) {
  return <div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><h2 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">{title}</h2><span className="bg-brand-red text-white text-xs font-bold px-2 py-0.5 rounded-full">{count}</span></div><button onClick={onRefresh} className="text-xs text-brand-red font-semibold flex items-center gap-1"><RefreshCw size={13} /> Refresh</button></div>
}

function LeadCard({ lead, onOpen }: { lead: SalesLead; onOpen: () => void }) {
  const style = temperatureStyle[lead.temperature]
  const Icon = style.icon
  return <button onClick={onOpen} className="bg-white rounded-2xl p-4 shadow-sm text-left flex items-start gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.className}`}><Icon size={18} /></div><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-brand-dark truncate">{lead.customerName}</span><div className="flex gap-1"><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${leadStatusStyle[lead.status]}`}>{lead.status}</span><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${style.className}`}>{lead.temperature}</span></div></div><div className="text-xs text-steel mt-1 truncate">{lead.companyName || lead.phone || lead.email || "Contact information needed"}</div><div className="flex items-center gap-1 mt-2 text-xs text-silver"><CalendarClock size={12} />{lead.nextFollowUpAt ? `Follow up ${new Date(lead.nextFollowUpAt).toLocaleDateString()}` : `Last touch ${new Date(lead.lastInteractionAt || lead.updatedAt).toLocaleDateString()}`}</div></div><ChevronRight size={17} className="text-silver mt-2" /></button>
}

function QuoteSection({ title, items, empty, onOpen }: { title: string; items: SalesBrainEstimateListItem[]; empty: string; onOpen: (id: string) => void }) {
  return <section><div className="flex items-center gap-2 mb-3"><h2 className="font-display text-xl font-bold text-brand-dark uppercase">{title}</h2><span className="bg-brand-dark text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span></div>{items.length === 0 ? <Empty title={empty} detail="Saved quotes will appear here automatically." /> : <div className="grid lg:grid-cols-2 gap-3">{items.map((item) => <button key={item.id} onClick={() => onOpen(item.id)} className="bg-white rounded-2xl p-4 shadow-sm text-left flex items-start gap-3"><div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center"><FileText size={18} className="text-steel" /></div><div className="flex-1 min-w-0"><div className="font-semibold text-brand-dark truncate">{item.customerName || "Customer not selected"}</div><div className="flex items-center gap-1 mt-1 text-xs text-steel"><MapPin size={12} />{item.locationAddress || item.locationName || "No location"}</div><div className="mt-2 flex justify-between text-xs"><span className="font-mono text-silver">{item.estimateNumber}</span>{item.totalCents !== null ? <span className="font-mono font-bold">${(item.totalCents / 100).toLocaleString()}</span> : null}</div></div><ChevronRight size={17} className="text-silver mt-2" /></button>)}</div>}</section>
}

const EMPTY_LEAD: LeadInput = {
  leadType: "New Customer", customerName: "", company: "", companyName: "", first: "", last: "",
  locationName: "", streetAddress: "", city: "", state: "NC", zip: "", phone: "", email: "",
  preferredContact: "Text", referralSource: "", referralSourceOther: "", temperature: "warm",
  status: "open", notes: "", nextFollowUpAt: "",
}

function LeadForm({ onClose, onSave }: { onClose: () => void; onSave: (input: LeadInput) => Promise<void> }) {
  const [form, setForm] = useState(EMPTY_LEAD)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const save = async () => {
    const customerName = form.company.trim() || [form.first.trim(), form.last.trim()].filter(Boolean).join(" ")
    if (!customerName) { setError("Enter a company or customer first and last name."); return }
    setSaving(true)
    try { await onSave({ ...form, companyName: form.company.trim(), customerName, state: "NC" }) }
    catch (value) { setError(value instanceof Error ? value.message : "Unable to save lead."); setSaving(false) }
  }
  return <Modal title="New Lead" onClose={onClose}><div className="space-y-4">
    <Choice label="Lead Type" options={LEAD_TYPE_OPTIONS} value={form.leadType} onChange={(value) => setForm({ ...form, leadType: value as LeadInput["leadType"] })} />
    <div className="grid sm:grid-cols-3 gap-3"><Field label="Company" value={form.company} onChange={(value) => setForm({ ...form, company: value, companyName: value })} /><Field label="First" value={form.first} onChange={(value) => setForm({ ...form, first: value })} /><Field label="Last" value={form.last} onChange={(value) => setForm({ ...form, last: value })} /></div>
    <div className="grid sm:grid-cols-2 gap-3"><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /></div>
    <Choice label="Preferred Contact" options={PREFERRED_CONTACT_OPTIONS} value={form.preferredContact} onChange={(value) => setForm({ ...form, preferredContact: value })} />
    <Choice label="Referral Source" options={REFERRAL_SOURCE_OPTIONS} value={form.referralSource} onChange={(value) => setForm({ ...form, referralSource: value })} />
    {form.referralSource === "Other" ? <Field label="Other Referral Source" value={form.referralSourceOther} onChange={(value) => setForm({ ...form, referralSourceOther: value })} /> : null}
    <div className="border-t border-surface pt-3"><div className="font-display text-base font-bold text-brand-dark uppercase mb-3">Service Location</div><div className="space-y-3"><Field label="Location Name" value={form.locationName} onChange={(value) => setForm({ ...form, locationName: value })} /><Field label="Street Address" value={form.streetAddress} onChange={(value) => setForm({ ...form, streetAddress: value })} /><div className="grid grid-cols-[1fr_80px_110px] gap-3"><Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} /><Field label="State" value="NC" onChange={() => undefined} disabled /><Field label="ZIP" value={form.zip} onChange={(value) => setForm({ ...form, zip: value })} /></div></div></div>
    <Choice label="Lead Temperature" options={["hot", "warm", "cold"]} value={form.temperature} onChange={(value) => setForm({ ...form, temperature: value as LeadInput["temperature"] })} />
    <Field label="Next Follow-Up" type="datetime-local" value={form.nextFollowUpAt || ""} onChange={(value) => setForm({ ...form, nextFollowUpAt: value })} />
    <label className="block text-xs font-semibold text-steel">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="mt-1 w-full border border-surface rounded-xl px-3 py-2 text-sm" /></label>
    {error ? <div className="text-sm text-danger">{error}</div> : null}<button onClick={() => void save()} disabled={saving} className="w-full bg-brand-red text-white rounded-xl py-3 font-display text-lg font-bold uppercase disabled:opacity-50">{saving ? "Saving..." : "Save Lead"}</button>
  </div></Modal>
}

function LeadDetail({ lead, activities, onClose, onUpdate, onAddActivity }: { lead: SalesLead; activities: LeadActivity[]; onClose: () => void; onUpdate: (input: Partial<LeadInput>) => Promise<void>; onAddActivity: (input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">) => Promise<void> }) {
  const [activityOpen, setActivityOpen] = useState(false)
  const [type, setType] = useState("Called")
  const [note, setNote] = useState("")
  return <Modal title={lead.customerName} onClose={onClose}><div className="space-y-4"><div className="grid sm:grid-cols-2 gap-3"><Choice label="Temperature" options={["hot", "warm", "cold"]} value={lead.temperature} onChange={(value) => void onUpdate({ temperature: value as LeadInput["temperature"] })} /><Choice label="Lead Status" options={["open", "sold", "lost"]} value={lead.status} onChange={(value) => void onUpdate({ status: value as LeadInput["status"] })} /></div><div className="bg-surface rounded-xl p-3 text-sm text-brand-dark"><div>{lead.phone || "No phone"} · {lead.email || "No email"}</div><div className="text-xs text-steel mt-1">Preferred: {lead.preferredContact || "Not selected"} · Source: {lead.referralSource || "Not selected"}</div></div><button onClick={() => setActivityOpen((value) => !value)} className="w-full bg-brand-dark text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"><MessageSquarePlus size={17} /> Add Customer Interaction</button>{activityOpen ? <div className="border border-surface rounded-2xl p-3 space-y-3"><Choice label="Interaction" options={LEAD_ACTIVITY_TYPES} value={type} onChange={setType} /><Field label="Notes" value={note} onChange={setNote} /><button onClick={async () => { await onAddActivity({ type, note, happenedAt: new Date().toISOString() }); setNote(""); setActivityOpen(false) }} className="w-full bg-brand-red text-white rounded-xl py-2.5 font-bold">Log Interaction</button></div> : null}<div><h3 className="font-display text-lg font-bold text-brand-dark uppercase mb-2">Activity Timeline</h3>{activities.length === 0 ? <div className="text-sm text-steel">No interactions recorded yet.</div> : <div className="space-y-2">{activities.map((activity) => <div key={activity.id} className="border-l-2 border-brand-red pl-3 py-1"><div className="text-sm font-semibold text-brand-dark">{activity.type}</div><div className="text-xs text-steel">{new Date(activity.happenedAt).toLocaleString()} · {activity.createdBy}</div>{activity.note ? <p className="text-sm text-steel mt-1">{activity.note}</p> : null}</div>)}</div>}</div></div></Modal>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center p-4" onClick={onClose}><div className="bg-white rounded-3xl p-5 w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="font-display text-2xl font-bold text-brand-dark uppercase">{title}</h2><button onClick={onClose} className="text-silver" aria-label="Close"><X size={20} /></button></div>{children}</div></div> }
function Choice({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (value: string) => void }) { return <div><div className="text-xs font-semibold text-steel mb-1">{label}</div><div className="flex flex-wrap gap-2">{options.map((option) => <button type="button" key={option} onClick={() => onChange(option)} className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${value === option ? "bg-brand-dark border-brand-dark text-white" : "bg-white border-surface text-steel"}`}>{option}</button>)}</div></div> }
function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) { return <label className="block text-xs font-semibold text-steel">{label}<input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full border border-surface rounded-xl px-3 py-2.5 text-sm text-brand-dark disabled:bg-surface disabled:text-steel" /></label> }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className="bg-white rounded-2xl p-6 text-center shadow-sm"><div className="font-semibold text-brand-dark">{title}</div><div className="text-sm text-steel mt-1">{detail}</div></div> }
function Loading({ label }: { label: string }) { return <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">{label}</div> }
