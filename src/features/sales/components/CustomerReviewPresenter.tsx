import { customerReviewContent } from "../customerReview"
import { useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle, Mail, Save } from "lucide-react"
import { BugManGraphPresentation } from "../../../components/property/BugManGraphPresentation"
import { quoteWorkspaceCustomerFacingReview, quoteWorkspaceCustomerIdentity } from "../quoteWorkspace"
import type { QuoteWorkspaceProps } from "../../../screens/QuoteWorkspace"

type Props = Pick<QuoteWorkspaceProps, "inspection" | "workflowData" | "quoteEngineCalculation" | "employeeProfile" | "onSendDelivery" | "onCreateDocument" | "onPersist" | "onCustomerDecision" | "onCreateAdditionalQuote"> & {
  onClose: () => void
  onEditQuote: () => void
  onSignature: () => void
}
const STEPS = ["Structure Graph", "Photos", "Findings", "Email Inspection", "Quote"]

export function CustomerReviewPresenter(props: Props) {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [to, setTo] = useState(props.workflowData.customer.email)
  const [ccValue, setCc] = useState<string | null>(null)
  const cc = ccValue ?? props.employeeProfile?.email ?? ""
  const [note, setNote] = useState(props.workflowData.customerDecision?.note || "")
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [showQuote, setShowQuote] = useState(false)
  const identity = quoteWorkspaceCustomerIdentity(props.inspection, props.workflowData)
  const quote = quoteWorkspaceCustomerFacingReview(props.quoteEngineCalculation)
  const { findings, photos } = customerReviewContent(props.inspection)
  const visibleMarkerIds = findings.filter((item) => item.source === "graph" && (!item.sourceGraphKey || item.sourceGraphKey === props.inspection.property?.graphKey)).flatMap((item) => item.markerIds)
  const completed = props.inspection.status === "accepted" || ["signed", "completed"].includes(props.inspection.signatureStatus || "")
  const run = async (work: () => Promise<unknown>, success = "") => {
    if (busy) return
    setBusy(true); setNotice("")
    try { await work(); setNotice(success) } catch (error) { setNotice(error instanceof Error ? error.message : "Your work is still here. Please try again.") } finally { setBusy(false) }
  }
  const move = (next: () => void) => void run(async () => { await props.onPersist(); next() })
  const decide = (status: "accepted" | "pending" | "declined") => void run(async () => {
    await props.onCustomerDecision(status, note)
    if (status === "accepted") props.onSignature()
  }, status === "pending" ? "Saved as Pending / Open." : status === "declined" ? "Saved as Declined." : "")
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-surface text-brand-dark pb-28" aria-label="Review with Customer">
    <header className="sticky top-0 z-10 bg-brand-black text-white p-4"><div className="max-w-5xl mx-auto flex items-center gap-3"><button disabled={busy} onClick={() => move(props.onClose)} aria-label="Return to inspection"><ArrowLeft /></button><div><h1 className="font-display text-xl font-bold">Review with Customer</h1><p className="text-sm">{identity.name} · {identity.address}</p></div></div></header>
    <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
      <p className="text-sm text-steel">{step + 1} of {STEPS.length} · {STEPS[step]}</p>
      {notice && <p role="status" className="rounded-xl bg-white p-4 border border-surface">{notice}</p>}
      {step === 0 && <section className="bg-white rounded-2xl p-4"><h2 className="font-display text-xl mb-3">Structure Graph</h2><BugManGraphPresentation graphKey={props.inspection.property?.graphKey} billToNumber={props.inspection.billTo?.billToNumber} locationNumber={props.inspection.location?.locationNumber} visibleMarkerIds={visibleMarkerIds} /></section>}
      {step === 1 && <section className="bg-white rounded-2xl p-4"><h2 className="font-display text-xl mb-3">Inspection Photos</h2>{photos.length ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{photos.map((photo) => <figure key={photo.id}><a href={photo.url} target="_blank" rel="noreferrer"><img src={photo.thumbnailUrl || photo.url} alt={photo.caption || "Inspection photo"} className="w-full rounded-xl aspect-[4/3] object-cover" /></a><figcaption className="text-sm mt-2">{photo.caption}</figcaption></figure>)}</div> : <p>No customer photos selected.</p>}</section>}
      {step === 2 && <section className="space-y-3"><h2 className="font-display text-xl">Inspection Findings</h2>{findings.length ? findings.map((finding) => <article key={finding.id} className="bg-white rounded-2xl p-5"><h3 className="text-lg font-bold">{finding.title}</h3><p className="mt-2 whitespace-pre-wrap">{finding.customerFacingSummary || finding.summary}</p></article>) : <p>No customer-facing findings recorded.</p>}</section>}
      {step === 3 && <section className="bg-white rounded-2xl p-5 space-y-4"><h2 className="font-display text-xl">Email Inspection to Customer</h2><label className="block text-sm">Customer email<input type="email" value={to} onChange={(event) => setTo(event.target.value)} className="block w-full border rounded-xl p-3 mt-1" /></label>{!props.employeeProfile?.email && ccValue === null && <p className="text-sm text-steel">Add your employee email in your profile to receive a copy, or enter it below.</p>}<label className="block text-sm">CC salesperson<input type="email" value={cc} onChange={(event) => setCc(event.target.value)} className="block w-full border rounded-xl p-3 mt-1" /></label><button disabled={busy || !to || !props.employeeProfile?.gmailEnabled || !props.employeeProfile.active} onClick={() => void run(() => props.onSendDelivery({ documentType: "inspection-report", documentIds: [], to, cc: cc.trim() ? [cc.trim()] : [], bcc: [], subject: "Your Holloman Exterminators inspection", message: "Thank you for reviewing your property inspection with us. Your inspection report is attached.", idempotencyKey: crypto.randomUUID() }), "Inspection saved and email accepted by Gmail.")} className="bg-brand-red text-white rounded-xl px-5 py-3 font-bold disabled:opacity-40"><Mail className="inline mr-2" size={18} />Save & Send Inspection</button>{!props.employeeProfile?.gmailEnabled && <p className="text-sm">Your employee Gmail sender profile must be enabled before sending.</p>}<p className="text-sm text-steel">You can continue without sending email.</p><button disabled={busy} onClick={() => void run(async () => { const { document: doc } = await props.onCreateDocument("inspection-report"); const link = document.createElement("a"); link.href = "/api/download?key=" + encodeURIComponent(doc.r2Key); link.download = doc.filename; link.click() }, "Inspection saved and download ready.")} className="rounded-xl border px-5 py-3 font-bold">Save & Download Inspection</button></section>}
      {step === 4 && <section className="bg-white rounded-2xl p-5 space-y-4"><h2 className="font-display text-xl">Would you like to review a quote?</h2><div className="flex flex-wrap gap-3">{quote && <button disabled={busy} onClick={() => setShowQuote(true)} className="bg-brand-red text-white rounded-xl px-5 py-3 font-bold">Show Quote</button>}<button disabled={busy || completed} onClick={() => move(props.onEditQuote)} className="border rounded-xl px-5 py-3 font-bold disabled:opacity-40">{quote ? "Edit Quote" : "Build Quote"}</button>{quote && <button disabled={busy} onClick={() => void run(async () => { await props.onCreateAdditionalQuote(); props.onEditQuote() })} className="border rounded-xl px-5 py-3 font-bold">Create New Quote</button>}</div>
        {showQuote && quote && <><div className="divide-y">{quote.lines.map((line) => <div key={line.lineId} className="py-3 flex justify-between gap-4"><div><strong>{line.serviceName}</strong><p className="text-sm">{line.description}</p></div><span>{line.sellingPriceCents === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(line.sellingPriceCents / 100)}</span></div>)}<div className="py-4 flex justify-between font-bold text-xl"><span>Total</span><span>{quote.quoteTotalCents === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(quote.quoteTotalCents / 100)}</span></div></div>{completed ? <p className="text-success font-bold"><CheckCircle className="inline mr-2" />Signed agreement completed.</p> : <><label className="block text-sm">Decision note (optional)<textarea value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} className="block w-full border rounded-xl p-3 mt-1" /></label><div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => decide("accepted")} className="bg-brand-red text-white rounded-xl px-5 py-3 font-bold">Accept & Continue to Signature</button><button disabled={busy} onClick={() => decide("pending")} className="border rounded-xl px-5 py-3 font-bold">Pending / Open</button><button disabled={busy} onClick={() => setConfirmDecline(true)} className="border rounded-xl px-5 py-3 font-bold">Decline</button></div>{confirmDecline && <div role="dialog" aria-label="Confirm declined quote" className="rounded-xl border p-4 space-y-3"><p>Save this quote as declined? You may add a reason in the optional decision note above.</p><button disabled={busy} onClick={() => { decide("declined"); setConfirmDecline(false) }} className="rounded-xl bg-brand-red text-white px-4 py-3 font-bold">Save Declined Decision</button><button disabled={busy} onClick={() => setConfirmDecline(false)} className="ml-3 rounded-xl border px-4 py-3">Cancel</button></div>}</>}</>}
      </section>}
    </main>
    <footer className="fixed bottom-0 inset-x-0 bg-white border-t p-4"><div className="max-w-5xl mx-auto flex justify-between gap-3"><button disabled={busy || step === 0} onClick={() => setStep(step - 1)} className="rounded-xl border px-4 py-3 disabled:opacity-40"><ArrowLeft className="inline" size={18} /> Back</button><button disabled={busy} onClick={() => void run(() => props.onPersist(), "Inspection saved.")} className="rounded-xl border px-4 py-3"><Save className="inline mr-1" size={18} />Save</button>{step < 4 ? <button disabled={busy} onClick={() => setStep(step + 1)} className="rounded-xl bg-brand-red text-white px-4 py-3 font-bold">Next <ArrowRight className="inline" size={18} /></button> : <button disabled={busy} onClick={() => move(props.onClose)} className="rounded-xl bg-brand-red text-white px-4 py-3 font-bold">Finish Review</button>}</div></footer>
  </div>
}
