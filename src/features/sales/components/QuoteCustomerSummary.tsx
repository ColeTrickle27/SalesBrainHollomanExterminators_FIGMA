import { MapPin, UserRound } from "lucide-react"

import { quoteWorkspaceCustomerIdentity } from "../quoteWorkspace"
import type { SalesInspection } from "../../../types/sales-inspection"
import type { SalesBrainWorkflowData } from "../../../types/figma-workflow"

export function QuoteCustomerSummary({
  inspection,
  workflowData,
  onChangeCustomer,
  onEditLead,
}: {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  onChangeCustomer: () => void
  onEditLead: () => void
}) {
  const identity = quoteWorkspaceCustomerIdentity(inspection, workflowData)
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRound size={20} className="text-brand-red" />
            <h2 className="font-display text-xl font-bold uppercase text-brand-dark">
              Customer
            </h2>
          </div>
          <div className="mt-4 text-lg font-semibold text-brand-dark">
            {identity.name}
          </div>
          <div className="mt-1 flex items-start gap-2 text-sm text-steel">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            <span>{identity.address}</span>
          </div>
          <div className="mt-3 text-xs font-mono text-steel">
            {inspection.billTo && inspection.location
              ? `Bill-To ${inspection.billTo.billToNumber} · Location ${inspection.location.locationNumber}`
              : inspection.leadId
                ? "SalesBrain Lead"
                : "No quote context selected"}
          </div>
        </div>
        <button
          type="button"
          onClick={inspection.leadId ? onEditLead : onChangeCustomer}
          className="rounded-xl border border-surface px-4 py-2.5 text-sm font-bold text-brand-dark hover:bg-surface"
        >
          {inspection.leadId ? "Edit Lead from Home" : "Change Customer"}
        </button>
      </div>
      {inspection.billTo && inspection.location ? (
        <p className="mt-4 border-t border-surface pt-3 text-xs text-steel">
          Permanent customer identity remains linked to this Bill-To and
          Location. Changing it uses the existing customer search and safely
          resets property-specific quote data when the location changes.
        </p>
      ) : null}
    </section>
  )
}
