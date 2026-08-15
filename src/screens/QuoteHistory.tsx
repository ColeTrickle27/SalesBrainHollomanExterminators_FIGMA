import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronRight, FileText, Percent, RefreshCw, Search, Trash2, TrendingUp } from 'lucide-react'

import type { SalesBrainEstimateListItem } from '../services/opsBrain'

interface Props {
  estimates: SalesBrainEstimateListItem[]
  loading: boolean
  error: string | null
  onOpen: (id: string) => void
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
  metrics?: {
    acceptedCount: number
    acceptedRevenueCents: number
    closeRatePercent: number | null
    averageMarginPercent: number | null
  }
}

const statusStyle: Record<string, string> = {
  draft: 'bg-amber-light text-amber',
  sent: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  declined: 'bg-danger-light text-danger',
}

export default function QuoteHistory({ estimates, loading, error, onOpen, onDelete, onRefresh, metrics }: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return estimates.filter((estimate) => {
      const matchesStatus = status === 'all' || estimate.status === status
      const haystack = [estimate.customerName, estimate.locationName, estimate.locationAddress, estimate.estimateNumber].filter(Boolean).join(' ').toLowerCase()
      return matchesStatus && (!normalized || haystack.includes(normalized))
    })
  }, [estimates, query, status])

  return (
    <div className="pb-24 px-4 pt-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-dark uppercase tracking-wide">Quote History</h1>
          <p className="text-sm text-steel">Saved Sales Brain records from authenticated Ops Brain storage</p>
        </div>
        <button onClick={onRefresh} className="text-sm text-brand-red font-semibold flex items-center gap-1"><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Metric icon={CheckCircle} label="Accepted" value={`$${((metrics?.acceptedRevenueCents || 0) / 100).toLocaleString()}`} sub={`${metrics?.acceptedCount || 0} accepted quote${metrics?.acceptedCount === 1 ? '' : 's'}`} />
        <Metric icon={TrendingUp} label="Close Rate" value={metrics?.closeRatePercent == null ? '—' : `${metrics.closeRatePercent.toFixed(1)}%`} sub="Accepted / decided · 30 days" />
        <Metric icon={Percent} label="Average Margin" value={metrics?.averageMarginPercent == null ? '—' : `${metrics.averageMarginPercent.toFixed(1)}%`} sub="Accepted quotes with costing" />
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-2 mb-4">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-white border border-surface rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" placeholder="Search quotes…" /></div>
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'draft', 'sent', 'accepted', 'declined'].map((value) => <button key={value} onClick={() => setStatus(value)} className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${status === value ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-surface text-steel'}`}>{value}</button>)}
        </div>
      </div>

      {error ? <div className="bg-danger-light border border-danger/25 rounded-2xl p-4 flex items-center gap-2 text-sm text-danger"><AlertTriangle size={17} />{error}</div> : null}
      {loading ? <div className="bg-white rounded-2xl p-7 text-center text-sm text-steel">Loading quote history…</div> : null}
      {!loading && !error && filtered.length === 0 ? <div className="bg-white rounded-2xl p-7 text-center"><FileText size={32} className="text-silver mx-auto mb-2" /><div className="font-semibold text-brand-dark">No matching quotes</div></div> : null}

      <div className="grid lg:grid-cols-2 gap-3">
        {filtered.map((estimate) => (
          <article key={estimate.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 hover:shadow-md transition-all">
            <button onClick={() => onOpen(estimate.id)} className="flex flex-1 min-w-0 items-start gap-3 text-left">
            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center"><FileText size={18} className="text-steel" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold text-brand-dark truncate">{estimate.customerName || 'Customer not selected'}</span><span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusStyle[estimate.status]}`}>{estimate.status}</span></div>
              <div className="text-xs text-steel truncate mt-1">{estimate.locationAddress || estimate.locationName || 'No location'}</div>
              <div className="flex items-center justify-between gap-2 mt-2 text-xs"><span className="font-mono text-silver">{estimate.estimateNumber}</span><span className="text-silver">Updated {new Date(estimate.updatedAt).toLocaleDateString()}</span>{estimate.totalCents !== null ? <span className="font-mono font-bold text-brand-dark">${(estimate.totalCents / 100).toLocaleString()}</span> : null}</div>
            </div>
            <ChevronRight size={17} className="text-silver mt-2" />
            </button>
            {estimate.status === 'draft' || estimate.status === 'sent' ? <button onClick={() => { if (window.confirm(`Delete open quote ${estimate.estimateNumber}? This removes it from SalesBrain.`)) void onDelete(estimate.id).catch(() => undefined) }} className="p-2 text-danger hover:bg-danger-light rounded-xl" aria-label={`Delete quote ${estimate.estimateNumber}`} title="Delete open quote"><Trash2 size={17} /></button> : null}
          </article>
        ))}
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, sub }: { icon: typeof CheckCircle; label: string; value: string; sub: string }) {
  return <div className="bg-white rounded-2xl p-4 shadow-sm"><div className="flex items-center gap-2 text-brand-red"><Icon size={18} /><span className="text-xs font-bold uppercase tracking-wide">{label}</span></div><div className="font-display text-3xl font-bold text-brand-dark mt-2">{value}</div><div className="text-xs text-steel mt-1">{sub}</div></div>
}
