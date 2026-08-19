import { useEffect, useState } from "react"
import { Calculator, ChevronLeft, Lock, Plus, Save, Trash2 } from "lucide-react"

import { CurrencyInput } from "../components/forms/CurrencyInput"
import type { SalesInspection } from "../types/sales-inspection"
import type { SalesCostingSettings, SalesLaborRole, SalesProduct } from "../types/sales-operations"
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

interface Props {
  inspection: SalesInspection
  workflowData: SalesBrainWorkflowData
  products: SalesProduct[]
  laborRoles: SalesLaborRole[]
  settings: SalesCostingSettings
  estimates: EstimateListItem[]
  estimatesLoading: boolean
  estimatesError: string | null
  openingEstimateId: string | null
  isSaving: boolean
  savedAt: string | null
  saveError: string | null
  onOpenEstimate: (id: string) => Promise<void>
  onChange: (data: SalesBrainWorkflowData) => void
  onSave: () => void
}

export default function JobCosting(props: Props) {
  const hasQuote = Boolean(props.inspection.billTo && props.inspection.location)
  const [showPicker, setShowPicker] = useState(!hasQuote)

  useEffect(() => {
    if (!hasQuote) setShowPicker(true)
  }, [hasQuote])

  if (showPicker) {
    return <div className="pb-24 px-4 pt-5 max-w-4xl mx-auto space-y-4">
      <div className="bg-brand-charcoal rounded-2xl p-5 text-white flex items-center gap-3">
        <Calculator size={24} />
        <div className="flex-1"><h1 className="font-display text-2xl font-bold uppercase">Job Costing</h1><p className="text-xs text-silver mt-1">Choose a saved quote to review or update its internal cost snapshot.</p></div>
        {hasQuote ? <button onClick={() => setShowPicker(false)} className="text-xs font-bold bg-white/10 rounded-xl px-3 py-2"><ChevronLeft size={14} className="inline mr-1" />Current Quote</button> : null}
      </div>
      {props.estimatesError ? <div className="text-sm text-danger">{props.estimatesError}</div> : null}
      {props.estimatesLoading ? <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">Loading saved quotes…</div> : null}
      <div className="space-y-2">{props.estimates.map((estimate) => <button key={estimate.id} onClick={async () => { await props.onOpenEstimate(estimate.id); setShowPicker(false) }} disabled={props.openingEstimateId !== null} className="w-full bg-white rounded-2xl p-4 shadow-sm text-left disabled:opacity-50"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-semibold text-brand-dark truncate">{estimate.customerName || "Customer not selected"}</div><div className="text-xs text-steel mt-1 truncate">{estimate.locationAddress || "No location"} · {estimate.estimateNumber}</div></div><span className="text-xs capitalize text-amber font-bold">{props.openingEstimateId === estimate.id ? "Opening…" : estimate.status}</span></div></button>)}</div>
      {!props.estimatesLoading && props.estimates.length === 0 ? <EmptyState title="No saved quotes" detail="Create or save a quote before using Job Costing." /> : null}
    </div>
  }

  return <div className="pb-28 px-4 pt-5 max-w-5xl mx-auto space-y-4">
    <div className="bg-brand-charcoal rounded-2xl p-5 text-white flex items-center gap-3"><Calculator size={24} /><div className="flex-1 min-w-0"><h1 className="font-display text-2xl font-bold uppercase">Job Costing</h1><p className="text-xs text-silver mt-1 truncate">{props.inspection.billTo?.billToName} · {props.inspection.location?.locationAddress || props.inspection.location?.locationName} · {props.inspection.estimateNumber}</p></div><button onClick={() => setShowPicker(true)} className="text-xs font-bold bg-white/10 rounded-xl px-3 py-2">Change Quote</button></div>
    <CostingEditor data={props.workflowData} products={props.products} laborRoles={props.laborRoles} settings={props.settings} onChange={props.onChange} />
    <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface px-4 py-3 z-20"><div className="max-w-5xl mx-auto"><button onClick={props.onSave} disabled={props.isSaving} className="w-full bg-brand-red text-white rounded-xl py-3 font-display text-lg font-bold uppercase disabled:opacity-50"><Save size={17} className="inline mr-2" />{props.isSaving ? "Saving…" : "Save Job Costing"}</button>{props.saveError ? <div className="mt-2 text-xs text-danger">{props.saveError}</div> : props.savedAt ? <div className="mt-2 text-xs text-success">Saved {new Date(props.savedAt).toLocaleTimeString()}</div> : null}</div></div>
  </div>
}

function CostingEditor({ data, products, laborRoles, settings, onChange }: { data: SalesBrainWorkflowData; products: SalesProduct[]; laborRoles: SalesLaborRole[]; settings: SalesCostingSettings; onChange: (data: SalesBrainWorkflowData) => void }) {
  const costing = data.costing
  const setCosting = (patch: Partial<typeof costing>) => onChange({ ...data, costing: { ...costing, ...patch } })
  const totals = calculateCosting(costing)
  const addProduct = () => { const product = products.find((item) => item.active); const row: EstimatedProductUsage = { id: crypto.randomUUID(), productId: product?.id, productName: product?.name || "", sku: product?.sku || "", plannedQuantity: 1, unit: product?.unit || "unit", catalogCostCents: product?.unitCostCents || 0 }; setCosting({ productUsage: [...costing.productUsage, row] }) }
  const updateProduct = (id: string, patch: Partial<EstimatedProductUsage>) => setCosting({ productUsage: costing.productUsage.map((row) => row.id === id ? { ...row, ...patch } : row) })
  const addLabor = () => { const role = laborRoles.find((item) => item.active); const row: EstimatedLaborUsage = { id: crypto.randomUUID(), laborRoleId: role?.id, role: role?.name || "", service: "", hours: 1, loadedRateCents: role?.loadedRateCents || 0 }; setCosting({ laborUsage: [...costing.laborUsage, row] }) }
  const updateLabor = (id: string, patch: Partial<EstimatedLaborUsage>) => setCosting({ laborUsage: costing.laborUsage.map((row) => row.id === id ? { ...row, ...patch } : row) })

  return <div className="space-y-4">
    <div className="bg-info-light border border-info/20 rounded-xl p-3 text-xs text-info">No inventory quantities or approval gates. Every cost and rate is snapshotted into this quote.</div>
    <TableCard title="Estimated Product Usage" action="Add Product" onAction={addProduct}>{costing.productUsage.length === 0 ? <EmptyState title="No product usage" detail="Add estimated materials used on this job." /> : costing.productUsage.map((row) => <div key={row.id} className="grid lg:grid-cols-[2fr_1fr_90px_100px_110px_auto] gap-2 p-3 border-t border-surface"><select value={row.productId || ""} onChange={(event) => { const item = products.find((product) => product.id === event.target.value); if (item) updateProduct(row.id, { productId: item.id, productName: item.name, sku: item.sku, unit: item.unit, catalogCostCents: item.unitCostCents }) }} className="border border-surface rounded-lg px-2 py-2 text-sm"><option value="">Custom product</option>{products.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input value={row.sku} onChange={(event) => updateProduct(row.id, { sku: event.target.value })} placeholder="SKU" className="border border-surface rounded-lg px-2 text-sm" /><input type="number" value={row.plannedQuantity} onChange={(event) => updateProduct(row.id, { plannedQuantity: Number(event.target.value) })} className="border border-surface rounded-lg px-2" /><input value={row.unit} onChange={(event) => updateProduct(row.id, { unit: event.target.value })} className="border border-surface rounded-lg px-2" /><MoneyInput label="Product unit cost" cents={row.catalogCostCents} onChange={(value) => updateProduct(row.id, { catalogCostCents: value })} /><button onClick={() => setCosting({ productUsage: costing.productUsage.filter((item) => item.id !== row.id) })} className="text-danger"><Trash2 size={15} /></button></div>)}</TableCard>
    <TableCard title="Labor Plan" action="Add Labor" onAction={addLabor}>{costing.laborUsage.length === 0 ? <EmptyState title="No labor plan" detail="Add estimated labor hours for the job." /> : costing.laborUsage.map((row) => <div key={row.id} className="grid lg:grid-cols-[1.5fr_2fr_100px_120px_auto] gap-2 p-3 border-t border-surface"><select value={row.laborRoleId || ""} onChange={(event) => { const role = laborRoles.find((item) => item.id === event.target.value); if (role) updateLabor(row.id, { laborRoleId: role.id, role: role.name, loadedRateCents: role.loadedRateCents }) }} className="border border-surface rounded-lg px-2 py-2 text-sm"><option value="">Custom role</option>{laborRoles.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input value={row.service} onChange={(event) => updateLabor(row.id, { service: event.target.value })} placeholder="Service / task" className="border border-surface rounded-lg px-2 text-sm" /><input type="number" value={row.hours} onChange={(event) => updateLabor(row.id, { hours: Number(event.target.value) })} className="border border-surface rounded-lg px-2" /><MoneyInput label="Loaded labor rate" cents={row.loadedRateCents} onChange={(value) => updateLabor(row.id, { loadedRateCents: value })} /><button onClick={() => setCosting({ laborUsage: costing.laborUsage.filter((item) => item.id !== row.id) })} className="text-danger"><Trash2 size={15} /></button></div>)}</TableCard>
    <FormCard title="Job Cost Summary"><MoneyRow label="Materials" cents={totals.materialsCents} /><MoneyRow label="Labor" cents={totals.laborCents} /><MoneyEditRow label="Equipment" cents={costing.equipmentCents} onChange={(value) => setCosting({ equipmentCents: value, equipmentTravelDisposalCents: 0 })} /><MoneyEditRow label="Travel" cents={costing.travelCents} onChange={(value) => setCosting({ travelCents: value, equipmentTravelDisposalCents: 0 })} /><MoneyEditRow label="Disposal" cents={costing.disposalCents} onChange={(value) => setCosting({ disposalCents: value, equipmentTravelDisposalCents: 0 })} /><NumberRow label="Overhead %" value={costing.overheadPercent} onChange={(value) => setCosting({ overheadPercent: value })} /><NumberRow label="Contingency %" value={costing.contingencyPercent} onChange={(value) => setCosting({ contingencyPercent: value })} /><MoneyRow label="Total Direct Cost" cents={totals.directCostCents} strong /><NumberRow label="Target Margin %" value={costing.targetMarginPercent} onChange={(value) => setCosting({ targetMarginPercent: value })} /><MoneyRow label="Recommended Minimum Price" cents={totals.recommendedMinimumCents} strong /><MoneyEditRow label="Quoted Selling Price" cents={costing.sellingPriceCents} onChange={(value) => setCosting({ sellingPriceCents: value })} /><MoneyRow label="Gross Profit" cents={totals.grossProfitCents} /><ReadOnlyRow label="Gross Margin" value={`${totals.grossMarginPercent.toFixed(1)}%`} /></FormCard>
    {costing.productUsage.length === 0 && costing.laborUsage.length === 0 ? <button onClick={() => setCosting({ travelCents: settings.equipmentTravelDisposalCents, equipmentTravelDisposalCents: 0, overheadPercent: settings.overheadPercent, contingencyPercent: settings.contingencyPercent, targetMarginPercent: settings.targetMarginPercent })} className="text-sm text-brand-red font-bold">Apply current Admin costing defaults</button> : null}
    <div className="bg-amber-light border border-amber/25 rounded-xl p-3 text-xs text-amber"><Lock size={14} className="inline mr-2" />Internal costs never appear in customer presentation, PDFs, Gmail attachments, or BoldSign agreements.</div>
  </div>
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="bg-white rounded-2xl p-4 shadow-sm"><h3 className="font-display text-lg font-bold text-brand-dark uppercase mb-2">{title}</h3>{children}</section> }
function TableCard({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children: React.ReactNode }) { return <div className="bg-white rounded-2xl shadow-sm overflow-hidden"><div className="px-3 py-2 bg-brand-charcoal flex justify-between"><span className="font-display text-sm font-bold text-white uppercase">{title}</span><button onClick={onAction} className="text-xs text-white font-bold"><Plus size={13} className="inline" /> {action}</button></div>{children}</div> }
function NumberRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="py-2 grid grid-cols-[1fr_130px] gap-3 items-center"><span className="text-sm text-steel">{label}</span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="border border-surface rounded-lg px-2 py-2 text-right" /></label> }
function MoneyInput({ label, cents, onChange }: { label: string; cents: number; onChange: (value: number) => void }) { return <CurrencyInput ariaLabel={label} cents={cents} onChange={onChange} className="border border-surface rounded-lg px-2 py-2 text-right font-mono min-w-0" /> }
function MoneyEditRow({ label, cents, onChange }: { label: string; cents: number; onChange: (value: number) => void }) { return <div className="py-2 grid grid-cols-[1fr_150px] gap-3 items-center"><span className="text-sm text-steel">{label}</span><MoneyInput label={label} cents={cents} onChange={onChange} /></div> }
function MoneyRow({ label, cents, strong = false }: { label: string; cents: number; strong?: boolean }) { return <div className={`py-2 flex items-center justify-between ${strong ? "font-bold text-brand-dark" : "text-sm text-steel"}`}><span>{label}</span><span className="font-mono">${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div> }
function ReadOnlyRow({ label, value }: { label: string; value: string }) { return <div className="py-2 grid sm:grid-cols-[190px_1fr] gap-2"><span className="text-xs text-steel font-semibold">{label}</span><span className="text-sm text-brand-dark break-all">{value}</span></div> }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="bg-white rounded-2xl p-6 text-center"><div className="font-semibold text-brand-dark">{title}</div><p className="text-sm text-steel mt-1">{detail}</p></div> }
