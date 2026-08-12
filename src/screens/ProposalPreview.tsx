import { CheckCircle, ChevronLeft, Download, Printer, ShieldCheck } from 'lucide-react'

import type { SalesBrainWorkflowData } from '../types/figma-workflow'
import type { SalesInspection } from '../types/sales-inspection'

interface Props {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  onClose: () => void
}

export default function ProposalPreview({ inspection, workflowData, onClose }: Props) {
  const selected = inspection.recommendations.find((item) => item.id === inspection.selectedRecommendationId)
  const total = (inspection.pricingSnapshot?.totalCents || 0) / 100
  const accepted = workflowData.acceptance.captured

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="bg-brand-black px-4 py-3 sticky top-0 z-20 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center" aria-label="Close proposal"><ChevronLeft size={20} /></button>
          <div className="flex-1"><div className="font-display text-xl font-bold text-white uppercase">Proposal Preview</div><div className="text-xs text-silver">Customer-safe saved quote snapshot</div></div>
          <button onClick={() => window.print()} className="bg-white/10 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold"><Printer size={16} /> Print / Save PDF</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 print:p-0">
        <article className="bg-white rounded-3xl shadow-sm p-6 sm:p-10 print:shadow-none print:rounded-none">
          <div className="flex items-start justify-between gap-4 border-b border-surface pb-6">
            <div><div className="text-xs text-brand-red uppercase font-bold tracking-widest">Holloman Exterminators</div><h1 className="font-display text-4xl font-bold text-brand-dark mt-1 uppercase">Service Proposal</h1><div className="font-mono text-xs text-silver mt-2">{inspection.estimateNumber}</div></div>
            <ShieldCheck size={42} className="text-brand-red" />
          </div>

          <section className="py-6 grid sm:grid-cols-2 gap-5 border-b border-surface">
            <div><div className="text-xs text-steel uppercase tracking-wide font-semibold">Prepared For</div><div className="font-display text-2xl font-bold text-brand-dark mt-1">{inspection.billTo?.billToName || 'Customer'}</div><div className="text-sm text-steel mt-1">{inspection.location?.locationAddress || inspection.location?.locationName || ''}</div></div>
            <div className="sm:text-right"><div className="text-xs text-steel uppercase tracking-wide font-semibold">Prepared</div><div className="text-sm text-brand-dark mt-1">{new Date(inspection.updatedAt).toLocaleDateString()}</div><div className="text-xs text-steel mt-1">Status: <span className="capitalize font-semibold">{inspection.status}</span></div></div>
          </section>

          <section className="py-6 border-b border-surface"><h2 className="font-display text-2xl font-bold text-brand-dark uppercase">Inspection Summary</h2>{inspection.findings.length ? <div className="space-y-3 mt-4">{inspection.findings.map((finding) => <div key={finding.id} className="flex items-start gap-3"><CheckCircle size={17} className="text-brand-red mt-0.5" /><div><div className="font-semibold text-brand-dark">{finding.title}</div><p className="text-sm text-steel mt-1">{finding.customerFacingSummary || finding.summary}</p></div></div>)}</div> : <p className="text-sm text-steel mt-3">No customer-facing findings recorded.</p>}</section>

          <section className="py-6 border-b border-surface"><h2 className="font-display text-2xl font-bold text-brand-dark uppercase">Selected Service</h2>{selected ? <div className="mt-4 border-2 border-brand-red rounded-2xl p-5"><div className="font-display text-2xl font-bold text-brand-dark uppercase">{selected.name}</div><p className="text-sm text-steel mt-2">{selected.description}</p><div className="font-mono text-3xl font-bold text-brand-dark mt-5">${total.toLocaleString()}</div></div> : <p className="text-sm text-steel mt-3">No service selected.</p>}</section>

          <section className="py-6"><h2 className="font-display text-2xl font-bold text-brand-dark uppercase">Acceptance</h2>{accepted ? <div className="mt-4 bg-success-light border border-success/20 rounded-2xl p-4 flex items-start gap-3"><CheckCircle size={22} className="text-success" /><div><div className="font-bold text-success">Accepted in Sales Brain</div><div className="text-sm text-steel mt-1">{workflowData.acceptance.printedName} • {new Date(workflowData.acceptance.signedAt).toLocaleString()}</div></div></div> : <p className="text-sm text-steel mt-3">This proposal has not been accepted.</p>}</section>

          <footer className="border-t border-surface pt-5 text-xs text-steel">Internal cost, margin, formulas, and staff notes are intentionally excluded from this proposal.</footer>
        </article>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface p-4 print:hidden"><div className="max-w-4xl mx-auto flex gap-3"><button onClick={() => window.print()} className="flex-1 bg-brand-red text-white font-display text-lg font-bold uppercase py-3 rounded-2xl flex items-center justify-center gap-2"><Download size={18} /> Print / Save PDF</button></div></div>
    </div>
  )
}
