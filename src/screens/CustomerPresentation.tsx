import { useState, type ReactNode } from "react"
import { CheckCircle, ChevronLeft, ClipboardList, Droplets, Images, ShieldCheck } from "lucide-react"

import type { PricebookService } from "../types/pricebook"
import type { SalesBrainQuoteOption, SalesBrainWorkflowData } from "../types/figma-workflow"
import type { SalesInspection } from "../types/sales-inspection"

interface Props {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  services: PricebookService[]
  onChange: (data: SalesBrainWorkflowData) => void
  onClose: () => void
  onContinue: () => void
}

type Section = "overview" | "findings" | "photos" | "options"

export default function CustomerPresentation({ inspection, workflowData, services, onChange, onClose, onContinue }: Props) {
  const [section, setSection] = useState<Section>("findings")
  const selected = workflowData.quoteOptions.find((item) => item.id === workflowData.selectedQuoteOptionId)
  const visibleFindings = inspection.findings.filter((finding) => !finding.hidden && finding.customerVisible !== false)
  const visibleGraphNotes = inspection.markers.filter((marker) => (marker.type === "treatmentNote" || marker.type === "notePoint") && workflowData.graphNoteVisibility[marker.id] !== false)
  const photos = inspection.photos.filter((photo) => photo.customerVisible !== false && photo.uploadStatus !== "error")
  const customerName = [workflowData.customer.company, workflowData.customer.first, workflowData.customer.last].filter(Boolean).join(" ") || inspection.billTo?.billToName || "Customer"
  const address = [workflowData.customer.locationName, workflowData.customer.streetAddress, workflowData.customer.city, "NC", workflowData.customer.zip].filter(Boolean).join(", ")
  const tabs: Array<{ id: Section; label: string }> = [{ id: "findings", label: "Findings" }, { id: "photos", label: "Photos" }, { id: "overview", label: "Property" }, { id: "options", label: "Options" }]
  const customerSpecified = workflowData.quoteOptions.find((item) => item.kind === "customer-specified")
  const choose = (id: string) => onChange({ ...workflowData, selectedQuoteOptionId: id })
  const chooseCustomerSpecified = () => {
    if (customerSpecified) { choose(customerSpecified.id); return }
    const option: SalesBrainQuoteOption = { id: crypto.randomUUID(), name: "Other — Customer Specified", description: "Services selected by the customer", serviceIds: [], oneTimePriceCents: 0, recurringPriceCents: 0, warranty: "", highlights: [], recommended: false, kind: "customer-specified" }
    onChange({ ...workflowData, quoteOptions: [...workflowData.quoteOptions, option], selectedQuoteOptionId: option.id })
  }
  const toggleCustom = (service: PricebookService) => {
    if (!customerSpecified) return
    const serviceIds = customerSpecified.serviceIds.includes(service.id) ? customerSpecified.serviceIds.filter((id) => id !== service.id) : [...customerSpecified.serviceIds, service.id]
    const oneTimePriceCents = serviceIds.reduce((sum, id) => sum + (services.find((item) => item.id === id)?.price || 0), 0)
    onChange({ ...workflowData, quoteOptions: workflowData.quoteOptions.map((item) => item.id === customerSpecified.id ? { ...item, serviceIds, oneTimePriceCents } : item) })
  }

  return <div className="min-h-screen bg-[#f7f4ed] text-gray-900 pb-28">
    <header className="bg-brand-black text-white sticky top-0 z-20 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3"><button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 grid place-items-center" aria-label="Exit customer presentation"><ChevronLeft size={20} /></button><div className="flex-1"><div className="font-display text-xl font-bold uppercase">Customer Presentation</div><div className="text-xs text-silver">Customer-safe view · Internal costs and staff activity hidden</div></div><ShieldCheck size={22} className="text-success" /></div>
      <nav className="max-w-5xl mx-auto px-4 flex overflow-x-auto">{tabs.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`px-4 py-2.5 text-xs font-bold border-b-2 ${section === item.id ? "border-brand-red text-white" : "border-transparent text-silver"}`}>{item.label}</button>)}</nav>
    </header>
    <main className="max-w-5xl mx-auto px-4 pt-5 space-y-4">
      <div className="bg-white rounded-3xl p-6 shadow-sm"><div className="text-xs text-brand-red font-bold uppercase tracking-widest">Inspection Findings & Service Proposal</div><h1 className="font-display text-3xl font-bold mt-1">{customerName}</h1><p className="text-gray-500 text-sm mt-1">{address}</p><div className="mt-4 text-xs text-gray-400 font-mono">{inspection.estimateNumber}</div></div>

      {section === "findings" ? <div className="space-y-4"><CustomerCard icon={<CheckCircle size={20} />} title="Inspection Findings">{visibleFindings.length === 0 ? <p className="text-sm text-gray-500">No customer-facing findings recorded.</p> : <div className="space-y-4">{visibleFindings.map((finding) => <article key={finding.id} className="border border-gray-100 rounded-2xl p-4"><h3 className="font-bold text-lg">{finding.title}</h3><p className="text-sm text-gray-600 mt-1 leading-relaxed">{finding.customerFacingSummary || finding.summary}</p>{photos.filter((photo) => photo.findingIds?.includes(finding.id)).length ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">{photos.filter((photo) => photo.findingIds?.includes(finding.id)).map((photo) => <Photo key={photo.id} src={photo.thumbnailUrl || photo.url} fullSrc={photo.url} caption={photo.caption} />)}</div> : null}</article>)}</div>}</CustomerCard>{visibleGraphNotes.length ? <CustomerCard icon={<ClipboardList size={20} />} title="Inspection Notes"><div className="space-y-3">{visibleGraphNotes.map((note) => <article key={note.id} className="border border-gray-100 rounded-2xl p-4"><h3 className="font-bold">{note.title || "Inspection Note"}</h3><p className="text-sm text-gray-600 mt-1">{note.observation || note.notes}</p></article>)}</div></CustomerCard> : null}</div> : null}

      {section === "photos" ? <CustomerCard icon={<Images size={20} />} title="Inspection Photos">{photos.length === 0 ? <p className="text-sm text-gray-500">No customer photos selected.</p> : <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{photos.map((photo) => <Photo key={photo.id} src={photo.thumbnailUrl || photo.url} fullSrc={photo.url} caption={photo.caption} />)}</div>}</CustomerCard> : null}

      {section === "overview" ? <div className="space-y-4"><CustomerCard icon={<ClipboardList size={20} />} title="Property Overview"><div className="grid sm:grid-cols-2 gap-3">{workflowData.structures.map((structure) => <div key={structure.id} className="bg-gray-50 rounded-2xl p-4"><div className="font-bold">{structure.name}</div><div className="text-sm text-gray-600 mt-1">{structure.structureOther || structure.structureType || "Structure type not recorded"}</div><div className="text-xs text-gray-500 mt-2">{[structure.construction, structure.occupancy, structure.squareFootage ? `${structure.squareFootage} sq ft` : ""].filter(Boolean).join(" · ")}</div></div>)}</div></CustomerCard>{workflowData.moisture.readings.length ? <CustomerCard icon={<Droplets size={20} />} title="Recorded Moisture Readings"><div className="grid sm:grid-cols-2 gap-3">{workflowData.moisture.readings.map((reading) => <div key={reading.id} className="bg-gray-50 rounded-xl p-3"><div className="font-mono text-xl font-bold">{reading.value}{reading.unit}</div><div className="text-sm font-semibold">{reading.location}</div><div className="text-xs text-gray-500">{reading.material} · {reading.category}</div></div>)}</div></CustomerCard> : null}</div> : null}

      {section === "options" ? <CustomerCard icon={<ShieldCheck size={20} />} title="Service Options"><div className="grid lg:grid-cols-3 gap-3">{workflowData.quoteOptions.filter((option) => option.kind === "chocolate" || option.kind === "vanilla").map((option) => <OptionCard key={option.id} option={option} selected={workflowData.selectedQuoteOptionId === option.id} onClick={() => choose(option.id)} />)}<button onClick={chooseCustomerSpecified} className={`rounded-2xl p-5 border-2 text-left ${customerSpecified && workflowData.selectedQuoteOptionId === customerSpecified.id ? "border-brand-red bg-red-50/30" : "border-gray-100"}`}><div className="text-xs text-brand-red font-bold uppercase">Customer Choice</div><h3 className="font-display text-xl font-bold uppercase mt-1">Other — Customer Specified</h3><p className="text-sm text-gray-600 mt-2">Select a custom combination of services.</p></button></div>{customerSpecified && workflowData.selectedQuoteOptionId === customerSpecified.id ? <div className="mt-4 border-t border-gray-100 pt-4"><div className="text-sm font-bold mb-2">Select Services</div><div className="flex flex-wrap gap-2">{services.filter((item) => item.active).map((service) => <button key={service.id} onClick={() => toggleCustom(service)} className={`px-3 py-2 rounded-xl border text-xs font-bold ${customerSpecified.serviceIds.includes(service.id) ? "bg-gray-900 text-white border-gray-900" : "border-gray-200"}`}>{customerSpecified.serviceIds.includes(service.id) ? "✓ " : "+ "}{service.name}</button>)}</div></div> : null}</CustomerCard> : null}
    </main>
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4"><div className="max-w-5xl mx-auto flex items-center gap-3"><div className="flex-1"><div className="text-xs text-gray-400">Customer-selected option</div><div className="font-bold truncate">{selected?.name || "Not selected"}</div></div><button onClick={onContinue} disabled={!selected || selected.serviceIds.length === 0} className="bg-brand-red text-white font-display text-lg font-bold uppercase px-6 py-3 rounded-2xl disabled:opacity-40">Continue to Service Quote</button></div></div>
  </div>
}

function OptionCard({ option, selected, onClick }: { option: SalesBrainQuoteOption; selected: boolean; onClick: () => void }) { return <button onClick={onClick} className={`rounded-2xl p-5 border-2 text-left ${selected ? "border-brand-red bg-red-50/30" : "border-gray-100"}`}><div className="text-xs text-brand-red font-bold uppercase">{option.kind === "chocolate" ? "Complete Recommendation" : "Short-Term Recommendation"}</div><h3 className="font-display text-xl font-bold uppercase mt-1">{option.name}</h3><p className="text-sm text-gray-600 mt-2">{option.description}</p><div className="font-mono text-3xl font-bold mt-5">${(option.oneTimePriceCents / 100).toLocaleString()}</div>{option.recurringPriceCents ? <div className="text-sm text-gray-500">${(option.recurringPriceCents / 100).toLocaleString()} recurring / renewal</div> : null}{option.highlights.length ? <ul className="mt-4 space-y-1 text-sm">{option.highlights.map((item) => <li key={item}>✓ {item}</li>)}</ul> : null}{option.warranty ? <div className="text-xs text-gray-500 mt-4">{option.warranty}</div> : null}</button> }
function CustomerCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) { return <section className="bg-white rounded-3xl p-5 shadow-sm"><div className="flex items-center gap-2 mb-4 text-brand-red">{icon}<h2 className="font-display text-xl font-bold text-gray-900 uppercase">{title}</h2></div>{children}</section> }
function Photo({ src, fullSrc, caption }: { src: string; fullSrc: string; caption?: string }) { return <figure><a href={fullSrc} target="_blank" rel="noreferrer"><img src={src} alt={caption || "Inspection photo"} className="w-full aspect-[4/3] object-cover rounded-xl bg-gray-100" /></a>{caption ? <figcaption className="text-xs text-gray-500 mt-1">{caption}</figcaption> : null}</figure> }
