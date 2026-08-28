import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Calculator,
  ChevronLeft,
  Lock,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

import { CurrencyInput } from "../components/forms/CurrencyInput"
import type { SalesInspection } from "../types/sales-inspection"
import type { PricebookService } from "../types/pricebook"
import {
  hasQuoteEngineQuoteContext,
  quoteEngineMarginMessage,
  type QuoteEngineInput,
  type QuoteEngineInternalLine,
  type QuoteEngineMaterialBreakdown,
  type QuoteEngineSnapshot,
} from "../types/quote-engine"
import type {
  SalesCostingSettings,
  SalesLaborRole,
  SalesProduct,
} from "../types/sales-operations"
import type { OpsBrainUser } from "../types/user"
import {
  calculateCosting,
  type EstimatedLaborUsage,
  type EstimatedProductUsage,
  type SalesBrainWorkflowData,
} from "../types/figma-workflow"

interface EstimateListItem {
  id: string
  estimateNumber: string
  customerName: string | null
  locationAddress: string | null
  status: string
}

export interface QuoteBuilderPanelProps {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  pricebookServices: PricebookService[]
  currentUser: OpsBrainUser | null
  quoteEngineCalculation: QuoteEngineSnapshot | null
  quoteEngineCalculating: boolean
  quoteEngineCalculationError: string | null
  isSaving: boolean
  savedAt: string | null
  saveError: string | null
  onQuoteNotesChange: (value: string) => void
  onQuoteEngineInputChange: (
    updater: (current: QuoteEngineInput) => QuoteEngineInput,
  ) => void
  onSave: () => void
  embedded?: boolean
}

interface Props extends QuoteBuilderPanelProps {
  products: SalesProduct[]
  laborRoles: SalesLaborRole[]
  settings: SalesCostingSettings
  estimates: EstimateListItem[]
  estimatesLoading: boolean
  estimatesError: string | null
  openingEstimateId: string | null
  onOpenEstimate: (id: string) => Promise<unknown>
  onChange: (data: SalesBrainWorkflowData) => void
}

interface QuotePickerProps extends Props {
  hasQuoteContext: boolean
  onClose: () => void
}

interface QuoteEngineMaterialPatch {
  estimatedConsumption?: number
  consumptionUnit?: string
}

interface InternalMetricProps {
  label: string
  value: string
}

interface ReadOnlyRowProps {
  label: string
  value: string
}

interface FormCardProps {
  title: string
  children: ReactNode
}

interface EmptyStateProps {
  title: string
  detail: string
}

function hasLegacyCostingData(data: SalesBrainWorkflowData) {
  const costing = data.costing
  return Boolean(
    costing.productUsage.length ||
      costing.laborUsage.length ||
      costing.equipmentTravelDisposalCents ||
      costing.equipmentCents ||
      costing.travelCents ||
      costing.disposalCents ||
      costing.sellingPriceCents,
  )
}

export default function JobCosting(props: Props) {
  const quoteEngineBacked = Boolean(props.inspection.quoteEngineInput)
  const legacyCosting =
    !quoteEngineBacked && hasLegacyCostingData(props.workflowData)
  const hasQuoteContext = Boolean(
    props.inspection.leadId ||
      (props.inspection.billTo && props.inspection.location),
  )
  const [showPicker, setShowPicker] = useState(
    legacyCosting && !hasQuoteContext,
  )

  useEffect(() => {
    if (legacyCosting && !hasQuoteContext) setShowPicker(true)
  }, [hasQuoteContext, legacyCosting])

  if (showPicker)
    return (
      <QuotePicker
        {...props}
        hasQuoteContext={hasQuoteContext}
        onClose={() => setShowPicker(false)}
      />
    )
  if (quoteEngineBacked) return <QuoteBuilderPanel {...props} />
  return (
    <LegacyJobCosting {...props} onChooseQuote={() => setShowPicker(true)} />
  )
}

function QuotePicker({ hasQuoteContext, onClose, ...props }: QuotePickerProps) {
  return (
    <div className="pb-24 px-4 pt-5 max-w-4xl mx-auto space-y-4">
      <div className="bg-brand-charcoal rounded-2xl p-5 text-white flex items-center gap-3">
        <Calculator size={24} />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold uppercase">
            Legacy Job Costing
          </h1>
          <p className="text-xs text-silver mt-1">
            Choose a saved legacy quote to review its historical internal cost
            snapshot.
          </p>
        </div>
        {hasQuoteContext ? (
          <button
            onClick={onClose}
            className="text-xs font-bold bg-white/10 rounded-xl px-3 py-2"
          >
            <ChevronLeft size={14} className="inline mr-1" />
            Current Quote
          </button>
        ) : null}
      </div>
      {props.estimatesError ? (
        <div className="text-sm text-danger">{props.estimatesError}</div>
      ) : null}
      {props.estimatesLoading ? (
        <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">
          Loading saved quotes…
        </div>
      ) : null}
      <div className="space-y-2">
        {props.estimates.map((estimate) => (
          <button
            key={estimate.id}
            onClick={async () => {
              await props.onOpenEstimate(estimate.id)
              onClose()
            }}
            disabled={props.openingEstimateId !== null}
            className="w-full bg-white rounded-2xl p-4 shadow-sm text-left disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-brand-dark truncate">
                  {estimate.customerName || "Customer not selected"}
                </div>
                <div className="text-xs text-steel mt-1 truncate">
                  {estimate.locationAddress || "No location"} ·{" "}
                  {estimate.estimateNumber}
                </div>
              </div>
              <span className="text-xs capitalize text-amber font-bold">
                {props.openingEstimateId === estimate.id
                  ? "Opening…"
                  : estimate.status}
              </span>
            </div>
          </button>
        ))}
      </div>
      {!props.estimatesLoading && props.estimates.length === 0 ? (
        <EmptyState
          title="No saved legacy quotes"
          detail="Create or save a quote before using legacy Job Costing."
        />
      ) : null}
    </div>
  )
}

export function QuoteBuilderPanel(props: QuoteBuilderPanelProps) {
  const input = props.inspection.quoteEngineInput
  const hasQuoteContext = hasQuoteEngineQuoteContext({
    leadId: props.inspection.leadId,
    billToNumber: props.inspection.billTo?.billToNumber,
    locationNumber: props.inspection.location?.locationNumber,
  })
  const [serviceToAdd, setServiceToAdd] = useState("")
  const activeServices = useMemo(
    () => props.pricebookServices.filter((service) => service.active),
    [props.pricebookServices],
  )
  const calculation = props.quoteEngineCalculation
  const customerLines = useMemo(
    () =>
      new Map(
        calculation?.customerFacing.lines.map((line) => [line.lineId, line]) ??
          [],
      ),
    [calculation],
  )
  const internalLines = useMemo(
    () =>
      new Map(
        calculation?.internal.lines.map((line) => [line.lineId, line]) ?? [],
      ),
    [calculation],
  )

  useEffect(() => {
    if (!serviceToAdd && activeServices[0])
      setServiceToAdd(activeServices[0].id)
  }, [activeServices, serviceToAdd])

  const updateInput = props.onQuoteEngineInputChange
  const services = input?.services ?? []
  const customLines = input?.customLineItems ?? []
  const addService = () => {
    if (!hasQuoteContext) return
    const service = activeServices.find((item) => item.id === serviceToAdd)
    if (!service) return
    updateInput((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          lineId: crypto.randomUUID(),
          serviceId: service.id,
          materialOverrides: [],
          laborOverride: {},
        },
      ],
    }))
  }
  const addCustomLine = () => {
    if (!hasQuoteContext) return
    updateInput((current) => ({
      ...current,
      customLineItems: [
        ...current.customLineItems,
        {
          lineId: crypto.randomUUID(),
          name: "Custom line item",
          description: "",
          sellingPriceCents: 0,
        },
      ],
    }))
  }

  return (
    <div
      className={
        props.embedded
          ? "space-y-4"
          : "pb-28 px-4 pt-5 max-w-5xl mx-auto space-y-4"
      }
      data-quote-pricing-authority="opsbrain-quote-engine"
    >
      {!props.embedded ? (
        <QuoteBuilderHeader
          inspection={props.inspection}
          workflowData={props.workflowData}
          currentUser={props.currentUser}
        />
      ) : null}
      <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-dark uppercase">
              Customer Quote
            </h2>
          <p className="text-sm text-steel mt-1">
            Choose services and quote-specific customer wording. OpsBrain
            calculates the economics.
          </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-steel uppercase font-semibold">
              Grand Total
            </div>
            <div className="font-mono text-2xl font-bold text-brand-dark">
              {formatMoney(
                calculation?.customerFacing.quoteTotalCents,
              )}
            </div>
          </div>
        </div>
        {!hasQuoteContext ? (
          <div className="rounded-xl bg-amber/10 border border-amber/30 px-3 py-2 text-sm text-brand-dark">
            Select an existing customer or start a quote from a SalesBrain lead
            before adding services or saving this quote.
          </div>
        ) : null}
        <label className="block">
          <span className="text-xs text-steel uppercase font-semibold">
            Customer-facing quote notes
          </span>
          <textarea
            value={props.inspection.quoteNotes ?? ""}
            onChange={(event) => props.onQuoteNotesChange(event.target.value)}
            rows={3}
            placeholder="Scope clarification, conditions, timing, or customer-specific context"
            className="mt-1 w-full border border-surface rounded-xl px-3 py-2 text-sm"
          />
        </label>
        <div className="border-t border-surface pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-brand-dark uppercase">
              Service Lines
            </h3>
            <div className="flex gap-2">
              <select
                aria-label="Service to add"
                value={serviceToAdd}
                onChange={(event) => setServiceToAdd(event.target.value)}
                disabled={!hasQuoteContext}
                className="border border-surface rounded-lg px-2 py-2 text-sm max-w-52"
              >
                <option value="">Choose a service</option>
                {activeServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <button
                onClick={addService}
                disabled={!hasQuoteContext || !serviceToAdd}
                className="bg-brand-red text-white rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50"
              >
                <Plus size={15} className="inline mr-1" />
                Add Service
              </button>
            </div>
          </div>
          {!services.length ? (
            <EmptyState
              title="No services selected"
              detail="Add an active Pricebook service or a custom line item to begin this quote."
            />
          ) : (
            services.map((line) => (
              <CatalogServiceLine
                key={line.lineId}
                line={line}
                service={props.pricebookServices.find(
                  (item) => item.id === line.serviceId,
                )}
                customerLine={customerLines.get(line.lineId)}
                internalLine={internalLines.get(line.lineId)}
                onChange={updateInput}
              />
            ))
          )}
        </div>
        <div className="border-t border-surface pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-brand-dark uppercase">
              Custom Quote Lines
            </h3>
            <button
              onClick={addCustomLine}
              disabled={!hasQuoteContext}
              className="text-sm font-bold text-brand-red disabled:opacity-50"
            >
              <Plus size={15} className="inline mr-1" />
              Add Custom Line Item
            </button>
          </div>
          {customLines.map((line) => (
            <CustomLine
              key={line.lineId}
              line={line}
              customerLine={customerLines.get(line.lineId)}
              internalLine={internalLines.get(line.lineId)}
              onChange={updateInput}
            />
          ))}
        </div>
      </section>
      <InternalJobCost
        calculation={calculation}
        calculating={props.quoteEngineCalculating}
        error={props.quoteEngineCalculationError}
      />
      {!props.embedded ? (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface px-4 py-3 z-20">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={props.onSave}
              disabled={!hasQuoteContext || props.isSaving || props.quoteEngineCalculating}
              className="w-full bg-brand-red text-white rounded-xl py-3 font-display text-lg font-bold uppercase disabled:opacity-50"
            >
              <Save size={17} className="inline mr-2" />
              {props.isSaving ? "Saving…" : "Save Draft"}
            </button>
            {props.saveError ? (
              <div className="mt-2 text-xs text-danger">{props.saveError}</div>
            ) : props.savedAt ? (
              <div className="mt-2 text-xs text-success">
                Saved {new Date(props.savedAt).toLocaleTimeString()}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function QuoteBuilderHeader({
  inspection,
  workflowData,
  currentUser,
}: {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  currentUser: OpsBrainUser | null
}) {
  const leadName =
    workflowData.customer.company ||
    [workflowData.customer.first, workflowData.customer.last]
      .filter(Boolean)
      .join(" ")
  const customerName =
    inspection.billTo?.billToName ||
    (inspection.leadId ? leadName || "SalesBrain lead" : "Customer or lead not selected")
  const address =
    inspection.location?.locationAddress ||
    inspection.location?.locationName ||
    (inspection.leadId
      ? [
          workflowData.customer.streetAddress,
          workflowData.customer.city,
          workflowData.customer.zip,
        ]
          .filter(Boolean)
          .join(", ") || "Lead address not provided"
      : "Customer or lead details not selected")
  return (
    <div className="bg-brand-charcoal rounded-2xl p-5 text-white flex items-start gap-3">
      <Calculator size={24} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-2xl font-bold uppercase">
          Quote Builder
        </h1>
        <div className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-silver">
          <span>Quote #{inspection.estimateNumber}</span>
          <span>
            Quote date {new Date(inspection.createdAt).toLocaleDateString()}
          </span>
          <span>Prepared by {currentUser?.name || inspection.createdBy}</span>
          <span className="truncate">
            {customerName} · {address}
          </span>
          {inspection.billTo?.billToNumber ||
          inspection.location?.locationNumber ? (
            <span>
              Bill-To {inspection.billTo?.billToNumber || "—"} · Location{" "}
              {inspection.location?.locationNumber || "—"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CatalogServiceLine({
  line,
  service,
  customerLine,
  internalLine,
  onChange,
}: {
  line: QuoteEngineInput["services"][number]
  service?: PricebookService
  customerLine?: QuoteEngineSnapshot["customerFacing"]["lines"][number]
  internalLine?: QuoteEngineInternalLine
  onChange: Props["onQuoteEngineInputChange"]
}) {
  const description =
    line.customerDescription ??
    customerLine?.description ??
    service?.description ??
    ""
  const sellingPrice =
    line.sellingPriceCents ?? customerLine?.sellingPriceCents ?? 0
  const update = (patch: Partial<typeof line>) =>
    onChange((current) => ({
      ...current,
      services: current.services.map((item) =>
        item.lineId === line.lineId ? { ...item, ...patch } : item,
      ),
    }))
  return (
    <article className="border border-surface rounded-xl p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-brand-dark">
            {service?.name ||
              customerLine?.serviceName ||
              "Unavailable service"}
          </div>
          <div className="text-xs text-steel">
            Catalog service · quote-specific changes do not edit the Pricebook
          </div>
        </div>
        <button
          onClick={() =>
            onChange((current) => ({
              ...current,
              services: current.services.filter(
                (item) => item.lineId !== line.lineId,
              ),
            }))
          }
          className="text-danger p-1"
          aria-label="Remove service line"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <label className="block">
        <span className="text-xs text-steel uppercase font-semibold">
          Customer description
        </span>
        <textarea
          value={description}
          onChange={(event) =>
            update({ customerDescription: event.target.value })
          }
          rows={2}
          className="mt-1 w-full border border-surface rounded-lg px-3 py-2 text-sm"
        />
      </label>
      <label className="block max-w-48">
        <span className="text-xs text-steel uppercase font-semibold">
          Selling price
        </span>
        <CurrencyInput
          ariaLabel="Quote line selling price"
          cents={sellingPrice ?? 0}
          onChange={(sellingPriceCents) => update({ sellingPriceCents })}
          className="mt-1 w-full border border-surface rounded-lg px-3 py-2 text-right font-mono"
        />
      </label>
      <MarginStatus
        status={internalLine?.marginStatus}
        message={internalLine?.marginMessage}
        compact
      />
      {internalLine ? (
        <ServiceInternalDetails
          line={line}
          internalLine={internalLine}
          onChange={onChange}
        />
      ) : null}
    </article>
  )
}

function CustomLine({
  line,
  customerLine,
  internalLine,
  onChange,
}: {
  line: QuoteEngineInput["customLineItems"][number]
  customerLine?: QuoteEngineSnapshot["customerFacing"]["lines"][number]
  internalLine?: QuoteEngineInternalLine
  onChange: Props["onQuoteEngineInputChange"]
}) {
  const update = (patch: Partial<typeof line>) =>
    onChange((current) => ({
      ...current,
      customLineItems: current.customLineItems.map((item) =>
        item.lineId === line.lineId ? { ...item, ...patch } : item,
      ),
    }))
  return (
    <article className="border border-surface rounded-xl p-3 space-y-3">
      <div className="flex justify-between gap-3">
        <div className="font-semibold text-brand-dark">Custom line item</div>
        <button
          onClick={() =>
            onChange((current) => ({
              ...current,
              customLineItems: current.customLineItems.filter(
                (item) => item.lineId !== line.lineId,
              ),
            }))
          }
          className="text-danger p-1"
          aria-label="Remove custom line"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label>
          <span className="text-xs text-steel uppercase font-semibold">
            Name
          </span>
          <input
            value={line.name}
            onChange={(event) => update({ name: event.target.value })}
            className="mt-1 w-full border border-surface rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label>
          <span className="text-xs text-steel uppercase font-semibold">
            Selling price
          </span>
          <CurrencyInput
            ariaLabel="Custom line selling price"
            cents={line.sellingPriceCents}
            onChange={(sellingPriceCents) => update({ sellingPriceCents })}
            className="mt-1 w-full border border-surface rounded-lg px-3 py-2 text-right font-mono"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-steel uppercase font-semibold">
          Customer description
        </span>
        <textarea
          value={line.description ?? customerLine?.description ?? ""}
          onChange={(event) => update({ description: event.target.value })}
          rows={2}
          className="mt-1 w-full border border-surface rounded-lg px-3 py-2 text-sm"
        />
      </label>
      <MarginStatus
        status={internalLine?.marginStatus}
        message={internalLine?.marginMessage}
        compact
      />
    </article>
  )
}

function ServiceInternalDetails({
  line,
  internalLine,
  onChange,
}: {
  line: QuoteEngineInput["services"][number]
  internalLine: QuoteEngineInternalLine
  onChange: Props["onQuoteEngineInputChange"]
}) {
  const setMaterial = (
    material: QuoteEngineMaterialBreakdown,
    patch: QuoteEngineMaterialPatch,
  ) =>
    onChange((current) => ({
      ...current,
      services: current.services.map((service) => {
        if (service.lineId !== line.lineId) return service
        const existing = service.materialOverrides?.find(
          (item) => item.productId === material.productId,
        )
        const next = {
          productId: material.productId,
          estimatedConsumption:
            patch.estimatedConsumption ??
            existing?.estimatedConsumption ??
            material.estimatedConsumption,
          consumptionUnit:
            patch.consumptionUnit ??
            existing?.consumptionUnit ??
            material.consumptionUnit ??
            undefined,
        }
        return {
          ...service,
          materialOverrides: [
            ...(service.materialOverrides ?? []).filter(
              (item) => item.productId !== material.productId,
            ),
            next,
          ],
        }
      }),
    }))
  const setLabor = (patch: {
    onsiteHours?: number | undefined
    employeeCount?: number | undefined
  }) =>
    onChange((current) => ({
      ...current,
      services: current.services.map((service) =>
        service.lineId === line.lineId
          ? {
              ...service,
              laborOverride: { ...service.laborOverride, ...patch },
            }
          : service,
      ),
    }))
  return (
    <details className="bg-brand-charcoal/5 rounded-lg p-3">
      <summary className="cursor-pointer text-sm font-bold text-brand-dark">
        Internal Job Cost details
      </summary>
      <div className="mt-3 space-y-3 text-sm">
        <div className="grid sm:grid-cols-3 gap-2">
          <ReadOnlyRow
            label="Direct cost"
            value={formatMoney(internalLine.directJobCostCents)}
          />
          <ReadOnlyRow
            label="Gross profit"
            value={formatMoney(internalLine.grossProfitCents)}
          />
          <ReadOnlyRow
            label="Gross margin"
            value={formatMargin(internalLine.grossMarginPercent)}
          />
        </div>
        {internalLine.recommendedSellingPriceCents !== null &&
        internalLine.recommendedSellingPriceCents !== undefined ? (
          <ReadOnlyRow
            label="OpsBrain recommended selling price"
            value={formatMoney(internalLine.recommendedSellingPriceCents)}
          />
        ) : null}
        {internalLine.labor ? (
          <div className="border-t border-surface pt-3">
            <div className="font-semibold text-brand-dark">Labor</div>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              <NumberInput
                label="Onsite hours"
                value={
                  line.laborOverride?.onsiteHours ??
                  internalLine.labor.onsiteHours
                }
                onChange={(onsiteHours) => setLabor({ onsiteHours })}
              />
              <NumberInput
                label="Employee count"
                value={
                  line.laborOverride?.employeeCount ??
                  internalLine.labor.employeeCount
                }
                onChange={(employeeCount) => setLabor({ employeeCount })}
              />
              <ReadOnlyRow
                label="Employee-hours"
                value={formatNumber(internalLine.labor.employeeHours)}
              />
              <ReadOnlyRow
                label="Labor cost"
                value={formatMoney(internalLine.labor.costCents)}
              />
            </div>
            <div className="mt-2 text-xs text-steel">
              Travel time is excluded from quote labor costing.
            </div>
          </div>
        ) : null}
        {internalLine.materialBreakdown.length ? (
          <div className="border-t border-surface pt-3">
            <div className="font-semibold text-brand-dark">Materials</div>
            <div className="space-y-2 mt-2">
              {internalLine.materialBreakdown.map((material) => (
                <div
                  key={material.productId}
                  className="border border-surface rounded-lg p-2"
                >
                  <div className="font-medium">{material.productName}</div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    <NumberInput
                      label="Estimated consumption"
                      value={
                        line.materialOverrides?.find(
                          (item) => item.productId === material.productId,
                        )?.estimatedConsumption ?? material.estimatedConsumption
                      }
                      onChange={(estimatedConsumption) =>
                        setMaterial(material, { estimatedConsumption })
                      }
                    />
                    <label>
                      <span className="text-xs text-steel">
                        Consumption unit
                      </span>
                      <input
                        value={
                          line.materialOverrides?.find(
                            (item) => item.productId === material.productId,
                          )?.consumptionUnit ??
                          material.consumptionUnit ??
                          ""
                        }
                        onChange={(event) =>
                          setMaterial(material, {
                            consumptionUnit: event.target.value,
                          })
                        }
                        className="mt-1 w-full border border-surface rounded-lg px-2 py-2"
                      />
                    </label>
                    <ReadOnlyRow
                      label="Whole units / packages charged"
                      value={formatNumber(material.wholePackageQuantity)}
                    />
                    <ReadOnlyRow
                      label="Purchase unit cost"
                      value={formatMoney(material.purchaseUnitCostCents)}
                    />
                    <ReadOnlyRow
                      label="Material cost"
                      value={formatMoney(material.purchaseCostCents)}
                    />
                  </div>
                  {material.unavailableReason ? (
                    <div className="mt-2 text-xs text-amber">
                      Cost data unavailable:{" "}
                      {material.unavailableReason.split("_").join(" ")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {internalLine.otherDirectCosts.length ? (
          <div className="border-t border-surface pt-3">
            <div className="font-semibold text-brand-dark">
              Other confirmed direct costs
            </div>
            {internalLine.otherDirectCosts.map((item) => (
              <ReadOnlyRow
                key={item.name}
                label={item.name}
                value={formatMoney(item.costCents)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </details>
  )
}

function InternalJobCost({
  calculation,
  calculating,
  error,
}: {
  calculation: QuoteEngineSnapshot | null
  calculating: boolean
  error: string | null
}) {
  const internal = calculation?.internal
  return (
    <details className="bg-brand-charcoal rounded-2xl p-4 text-white">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
        <div>
          <h2 className="font-display text-xl font-bold uppercase">
            Internal Economics
          </h2>
          <p className="text-xs text-silver mt-1">
            Internal costs and margins never appear in customer presentation or
            customer documents.
          </p>
        </div>
        {calculating ? (
          <span className="text-xs font-bold bg-white/10 rounded-lg px-3 py-2">
            Calculating…
          </span>
        ) : internal?.grossMarginPercent !== null &&
          internal?.grossMarginPercent !== undefined ? (
          <span className="text-sm font-mono font-bold">
            {formatMargin(internal.grossMarginPercent)} GM
          </span>
        ) : (
          <span className="text-xs text-silver">View details</span>
        )}
      </summary>
      <div className="mt-4">
        {error ? (
          <div className="bg-danger/15 border border-danger/30 rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}
        {!internal && !calculating && !error ? (
          <p className="text-sm text-silver">
            Add a service or custom line item to request an authoritative
            calculation from OpsBrain.
          </p>
        ) : null}
        {internal ? (
          <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <InternalMetric
              label="Total direct job cost"
              value={formatMoney(internal.directJobCostCents)}
            />
            <InternalMetric
              label="Gross profit"
              value={formatMoney(internal.grossProfitCents)}
            />
            <InternalMetric
              label="Gross margin"
              value={formatMargin(internal.grossMarginPercent)}
            />
          </div>
          <MarginStatus
            status={internal.marginStatus}
            message={internal.marginMessage}
          />
          </div>
        ) : null}
      </div>
    </details>
  )
}

function MarginStatus({
  status,
  message,
  compact = false,
}: {
  status?: QuoteEngineInternalLine["marginStatus"]
  message?: string | null
  compact?: boolean
}) {
  if (!status) return null
  const copy = quoteEngineMarginMessage(status, message)
  if (!copy && status === "available") return null
  const styles =
    status === "low_margin_warning"
      ? "bg-amber-light text-amber border-amber/30"
      : status === "excluded"
        ? "bg-info-light text-info border-info/30"
        : "bg-danger-light text-danger border-danger/30"
  return (
    <div
      className={`${
        compact ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2"
      } border rounded-lg ${styles}`}
    >
      <AlertTriangle size={compact ? 13 : 15} className="inline mr-2" />
      {status === "low_margin_warning"
        ? message || "Gross margin is below 40%."
        : copy}
    </div>
  )
}

function InternalMetric({ label, value }: InternalMetricProps) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <div className="text-[11px] text-silver uppercase font-semibold">
        {label}
      </div>
      <div className="font-mono text-lg font-bold mt-1">{value}</div>
    </div>
  )
}
function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null | undefined
  onChange: (value: number | undefined) => void
}) {
  return (
    <label>
      <span className="text-xs text-steel">{label}</span>
      <input
        type="number"
        min="0"
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value === "" ? undefined : Number(event.target.value),
          )
        }
        className="mt-1 w-full border border-surface rounded-lg px-2 py-2"
      />
    </label>
  )
}
function ReadOnlyRow({ label, value }: ReadOnlyRowProps) {
  return (
    <div className="py-1">
      <div className="text-xs text-steel">{label}</div>
      <div className="font-mono text-sm text-brand-dark">{value}</div>
    </div>
  )
}
function formatMoney(cents: number | null | undefined) {
  return cents === null || cents === undefined
    ? "Unavailable"
    : `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function formatNumber(value: number | null | undefined) {
  return value === null || value === undefined
    ? "Unavailable"
    : value.toLocaleString()
}
function formatMargin(value: number | null | undefined) {
  return value === null || value === undefined
    ? "Unavailable"
    : `${value.toFixed(2)}%`
}

function LegacyJobCosting({
  onChooseQuote,
  ...props
}: Props & { onChooseQuote: () => void }) {
  return (
    <div className="pb-28 px-4 pt-5 max-w-5xl mx-auto space-y-4">
      <div className="bg-brand-charcoal rounded-2xl p-5 text-white flex items-center gap-3">
        <Calculator size={24} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold uppercase">
            Legacy Job Costing
          </h1>
          <p className="text-xs text-silver mt-1 truncate">
            Historical costing remains available without recalculating it from
            today’s Pricebook.
          </p>
        </div>
        <button
          onClick={onChooseQuote}
          className="text-xs font-bold bg-white/10 rounded-xl px-3 py-2"
        >
          Change Quote
        </button>
      </div>
      <CostingEditor
        data={props.workflowData}
        products={props.products}
        laborRoles={props.laborRoles}
        onChange={props.onChange}
      />
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface px-4 py-3 z-20">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={props.onSave}
            disabled={props.isSaving}
            className="w-full bg-brand-red text-white rounded-xl py-3 font-display text-lg font-bold uppercase disabled:opacity-50"
          >
            <Save size={17} className="inline mr-2" />
            {props.isSaving ? "Saving…" : "Save Legacy Job Costing"}
          </button>
          {props.saveError ? (
            <div className="mt-2 text-xs text-danger">{props.saveError}</div>
          ) : props.savedAt ? (
            <div className="mt-2 text-xs text-success">
              Saved {new Date(props.savedAt).toLocaleTimeString()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CostingEditor({
  data,
  products,
  laborRoles,
  onChange,
}: {
  data: SalesBrainWorkflowData
  products: SalesProduct[]
  laborRoles: SalesLaborRole[]
  onChange: (data: SalesBrainWorkflowData) => void
}) {
  const costing = data.costing
  const setCosting = (patch: Partial<typeof costing>) =>
    onChange({ ...data, costing: { ...costing, ...patch } })
  const totals = calculateCosting(costing)
  const addProduct = () => {
    const product = products.find((item) => item.active)
    const row: EstimatedProductUsage = {
      id: crypto.randomUUID(),
      productId: product?.id,
      productName: product?.name || "",
      sku: product?.sku || "",
      plannedQuantity: 1,
      unit: product?.unit || "unit",
      catalogCostCents: product?.unitCostCents || 0,
    }
    setCosting({ productUsage: [...costing.productUsage, row] })
  }
  const updateProduct = (id: string, patch: Partial<EstimatedProductUsage>) =>
    setCosting({
      productUsage: costing.productUsage.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    })
  const addLabor = () => {
    const role = laborRoles.find((item) => item.active)
    const row: EstimatedLaborUsage = {
      id: crypto.randomUUID(),
      laborRoleId: role?.id,
      role: role?.name || "",
      service: "",
      hours: 1,
      loadedRateCents: role?.loadedRateCents || 0,
    }
    setCosting({ laborUsage: [...costing.laborUsage, row] })
  }
  const updateLabor = (id: string, patch: Partial<EstimatedLaborUsage>) =>
    setCosting({
      laborUsage: costing.laborUsage.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    })
  return (
    <div className="space-y-4">
      <div className="bg-info-light border border-info/20 rounded-xl p-3 text-xs text-info">
        This saved quote uses the historical legacy costing snapshot. New Quote
        Engine quotes use OpsBrain’s authoritative calculation.
      </div>
      <TableCard
        title="Estimated Product Usage"
        action="Add Product"
        onAction={addProduct}
      >
        {costing.productUsage.length === 0 ? (
          <EmptyState
            title="No product usage"
            detail="No historical material rows were saved on this quote."
          />
        ) : (
          costing.productUsage.map((row) => (
            <div
              key={row.id}
              className="grid lg:grid-cols-[2fr_1fr_90px_100px_110px_auto] gap-2 p-3 border-t border-surface"
            >
              <select
                value={row.productId || ""}
                onChange={(event) => {
                  const item = products.find(
                    (product) => product.id === event.target.value,
                  )
                  if (item)
                    updateProduct(row.id, {
                      productId: item.id,
                      productName: item.name,
                      sku: item.sku,
                      unit: item.unit,
                      catalogCostCents: item.unitCostCents,
                    })
                }}
                className="border border-surface rounded-lg px-2 py-2 text-sm"
              >
                <option value="">Custom product</option>
                {products
                  .filter((item) => item.active)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <input
                value={row.sku}
                onChange={(event) =>
                  updateProduct(row.id, { sku: event.target.value })
                }
                placeholder="SKU"
                className="border border-surface rounded-lg px-2 text-sm"
              />
              <input
                type="number"
                value={row.plannedQuantity}
                onChange={(event) =>
                  updateProduct(row.id, {
                    plannedQuantity: Number(event.target.value),
                  })
                }
                className="border border-surface rounded-lg px-2"
              />
              <input
                value={row.unit}
                onChange={(event) =>
                  updateProduct(row.id, { unit: event.target.value })
                }
                className="border border-surface rounded-lg px-2"
              />
              <MoneyInput
                label="Product unit cost"
                cents={row.catalogCostCents}
                onChange={(value) =>
                  updateProduct(row.id, { catalogCostCents: value })
                }
              />
              <button
                onClick={() =>
                  setCosting({
                    productUsage: costing.productUsage.filter(
                      (item) => item.id !== row.id,
                    ),
                  })
                }
                className="text-danger"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </TableCard>
      <TableCard title="Labor Plan" action="Add Labor" onAction={addLabor}>
        {costing.laborUsage.length === 0 ? (
          <EmptyState
            title="No labor plan"
            detail="No historical labor rows were saved on this quote."
          />
        ) : (
          costing.laborUsage.map((row) => (
            <div
              key={row.id}
              className="grid lg:grid-cols-[1.5fr_2fr_100px_120px_auto] gap-2 p-3 border-t border-surface"
            >
              <select
                value={row.laborRoleId || ""}
                onChange={(event) => {
                  const role = laborRoles.find(
                    (item) => item.id === event.target.value,
                  )
                  if (role)
                    updateLabor(row.id, {
                      laborRoleId: role.id,
                      role: role.name,
                      loadedRateCents: role.loadedRateCents,
                    })
                }}
                className="border border-surface rounded-lg px-2 py-2 text-sm"
              >
                <option value="">Custom role</option>
                {laborRoles
                  .filter((item) => item.active)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <input
                value={row.service}
                onChange={(event) =>
                  updateLabor(row.id, { service: event.target.value })
                }
                placeholder="Service / task"
                className="border border-surface rounded-lg px-2 text-sm"
              />
              <input
                type="number"
                value={row.hours}
                onChange={(event) =>
                  updateLabor(row.id, { hours: Number(event.target.value) })
                }
                className="border border-surface rounded-lg px-2"
              />
              <MoneyInput
                label="Loaded labor rate"
                cents={row.loadedRateCents}
                onChange={(value) =>
                  updateLabor(row.id, { loadedRateCents: value })
                }
              />
              <button
                onClick={() =>
                  setCosting({
                    laborUsage: costing.laborUsage.filter(
                      (item) => item.id !== row.id,
                    ),
                  })
                }
                className="text-danger"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </TableCard>
      <FormCard title="Historical Job Cost Summary">
        <MoneyRow label="Materials" cents={totals.materialsCents} />
        <MoneyRow label="Labor" cents={totals.laborCents} />
        <MoneyEditRow
          label="Equipment"
          cents={costing.equipmentCents}
          onChange={(value) =>
            setCosting({
              equipmentCents: value,
              equipmentTravelDisposalCents: 0,
            })
          }
        />
        <MoneyEditRow
          label="Travel"
          cents={costing.travelCents}
          onChange={(value) =>
            setCosting({ travelCents: value, equipmentTravelDisposalCents: 0 })
          }
        />
        <MoneyEditRow
          label="Disposal"
          cents={costing.disposalCents}
          onChange={(value) =>
            setCosting({
              disposalCents: value,
              equipmentTravelDisposalCents: 0,
            })
          }
        />
        <MoneyRow
          label="Total Direct Cost"
          cents={totals.directCostCents}
          strong
        />
        <MoneyRow
          label="Quoted Selling Price"
          cents={costing.sellingPriceCents}
          strong
        />
        <MoneyRow label="Gross Profit" cents={totals.grossProfitCents} />
        <ReadOnlyRow
          label="Gross Margin"
          value={`${totals.grossMarginPercent.toFixed(1)}%`}
        />
      </FormCard>
      <div className="bg-amber-light border border-amber/25 rounded-xl p-3 text-xs text-amber">
        <Lock size={14} className="inline mr-2" />
        Internal costs never appear in customer presentation, PDFs, Gmail
        attachments, or BoldSign agreements.
      </div>
    </div>
  )
}

function FormCard({ title, children }: FormCardProps) {
  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-display text-lg font-bold text-brand-dark uppercase mb-2">
        {title}
      </h3>
      {children}
    </section>
  )
}
function TableCard({
  title,
  action,
  onAction,
  children,
}: {
  title: string
  action: string
  onAction: () => void
  children: ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-3 py-2 bg-brand-charcoal flex justify-between">
        <span className="font-display text-sm font-bold text-white uppercase">
          {title}
        </span>
        <button onClick={onAction} className="text-xs text-white font-bold">
          <Plus size={13} className="inline" /> {action}
        </button>
      </div>
      {children}
    </div>
  )
}
function MoneyInput({
  label,
  cents,
  onChange,
}: {
  label: string
  cents: number
  onChange: (value: number) => void
}) {
  return (
    <CurrencyInput
      ariaLabel={label}
      cents={cents}
      onChange={onChange}
      className="border border-surface rounded-lg px-2 py-2 text-right font-mono min-w-0"
    />
  )
}
function MoneyEditRow({
  label,
  cents,
  onChange,
}: {
  label: string
  cents: number
  onChange: (value: number) => void
}) {
  return (
    <div className="py-2 grid grid-cols-[1fr_150px] gap-3 items-center">
      <span className="text-sm text-steel">{label}</span>
      <MoneyInput label={label} cents={cents} onChange={onChange} />
    </div>
  )
}
function MoneyRow({
  label,
  cents,
  strong = false,
}: {
  label: string
  cents: number
  strong?: boolean
}) {
  return (
    <div
      className={`py-2 flex items-center justify-between ${
        strong ? "font-bold text-brand-dark" : "text-sm text-steel"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono">{formatMoney(cents)}</span>
    </div>
  )
}
function EmptyState({ title, detail }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl p-6 text-center">
      <div className="font-semibold text-brand-dark">{title}</div>
      <p className="text-sm text-steel mt-1">{detail}</p>
    </div>
  )
}
