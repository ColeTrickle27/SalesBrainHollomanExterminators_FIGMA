import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronRight, FileText, RefreshCw, Search } from 'lucide-react'

import type { SalesBrainEstimateListItem } from '../services/opsBrain'

interface Props {
  estimates: SalesBrainEstimateListItem[]
  loading: boolean
  error: string | null
  onOpen: (id: string) => void
  onRefresh: () => void
}

const statusStyle: Record<string, string> = {
  draft: 'bg-amber-light text-amber',
  sent: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  declined: 'bg-danger-light text-danger',
}

export default function QuoteHistory({ estimates, loading, error, onOpen, onRefresh }: Props) {
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
          <button key={estimate.id} onClick={() => onOpen(estimate.id)} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center"><FileText size={18} className="text-steel" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold text-brand-dark truncate">{estimate.customerName || 'Customer not selected'}</span><span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusStyle[estimate.status]}`}>{estimate.status}</span></div>
              <div className="text-xs text-steel truncate mt-1">{estimate.locationAddress || estimate.locationName || 'No location'}</div>
              <div className="flex items-center justify-between gap-2 mt-2 text-xs"><span className="font-mono text-silver">{estimate.estimateNumber}</span><span className="text-silver">Updated {new Date(estimate.updatedAt).toLocaleDateString()}</span>{estimate.totalCents !== null ? <span className="font-mono font-bold text-brand-dark">${(estimate.totalCents / 100).toLocaleString()}</span> : null}</div>
            </div>
            <ChevronRight size={17} className="text-silver mt-2" />
          </button>
        ))}
      </div>
    </div>
  )
}
