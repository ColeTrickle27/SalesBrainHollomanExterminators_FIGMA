import { effectiveLeadStatus, filterDashboardLeads, leadBusinessDate, leadDateLabel, leadFollowUpIssue, leadCommentIssue, leadSourceLabel, leadAssigneeLabel, LEAD_STATUS_LABELS } from "../features/sales/leadDashboard"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AlertTriangle, CalendarClock, CheckCircle, ChevronRight, FileText, Flame, MapPin, MessageSquarePlus, Plus, RefreshCw, Search, Snowflake, Sun, Trash2, X } from "lucide-react"

import type { SalesBrainEstimateListItem } from "../services/opsBrain"
import { LEAD_TYPE_OPTIONS, PREFERRED_CONTACT_OPTIONS, REFERRAL_SOURCE_OPTIONS } from "../types/figma-workflow"
import { LEAD_ACTIVITY_TYPES, type LeadAssignee, type LeadActivity, type LeadInput, type SalesDashboardData, type SalesLead } from "../types/sales-operations"
import type { PricebookService } from "../types/pricebook"
import type { OpsBrainUser } from "../types/user"

interface DashboardProps {
  services: PricebookService[]
  user: OpsBrainUser | null
  userLoading: boolean
  estimates: SalesBrainEstimateListItem[]
  data: SalesDashboardData | null
  loading: boolean
  error: string | null
  onLoadAssignees: () => Promise<LeadAssignee[]>
  leadActivities: Record<string, LeadActivity[]>
  onStartInspection: () => void
  onOpenEstimate: (id: string) => void
  onDeleteEstimate: (id: string) => Promise<void>
  onRefresh: () => void
  onCreateLead: (input: LeadInput) => Promise<SalesLead>
  onUpdateLead: (id: string, input: Partial<LeadInput>) => Promise<SalesLead>
  onStartQuoteForLead: (lead: SalesLead) => void
  onLoadActivities: (leadId: string) => Promise<LeadActivity[]>
  onAddActivity: (leadId: string, input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">) => Promise<LeadActivity>
}

const temperatureStyle = {
  hot: { className: "bg-red-100 text-red-700", icon: Flame },
  warm: { className: "bg-yellow-100 text-yellow-800", icon: Sun },
  cold: { className: "bg-blue-100 text-blue-700", icon: Snowflake },
} as const

const leadStatusStyle = {
  open: "bg-info-light text-info",
  sold: "bg-success-light text-success",
  ex_dated: "bg-purple-100 text-purple-800",
  lost: "bg-danger-light text-danger",
} as const

export default function Dashboard(props: DashboardProps) {
  const { user, userLoading, estimates, data, loading, error, onStartInspection, onOpenEstimate, onRefresh } = props
  const [businessDate, setBusinessDate] = useState(() => leadBusinessDate())
  useEffect(() => {
    const timer = window.setInterval(() => { const next = leadBusinessDate(); if (next !== businessDate) { setBusinessDate(next); onRefresh() } }, 60_000)
    return () => window.clearInterval(timer)
  }, [businessDate, onRefresh])
  const [leadQuery, setLeadQuery] = useState("")
  const [leadStatus, setLeadStatus] = useState("open")
  const [temperature, setTemperature] = useState("all")
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null)
  const [assignees, setAssignees] = useState<LeadAssignee[]>([])
  const [assigneeLoading, setAssigneeLoading] = useState(false)
  const [assigneeError, setAssigneeError] = useState("")
  useEffect(() => {
    if (!leadFormOpen && !selectedLead) return
    let cancelled = false
    setAssigneeLoading(true); setAssigneeError("")
    props.onLoadAssignees().then((rows) => { if (!cancelled) setAssignees(rows) }).catch((error) => { if (!cancelled) setAssigneeError(error instanceof Error ? error.message : "Salespeople could not be loaded. Try reopening the lead.") }).finally(() => { if (!cancelled) setAssigneeLoading(false) })
    return () => { cancelled = true }
  }, [leadFormOpen, selectedLead?.id, props.onLoadAssignees])
  const assignmentProps = { assignees, assigneeLoading, assigneeError }
  const [leadLinkError, setLeadLinkError] = useState("")
  const openedLeadLink = useRef<string | null>(null)
  const linkedLeadId = new URLSearchParams(window.location.search).get("leadId")
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const historyRequest = useRef(0)
  const refreshHistory = async (leadId: string) => {
    const request = ++historyRequest.current
    setHistoryLoading(true); setHistoryError("")
    try { await props.onLoadActivities(leadId) }
    catch (error) { if (request === historyRequest.current) setHistoryError(error instanceof Error ? error.message : "History could not be refreshed. Your saved updates are safe; choose Refresh History.") }
    finally { if (request === historyRequest.current) setHistoryLoading(false) }
  }
  const leads = data?.leads ?? []
  const drafts = estimates.filter((item) => item.status === "draft")
  const pending = estimates.filter((item) => item.status === "sent")
  const filteredLeads = useMemo(() => filterDashboardLeads(leads, leadStatus, temperature, leadQuery, businessDate), [leadQuery, leads, leadStatus, temperature, businessDate])
  const firstName = user?.name?.split(/\s+/)[0] || "there"
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  const openLead = async (lead: SalesLead) => {
    setSelectedLead(lead)
    await refreshHistory(lead.id)
  }

  useEffect(() => {
    if (!linkedLeadId || openedLeadLink.current === linkedLeadId || !data || loading) return
    const linked = leads.find((lead) => lead.id === linkedLeadId)
    if (!linked) { setLeadLinkError("This lead could not be opened. Refresh or search your leads."); return }
    openedLeadLink.current = linkedLeadId
    setLeadLinkError("")
    setSelectedLead(linked)
    void refreshHistory(linked.id)
    const url = new URL(window.location.href)
    url.searchParams.delete("leadId")
    window.history.replaceState(null, "", url)
  }, [linkedLeadId, leads, data, loading])

  return (
    <div className="pb-24">
      <div className="bg-brand-charcoal px-5 pt-5 pb-6">
        <div className="text-silver text-xs uppercase tracking-widest font-semibold font-mono mb-0.5">{today}</div>
        <div className="font-display text-3xl font-bold text-white tracking-wide">{userLoading ? "Loading your workspace..." : `Good morning, ${firstName}`}</div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <Stat label="Open Leads" value={leads.filter((lead) => effectiveLeadStatus(lead, businessDate) === "open").length} />
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
            <div><div className="font-display text-lg font-bold text-white uppercase">New Quote</div><div className="text-white/65 text-xs">Select an existing Ops Brain customer</div></div>
          </button>
        </div>

        {leadLinkError && <p role="alert" className="rounded-xl bg-danger-light p-4 text-danger">{leadLinkError}</p>}
        {error ? <div className="bg-danger-light border border-danger/25 rounded-2xl p-4 flex gap-2 text-sm text-danger"><AlertTriangle size={17} />{error}</div> : null}

        <section>
          <SectionHeading title="Leads" count={filteredLeads.length} onRefresh={onRefresh} />
          <div className="grid md:grid-cols-[1fr_auto] gap-2 mb-3">
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" /><input value={leadQuery} onChange={(event) => setLeadQuery(event.target.value)} className="w-full bg-white border border-surface rounded-xl pl-8 pr-3 py-2.5 text-sm" placeholder="Search leads..." /></div>
            <div className="flex gap-2 overflow-x-auto">{["all", "open", "sold", "lost", "ex_dated"].map((value) => <button key={value} onClick={() => setLeadStatus(value)} className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${leadStatus === value ? "bg-brand-dark border-brand-dark text-white" : "bg-white border-surface text-steel"}`}>{value === "all" ? "All" : LEAD_STATUS_LABELS[value as SalesLead["status"]]}</button>)}</div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto mb-3"><span className="text-xs font-semibold text-steel">Temperature</span>{["all", "hot", "warm", "cold"].map((value) => <button key={value} onClick={() => setTemperature(value)} className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${value === "all" ? temperature === value ? "bg-brand-dark border-brand-dark text-white" : "bg-white border-surface text-steel" : `${temperatureStyle[value as SalesLead["temperature"]].className} ${temperature === value ? "border-current ring-2 ring-current" : "border-transparent"}`}`}>{value}</button>)}</div>
          {loading ? <Loading label="Loading SalesBrain dashboard..." /> : null}
          {!loading && filteredLeads.length === 0 ? <Empty title="No matching leads" detail="Change the status, temperature, or search filters to view other leads." /> : null}
          <div className="grid lg:grid-cols-2 gap-3">{filteredLeads.map((lead) => <LeadCard key={lead.id} lead={lead} status={effectiveLeadStatus(lead, businessDate)} activities={props.leadActivities[lead.id] || []} onOpen={() => void openLead(lead)} />)}</div>
        </section>

        <section className="space-y-4" aria-label="Quotes"><SectionHeading title="Quotes" count={drafts.length + pending.length} onRefresh={onRefresh} />
        <QuoteSection title="Open Drafts" items={drafts} empty="No quote drafts are open." onOpen={onOpenEstimate} onDelete={props.onDeleteEstimate} />
        <QuoteSection title="Pending Quotes" items={pending} empty="No sent quotes are awaiting a decision." onOpen={onOpenEstimate} onDelete={props.onDeleteEstimate} />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-success-light border border-success/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2"><CheckCircle size={16} className="text-success" /><span className="text-sm text-success font-semibold">Connected to Ops Brain storage</span></div>
          <span className="text-xs text-success/70 font-mono">D1 records + R2 files</span>
        </div>
      </div>

      {leadFormOpen ? <LeadForm {...assignmentProps} services={props.services} onExistingCustomer={() => { setLeadFormOpen(false); onStartInspection() }} onClose={() => setLeadFormOpen(false)} onSave={async (input) => { await props.onCreateLead(input); setLeadFormOpen(false) }} /> : null}
      {selectedLead ? <LeadDetail {...assignmentProps} historyLoading={historyLoading} historyError={historyError} onRefreshHistory={() => refreshHistory(selectedLead.id)} lead={selectedLead} activities={props.leadActivities[selectedLead.id] || []} onClose={() => setSelectedLead(null)} onUpdate={async (input) => { const updated = await props.onUpdateLead(selectedLead.id, input); setSelectedLead(updated); await refreshHistory(selectedLead.id) }} onStartQuote={() => props.onStartQuoteForLead(selectedLead)} onAddActivity={async (input) => { await props.onAddActivity(selectedLead.id, input); await refreshHistory(selectedLead.id) }} /> : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="min-w-0 bg-white/8 rounded-xl p-3 text-center"><div className="font-display text-3xl font-bold text-white leading-none">{value}</div><div className="text-silver text-xs mt-1 leading-tight">{label}</div></div>
}

function SectionHeading({ title, count, onRefresh }: { title: string; count: number; onRefresh: () => void }) {
  return <div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><h2 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">{title}</h2><span className="bg-brand-red text-white text-xs font-bold px-2 py-0.5 rounded-full">{count}</span></div><button onClick={onRefresh} className="text-xs text-brand-red font-semibold flex items-center gap-1"><RefreshCw size={13} /> Refresh</button></div>
}

function LeadCard({ lead, status, activities, onOpen }: { lead: SalesLead; status: SalesLead["status"]; activities: LeadActivity[]; onOpen: () => void }) {
  const style = temperatureStyle[lead.temperature]
  const Icon = style.icon
  const latest = [...activities].sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))[0]
  const lastNote = lead.lastUpdateNote || latest?.note || lead.notes || "No update note recorded"
  const lastAt = lead.lastUpdateAt || latest?.happenedAt || lead.lastInteractionAt || lead.updatedAt
  return <button onClick={onOpen} className="bg-white rounded-2xl p-4 shadow-sm text-left flex items-start gap-3">
    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${style.className}`}><Icon size={18} /></div>
    <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-brand-dark break-words">{lead.customerName}</span><div className="flex gap-1"><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${leadStatusStyle[status]}`}>{LEAD_STATUS_LABELS[status]}</span><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${style.className}`}>{lead.temperature}</span></div></div>
      <div className="text-xs text-steel mt-1 truncate">{lead.companyName || lead.phone || lead.email || "Contact information needed"}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-surface px-2 py-1 font-semibold">{leadSourceLabel(lead)}</span><span className="rounded-full bg-surface px-2 py-1 font-bold">{leadAssigneeLabel(lead)}</span></div>
      <p className="mt-2 text-xs text-steel">{lead.source === "hubspot_form" ? "Received" : "Created"} · {leadDateLabel(lead.receivedAt || lead.createdAt)}{lead.source === "hubspot_form" && lead.receivedAt && <span> · Created {leadDateLabel(lead.createdAt)}</span>}</p>
      <dl className="mt-3 space-y-2 text-xs"><div><dt className="font-bold text-brand-dark">Last Update · {leadDateLabel(lastAt)}</dt><dd className="text-steel whitespace-pre-wrap break-words">{lastNote}</dd></div><div><dt className="font-bold text-brand-dark">Current Status · {LEAD_STATUS_LABELS[status]}</dt><dd className="text-steel whitespace-pre-wrap break-words">{lead.statusNote || "No status note recorded"}</dd></div><div><dt className="font-bold text-brand-dark"><CalendarClock size={12} className="inline mr-1" />Next Touch · {leadDateLabel(lead.nextFollowUpAt)}</dt><dd className="text-steel whitespace-pre-wrap break-words">{[lead.nextTouchPoint, lead.nextTouchNote].filter(Boolean).join(" — ") || "No next action recorded"}</dd></div>{lead.exDate && <div><dt className="font-bold text-brand-dark">Ex-Date · {leadDateLabel(lead.exDate)}{status === "open" && lead.exDate <= leadBusinessDate() ? " · Follow-up due" : ""}</dt><dd className="text-steel whitespace-pre-wrap break-words">{lead.exDateNote || "No Ex-Date note recorded"}</dd></div>}</dl>
    </div><ChevronRight size={17} className="text-silver mt-2 shrink-0" />
  </button>
}

function QuoteSection({ title, items, empty, onOpen, onDelete }: { title: string; items: SalesBrainEstimateListItem[]; empty: string; onOpen: (id: string) => void; onDelete: (id: string) => Promise<void> }) {
  return <section><div className="flex items-center gap-2 mb-3"><h2 className="font-display text-xl font-bold text-brand-dark uppercase">{title}</h2><span className="bg-brand-dark text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span></div>{items.length === 0 ? <Empty title={empty} detail="Saved quotes will appear here automatically." /> : <div className="grid lg:grid-cols-2 gap-3">{items.map((item) => <article key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3"><button onClick={() => onOpen(item.id)} className="flex flex-1 min-w-0 items-start gap-3 text-left"><div className="w-10 h-10 shrink-0 bg-surface rounded-xl flex items-center justify-center"><FileText size={18} className="text-steel" /></div><div className="flex-1 min-w-0"><div className="font-semibold text-brand-dark truncate">{item.customerName || "Customer not selected"}</div><div className="flex items-center gap-1 mt-1 text-xs text-steel"><MapPin size={12} />{item.locationAddress || item.locationName || "No location"}</div><div className="mt-2 flex justify-between text-xs"><span className="font-mono text-silver">{item.estimateNumber}</span>{item.totalCents !== null ? <span className="font-mono font-bold">${(item.totalCents / 100).toLocaleString()}</span> : null}</div></div><ChevronRight size={17} className="text-silver mt-2" /></button><button onClick={() => { if (window.confirm(`Delete open quote ${item.estimateNumber}? This removes it from SalesBrain.`)) void onDelete(item.id).catch(() => undefined) }} className="p-2 text-danger hover:bg-danger-light rounded-xl" aria-label={`Delete quote ${item.estimateNumber}`} title="Delete open quote"><Trash2 size={17} /></button></article>)}</div>}</section>
}

const EMPTY_LEAD: LeadInput = {
  leadType: "New Customer", customerName: "", company: "", companyName: "", first: "", last: "",
  locationName: "", streetAddress: "", city: "", state: "NC", zip: "", phone: "", email: "",
  preferredContact: "Text", referralSource: "", referralSourceOther: "", temperature: "warm",
  assignedTo: null, status: "open", notes: "", nextFollowUpAt: "",
}

export function LeadEditModal({ lead, services, onClose, onSave }: { lead: SalesLead; services: PricebookService[]; onClose: () => void; onSave: (input: LeadInput) => Promise<void> }) {
  return <LeadForm services={services} title="Edit Lead" initial={leadInputFromLead(lead)} showStatus showCancel onClose={onClose} onSave={onSave} />
}

function LeadForm({ assignees, assigneeLoading, assigneeError, services, onExistingCustomer, onClose, onSave, initial = EMPTY_LEAD, title = "New Lead", showStatus = false, showCancel = false }: { services: PricebookService[]; onExistingCustomer?: () => void; onClose: () => void; onSave: (input: LeadInput) => Promise<void>; initial?: LeadInput; title?: string; showStatus?: boolean; showCancel?: boolean; assignees?: LeadAssignee[]; assigneeLoading?: boolean; assigneeError?: string }) {
  const [form, setForm] = useState(() => ({ ...initial }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const save = async () => {
    const customerName = form.company.trim() || [form.first.trim(), form.last.trim()].filter(Boolean).join(" ")
    if (!customerName) { setError("Enter a company or customer first and last name."); return }
    const issue = leadFollowUpIssue(form)
    if (issue) { setError(issue); return }
    setSaving(true)
    try { await onSave({ ...form, companyName: form.company.trim(), customerName, state: "NC", nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : "" }) }
    catch (value) { setError(value instanceof Error ? value.message : "Unable to save lead."); setSaving(false) }
  }
  return <Modal title={title} onClose={onClose}><div className="space-y-4">
    {assignees && <AssignmentField value={form.assignedTo || null} currentName={initial.assignedTo || ""} options={assignees} loading={assigneeLoading} error={assigneeError} onChange={(value) => setForm({ ...form, assignedTo: value })} />}
    <Choice label="Lead Type" options={LEAD_TYPE_OPTIONS} value={form.leadType} onChange={(value) => { if (value === "Existing Customer" && onExistingCustomer) { onExistingCustomer(); return } setForm({ ...form, leadType: value as LeadInput["leadType"] }) }} />
    <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface p-3 text-sm"><div>Bill To: <strong>{form.billToNumber || "New/Unassigned"}</strong></div><div>Location: <strong>{form.locationNumber || "New/Unassigned"}</strong></div></div>
    <div className="font-display text-base font-bold text-brand-dark uppercase">Location Fields</div>
    <div className="grid sm:grid-cols-3 gap-3"><Field label="Company" type="text" value={form.company || ""} onChange={(value) => setForm({ ...form, company: value })} /><Field label="First Name" type="text" value={form.first || ""} onChange={(value) => setForm({ ...form, first: value })} /><Field label="Last Name" type="text" value={form.last || ""} onChange={(value) => setForm({ ...form, last: value })} /></div>
    <div className="grid sm:grid-cols-[2fr_1fr_80px_100px] gap-3"><Field label="Street Address" type="text" value={form.streetAddress || ""} onChange={(value) => setForm({ ...form, streetAddress: value })} /><Field label="City" type="text" value={form.city || ""} onChange={(value) => setForm({ ...form, city: value })} /><Field label="State" type="text" value={form.state || ""} onChange={(value) => setForm({ ...form, state: value as "NC" })} disabled /><Field label="Zip" type="text" value={form.zip || ""} onChange={(value) => setForm({ ...form, zip: value })} /></div>
    <div className="grid sm:grid-cols-3 gap-3"><Field label="Phone" type="tel" value={form.phone || ""} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="Email" type="email" value={form.email || ""} onChange={(value) => setForm({ ...form, email: value })} /><label className="block min-w-0 text-xs font-semibold text-steel">Customer Type<select aria-label="Customer Type" value={form.customerType || ""} onChange={(event) => setForm({ ...form, customerType: event.target.value as LeadInput["customerType"] })} className="mt-1 w-full border border-surface rounded-xl px-3 py-2.5 text-sm text-brand-dark"><option value="">Select Customer Type</option><option value="Residential">Residential</option><option value="Commercial">Commercial</option></select></label></div>
    <fieldset><legend className="text-xs font-semibold text-steel mb-1">Primary/Alternate Contact</legend><div className="grid sm:grid-cols-2 gap-3"><Field label="Name" type="text" value={form.contactName || ""} onChange={(value) => setForm({ ...form, contactName: value })} /><Field label="Phone Number" type="tel" value={form.contactPhone || ""} onChange={(value) => setForm({ ...form, contactPhone: value })} /></div></fieldset>
    <div><div className="text-xs font-semibold text-steel mb-1">Service</div><details className="border border-surface rounded-xl p-3"><summary className="cursor-pointer text-sm text-brand-dark">{form.serviceIds?.length ? `${form.serviceIds.length} service(s) selected` : "Select Service(s)"}</summary><div className="mt-2 space-y-2">{services.filter((service) => service.active || form.serviceIds?.includes(service.id)).map((service) => <label key={service.id} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={form.serviceIds?.includes(service.id) || false} onChange={(event) => setForm({ ...form, serviceIds: event.target.checked ? [...(form.serviceIds || []), service.id] : (form.serviceIds || []).filter((id) => id !== service.id) })} />{service.name}</label>)}{services.length === 0 ? <p className="text-sm text-steel">No services available. Check the service catalog.</p> : null}</div></details></div>
    <Choice label="Lead Temp" options={["hot", "warm", "cold"]} value={form.temperature} onChange={(value) => setForm({ ...form, temperature: value as LeadInput["temperature"] })} />
    <div className="grid sm:grid-cols-2 gap-3"><Field label="Next Touch-Point Date" type="datetime-local" value={form.nextFollowUpAt || ""} onChange={(value) => setForm({ ...form, nextFollowUpAt: value })} /><label className="block min-w-0 text-xs font-semibold text-steel">Next Touch-Point<select aria-label="Next Touch-Point" value={form.nextTouchPoint || ""} onChange={(event) => setForm({ ...form, nextTouchPoint: event.target.value as LeadInput["nextTouchPoint"] })} className="mt-1 w-full border border-surface rounded-xl px-3 py-2.5 text-sm text-brand-dark"><option value="">Select Next Touch-Point</option><option value="Contact">Contact</option><option value="Inspect">Inspect</option><option value="Send Quote">Send Quote</option><option value="Follow-Up">Follow-Up</option><option value="X-Date">X-Date</option></select></label></div>
    <details><summary className="cursor-pointer text-sm font-semibold text-steel">Additional Details</summary><div className="mt-3 space-y-3">
    <Choice label="Preferred Contact" options={PREFERRED_CONTACT_OPTIONS} value={form.preferredContact} onChange={(value) => setForm({ ...form, preferredContact: value })} />
    <Choice label="Referral Source" options={REFERRAL_SOURCE_OPTIONS} value={form.referralSource} onChange={(value) => setForm({ ...form, referralSource: value })} />
    {form.referralSource === "Other" ? <Field label="Other Referral Source" value={form.referralSourceOther} onChange={(value) => setForm({ ...form, referralSourceOther: value })} /> : null}
    <Field label="Location Name" type="text" value={form.locationName || ""} onChange={(value) => setForm({ ...form, locationName: value })} />
    </div></details>
    <NoteField label="Service Requested" value={form.serviceRequested || ""} onChange={(value) => setForm({ ...form, serviceRequested: value })} />
    <NoteField label="Service Needed" value={form.serviceNeeded || ""} onChange={(value) => setForm({ ...form, serviceNeeded: value })} />
    <NoteField label="Next Touch Action Note" value={form.nextTouchNote || ""} onChange={(value) => setForm({ ...form, nextTouchNote: value })} />
    {showStatus ? <><Choice label="Lead Status" options={["open", "sold", "lost", "ex_dated"]} value={form.status} onChange={(value) => setForm({ ...form, status: value as LeadInput["status"] })} /><NoteField label="Current Status Note" value={form.statusNote || ""} onChange={(value) => setForm({ ...form, statusNote: value })} />{form.status === "ex_dated" && <><Field label="Ex-Date" type="date" value={form.exDate || ""} onChange={(value) => setForm({ ...form, exDate: value })} /><NoteField label="Ex-Date Note (required)" value={form.exDateNote || ""} onChange={(value) => setForm({ ...form, exDateNote: value })} /></>}</> : null}
    <label className="block text-xs font-semibold text-steel">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="mt-1 w-full border border-surface rounded-xl px-3 py-2 text-sm" /></label>
    {error ? <div className="text-sm text-danger">{error}</div> : null}<div className={showCancel ? "grid grid-cols-2 gap-2" : "grid"}>{showCancel ? <button type="button" onClick={onClose} disabled={saving} className="w-full border border-surface text-brand-dark rounded-xl py-3 font-bold disabled:opacity-50">Cancel</button> : null}<button onClick={() => void save()} disabled={saving} className="w-full bg-brand-red text-white rounded-xl py-3 font-display text-lg font-bold uppercase disabled:opacity-50">{saving ? "Saving..." : "Save Lead"}</button></div>
  </div></Modal>
}

function localDateTime(value: string) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function leadInputFromLead(lead: SalesLead): LeadInput {
  return {
    assignedTo: lead.assignedTo || null,
    serviceRequested: lead.serviceRequested,
    serviceNeeded: lead.serviceNeeded,
    leadType: lead.leadType,
    customerName: lead.customerName,
    company: lead.company,
    first: lead.first,
    last: lead.last,
    locationName: lead.locationName,
    streetAddress: lead.streetAddress,
    city: lead.city,
    state: lead.state,
    zip: lead.zip,
    companyName: lead.companyName,
    phone: lead.phone,
    email: lead.email,
    preferredContact: lead.preferredContact,
    referralSource: lead.referralSource,
    referralSourceOther: lead.referralSourceOther,
    temperature: lead.temperature,
    status: effectiveLeadStatus(lead),
    statusNote: lead.statusNote,
    nextTouchNote: lead.nextTouchNote,
    exDate: lead.exDate,
    exDateNote: lead.exDateNote,
    notes: lead.notes,
    billToNumber: lead.billToNumber,
    locationNumber: lead.locationNumber,
    customerType: lead.customerType,
    contactName: lead.contactName,
    contactPhone: lead.contactPhone,
    serviceIds: lead.serviceIds,
    nextTouchPoint: lead.nextTouchPoint,
    nextFollowUpAt: lead.nextFollowUpAt ? localDateTime(lead.nextFollowUpAt) : "",
  }
}

function LeadDetail({ historyLoading, historyError, onRefreshHistory, assignees, assigneeLoading, assigneeError, lead, activities, onClose, onUpdate, onStartQuote, onAddActivity }: { lead: SalesLead; activities: LeadActivity[]; historyLoading: boolean; historyError: string; onRefreshHistory: () => Promise<void>; assignees: LeadAssignee[]; assigneeLoading: boolean; assigneeError: string; onClose: () => void; onUpdate: (input: Partial<LeadInput>) => Promise<void>; onStartQuote: () => void; onAddActivity: (input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">) => Promise<void> }) {
  const [activityOpen, setActivityOpen] = useState(false)
  const [type, setType] = useState("Called")
  const [note, setNote] = useState("")
  const [form, setForm] = useState(() => leadInputFromLead(lead))
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const save = async () => {
    const issue = leadFollowUpIssue(form)
    if (issue) { setNotice(issue); return false }
    setBusy(true); setNotice("")
    try { await onUpdate({ assignedTo: form.assignedTo || null, serviceRequested: form.serviceRequested || "", serviceNeeded: form.serviceNeeded || "", temperature: form.temperature, status: form.status, statusNote: form.statusNote || "", nextTouchPoint: form.nextTouchPoint, nextTouchNote: form.nextTouchNote || "", nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : "", exDate: form.exDate || "", exDateNote: form.exDateNote || "" }); setNotice("Lead updated."); return true }
    catch (error) { setNotice(error instanceof Error ? error.message : "Your changes are still here. Please try again."); return false }
    finally { setBusy(false) }
  }
  return <Modal title={lead.customerName} onClose={() => { if (!busy) onClose() }}><div className="space-y-4">
    <div className="rounded-xl bg-surface p-3 text-sm"><strong>{leadSourceLabel(lead)}</strong><p>{lead.source === "hubspot_form" ? "Received" : "Created"} · {leadDateLabel(lead.receivedAt || lead.createdAt)}</p></div>
    <fieldset disabled={busy} className="space-y-4"><AssignmentField value={form.assignedTo || null} currentName={leadAssigneeLabel(lead)} options={assignees} loading={assigneeLoading} error={assigneeError} onChange={(value) => setForm({ ...form, assignedTo: value })} />
      {lead.assignmentNotificationStatus && lead.assignedTo && <p className="text-xs text-steel">{lead.assignmentNotificationStatus === "sent" ? "Assignment email sent." : lead.assignmentNotificationStatus === "failed" ? "Assignment email needs attention. Contact an administrator." : "Assignment email queued."}</p>}
      <NoteField label="Service Requested" value={form.serviceRequested || ""} onChange={(value) => setForm({ ...form, serviceRequested: value })} /><NoteField label="Service Needed" value={form.serviceNeeded || ""} onChange={(value) => setForm({ ...form, serviceNeeded: value })} /><Choice label="Temperature" options={["hot", "warm", "cold"]} value={form.temperature} onChange={(value) => setForm({ ...form, temperature: value as LeadInput["temperature"] })} /><Choice label="Lead Status" options={["open", "sold", "lost", "ex_dated"]} value={form.status} onChange={(value) => setForm({ ...form, status: value as LeadInput["status"] })} />
      <NoteField label="Current Status Note" value={form.statusNote || ""} onChange={(value) => setForm({ ...form, statusNote: value })} />
      {form.status === "ex_dated" ? <div className="rounded-xl bg-purple-50 p-3 space-y-3"><Field label="Ex-Date (future date required)" type="date" value={form.exDate || ""} onChange={(value) => setForm({ ...form, exDate: value })} /><NoteField label="Ex-Date Note (required)" value={form.exDateNote || ""} onChange={(value) => setForm({ ...form, exDateNote: value })} /><p className="text-xs text-steel">This lead returns to Open on the Ex-Date. The date and note stay with the lead.</p></div> : lead.exDate ? <div className="rounded-xl bg-surface p-3 text-sm"><strong>Ex-Date · {leadDateLabel(lead.exDate)}</strong><p className="whitespace-pre-wrap">{lead.exDateNote}</p></div> : null}
      <Field label="Next Touch Date" type="datetime-local" value={form.nextFollowUpAt || ""} onChange={(value) => setForm({ ...form, nextFollowUpAt: value })} /><Choice label="Next Touch Action" options={["Contact", "Inspect", "Send Quote", "Follow-Up", "X-Date"]} value={form.nextTouchPoint || ""} onChange={(value) => setForm({ ...form, nextTouchPoint: value as LeadInput["nextTouchPoint"] })} /><NoteField label="Next Touch Action Note" value={form.nextTouchNote || ""} onChange={(value) => setForm({ ...form, nextTouchNote: value })} />
      <button onClick={() => void save()} className="w-full bg-brand-red text-white rounded-xl py-3 font-bold">{busy ? "Saving..." : "Save Lead Update"}</button>
    </fieldset>
    {notice && <p role="status" className="text-sm text-brand-dark rounded-xl bg-surface p-3">{notice}</p>}
    <div className="bg-surface rounded-xl p-3 text-sm text-brand-dark"><div>{lead.phone || "No phone"} · {lead.email || "No email"}</div><div className="text-xs text-steel mt-1">Preferred: {lead.preferredContact || "Not selected"} · Source: {lead.referralSource || "Not selected"}</div></div>
    <button disabled={busy} onClick={async () => { if (await save()) onStartQuote() }} className="w-full bg-brand-red text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-40"><FileText size={17} /> Start Quote</button>
    <button disabled={busy} onClick={() => { setType("Comment"); setActivityOpen(true); setNotice("") }} className="w-full border border-brand-red text-brand-red rounded-xl py-3 font-bold">Add Comment</button>
    <button disabled={busy} onClick={() => setActivityOpen((value) => !value)} className="w-full bg-brand-dark text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"><MessageSquarePlus size={17} /> Add Customer Interaction</button>
    {activityOpen ? <div className="border border-surface rounded-2xl p-3 space-y-3"><Choice label="Interaction" options={LEAD_ACTIVITY_TYPES} value={type} onChange={setType} /><NoteField label="Update Note" value={note} onChange={setNote} /><button disabled={busy} onClick={async () => { const issue = leadCommentIssue(type, note); if (issue) { setNotice(issue); return } setBusy(true); setNotice(""); try { await onAddActivity({ type, note: note.trim(), happenedAt: new Date().toISOString() }); setNote(""); setActivityOpen(false) } catch (error) { setNotice(error instanceof Error ? error.message : "The update could not be saved. Your note is still here.") } finally { setBusy(false) } }} className="w-full bg-brand-red text-white rounded-xl py-2.5 font-bold disabled:opacity-40">{type === "Comment" ? "Save Comment" : "Log Interaction"}</button></div> : null}
    <section aria-label="Lead activity timeline"><div className="flex items-center justify-between gap-3 mb-3"><h3 className="font-display text-lg font-bold text-brand-dark uppercase">Full Lead Timeline</h3><button disabled={historyLoading} onClick={() => void onRefreshHistory()} className="text-xs font-bold text-brand-red disabled:opacity-40"><RefreshCw size={13} className="inline mr-1" />Refresh History</button></div>
      {historyLoading && <p role="status" className="text-sm text-steel">Loading lead history…</p>}
      {historyError && <p role="alert" className="text-sm text-danger mb-3">History refresh failed: {historyError} Your saved updates remain recorded. Choose Refresh History to try again.</p>}
      {!historyLoading && !historyError && activities.length === 0 ? <p className="text-sm text-steel">No updates recorded yet.</p> : <ol className="space-y-3">{[...activities].sort((a, b) => (b.happenedAt || b.createdAt).localeCompare(a.happenedAt || a.createdAt) || b.createdAt.localeCompare(a.createdAt)).map((activity) => <li key={activity.id} className="border-l-2 border-brand-red pl-3 py-1"><div className="text-sm font-semibold text-brand-dark">{activity.type}</div><div className="text-xs text-steel">{activity.createdByName || assignees.find((person) => person.username === activity.createdBy)?.displayName || activity.createdBy || "Unknown user"} · {new Date(activity.happenedAt || activity.createdAt).toLocaleString("en-US", { timeZone: "America/New_York" })}</div>{activity.note && <p className="text-sm text-steel mt-1 whitespace-pre-wrap break-words">{activity.note}</p>}</li>)}</ol>}
    </section>
  </div></Modal>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center p-4" onClick={onClose}><div className="bg-white rounded-3xl p-5 w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="font-display text-2xl font-bold text-brand-dark uppercase">{title}</h2><button onClick={onClose} className="text-silver" aria-label="Close"><X size={20} /></button></div>{children}</div></div> }
function Choice({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (value: string) => void }) { return <div><div className="text-xs font-semibold text-steel mb-1">{label}</div><div className="flex flex-wrap gap-2">{options.map((option) => <button type="button" key={option} onClick={() => onChange(option)} className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${option in temperatureStyle ? `${temperatureStyle[option as SalesLead["temperature"]].className} ${value === option ? "border-current ring-2 ring-current" : "border-transparent"}` : value === option ? "bg-brand-dark border-brand-dark text-white" : "bg-white border-surface text-steel"}`}>{option in LEAD_STATUS_LABELS ? LEAD_STATUS_LABELS[option as SalesLead["status"]] : option}</button>)}</div></div> }
function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) { return <label className="block min-w-0 text-xs font-semibold text-steel">{label}<input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full border border-surface rounded-xl px-3 py-2.5 text-sm text-brand-dark disabled:bg-surface disabled:text-steel" /></label> }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className="bg-white rounded-2xl p-6 text-center shadow-sm"><div className="font-semibold text-brand-dark">{title}</div><div className="text-sm text-steel mt-1">{detail}</div></div> }
function Loading({ label }: { label: string }) { return <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">{label}</div> }

function NoteField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-xs font-semibold text-steel">{label}<textarea rows={2} maxLength={2000} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-surface px-3 py-2 text-sm text-brand-dark" /></label> }

function AssignmentField({ value, currentName, options, loading, error, onChange }: { value: string | null; currentName: string; options: LeadAssignee[]; loading?: boolean; error?: string; onChange: (value: string | null) => void }) {
  return <label className="block text-xs font-semibold text-steel">Assigned Salesperson<select value={value || ""} disabled={loading || Boolean(error)} onChange={(event) => onChange(event.target.value || null)} className="block w-full mt-1 rounded-xl border border-surface px-3 py-3 text-sm text-brand-dark disabled:opacity-50"><option value="">UNASSIGNED</option>{value && !options.some((employee) => employee.username === value) && <option value={value}>{currentName || value} (current assignment)</option>}{options.map((employee) => <option key={employee.username} value={employee.username}>{employee.displayName || employee.username}</option>)}</select>{loading && <span className="block mt-1">Loading salespeople…</span>}{error && <span role="alert" className="block mt-1 text-danger">{error}</span>}<span className="block mt-1 text-steel">Assigning a salesperson sends them a notification email.</span></label>
}
