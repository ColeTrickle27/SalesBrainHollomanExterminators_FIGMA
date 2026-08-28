import { useState } from "react"
import {
  Calculator,
  Camera,
  ClipboardCheck,
  Save,
  UserRound,
} from "lucide-react"

import {
  QuoteInspection,
  type QuoteInspectionProps,
} from "./InspectionWizard"
import {
  QuoteBuilderPanel,
  type QuoteBuilderPanelProps,
} from "./JobCosting"
import { QuoteCustomerSummary } from "../features/sales/components/QuoteCustomerSummary"
import { QuoteReview } from "../features/sales/components/QuoteReview"
import { LeadEditModal } from "./Dashboard"
import {
  getQuoteWorkspaceReadiness,
  quoteWorkspaceCustomerIdentity,
} from "../features/sales/quoteWorkspace"
import type { LeadInput, SalesLead } from "../types/sales-operations"

const WORKSPACE_SECTIONS = [
  { id: "customer", label: "Customer", icon: UserRound },
  { id: "inspection", label: "Inspection", icon: Camera },
  { id: "quote", label: "Quote", icon: Calculator },
  { id: "review", label: "Review", icon: ClipboardCheck },
] as const

type WorkspaceSection = (typeof WORKSPACE_SECTIONS)[number]["id"]

export interface QuoteWorkspaceProps
  extends QuoteBuilderPanelProps,
    QuoteInspectionProps {
  onChangeCustomer: () => void
  lead: SalesLead | null
  onUpdateLead: (input: LeadInput) => Promise<SalesLead>
}

export default function QuoteWorkspace(props: QuoteWorkspaceProps) {
  const [section, setSection] = useState<WorkspaceSection>("quote")
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
              <span>Quote #{props.inspection.estimateNumber}</span>
              <span>
                Prepared by {props.currentUser?.name || props.inspection.createdBy}
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

      <nav
        className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1.5 shadow-sm"
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

      {section === "quote" ? (
        <QuoteBuilderPanel {...props} embedded />
      ) : null}

      {section === "review" ? (
        <QuoteReview
          inspection={props.inspection}
          workflowData={props.workflowData}
          calculation={props.quoteEngineCalculation}
          calculating={props.quoteEngineCalculating}
        />
      ) : null}

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
          ) : !readiness.hasLines ? (
            <div className="mt-1.5 text-xs text-amber">
              Add a service or custom item before saving this quote.
            </div>
          ) : props.saveError ? (
            <div className="mt-1.5 text-xs text-danger">{props.saveError}</div>
          ) : null}
        </div>
      </div>
      {leadEditorOpen && props.lead ? (
        <LeadEditModal
          lead={props.lead}
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
