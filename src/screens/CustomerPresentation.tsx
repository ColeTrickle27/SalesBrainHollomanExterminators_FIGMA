import { useState } from 'react'
import { CheckCircle, ChevronLeft, ClipboardList, Droplets, FileText, Home, ShieldCheck } from 'lucide-react'

import type { SalesBrainWorkflowData } from '../types/figma-workflow'
import type { SalesInspection } from '../types/sales-inspection'

interface Props {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  onClose: () => void
  onProposal: () => void
}

type Section = 'overview' | 'findings' | 'plan' | 'option'

export default function CustomerPresentation({ inspection, workflowData, onClose, onProposal }: Props) {
  const [section, setSection] = useState<Section>('overview')
  const selected = inspection.recommendations.find((item) => item.id === inspection.selectedRecommendationId)
  const price = (inspection.pricingSnapshot?.totalCents || 0) / 100
  const customerName = inspection.billTo?.billToName || 'Customer'
  const address = inspection.location?.locationAddress || inspection.location?.locationName || ''

  const sections: Array<{ id: Section; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'findings', label: 'Findings' },
    { id: 'plan', label: 'Plan' },
    { id: 'option', label: 'Your Option' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-gray-900 pb-28">
      <header className="bg-brand-black text-white sticky top-0 z-20 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center" aria-label="Exit customer presentation"><ChevronLeft size={20} /></button>
          <div className="flex-1"><div className="font-display text-xl font-bold uppercase tracking-wide">Customer Presentation</div><div className="text-xs text-silver">Customer-safe view • Internal costs and notes hidden</div></div>
          <ShieldCheck size={22} className="text-success" />
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex overflow-x-auto">{sections.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`px-4 py-2.5 text-xs font-bold border-b-2 ${section === item.id ? 'border-brand-red text-white' : 'border-transparent text-silver'}`}>{item.label}</button>)}</nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm"><div className="text-xs text-brand-red font-bold uppercase tracking-widest">Inspection Findings & Service Proposal</div><h1 className="font-display text-3xl font-bold mt-1">{customerName}</h1><p className="text-gray-500 text-sm mt-1">{address}</p><div className="mt-4 text-xs text-gray-400 font-mono">{inspection.estimateNumber}</div></div>

        {section === 'overview' ? (
          <div className="space-y-4">
            <CustomerCard icon={<Home size={20} />} title="Property Overview">
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">{[
                ['Structure', workflowData.structure.structureType || 'Not recorded'],
                ['Construction', workflowData.structure.construction || 'Not recorded'],
                ['Square Footage', workflowData.structure.squareFootage || 'Not recorded'],
                ['Occupancy', workflowData.structure.occupancy || 'Not recorded'],
              ].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt><dd className="font-semibold mt-0.5">{value}</dd></div>)}</dl>
            </CustomerCard>
            <CustomerCard icon={<ClipboardList size={20} />} title="What We Reviewed"><p className="text-sm text-gray-600 leading-relaxed">Your technician documented {inspection.findings.length} finding{inspection.findings.length === 1 ? '' : 's'} and reviewed service options based on the conditions observed during this visit.</p></CustomerCard>
          </div>
        ) : null}

        {section === 'findings' ? (
          <CustomerCard icon={<FileText size={20} />} title="Inspection Findings">
            {inspection.findings.length === 0 ? <p className="text-sm text-gray-500">No customer-facing findings have been recorded.</p> : <div className="space-y-3">{inspection.findings.map((finding) => <article key={finding.id} className="border border-gray-100 rounded-2xl p-4"><div className="flex items-start gap-3"><CheckCircle size={18} className="text-brand-red mt-0.5" /><div><h3 className="font-bold">{finding.title}</h3><p className="text-sm text-gray-600 mt-1 leading-relaxed">{finding.customerFacingSummary || finding.summary}</p></div></div></article>)}</div>}
          </CustomerCard>
        ) : null}

        {section === 'plan' ? (
          <div className="space-y-4">
            <CustomerCard icon={<ClipboardList size={20} />} title="Recommended Service Plan">{selected ? <><h3 className="font-display text-2xl font-bold uppercase">{selected.name}</h3><p className="text-sm text-gray-600 mt-2 leading-relaxed">{selected.description}</p></> : <p className="text-sm text-gray-500">No service plan has been selected.</p>}</CustomerCard>
            {workflowData.moisture.readings.length ? <CustomerCard icon={<Droplets size={20} />} title="Recorded Moisture Readings"><div className="grid sm:grid-cols-2 gap-3">{workflowData.moisture.readings.map((reading) => <div key={reading.id} className="bg-gray-50 rounded-xl p-3"><div className="font-mono text-xl font-bold">{reading.value}{reading.unit}</div><div className="text-sm font-semibold mt-1">{reading.location}</div><div className="text-xs text-gray-500">{reading.category}</div></div>)}</div></CustomerCard> : null}
          </div>
        ) : null}

        {section === 'option' ? (
          <CustomerCard icon={<ShieldCheck size={20} />} title="Selected Option">{selected ? <div className="border-2 border-brand-red rounded-2xl p-5"><div className="font-display text-2xl font-bold uppercase">{selected.name}</div><p className="text-sm text-gray-600 mt-2">{selected.description}</p><div className="font-mono text-3xl font-bold mt-5">${price.toLocaleString()}</div><div className="text-xs text-gray-400 mt-1">Saved quote snapshot</div></div> : <p className="text-sm text-gray-500">No option selected.</p>}</CustomerCard>
        ) : null}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4"><div className="max-w-5xl mx-auto flex items-center gap-3"><div className="flex-1"><div className="text-xs text-gray-400">Selected option</div><div className="font-bold truncate">{selected?.name || 'Not selected'}</div></div><button onClick={onProposal} disabled={!selected} className="bg-brand-red text-white font-display text-lg font-bold uppercase px-6 py-3 rounded-2xl disabled:opacity-40">Review Proposal</button></div></div>
    </div>
  )
}

function CustomerCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <section className="bg-white rounded-3xl p-5 shadow-sm"><div className="flex items-center gap-2 mb-4 text-brand-red">{icon}<h2 className="font-display text-xl font-bold text-gray-900 uppercase tracking-wide">{title}</h2></div>{children}</section>
}
