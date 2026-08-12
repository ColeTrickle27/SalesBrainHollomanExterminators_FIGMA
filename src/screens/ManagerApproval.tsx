import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Package, TrendingDown, MessageSquare, User, Clock } from 'lucide-react'
import { managerQueue } from '../data/sample'

export default function ManagerApproval() {
  const [expanded, setExpanded] = useState<string | null>('mgr-001')
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected'>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  const decide = (id: string, decision: 'approved' | 'rejected') => {
    setDecisions(prev => ({ ...prev, [id]: decision }))
  }

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-dark uppercase tracking-wide">Approvals</h1>
          <p className="text-steel text-sm mt-0.5">Review and approve flagged quotes</p>
        </div>
        <div className="bg-amber text-white font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center">
          {managerQueue.filter(q => !decisions[q.id]).length}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Pending', value: managerQueue.filter(q => !decisions[q.id]).length.toString(), color: 'text-amber' },
          { label: 'Approved', value: Object.values(decisions).filter(v => v === 'approved').length.toString(), color: 'text-success' },
          { label: 'Rejected', value: Object.values(decisions).filter(v => v === 'rejected').length.toString(), color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-steel text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {managerQueue.map(item => {
          const isExpanded = expanded === item.id
          const decision = decisions[item.id]

          return (
            <div key={item.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
              decision === 'approved' ? 'border-success' :
              decision === 'rejected' ? 'border-danger' :
              'border-amber'
            }`}>
              {/* Header */}
              <button
                className="w-full p-4 flex items-start gap-3 text-left"
                onClick={() => setExpanded(isExpanded ? null : item.id)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  decision === 'approved' ? 'bg-success-light' :
                  decision === 'rejected' ? 'bg-danger-light' :
                  'bg-amber-light'
                }`}>
                  {decision === 'approved' ? <CheckCircle size={18} className="text-success" /> :
                   decision === 'rejected' ? <XCircle size={18} className="text-danger" /> :
                   <AlertTriangle size={18} className="text-amber" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-brand-dark">{item.customer}</span>
                      <span className="font-mono text-xs text-silver ml-2">{item.jobId}</span>
                    </div>
                    {decision ? (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${decision === 'approved' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                        {decision}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-light text-amber flex-shrink-0">
                        Needs Review
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <User size={12} className="text-silver" />
                    <span className="text-xs text-steel">{item.tech}</span>
                    <Clock size={12} className="text-silver" />
                    <span className="text-xs text-steel">{item.submittedAt.split(' — ')[1]}</span>
                  </div>
                  <div className="mt-1.5 text-sm text-brand-dark font-semibold">{item.quotedOption}</div>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-silver flex-shrink-0 mt-1" /> : <ChevronDown size={18} className="text-silver flex-shrink-0 mt-1" />}
              </button>

              {isExpanded && (
                <div className="border-t border-surface px-4 pb-4 space-y-4">
                  {/* Issue summary */}
                  <div className="bg-amber-light border border-amber/30 rounded-xl p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-brand-dark">{item.issue}</p>
                    </div>
                  </div>

                  {/* Margin indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={15} className="text-brand-red" />
                        <span className="text-sm font-semibold text-brand-dark">Gross Margin</span>
                      </div>
                      <div className="font-mono text-sm">
                        <span className={item.margin >= item.targetMargin ? 'text-success font-bold' : 'text-brand-red font-bold'}>{item.margin}%</span>
                        <span className="text-silver"> / target {item.targetMargin}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${item.margin >= item.targetMargin ? 'bg-success' : 'bg-brand-red'}`}
                        style={{ width: `${Math.min(100, (item.margin / 60) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-silver font-mono">0%</span>
                      <div className="relative flex items-center">
                        <div className="w-px h-3 bg-amber absolute" style={{ left: `${(item.targetMargin / 60) * 100}%`, transform: 'translateX(-50%)' }} />
                      </div>
                      <span className="text-xs text-silver font-mono">60%</span>
                    </div>
                  </div>

                  {/* Inventory shortages */}
                  {item.shortages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={15} className="text-steel" />
                        <span className="text-sm font-semibold text-brand-dark">Inventory Shortages</span>
                      </div>
                      {item.shortages.map((s, i) => (
                        <div key={i} className="bg-danger-light border border-danger/20 rounded-xl p-3 text-sm text-danger font-medium">
                          ⚠ {s}
                        </div>
                      ))}
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button className="bg-surface text-brand-dark text-sm font-semibold py-2 rounded-xl border border-surface hover:border-steel/30 transition-all">
                          Source Alternate
                        </button>
                        <button className="bg-surface text-brand-dark text-sm font-semibold py-2 rounded-xl border border-surface hover:border-steel/30 transition-all">
                          Special Order
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manager notes */}
                  {!decision && (
                    <div>
                      <label className="block text-xs text-steel uppercase tracking-wider font-semibold mb-1.5">
                        <MessageSquare size={12} className="inline mr-1" />
                        Decision Notes (required)
                      </label>
                      <textarea
                        value={notes[item.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        rows={2}
                        className="w-full border border-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red resize-none"
                        placeholder="Enter your approval or rejection reason…"
                      />
                    </div>
                  )}

                  {/* Approve / Reject */}
                  {!decision ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => decide(item.id, 'rejected')}
                        className="flex items-center justify-center gap-2 bg-danger-light border border-danger/30 text-danger font-bold py-3 rounded-xl transition-all active:scale-97"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                      <button
                        onClick={() => decide(item.id, 'approved')}
                        className="flex items-center justify-center gap-2 bg-success text-white font-bold py-3 rounded-xl transition-all active:scale-97"
                      >
                        <CheckCircle size={18} />
                        Approve
                      </button>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-2 justify-center py-3 rounded-xl font-bold ${decision === 'approved' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                      {decision === 'approved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      {decision === 'approved' ? 'Approved — Technician notified' : 'Rejected — Technician notified'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Manager summary strip */}
      <div className="mt-5 bg-brand-charcoal rounded-2xl p-4">
        <div className="font-display text-lg font-bold text-white uppercase tracking-wide mb-3">This Week</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Quotes Reviewed', value: '14' },
            { label: 'Avg. Margin', value: '47.3%' },
            { label: 'Avg. Discount', value: '4.1%' },
            { label: 'Close Rate', value: '68%' },
          ].map(s => (
            <div key={s.label} className="bg-white/8 rounded-xl p-3">
              <div className="font-display text-2xl font-bold text-white">{s.value}</div>
              <div className="text-silver text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
