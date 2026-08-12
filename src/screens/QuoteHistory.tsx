import { useState } from 'react'
import { ChevronRight, Clock, FileText, Copy, Eye, RotateCcw, CheckCircle, XCircle, AlertCircle, ChevronUp, ArrowLeftRight, Lock } from 'lucide-react'

interface QuoteRecord {
  id: string
  jobId: string
  customer: string
  address: string
  tech: string
  createdDate: string
  expiresDate: string
  services: string[]
  selectedOption: string
  oneTimeAmount: number
  recurringAmount: number
  status: 'accepted' | 'pending' | 'declined' | 'expired' | 'draft' | 'revised'
  revisions: number
  signedDate?: string
  margin?: number
}

const QUOTES: QuoteRecord[] = [
  { id: 'q1', jobId: 'JQ-2026-0847', customer: 'Sarah & David Chen', address: '4821 Magnolia Trace, Warner Robins, GA', tech: 'Marcus Webb', createdDate: 'Jul 23, 2026', expiresDate: 'Aug 7, 2026', services: ['Termite Liquid Barrier', 'Crawlspace Moisture Control'], selectedOption: 'Recommended', oneTimeAmount: 3850, recurringAmount: 195, status: 'accepted', revisions: 1, signedDate: 'Jul 23, 2026 11:14 AM', margin: 44.7 },
  { id: 'q2', jobId: 'JQ-2026-0844', customer: 'Thomas Abernethy', address: '208 Ridgecrest Dr, Perry, GA 31069', tech: 'Marcus Webb', createdDate: 'Jul 21, 2026', expiresDate: 'Aug 5, 2026', services: ['General Pest – Initial', 'Recurring Quarterly Plan'], selectedOption: 'Recommended', oneTimeAmount: 189, recurringAmount: 95, status: 'accepted', revisions: 0, signedDate: 'Jul 21, 2026 2:30 PM', margin: 52.1 },
  { id: 'q3', jobId: 'JQ-2026-0841', customer: 'Greenway HOA – Bldg 4', address: '1200 Greenway Blvd, Warner Robins, GA', tech: 'Marcus Webb', createdDate: 'Jul 20, 2026', expiresDate: 'Aug 4, 2026', services: ['Full Crawlspace Encapsulation', 'Termite Liquid Barrier'], selectedOption: 'Complete Protection', oneTimeAmount: 8200, recurringAmount: 395, status: 'pending', revisions: 0, margin: 46.3 },
  { id: 'q4', jobId: 'JQ-2026-0838', customer: 'Marcus & Tonya Reynolds', address: '5503 Peach Orchard Rd, Macon, GA', tech: 'Marcus Webb', createdDate: 'Jul 22, 2026', expiresDate: 'Aug 6, 2026', services: ['Full Crawlspace Encapsulation', 'Termite Liquid Barrier'], selectedOption: '—', oneTimeAmount: 0, recurringAmount: 0, status: 'draft', revisions: 0, margin: undefined },
  { id: 'q5', jobId: 'JQ-2026-0831', customer: 'Patricia Hollis', address: '88 Lakewood Dr, Centerville, GA', tech: 'Marcus Webb', createdDate: 'Jul 18, 2026', expiresDate: 'Aug 2, 2026', services: ['General Pest – Initial + Quarterly'], selectedOption: 'Essential', oneTimeAmount: 875, recurringAmount: 75, status: 'expired', revisions: 0, margin: 48.0 },
  { id: 'q6', jobId: 'JQ-2026-0827', customer: 'Robert & Linda Tanner', address: '209 Briarwood Cir, Byron, GA', tech: 'Marcus Webb', createdDate: 'Jul 15, 2026', expiresDate: 'Jul 30, 2026', services: ['Annual Termite Renewal Inspection'], selectedOption: 'Renewal', oneTimeAmount: 195, recurringAmount: 195, status: 'accepted', revisions: 0, signedDate: 'Jul 16, 2026 9:02 AM', margin: 61.5 },
]

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  'accepted': { label: 'Accepted', icon: <CheckCircle size={14} />, bg: 'bg-success-light', text: 'text-success' },
  'pending': { label: 'Pending', icon: <Clock size={14} />, bg: 'bg-amber-light', text: 'text-amber' },
  'declined': { label: 'Declined', icon: <XCircle size={14} />, bg: 'bg-danger-light', text: 'text-danger' },
  'expired': { label: 'Expired', icon: <AlertCircle size={14} />, bg: 'bg-surface', text: 'text-silver' },
  'draft': { label: 'Draft', icon: <FileText size={14} />, bg: 'bg-info-light', text: 'text-info' },
  'revised': { label: 'Revised', icon: <RotateCcw size={14} />, bg: 'bg-surface', text: 'text-steel' },
}

export default function QuoteHistory() {
  const [expanded, setExpanded] = useState<string | null>('q1')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filtered = statusFilter ? QUOTES.filter(q => q.status === statusFilter) : QUOTES

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    )
  }

  const compareA = QUOTES.find(q => q.id === compareIds[0])
  const compareB = QUOTES.find(q => q.id === compareIds[1])

  const totals = { accepted: QUOTES.filter(q => q.status === 'accepted').reduce((s, q) => s + q.oneTimeAmount, 0), count: QUOTES.filter(q => q.status === 'accepted').length }

  return (
    <div className="pb-24">
      {/* Summary header */}
      <div className="bg-brand-charcoal px-5 pt-5 pb-5">
        <div className="font-display text-3xl font-bold text-white uppercase tracking-wide">Quote History</div>
        <div className="text-steel text-sm mt-0.5">Marcus Webb · Warner Robins · Last 30 days</div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Accepted', value: `$${(totals.accepted / 1000).toFixed(1)}k`, sub: `${totals.count} jobs` },
            { label: 'Close Rate', value: '68%', sub: 'Last 30 days' },
            { label: 'Avg. Margin', value: '50.7%', sub: 'Accepted only' },
          ].map(s => (
            <div key={s.label} className="bg-white/8 rounded-xl p-3 text-center">
              <div className="font-display text-2xl font-bold text-white">{s.value}</div>
              <div className="text-silver text-xs mt-0.5">{s.label}</div>
              <div className="text-steel text-xs">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setStatusFilter(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${!statusFilter ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-surface text-steel'}`}>
            All ({QUOTES.length})
          </button>
          {['accepted', 'pending', 'draft', 'expired'].map(s => {
            const count = QUOTES.filter(q => q.status === s).length
            const st = STATUS_CONFIG[s]
            return (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${statusFilter === s ? 'bg-brand-dark border-brand-dark text-white' : `bg-white border-surface ${st.text}`}`}>
                {st.label} ({count})
              </button>
            )
          })}
          {compareIds.length > 0 && (
            <button onClick={() => setShowCompare(!showCompare)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-info text-white whitespace-nowrap border-info flex-shrink-0">
              <ArrowLeftRight size={12} />
              Compare ({compareIds.length}/2)
            </button>
          )}
        </div>

        {/* Compare panel */}
        {showCompare && compareA && compareB && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-info">
            <div className="px-4 py-2.5 bg-info flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={16} className="text-white" />
                <span className="font-display text-sm font-bold text-white uppercase tracking-wider">Side-by-Side Comparison</span>
              </div>
              <button onClick={() => { setCompareIds([]); setShowCompare(false) }} className="text-white/70 hover:text-white text-xs font-semibold">Clear</button>
            </div>
            <div className="grid grid-cols-2 divide-x divide-surface">
              {[compareA, compareB].map(q => {
                const st = STATUS_CONFIG[q.status]
                return (
                  <div key={q.id} className="p-4 space-y-2">
                    <div className="font-mono text-xs text-silver">{q.jobId}</div>
                    <div className="font-semibold text-brand-dark text-sm leading-snug">{q.customer}</div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                      {st.icon} {st.label}
                    </span>
                    {q.oneTimeAmount > 0 && (
                      <div className="font-mono text-xl font-bold text-brand-dark">${q.oneTimeAmount.toLocaleString()}</div>
                    )}
                    <div className="text-xs text-steel">{q.selectedOption}</div>
                    <ul className="space-y-0.5">
                      {q.services.map((s, i) => <li key={i} className="text-xs text-steel flex items-start gap-1"><span className="text-silver">·</span>{s}</li>)}
                    </ul>
                    {q.margin && (
                      <div className="text-xs font-mono">
                        <span className="text-steel">Margin: </span>
                        <span className={`font-bold ${q.margin >= 45 ? 'text-success' : 'text-amber'}`}>{q.margin}%</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quote list */}
        <div className="space-y-2.5">
          {filtered.map(quote => {
            const st = STATUS_CONFIG[quote.status]
            const isExpanded = expanded === quote.id

            return (
              <div key={quote.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all ${compareIds.includes(quote.id) ? 'border-info' : 'border-transparent'}`}>
                <button
                  className="w-full p-4 flex items-start gap-3 text-left"
                  onClick={() => setExpanded(isExpanded ? null : quote.id)}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${st.bg}`}>
                    <span className={st.text}>{st.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-brand-dark text-sm truncate">{quote.customer}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-silver">{quote.jobId}</span>
                      <span className="text-silver text-xs">·</span>
                      <span className="text-xs text-steel">{quote.createdDate}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {quote.oneTimeAmount > 0 ? (
                        <span className="font-mono font-bold text-brand-dark">${quote.oneTimeAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-xs italic text-silver">Draft — not priced</span>
                      )}
                      {quote.recurringAmount > 0 && (
                        <span className="text-xs text-steel">+ ${quote.recurringAmount}/yr</span>
                      )}
                      {quote.revisions > 0 && (
                        <span className="text-xs text-steel flex items-center gap-1"><RotateCcw size={11} /> {quote.revisions} rev.</span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-silver flex-shrink-0 mt-1" /> : <ChevronRight size={18} className="text-silver flex-shrink-0 mt-1" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-surface px-4 pb-4 space-y-3">
                    <div className="space-y-1.5 text-sm">
                      {[
                        ['Address', quote.address],
                        ['Technician', quote.tech],
                        ['Services', quote.services.join(', ')],
                        ['Selected Option', quote.selectedOption || '—'],
                        ['Expires', quote.expiresDate],
                        ...(quote.signedDate ? [['Signed', quote.signedDate]] : []),
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-start gap-3">
                          <span className="text-steel text-xs flex-shrink-0 w-24">{label}</span>
                          <span className="text-brand-dark text-xs flex-1">{value}</span>
                        </div>
                      ))}
                      {quote.margin !== undefined && (
                        <div className="flex items-start gap-3">
                          <span className="text-steel text-xs flex-shrink-0 w-24">Gross Margin</span>
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`font-mono font-bold text-xs ${quote.margin >= 45 ? 'text-success' : 'text-amber'}`}>{quote.margin}%</span>
                            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${quote.margin >= 45 ? 'bg-success' : 'bg-amber'}`} style={{ width: `${Math.min(100, (quote.margin / 60) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {quote.status === 'accepted' && (
                        <button className="flex items-center justify-center gap-1.5 bg-surface text-steel text-xs font-bold py-2.5 rounded-xl border border-surface hover:border-steel/30 transition-all">
                          <Lock size={13} /> View Signed
                        </button>
                      )}
                      {(quote.status === 'pending' || quote.status === 'expired') && (
                        <button className="flex items-center justify-center gap-1.5 bg-surface text-brand-dark text-xs font-bold py-2.5 rounded-xl border border-surface hover:border-steel/30 transition-all">
                          <Eye size={13} /> View
                        </button>
                      )}
                      <button
                        onClick={() => toggleCompare(quote.id)}
                        className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border transition-all ${compareIds.includes(quote.id) ? 'bg-info border-info text-white' : 'bg-surface text-steel border-surface hover:border-steel/30'}`}
                      >
                        <ArrowLeftRight size={13} /> Compare
                      </button>
                      <button className="flex items-center justify-center gap-1.5 bg-brand-red/10 text-brand-red text-xs font-bold py-2.5 rounded-xl border border-brand-red/20 hover:bg-brand-red/15 transition-all">
                        <Copy size={13} /> Clone
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
