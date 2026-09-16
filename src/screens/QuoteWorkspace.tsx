import { opsBrainUrl } from "../services/opsBrain/appUrls"
import { customerQuoteNumber } from "../features/sales/quoteNumber"
import { CustomerReviewPresenter } from "../features/sales/components/CustomerReviewPresenter"
import { signatureSendingBlocked } from "../features/sales/signatureEligibility"
import { useEffect, useState } from "react"
import {
  Calculator,
  Camera,
  ClipboardCheck,
  Download,
  FileSignature,
  FileText,
  Mail,
  Save,
  Send,
  UserRound,
} from "lucide-react"

import { QuoteInspection, type QuoteInspectionProps } from "./InspectionWizard"

import { QuoteBuilderPanel, type QuoteBuilderPanelProps } from "./JobCosting"

import { QuoteCustomerSummary } from "../features/sales/components/QuoteCustomerSummary"

import { QuoteReview } from "../features/sales/components/QuoteReview"

import { LeadEditModal } from "./Dashboard"

import {
  getQuoteWorkspaceReadiness,
  quoteWorkspaceCustomerIdentity,
} from "../features/sales/quoteWorkspace"

import type {
  LeadInput,
  SalesDeliveryEvent,
  SalesDeliveryInput,
  SalesDocumentType,
  SalesEmployeeProfile,
  SalesGeneratedDocument,
  SalesLead,
  SalesSignatureRequest,
} from "../types/sales-operations"

const WORKSPACE_SECTIONS = [
  { id: "customer", label: "Customer", icon: UserRound },

  { id: "inspection", label: "Inspection", icon: Camera },
  { id: "quote", label: "Quote", icon: Calculator },
  { id: "review", label: "Review", icon: ClipboardCheck },
  { id: "delivery", label: "Delivery", icon: Mail },
] as const

export type QuoteWorkspaceSection = typeof WORKSPACE_SECTIONS[number]["id"]

export interface QuoteWorkspaceProps
  extends QuoteBuilderPanelProps,
    QuoteInspectionProps {
  onResumeSignature: () => Promise<{ signingUrl: string }>
  onPersist: () => Promise<unknown>
  onCustomerDecision: (status: "accepted" | "pending" | "declined", note: string) => Promise<void>
  onCreateAdditionalQuote: () => Promise<void>
  onChangeCustomer: () => void
  lead: SalesLead | null
  onUpdateLead: (input: LeadInput) => Promise<SalesLead>
  initialSection?: QuoteWorkspaceSection
  generatedDocuments: SalesGeneratedDocument[]
  deliveries: SalesDeliveryEvent[]
  signatureRequest: SalesSignatureRequest | null
  employeeProfile: SalesEmployeeProfile | null
  providerActionLoading: boolean
  onLoadProviderState: () => void | Promise<void>
  onCreateDocument: (
    type: SalesDocumentType,
  ) => Promise<{ document: SalesGeneratedDocument }>
  onSendDelivery: (input: SalesDeliveryInput) => Promise<unknown>
  onRequestSignature: (input: {
    deliveryMode?: "email" | "in_person"
    customerEmail: string
    customerName: string
    selectedOptionId: string
    message: string
    idempotencyKey: string
  }) => Promise<{ signingUrl?: string }>
  onCreateProposalPdf: () => Promise<{ key: string; name: string; url: string }>
}

export default function QuoteWorkspace(props: QuoteWorkspaceProps) {
  const [section, setSection] = useState<QuoteWorkspaceSection>(
    props.initialSection || "quote",
  )
  const displayQuoteNumber = props.inspection.status === "draft" && !["signed", "completed"].includes(props.inspection.signatureStatus || "") ? customerQuoteNumber({ company: props.workflowData.customer.company, lastName: props.workflowData.customer.last, customerName: props.inspection.billTo?.billToName, serviceName: props.quoteEngineCalculation?.customerFacing.lines[0]?.serviceName, createdAt: props.inspection.createdAt }, props.inspection.estimateNumber) : props.inspection.estimateNumber
  const [presenting, setPresenting] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [leadEditorOpen, setLeadEditorOpen] = useState(false)
  const readiness = getQuoteWorkspaceReadiness({
    inspection: props.inspection,

    calculation: props.quoteEngineCalculation,

    calculating: props.quoteEngineCalculating,
  })

  const identity = quoteWorkspaceCustomerIdentity(
    props.inspection,
    props.workflowData,
  )

  useEffect(() => {
    if (props.initialSection) setSection(props.initialSection)
  }, [props.initialSection, props.inspection.id])

  if (presenting) return <CustomerReviewPresenter {...props} onClose={() => setPresenting(false)} onEditQuote={() => { setPresenting(false); setSection("quote") }} onSignature={() => { setPresenting(false); setSection("delivery") }} />

  return (
    <div
      className="pb-36 px-3 sm:px-4 pt-4 max-w-6xl mx-auto space-y-4 overflow-x-hidden"
      data-modern-quote-workspace="true"
    >
      <header className="rounded-2xl bg-brand-charcoal p-4 sm:p-5 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold uppercase">
                Quote Workspace
              </h1>
              <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold uppercase">
                {props.inspection.status}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-xs text-silver sm:grid-cols-2 sm:gap-x-8">
              <span>Quote#{displayQuoteNumber}</span>
              <span>
                Prepared by{" "}
                {props.currentUser?.name || props.inspection.createdBy}
              </span>
              <span className="truncate">{identity.name}</span>
              <span className="truncate">{identity.address}</span>
              {props.inspection.billTo && props.inspection.location ? (
                <span>
                  Bill-To {props.inspection.billTo.billToNumber} · Location{" "}
                  {props.inspection.location.locationNumber}
                </span>
              ) : props.inspection.leadId ? (
                <span>SalesBrain Lead</span>
              ) : (
                <span>Customer context required</span>
              )}
            </div>
          </div>
          <div className="text-xs font-semibold">
            {props.isSaving ? (
              <span className="text-amber">Saving…</span>
            ) : props.saveError ? (
              <span className="text-danger">Save needs attention</span>
            ) : props.savedAt ? (
              <span className="text-success">
                Saved {new Date(props.savedAt).toLocaleTimeString()}
              </span>
            ) : (
              <span className="text-silver">Not saved yet</span>
            )}
          </div>
        </div>
      </header>

      <button type="button" disabled={props.isSaving || props.providerActionLoading} onClick={async () => { setReviewError(""); try { await props.onPersist(); setPresenting(true) } catch (error) { setReviewError(error instanceof Error ? error.message : "Save your inspection before reviewing.") } }} className="w-full rounded-xl bg-brand-red py-3 text-white font-bold disabled:opacity-40">Review with Customer</button>
      {reviewError && <p role="alert" className="text-danger">{reviewError}</p>}
      <nav
        className="grid grid-cols-5 gap-1 rounded-2xl bg-white p-1.5 shadow-sm"
        aria-label="Quote Workspace sections"
      >
        {WORKSPACE_SECTIONS.map((item) => {
          const Icon = item.icon

          const active = section === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              aria-current={active ? "page" : undefined}
              className={`min-w-0 rounded-xl px-1.5 py-2.5 text-[11px] sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                active
                  ? "bg-brand-red text-white"
                  : "text-steel hover:bg-surface"
              }`}
            >
              <Icon size={17} />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {section === "customer" ? (
        <QuoteCustomerSummary
          inspection={props.inspection}
          workflowData={props.workflowData}
          onChangeCustomer={props.onChangeCustomer}
          onEditLead={() => setLeadEditorOpen(true)}
        />
      ) : null}

      {section === "inspection" ? <QuoteInspection {...props} /> : null}

      {section === "quote" ? <QuoteBuilderPanel {...props} embedded /> : null}

      {section === "review" ? (
        <QuoteReview
          inspection={props.inspection}
          workflowData={props.workflowData}
          calculation={props.quoteEngineCalculation}
          calculating={props.quoteEngineCalculating}
        />
      ) : null}

      {section === "delivery" ? (
        <QuoteDeliveryPanel
          inspection={props.inspection}
          customerName={identity.name}
          workflowData={props.workflowData}
          documents={props.generatedDocuments}
          deliveries={props.deliveries}
          signatureRequest={props.signatureRequest}
          employeeProfile={props.employeeProfile}
          loading={props.providerActionLoading}
          onLoad={props.onLoadProviderState}
          onCreateDocument={props.onCreateDocument}
          onSendDelivery={props.onSendDelivery}
          onResumeSignature={props.onResumeSignature}
          onRequestSignature={props.onRequestSignature}
          onCreateProposalPdf={props.onCreateProposalPdf}
        />
      ) : null}

      {section !== "delivery" ? (
        <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-surface bg-white px-3 py-3">
          <div className="max-w-6xl mx-auto">
            <button
              type="button"
              onClick={props.onSave}
              disabled={
                !readiness.saveEligible ||
                props.isSaving ||
                props.quoteEngineCalculating
              }
              className="w-full rounded-xl bg-brand-red py-3 text-white font-display text-lg font-bold uppercase disabled:opacity-50"
            >
              <Save size={17} className="inline mr-2" />
              {props.isSaving ? "Saving…" : "Save Draft"}
            </button>
            {!readiness.hasContext ? (
              <div className="mt-1.5 text-xs text-amber">
                Select a customer or start from a SalesBrain lead before saving.
              </div>
            ) : props.saveError ? (
              <div className="mt-1.5 text-xs text-danger">{props.saveError}</div>
            ) : null}
          </div>
        </div>
      ) : null}
      {leadEditorOpen && props.lead ? (
        <LeadEditModal
          lead={props.lead}
          services={props.pricebookServices}
          onClose={() => setLeadEditorOpen(false)}
          onSave={async (input) => {
            await props.onUpdateLead(input)

            setLeadEditorOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

const DOCUMENT_LABELS: Record<Exclude<SalesDocumentType, "agreement">, string> =
  {
    "inspection-report": "Inspection & Findings Report",
    "quote-options": "Quote Options",
    bundle: "Bundled Report + Quote",
  }

function QuoteDeliveryPanel({
  inspection,
  customerName,
  workflowData,
  documents,
  deliveries,
  signatureRequest,
  employeeProfile,
  loading,
  onLoad,
  onCreateDocument,
  onSendDelivery,
  onResumeSignature,
  onRequestSignature,
  onCreateProposalPdf,
}: {
  inspection: QuoteWorkspaceProps["inspection"]
  customerName: string
  workflowData: QuoteWorkspaceProps["workflowData"]
  documents: SalesGeneratedDocument[]
  deliveries: SalesDeliveryEvent[]
  signatureRequest: SalesSignatureRequest | null
  employeeProfile: SalesEmployeeProfile | null
  loading: boolean
  onLoad: () => void | Promise<void>
  onCreateDocument: QuoteWorkspaceProps["onCreateDocument"]
  onSendDelivery: QuoteWorkspaceProps["onSendDelivery"]
  onResumeSignature: QuoteWorkspaceProps["onResumeSignature"]
  onRequestSignature: QuoteWorkspaceProps["onRequestSignature"]
  onCreateProposalPdf: QuoteWorkspaceProps["onCreateProposalPdf"]
}) {
  const [documentType, setDocumentType] =
    useState<Exclude<SalesDocumentType, "agreement">>("bundle")
  const [to, setTo] = useState(workflowData.customer.email)
  const [ccValue, setCc] = useState<string | null>(null)
  const cc = ccValue ?? employeeProfile?.email ?? ""
  const [subject, setSubject] = useState(
    `${DOCUMENT_LABELS.bundle} — Holloman Exterminators`,
  )
  const [message, setMessage] = useState(
    "Thank you for choosing Holloman Exterminators. Please review the attached inspection and service information.",
  )
  const [notice, setNotice] = useState("")
  const [deliveryMode, setDeliveryMode] = useState<"email" | "in_person">("email")
  const [signingUrl, setSigningUrl] = useState("")
  const latest = documents.find((item) => item.type === documentType)
  const hasCurrentQuote = Boolean(
    inspection.quoteEngineSnapshot?.customerFacing?.quoteTotalCents,
  )
  const selectedOptionId =
    workflowData.selectedQuoteOptionId ||
    (hasCurrentQuote ? "quote-engine" : "")
  const signatureIsOpen = signatureSendingBlocked(inspection, signatureRequest)

  useEffect(() => {
    setTo(workflowData.customer.email)
  }, [inspection.id, workflowData.customer.email])

  useEffect(() => {
    void onLoad()
  }, [inspection.id, onLoad])

  useEffect(() => {
    if (
      !signatureRequest ||
      ["completed", "declined", "expired", "send_failed", "revoked"].includes(
        signatureRequest.status,
      )
    ) {
      return
    }
    const refreshTimer = window.setInterval(() => {
      void onLoad()
    }, 30_000)
    return () => window.clearInterval(refreshTimer)
  }, [onLoad, signatureRequest?.id, signatureRequest?.status])

  const run = async (work: () => Promise<void>, success: string) => {
    setNotice("")
    try {
      await work()
      setNotice(success)
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "This SalesBrain action could not be completed.",
      )
    }
  }

  const openPdf = async (download: boolean) => {
    await run(
      async () => {
        const result = await onCreateProposalPdf()
        if (download) {
          const link = document.createElement("a")
          link.href = result.url
          link.download = result.name
          link.click()
        } else {
          window.open(result.url, "_blank", "noopener,noreferrer")
        }
      },
      download
        ? "Your PDF download is ready."
        : "The customer PDF opened in a new tab.",
    )
  }

  return (
    <section className="space-y-4" aria-label="Customer delivery actions">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 text-brand-red" size={22} />
          <div>
            <h2 className="font-display text-xl font-bold uppercase text-brand-dark">
              Customer PDFs
            </h2>
            <p className="mt-1 text-sm text-steel">
              Customer-facing PDFs exclude internal cost, margin, formulas, and
              staff notes.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void openPdf(false)}
            disabled={loading}
            className="rounded-xl border border-surface px-3 py-3 text-sm font-bold text-brand-dark disabled:opacity-50"
          >
            <FileText size={16} className="mr-2 inline" />
            View PDF
          </button>
          <button
            type="button"
            onClick={() => void openPdf(true)}
            disabled={loading}
            className="rounded-xl border border-surface px-3 py-3 text-sm font-bold text-brand-dark disabled:opacity-50"
          >
            <Download size={16} className="mr-2 inline" />
            Download
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 text-brand-red" size={22} />
          <div>
            <h2 className="font-display text-xl font-bold uppercase text-brand-dark">
              Send Email
            </h2>
            <p className="mt-1 text-sm text-steel">
              Confirm the recipient and message before Gmail sends the selected
              customer PDF.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="text-xs font-semibold text-steel">
            Document
            <select
              value={documentType}
              onChange={(event) => {
                const next = event.target
                  .value as Exclude<SalesDocumentType, "agreement">
                setDocumentType(next)
                setSubject(`${DOCUMENT_LABELS[next]} — Holloman Exterminators`)
              }}
              className="mt-1 w-full rounded-xl border border-surface px-3 py-2 text-sm text-brand-dark"
            >
              <option value="bundle">Bundled Report + Quote</option>
              <option value="quote-options">Quote Options</option>
              <option value="inspection-report">
                Inspection & Findings Report
              </option>
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              void run(async () => {
                await onCreateDocument(documentType)
              }, `${DOCUMENT_LABELS[documentType]} generated and saved.`)
            }
            disabled={loading}
            className="rounded-xl border border-surface px-3 py-2.5 text-sm font-bold text-brand-dark disabled:opacity-50"
          >
            Generate / Save PDF
          </button>
          <label className="text-xs font-semibold text-steel">
            To
            <input
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 w-full rounded-xl border border-surface px-3 py-2 text-sm text-brand-dark"
            />
          </label>
          <label className="text-xs font-semibold text-steel">CC salesperson<input type="email" value={cc} onChange={(event) => setCc(event.target.value)} className="mt-1 w-full rounded-xl border border-surface px-3 py-2 text-sm text-brand-dark" /></label>
          <label className="text-xs font-semibold text-steel">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 w-full rounded-xl border border-surface px-3 py-2 text-sm text-brand-dark"
            />
          </label>
          <label className="text-xs font-semibold text-steel">
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-surface px-3 py-2 text-sm text-brand-dark"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              latest &&
              void run(async () => {
                await onSendDelivery({
                  documentType,
                  documentIds: [latest.id],
                  to,
                  cc: cc.trim() ? [cc.trim()] : [],
                  bcc: [],
                  subject,
                  message,
                  idempotencyKey: crypto.randomUUID(),
                })
              }, "Gmail accepted the message. SalesBrain recorded the delivery.")
            }
            disabled={
              loading ||
              !latest ||
              !to ||
              !employeeProfile?.active ||
              !employeeProfile.gmailEnabled
            }
            className="rounded-xl bg-brand-red px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Send size={16} className="mr-2 inline" />
            Send through Gmail
          </button>
        </div>
        {!employeeProfile?.gmailEnabled ? (
          <p className="mt-3 text-xs text-amber">
            An administrator must activate this employee's Gmail sender profile
            before email can be sent.
          </p>
        ) : null}
        {deliveries.length ? (
          <p className="mt-3 text-xs text-success">
            Latest delivery: {deliveries[0].status} to {deliveries[0].recipient}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <FileSignature className="mt-0.5 text-brand-red" size={22} />
          <div>
            <h2 className="font-display text-xl font-bold uppercase text-brand-dark">
              Send for Signature
            </h2>
            <p className="mt-1 text-sm text-steel">
              The Holloman Signature Service sends through SignWell and reports
              verified status back to SalesBrain. Employees do not need a SignWell login.
            </p>
          </div>
        </div>
        <label className="block mt-4 text-sm">Signature delivery<select value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value as "email" | "in_person")} className="block w-full rounded-xl border p-3 mt-1"><option value="email">Email through SignWell</option><option value="in_person">Sign in person on this device</option></select></label>
        <button
          type="button"
          onClick={() =>
            void run(async () => {
              if (signatureIsOpen) return
              const result = await onRequestSignature({
                deliveryMode,
                customerEmail: to,
                customerName,
                selectedOptionId,
                message:
                  "Please review and sign the attached Holloman Exterminators service agreement.",
                idempotencyKey: crypto.randomUUID(),
              })
              if (result.signingUrl) setSigningUrl(result.signingUrl)
            }, "Signature request created. SalesBrain will update status when SignWell reports it.")
          }
          disabled={
            loading ||
            !to ||
            !customerName ||
            !selectedOptionId ||
            signatureIsOpen
          }
          className="mt-4 w-full rounded-xl bg-brand-red px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          <FileSignature size={16} className="mr-2 inline" />
          Send for Signature
        </button>
        {signatureRequest?.deliveryMode === "in_person" && !["completed", "signed", "declined", "expired", "revoked"].includes(signatureRequest.status) && <button type="button" disabled={loading} onClick={() => void run(async () => { const result = await onResumeSignature(); setSigningUrl(result.signingUrl) }, "Signing session ready.")} className="mt-3 rounded-xl border px-4 py-3 font-bold">Resume In-Person Signing</button>}
        {signingUrl && /^https:\/\/www\.signwell\.com\//.test(signingUrl) && <a href={signingUrl} target="_blank" rel="noopener noreferrer" className="block mt-3 rounded-xl bg-brand-red px-4 py-3 text-white font-bold text-center">Open SignWell Signing Session</a>}
        {!selectedOptionId ? (
          <p className="mt-3 text-xs text-amber">
            Save a priced quote before sending it for signature.
          </p>
        ) : null}
        {signatureRequest ? (
          <div className="mt-3 space-y-2 text-xs text-brand-dark">
            <p>
              Signature status:{" "}
              <strong className="uppercase">
                {signatureRequest.status.replace("_", " ")}
              </strong>
              {signatureRequest.providerDocumentId
                ? ` · Document ${signatureRequest.providerDocumentId}`
                : ""}
            </p>
            {signatureRequest.status === "completed" &&
            signatureRequest.signedAgreementUrl ? (
              <div className="flex flex-wrap gap-2">
                <a
                  href={opsBrainUrl(signatureRequest.signedAgreementUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-surface px-3 py-2 text-xs font-bold text-brand-dark"
                >
                  <Download size={14} className="mr-2" />
                  Download Signed Agreement
                </a>
                {signatureRequest.auditTrailUrl ? (
                  <a
                    href={opsBrainUrl(signatureRequest.auditTrailUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg border border-surface px-3 py-2 text-xs font-bold text-brand-dark"
                  >
                    <FileText size={14} className="mr-2" />
                    View Audit Trail
                  </a>
                ) : null}
              </div>
            ) : null}
            {signatureRequest.status === "completed" ? (
              <p className="text-success">
                The signed agreement and audit trail are saved in this customer's files.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => void onLoad()}
                disabled={loading}
                className="font-semibold text-brand-dark underline disabled:opacity-50"
              >
                Check signature status
              </button>
            )}
          </div>
        ) : null}
      </div>

      {notice ? (
        <div className="rounded-xl bg-surface p-3 text-sm text-brand-dark">
          {notice}
        </div>
      ) : null}
    </section>
  )
}
