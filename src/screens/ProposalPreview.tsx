import { CheckCircle, ChevronLeft, Download, ShieldCheck } from "lucide-react"
import type { SalesInspection } from "../types/sales-inspection"
import type { SalesBrainWorkflowData } from "../types/figma-workflow"

interface Props {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  onClose: () => void
  onGeneratePdf: () => Promise<{ key: string name: string url: string }>
}

export default function ProposalPreview({ inspection, onClose }: Props) {
  const photos = inspection.photos.filter(
    (photo) => photo.customerVisible !== false,
  )
  const findings = inspection.findings.filter(
    (finding) => !finding.hidden && finding.customerVisible !== false,
  )
  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="bg-brand-black px-4 py-3 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 text-white grid place-items-center"
            aria-label="Back to inspection"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="font-display text-xl font-bold text-white uppercase">
              Inspection report
            </div>
            <div className="text-xs text-silver">
              Customer-facing, branded inspection record
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        <article className="bg-white rounded-3xl shadow-sm p-6 sm:p-10">
          <div className="flex items-start justify-between border-b border-surface pb-6">
            <div>
              <div className="text-xs text-brand-red uppercase font-bold tracking-widest">
                Holloman Exterminators
              </div>
              <h1 className="font-display text-4xl font-bold text-brand-dark mt-1 uppercase">
                Property inspection report
              </h1>
              <div className="font-mono text-xs text-silver mt-2">
                {inspection.estimateNumber}
              </div>
            </div>
            <ShieldCheck size={42} className="text-brand-red" />
          </div>
          <section className="py-6 grid sm:grid-cols-2 gap-5 border-b border-surface">
            <div>
              <div className="text-xs text-steel uppercase font-semibold">
                Prepared for
              </div>
              <div className="font-display text-2xl font-bold text-brand-dark mt-1">
                {inspection.billTo?.billToName || "Customer"}
              </div>
              <div className="text-sm text-steel">
                {inspection.location?.locationAddress ||
                  inspection.location?.locationName ||
                  ""}
              </div>
            </div>
            <div className="sm:text-right text-sm text-steel">
              Inspection date{" "}
              {new Date(inspection.updatedAt).toLocaleDateString()}
              <div>
                {inspection.markers.length} graph marker
                {inspection.markers.length === 1 ? "" : "s"} reviewed
              </div>
            </div>
          </section>
          <section className="py-6 border-b border-surface">
            <h2 className="font-display text-2xl font-bold text-brand-dark uppercase">
              Inspection findings
            </h2>
            {findings.length ? (
              <div className="space-y-3 mt-4">
                {findings.map((finding) => (
                  <div key={finding.id} className="flex gap-3">
                    <CheckCircle
                      size={17}
                      className="text-brand-red mt-0.5 shrink-0"
                    />
                    <div>
                      <div className="font-semibold">{finding.title}</div>
                      <p className="text-sm text-steel">
                        {finding.customerFacingSummary ||
                          finding.summary ||
                          "Observation recorded on the property graph."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-steel">
                No customer-facing findings have been recorded.
              </p>
            )}
            {photos.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-5">
                {photos.map((photo) => (
                  <figure key={photo.id}>
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.caption || "Inspection photo"}
                      className="w-full aspect-[4/3] object-cover rounded-xl"
                    />
                    {photo.caption ? (
                      <figcaption className="mt-1 text-xs text-steel">
                        {photo.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : null}
          </section>
          <section className="py-6">
            <h2 className="font-display text-2xl font-bold text-brand-dark uppercase">
              Next steps
            </h2>
            <p className="mt-3 text-sm text-steel">
              Your Holloman Exterminators representative will review this
              inspection with you and discuss any recommended service
              separately.
            </p>
          </section>
          <footer className="border-t border-surface pt-5 text-xs text-steel">
            This inspection report documents observed conditions and
            customer-visible evidence. Pricing, service agreements, and
            signatures are managed outside Sales Brain.
          </footer>
        </article>
      </main>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => window.print()}
            className="w-full bg-brand-red text-white font-display text-lg font-bold uppercase py-3 rounded-2xl"
          >
            <Download size={18} className="inline mr-2" />
            Print or save branded inspection report
          </button>
        </div>
      </div>
    </div>
  )
}
