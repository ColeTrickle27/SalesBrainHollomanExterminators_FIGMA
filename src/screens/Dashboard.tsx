import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronRight, FileText, MapPin, Plus, RefreshCw, Search } from 'lucide-react'

import type { SalesBrainEstimateListItem } from '../services/opsBrain'
import type { OpsBrainUser } from '../types/user'

interface DashboardProps {
  user: OpsBrainUser | null
  userLoading: boolean
  estimates: SalesBrainEstimateListItem[]
  estimatesLoading: boolean
  estimatesError: string | null
  onStartInspection: () => void
  onOpenEstimate: (id: string) => void
  onRefresh: () => void
}

const statusStyle: Record<string, string> = {
  draft: 'bg-amber-light text-amber',
  sent: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  declined: 'bg-danger-light text-danger',
}

export default function Dashboard({
  user,
  userLoading,
  estimates,
  estimatesLoading,
  estimatesError,
  onStartInspection,
  onOpenEstimate,
  onRefresh,
}: DashboardProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('open')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return estimates.filter((estimate) => {
      const matchesStatus = status === 'all'
        || (status === 'open' && (estimate.status === 'draft' || estimate.status === 'sent'))
        || estimate.status === status
      const searchText = [estimate.customerName, estimate.locationName, estimate.locationAddress, estimate.estimateNumber]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return matchesStatus && (!normalized || searchText.includes(normalized))
    })
  }, [estimates, query, status])

  const openCount = estimates.filter((estimate) => estimate.status === 'draft' || estimate.status === 'sent').length
  const acceptedCount = estimates.filter((estimate) => estimate.status === 'accepted').length
  const sentCount = estimates.filter((estimate) => estimate.status === 'sent').length
  const firstName = user?.name?.split(/\s+/)[0] || 'there'

  return (
    <div className="pb-24">
      <div className="bg-brand-charcoal px-5 pt-5 pb-6">
        <div className="text-silver text-xs uppercase tracking-widest font-semibold font-mono mb-0.5">{today}</div>
        <div className="font-display text-3xl font-bold text-white tracking-wide">
          {userLoading ? 'Loading your workspace…' : `Good morning, ${firstName}`}
        </div>
        <div className="text-steel text-sm mt-1">Holloman Exterminators{user?.role ? ` • ${user.role}` : ''}</div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Open Work', value: openCount, sub: 'Draft or sent' },
            { label: 'Sent Quotes', value: sentCount, sub: 'Awaiting response' },
            { label: 'Accepted', value: acceptedCount, sub: 'Recorded in Sales Brain' },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0 bg-white/8 rounded-xl p-3 text-center">
              <div className="font-display text-3xl font-bold text-white leading-none">{stat.value}</div>
              <div className="text-silver text-xs mt-1 leading-tight">{stat.label}</div>
              <div className="text-brand-red text-[11px] mt-0.5 font-semibold">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5 max-w-6xl mx-auto">
        <button onClick={onStartInspection} className="w-full bg-brand-red rounded-2xl p-4 flex items-center gap-3 active:scale-97 transition-all shadow-sm">
          <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center flex-shrink-0"><Plus size={22} className="text-white" /></div>
          <div className="text-left">
            <div className="font-display text-lg font-bold text-white leading-tight uppercase">Start Inspection</div>
            <div className="text-white/70 text-xs mt-0.5">Create a durable quote from an Ops Brain customer</div>
          </div>
        </button>

        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">Open Sales Work</h2>
              <span className="bg-brand-red text-white text-xs font-bold px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <button onClick={onRefresh} className="text-xs text-brand-red font-semibold flex items-center gap-1"><RefreshCw size={13} /> Refresh</button>
          </div>

          <div className="grid md:grid-cols-[1fr_auto] gap-2 mb-3">
            <div className="relative min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-white border border-surface rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" placeholder="Search customer, address, or quote number…" />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {['open', 'draft', 'sent', 'accepted', 'all'].map((value) => (
                <button key={value} onClick={() => setStatus(value)} className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${status === value ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-surface text-steel'}`}>{value}</button>
              ))}
            </div>
          </div>

          {estimatesError ? (
            <div className="bg-danger-light border border-danger/25 rounded-2xl p-4 flex gap-2 text-sm text-danger"><AlertTriangle size={17} />{estimatesError}</div>
          ) : null}
          {estimatesLoading ? <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">Loading saved Sales Brain records…</div> : null}
          {!estimatesLoading && !estimatesError && filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-7 text-center shadow-sm">
              <FileText size={32} className="text-silver mx-auto mb-2" />
              <div className="font-semibold text-brand-dark">No matching sales work</div>
              <p className="text-sm text-steel mt-1">Start an inspection to create the first saved quote.</p>
            </div>
          ) : null}

          <div className="grid lg:grid-cols-2 gap-2.5">
            {filtered.map((estimate) => (
              <button key={estimate.id} onClick={() => onOpenEstimate(estimate.id)} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left active:scale-98 transition-all">
                <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-steel" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-brand-dark truncate">{estimate.customerName || 'Customer not selected'}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusStyle[estimate.status] || 'bg-surface text-steel'}`}>{estimate.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1"><MapPin size={12} className="text-silver" /><span className="text-xs text-steel truncate">{estimate.locationAddress || estimate.locationName || 'Location not selected'}</span></div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-2 text-xs text-silver">
                    <span className="font-mono">{estimate.estimateNumber}</span>
                    <span>{new Date(estimate.updatedAt).toLocaleDateString()}</span>
                    {estimate.totalCents !== null ? <span className="font-mono font-bold text-brand-dark">${(estimate.totalCents / 100).toLocaleString()}</span> : null}
                  </div>
                </div>
                <ChevronRight size={18} className="text-silver flex-shrink-0 mt-2" />
              </button>
            ))}
          </div>
        </section>

        <div className="bg-info-light border border-info/20 rounded-2xl px-4 py-3 text-sm text-info">
          Scheduling, billing, and service history remain in PestPac. Sales Brain keeps the inspection and quote record without claiming live PestPac connectivity.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-success-light border border-success/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2"><CheckCircle size={16} className="text-success" /><span className="text-sm text-success font-semibold">Connected to Ops Brain storage</span></div>
          <span className="text-xs text-success/70 font-mono">Same-origin session</span>
        </div>
      </div>
    </div>
  )
}
