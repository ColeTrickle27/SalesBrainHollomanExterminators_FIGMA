import { useState } from 'react'
import { Clock, MapPin, ChevronRight, Plus, FileText, CheckCircle, RefreshCw, Edit3, Search } from 'lucide-react'
import { dashboardAppointments, dashboardDrafts, sampleTech } from '../data/sample'

const OPEN_LEADS = [
  { id: 'lead-001', name: 'Marcus Webb', phone: '(478) 555-0191', serviceType: 'Termites', dateAdded: 'Jul 18', lastTouch: 'Called lead, scheduled appointment for 8/20/26', temp: 'hot' as const, quoted: false, proposalValue: null },
  { id: 'lead-002', name: 'Sandra Okafor', phone: '(910) 555-0234', serviceType: 'Moisture Remediation', dateAdded: 'Jul 20', lastTouch: 'Left voicemail 8/8/26', temp: 'warm' as const, quoted: false, proposalValue: null },
  { id: 'lead-003', name: 'Greenway HOA – Bldg 7', phone: '(478) 555-0500', serviceType: 'General Pest Control', dateAdded: 'Jul 21', lastTouch: 'Quote sent 8/1/26', temp: 'warm' as const, quoted: true, proposalValue: 1200 },
  { id: 'lead-004', name: 'Patricia Hollis', phone: '(478) 555-0348', serviceType: 'Rodents', dateAdded: 'Jul 22', lastTouch: 'Inspection completed 8/4/26', temp: 'hot' as const, quoted: true, proposalValue: 750 },
  { id: 'lead-005', name: 'Thomas Abernethy', phone: '(478) 555-0204', serviceType: 'Carpenter Bees', dateAdded: 'Aug 1', lastTouch: 'Follow-up email sent 8/7/26', temp: 'cold' as const, quoted: false, proposalValue: null },
  { id: 'lead-006', name: 'Pinetree Apts – Unit 4B', phone: '(478) 555-0611', serviceType: 'Bed Bugs', dateAdded: 'Aug 3', lastTouch: 'Inspection scheduled 8/14/26', temp: 'hot' as const, quoted: false, proposalValue: null, source: 'HubSpot Webform via Gmail' },
]

interface DashboardProps {
  onStartInspection: () => void
  onOpenLead: (name: string) => void
  onOpenDraft: () => void
}

type LeadTemp = 'hot' | 'warm' | 'cold' | null

const tempConfig: Record<NonNullable<LeadTemp>, { label: string; bg: string; text: string; border: string }> = {
  hot:  { label: '🔥 Hot',  bg: 'bg-brand-red',   text: 'text-white',      border: 'border-brand-red' },
  warm: { label: '☀️ Warm', bg: 'bg-amber',        text: 'text-white',      border: 'border-amber' },
  cold: { label: '❄️ Cold', bg: 'bg-info',         text: 'text-white',      border: 'border-info' },
}


const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  'in-progress': { label: 'In Progress', color: 'text-brand-red', dot: 'bg-brand-red' },
  'scheduled': { label: 'Scheduled', color: 'text-steel', dot: 'bg-steel' },
  'completed': { label: 'Completed', color: 'text-success', dot: 'bg-success' },
}

export default function Dashboard({ onStartInspection, onOpenLead, onOpenDraft }: DashboardProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const [leadSearch, setLeadSearch] = useState('')
  const [leadTempFilter, setLeadTempFilter] = useState<LeadTemp | null>(null)

  const filteredLeads = OPEN_LEADS.filter(l => {
    const matchSearch = !leadSearch || l.name.toLowerCase().includes(leadSearch.toLowerCase()) || l.serviceType.toLowerCase().includes(leadSearch.toLowerCase())
    const matchTemp = !leadTempFilter || l.temp === leadTempFilter
    return matchSearch && matchTemp
  })

  return (
    <div className="pb-24">
      {/* Welcome strip */}
      <div className="bg-brand-charcoal px-5 pt-5 pb-6">
        <div className="text-silver text-xs uppercase tracking-widest font-semibold font-mono mb-0.5">{today}</div>
        <div className="font-display text-3xl font-bold text-white tracking-wide">
          {`Good morning, ${sampleTech.name.split(' ')[0]}`}
        </div>
        <div className="text-steel text-sm mt-1">{`Holloman Exterminators · ${sampleTech.role}`}</div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Today's Tasks", value: '3', sub: '1 in progress' },
            { label: 'Open Drafts', value: '2', sub: 'Need attention' },
            { label: 'Pending Quotes', value: '1', sub: 'Awaiting response' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/8 rounded-xl p-3 text-center">
              <div className="font-display text-3xl font-bold text-white leading-none">{stat.value}</div>
              <div className="text-silver text-xs mt-1 leading-tight">{stat.label}</div>
              <div className="text-brand-red text-xs mt-0.5 font-semibold">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onStartInspection}
            className="bg-brand-red rounded-2xl p-4 flex items-center gap-3 active:scale-97 transition-all shadow-sm"
          >
            <div className="w-10 h-10 bg-[rgba(42,42,42,0.2)] rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus size={22} stroke="rgb(252,252,252)" className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-display text-lg font-bold text-white leading-tight uppercase">Start Inspection</div>
              <div className="text-white/70 text-xs mt-0.5">New quote / inspection</div>
            </div>
          </button>
        </div>

        {/* Open Leads */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">Open Leads</h2>
            <span className="bg-brand-red text-white text-xs font-bold px-2 py-0.5 rounded-full">{OPEN_LEADS.length}</span>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" />
            <input
              value={leadSearch}
              onChange={e => setLeadSearch(e.target.value)}
              className="w-full bg-white border border-surface rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
              placeholder="Search leads…"
            />
          </div>

          {/* Temp filter pills */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button
              onClick={() => setLeadTempFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex-shrink-0 ${!leadTempFilter ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-surface text-steel'}`}
            >
              All
            </button>
            {(['hot', 'warm', 'cold'] as const).map(t => {
              const cfg = tempConfig[t]
              return (
                <button
                  key={t}
                  onClick={() => setLeadTempFilter(leadTempFilter === t ? null : t)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex-shrink-0 ${leadTempFilter === t ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-white border-surface text-steel'}`}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-2.5">
            {filteredLeads.map(lead => {
              const cfg = tempConfig[lead.temp]
              return (
                <div
                  key={lead.id}
                  onClick={() => onOpenLead(lead.name)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left active:scale-98 transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-brand-dark leading-snug truncate">{lead.name}</div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-block bg-surface text-steel text-xs px-2 py-0.5 rounded-full font-semibold">{lead.serviceType}</span>
                      {lead.quoted
                        ? <span className="text-xs bg-success-light text-success font-bold px-2 py-0.5 rounded-full">Quoted ${lead.proposalValue?.toLocaleString()}</span>
                        : <span className="text-xs bg-surface text-silver font-semibold px-2 py-0.5 rounded-full">Unquoted</span>
                      }
                      {'source' in lead && lead.source && (
                        <span className="text-xs bg-info-light text-info font-semibold px-2 py-0.5 rounded-full">HubSpot</span>
                      )}
                    </div>
                    <div className="text-xs text-steel mt-1.5 truncate">{lead.lastTouch}</div>
                    <div className="text-xs text-silver mt-0.5">Added {lead.dateAdded}</div>
                  </div>
                  <ChevronRight size={18} className="text-silver flex-shrink-0 mt-1" />
                </div>
              )
            })}
          </div>
        </section>

        {/* Today's Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">Today</h2>
            <span className="text-xs text-steel font-mono">{dashboardAppointments.length} appointments</span>
          </div>
          <div className="space-y-2.5">
            {dashboardAppointments.map(appt => {
              const st = statusConfig[appt.status]
              return (
                <button
                  key={appt.id}
                  onClick={onOpenDraft}
                  className={`w-full bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left transition-all active:scale-98 ${appt.status === 'in-progress' ? 'ring-2 ring-brand-red' : ''}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${st.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-steel flex-shrink-0" />
                        <span className="text-xs font-mono text-steel">{appt.time}</span>
                      </div>
                      <span className={`text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="font-semibold text-brand-dark mt-1 leading-snug">{appt.customer}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} className="text-silver flex-shrink-0" />
                      <span className="text-xs text-steel truncate">{appt.address}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="inline-block bg-surface text-steel text-xs px-2.5 py-0.5 rounded-full font-semibold">{appt.type}</span>
                      <span className="font-mono text-xs text-silver">{appt.jobId}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-silver flex-shrink-0 mt-2" />
                </button>
              )
            })}
          </div>
        </section>

        {/* Open Drafts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">Open Drafts</h2>
            <button className="text-xs text-brand-red font-semibold">See all</button>
          </div>
          <div className="space-y-2.5">
            {dashboardDrafts.map(draft => (
              <button
                key={draft.id}
                onClick={onOpenDraft}
                className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left active:scale-98 transition-all"
              >
                <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center flex-shrink-0">
                  <Edit3 size={18} className="text-steel" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brand-dark leading-snug">{draft.customer}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} className="text-silver flex-shrink-0" />
                    <span className="text-xs text-steel truncate">{draft.address}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber" />
                      <span className="text-xs text-amber font-semibold">Step {draft.stepNum}: {draft.step}</span>
                    </div>
                    <span className="text-xs text-steel">{draft.lastModified.split(' — ')[1]}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-silver flex-shrink-0 mt-2" />
              </button>
            ))}
          </div>
        </section>

        {/* Pending Quotes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">Pending Quotes</h2>
            <button className="text-xs text-brand-red font-semibold">See all</button>
          </div>
          <div className="space-y-2">
            {[
              { customer: 'Greenway HOA – Bldg 4', date: 'Jul 20', option: 'Complete Protection — $8,200', id: 'JQ-2026-0841', days: '2 days' },
              { customer: 'Raymond Castillo', date: 'Jul 22', option: 'Recommended — $1,950', id: 'JQ-2026-0847', days: 'Today' },
            ].map(q => (
              <button key={q.id} onClick={onOpenDraft} className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm text-left active:scale-98 transition-all">
                <FileText size={18} className="text-amber flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-brand-dark text-sm truncate">{q.customer}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-amber bg-amber-light flex-shrink-0">Pending</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-steel">{q.option}</span>
                    <span className="text-xs text-silver font-mono">{q.id}</span>
                  </div>
                  <div className="text-xs text-steel mt-1">Sent {q.days} ago</div>
                </div>
                <ChevronRight size={16} className="text-silver flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Sync status */}
        <div className="flex items-center justify-between bg-success-light border border-success/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-success" />
            <span className="text-sm text-success font-semibold">All data synced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw size={13} className="text-success/70" />
            <span className="text-xs text-success/70 font-mono">2 min ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
