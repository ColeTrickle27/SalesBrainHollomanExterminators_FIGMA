import { AlertTriangle, CheckCircle } from "lucide-react"

import {
  getQuoteWorkspaceReadiness,
  quoteWorkspaceCustomerFacingReview,
  quoteWorkspaceCustomerIdentity,
} from "../quoteWorkspace"
import type { SalesInspection } from "../../../types/sales-inspection"
import {
  quoteEngineMarginMessage,
  type QuoteEngineSnapshot,
} from "../../../types/quote-engine"
import type { SalesBrainWorkflowData } from "../../../types/figma-workflow"

export function QuoteReview({
  inspection,
  workflowData,
  calculation,
  calculating,
}: {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  calculation: QuoteEngineSnapshot | null
  calculating: boolean
}) {
  const identity = quoteWorkspaceCustomerIdentity(inspection, workflowData)
  const customerFacing = quoteWorkspaceCustomerFacingReview(calculation)
  const readiness = getQuoteWorkspaceReadiness({
    inspection,
    calculation,
    calculating,
  })
  const visiblePhotos = inspection.photos.filter(
    (photo) =>
      photo.customerVisible !== false && photo.uploadStatus !== "error",
  ).length
  const activeFindings = inspection.findings.filter(
    (finding) => !finding.hidden,
  ).length
  const hasInspection = Boolean(
    inspection.property?.hasGraph || activeFindings || visiblePhotos,
  )
  const marginMessage = calculation
    ? quoteEngineMarginMessage(
        calculation.internal.marginStatus,
        calculation.internal.marginMessage,
      )
    : null

  return (
    <div className="space-y-4" data-review-pricing-source="quote-engine-customer-facing">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-xl font-bold uppercase text-brand-dark">
          Customer
        </h2>
        <div className="mt-3 font-semibold text-brand-dark">{identity.name}</div>
        <div className="text-sm text-steel">{identity.address}</div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold uppercase text-brand-dark">
              Quote
            </h2>
            <p className="mt-1 text-xs text-steel">
              Customer pricing below comes from the saved or current OpsBrain
              calculation.
            </p>
          </div>
          {calculating ? (
            <span className="rounded-lg bg-amber-light px-2 py-1 text-xs font-bold text-amber">
              Calculating…
            </span>
          ) : null}
        </div>
        {!customerFacing ? (
          <div className="mt-4 rounded-xl bg-surface p-4 text-sm text-steel">
            Add a service or custom item in Quote and wait for the authoritative
            calculation to review customer pricing.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-surface">
            {customerFacing.lines.map((line) => (
              <div
                key={line.lineId}
                className="grid grid-cols-[1fr_auto] gap-3 py-3"
              >
                <div>
                  <div className="font-semibold text-brand-dark">
                    {line.serviceName}
                  </div>
                  {line.description ? (
                    <div className="mt-1 text-sm text-steel">
                      {line.description}
                    </div>
                  ) : null}
                </div>
                <div className="font-mono font-bold text-brand-dark">
                  {formatMoney(line.sellingPriceCents)}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 pt-4 text-lg">
              <span className="font-display font-bold uppercase text-brand-dark">
                Grand Total
              </span>
              <span className="font-mono text-2xl font-bold text-brand-dark">
                {formatMoney(customerFacing.quoteTotalCents)}
              </span>
            </div>
          </div>
        )}
        {inspection.quoteNotes ? (
          <div className="mt-4 rounded-xl bg-surface p-3">
            <div className="text-[11px] font-bold uppercase text-steel">
              Quote Notes
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-brand-dark">
              {inspection.quoteNotes}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold uppercase text-brand-dark">
          Optional Inspection Summary
        </h2>
        {hasInspection ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <SummaryValue label="Findings" value={String(activeFindings)} />
            <SummaryValue label="Visible Photos" value={String(visiblePhotos)} />
            <SummaryValue
              label="Graph"
              value={inspection.property?.hasGraph ? "Linked" : "Not linked"}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-steel">
            No inspection details added. This does not block quote review or
            saving.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-brand-charcoal p-5 text-white shadow-sm">
        <h2 className="font-display text-lg font-bold uppercase">
          Internal Readiness
        </h2>
        <div className="mt-3 space-y-2 text-sm">
          <ReadinessRow label="Valid customer or lead context" ok={readiness.hasContext} />
          <ReadinessRow label="At least one quote line" ok={readiness.hasLines} />
          <ReadinessRow
            label="Authoritative calculation available"
            ok={readiness.hasAuthoritativeCalculation}
          />
          <ReadinessRow label="Calculation finished" ok={!readiness.calculating} />
        </div>
        {marginMessage ? (
          <div className="mt-3 rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-amber">
            <AlertTriangle size={15} className="inline mr-2" />
            {marginMessage}
          </div>
        ) : null}
        <div
          className={`mt-4 rounded-xl px-3 py-2 text-sm font-bold ${
            readiness.ready
              ? "bg-success/15 text-success"
              : "bg-white/10 text-silver"
          }`}
        >
          {readiness.ready
            ? "Ready for quote review"
            : "Complete the quote items above to finish Review"}
        </div>
      </section>
    </div>
  )
}

function ReadinessRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle size={16} className="text-success" />
      ) : (
        <AlertTriangle size={16} className="text-amber" />
      )}
      <span>{label}</span>
    </div>
  )
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3 text-center">
      <div className="font-display text-lg font-bold text-brand-dark">
        {value}
      </div>
      <div className="mt-1 text-[10px] text-steel">{label}</div>
    </div>
  )
}

function formatMoney(cents: number | null | undefined) {
  return cents === null || cents === undefined
    ? "Unavailable"
    : `$${(cents / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
}
