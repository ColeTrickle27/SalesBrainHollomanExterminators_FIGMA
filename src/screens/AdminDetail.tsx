import { useEffect, useState, type ReactNode } from "react"
import { AlertTriangle, BriefcaseBusiness, Calculator, DatabaseBackup, Edit3, Mail, Package, Plus, RefreshCw, Settings, Trash2, Users, X } from "lucide-react"

import { CurrencyInput } from "../components/forms/CurrencyInput"

import type { PricebookService, PricebookServiceInput } from "../types/pricebook"
import type {
  SalesCostingSettings,
  SalesBrainMigrationResult,
  SalesEmployeeProfile,
  SalesLaborRole,
  SalesLaborRoleInput,
  SalesProduct,
  SalesProductInput,
  SalesServicePackage,
  SalesServicePackageInput,
} from "../types/sales-operations"
import type { OpsBrainUser } from "../types/user"

interface Props {
  services: PricebookService[]
  products: SalesProduct[]
  laborRoles: SalesLaborRole[]
  costingSettings: SalesCostingSettings
  servicePackages: SalesServicePackage[]
  employeeProfiles: SalesEmployeeProfile[]
  currentUser: OpsBrainUser | null
  loading: boolean
  error: string | null
  saving: boolean
  onRefresh: () => void
  onCreate: (input: PricebookServiceInput) => Promise<void>
  onUpdate: (id: string, input: PricebookServiceInput) => Promise<void>
  onDeactivate: (id: string) => Promise<void>
  onCreateProduct: (input: SalesProductInput) => Promise<void>
  onUpdateProduct: (id: string, input: SalesProductInput) => Promise<void>
  onDeactivateProduct: (id: string) => Promise<void>
  onCreateLaborRole: (input: SalesLaborRoleInput) => Promise<void>
  onUpdateLaborRole: (id: string, input: SalesLaborRoleInput) => Promise<void>
  onDeactivateLaborRole: (id: string) => Promise<void>
  onSaveCostingSettings: (input: SalesCostingSettings) => Promise<void>
  onCreateServicePackage: (input: SalesServicePackageInput) => Promise<void>
  onUpdateServicePackage: (id: string, input: SalesServicePackageInput) => Promise<void>
  onDeactivateServicePackage: (id: string) => Promise<void>
  onLoadEmployeeProfiles: () => Promise<SalesEmployeeProfile[]>
  onUpdateEmployeeProfile: (username: string, input: Omit<SalesEmployeeProfile, "username" | "updatedAt" | "updatedBy">) => Promise<SalesEmployeeProfile>
  onDeleteEmployeeProfile: (username: string) => Promise<void>
  onRunLegacyImport: () => Promise<SalesBrainMigrationResult>
}

type Tab = "services" | "packages" | "products" | "labor" | "defaults" | "employees"
type ServiceForm = { id?: string; name: string; category: string; description: string; price: string; priceBy: PricebookService["priceBy"]; productIds: string[] }
type PackageForm = { id?: string; name: string; description: string; serviceIds: string[] }
type EmployeeForm = { username: string; displayName: string; email: string; active: boolean; gmailEnabled: boolean }

export default function AdminDetail(props: Props) {
  const [tab, setTab] = useState<Tab>("services")
  const [serviceForm, setServiceForm] = useState<ServiceForm | null>(null)
  const [packageForm, setPackageForm] = useState<PackageForm | null>(null)
  const [productForm, setProductForm] = useState<{ id?: string; name: string; sku: string; unit: string; cost: string } | null>(null)
  const [laborForm, setLaborForm] = useState<{ id?: string; name: string; rate: string } | null>(null)
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm | null>(null)
  const [settings, setSettings] = useState(props.costingSettings)
  const [formError, setFormError] = useState("")
  const [migrationRunning, setMigrationRunning] = useState(false)
  const [migrationResult, setMigrationResult] = useState<SalesBrainMigrationResult | null>(null)
  const isAdmin = props.currentUser?.role === "admin"

  useEffect(() => setSettings(props.costingSettings), [props.costingSettings])
  useEffect(() => { if (tab === "employees" && isAdmin) void props.onLoadEmployeeProfiles().catch((error) => setFormError(error instanceof Error ? error.message : "Unable to load employee profiles.")) }, [tab, isAdmin, props.onLoadEmployeeProfiles])

  const saveService = async () => {
    if (!serviceForm) return
    const input: PricebookServiceInput = { name: serviceForm.name.trim(), category: serviceForm.category.trim(), description: serviceForm.description.trim(), price: Math.round(Number(serviceForm.price) * 100), priceBy: serviceForm.priceBy, productIds: serviceForm.productIds }
    if (!input.name || !input.category || !Number.isSafeInteger(input.price) || input.price < 0) { setFormError("Enter a name, category, and valid selling price."); return }
    try { if (serviceForm.id) await props.onUpdate(serviceForm.id, input); else await props.onCreate(input); setServiceForm(null); setFormError("") } catch (error) { setFormError(error instanceof Error ? error.message : "Unable to save service.") }
  }

  const savePackage = async () => {
    if (!packageForm) return
    const input: SalesServicePackageInput = { name: packageForm.name.trim(), description: packageForm.description.trim(), serviceIds: packageForm.serviceIds }
    if (!input.name || !input.serviceIds.length) { setFormError("Enter a package name and select at least one service."); return }
    try { if (packageForm.id) await props.onUpdateServicePackage(packageForm.id, input); else await props.onCreateServicePackage(input); setPackageForm(null); setFormError("") } catch (error) { setFormError(error instanceof Error ? error.message : "Unable to save service package.") }
  }

  const saveProduct = async () => {
    if (!productForm) return
    const input = { name: productForm.name.trim(), sku: productForm.sku.trim(), unit: productForm.unit.trim(), unitCostCents: Math.round(Number(productForm.cost) * 100) }
    if (!input.name || !input.unit || !Number.isSafeInteger(input.unitCostCents) || input.unitCostCents < 0) { setFormError("Enter a product name, unit, and valid unit cost."); return }
    try { if (productForm.id) await props.onUpdateProduct(productForm.id, input); else await props.onCreateProduct(input); setProductForm(null); setFormError("") } catch (error) { setFormError(error instanceof Error ? error.message : "Unable to save product.") }
  }

  const saveLabor = async () => {
    if (!laborForm) return
    const input = { name: laborForm.name.trim(), loadedRateCents: Math.round(Number(laborForm.rate) * 100) }
    if (!input.name || !Number.isSafeInteger(input.loadedRateCents) || input.loadedRateCents < 0) { setFormError("Enter a labor role and valid loaded hourly rate."); return }
    try { if (laborForm.id) await props.onUpdateLaborRole(laborForm.id, input); else await props.onCreateLaborRole(input); setLaborForm(null); setFormError("") } catch (error) { setFormError(error instanceof Error ? error.message : "Unable to save labor role.") }
  }

  const saveEmployee = async () => {
    if (!employeeForm) return
    const username = employeeForm.username.trim()
    const input = { displayName: employeeForm.displayName.trim(), email: employeeForm.email.trim().toLowerCase(), active: employeeForm.active, gmailEnabled: employeeForm.gmailEnabled }
    if (!username || !input.displayName || !input.email.endsWith("@holloman-ext.com")) { setFormError("Enter the exact Ops Brain username and a Holloman email address."); return }
    try { await props.onUpdateEmployeeProfile(username, input); setEmployeeForm(null); setFormError("") } catch (error) { setFormError(error instanceof Error ? error.message : "Unable to save employee profile.") }
  }

  const deleteEmployee = async (employee: SalesEmployeeProfile) => {
    if (!window.confirm(`Delete the Gmail sender profile for ${employee.displayName}?`)) return
    try { await props.onDeleteEmployeeProfile(employee.username); setFormError("") }
    catch (error) { setFormError(error instanceof Error ? error.message : "Unable to delete employee profile.") }
  }

  const runLegacyImport = async () => {
    setMigrationRunning(true)
    setFormError("")
    try { setMigrationResult(await props.onRunLegacyImport()) }
    catch (error) { setFormError(error instanceof Error ? error.message : "Unable to import legacy SalesBrain records.") }
    finally { setMigrationRunning(false) }
  }

  const tabs: Array<[Tab, string, typeof Package]> = [
    ["services", "Pricebook Services", Package],
    ["packages", "Service Packages", Package],
    ["products", "Product Catalog", Package],
    ["labor", "Labor Roles", BriefcaseBusiness],
    ["defaults", "Costing Defaults", Calculator],
    ["employees", "Gmail Employees", Users],
  ]

  return <div className="pb-24 px-4 pt-5 max-w-6xl mx-auto space-y-5">
    <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Settings size={22} className="text-brand-red" /><h1 className="font-display text-2xl font-bold text-brand-dark uppercase">Administration</h1></div><p className="text-sm text-steel mt-1">Pricebook, service packages, product costs, labor rates, and delegated Gmail senders.</p></div><button onClick={props.onRefresh} className="text-sm text-brand-red font-semibold flex items-center gap-1"><RefreshCw size={15} /> Refresh</button></div>
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">{tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`bg-white rounded-2xl p-4 shadow-sm text-left border-2 ${tab === id ? "border-brand-red" : "border-transparent"}`}><Icon size={20} className={tab === id ? "text-brand-red" : "text-steel"} /><div className="font-display text-sm font-bold text-brand-dark uppercase mt-2">{label}</div><div className="text-xs text-success mt-1">Live D1 configuration</div></button>)}</div>
    {props.error || formError ? <div className="bg-danger-light border border-danger/25 rounded-xl p-3 text-sm text-danger flex items-center gap-2"><AlertTriangle size={16} />{formError || props.error}</div> : null}
    {props.loading ? <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">Loading Admin data…</div> : null}
    {isAdmin ? <section className="bg-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><DatabaseBackup size={19} className="text-brand-red" /><h2 className="font-display text-lg font-bold text-brand-dark uppercase">Legacy R2 Import</h2></div><p className="text-sm text-steel mt-1">Idempotently copies legacy estimates and pricebook services into D1. Source R2 files are never deleted.</p>{migrationResult ? <p className="text-xs text-success mt-2">Estimates: {migrationResult.estimates.imported} imported, {migrationResult.estimates.skipped} skipped, {migrationResult.estimates.d1Count} in D1 · Services: {migrationResult.pricebookServices.imported} imported, {migrationResult.pricebookServices.skipped} skipped, {migrationResult.pricebookServices.d1Count} in D1 · Deleted: {migrationResult.sourceObjectsDeleted}</p> : null}</div><button disabled={migrationRunning} onClick={() => void runLegacyImport()} className="bg-brand-dark text-white rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50">{migrationRunning ? "Importing…" : "Run Legacy Import"}</button></section> : null}

    {tab === "services" ? <AdminSection title="Pricebook Services" action="Add Service" onAction={() => setServiceForm({ name: "", category: "", description: "", price: "", priceBy: "variable", productIds: [] })}>{props.services.map((item) => <Card key={item.id} title={item.name} meta={`${item.category} · ${priceByLabel(item.priceBy)} · ${item.active ? "Active" : "Inactive"}`} value={`$${(item.price / 100).toLocaleString()}`} inactive={!item.active} onEdit={() => setServiceForm({ id: item.id, name: item.name, category: item.category, description: item.description, price: (item.price / 100).toFixed(2), priceBy: item.priceBy, productIds: item.productIds })} onDeactivate={item.active ? () => void props.onDeactivate(item.id) : undefined}><p className="text-sm text-steel mt-2">{item.description || "No description"}</p><p className="text-xs text-steel mt-2">{item.productIds.length} linked product{item.productIds.length === 1 ? "" : "s"}</p></Card>)}</AdminSection> : null}
    {tab === "packages" ? <AdminSection title="Prebuilt Service Packages" action="Add Package" onAction={() => setPackageForm({ name: "", description: "", serviceIds: [] })}>{props.servicePackages.map((item) => <Card key={item.id} title={item.name} meta={`${item.serviceIds.length} services · ${item.active ? "Active" : "Inactive"}`} value="" inactive={!item.active} onEdit={() => setPackageForm({ id: item.id, name: item.name, description: item.description, serviceIds: item.serviceIds })} onDeactivate={item.active ? () => void props.onDeactivateServicePackage(item.id) : undefined}><p className="text-sm text-steel mt-2">{item.description || "No description"}</p><p className="text-xs text-brand-dark mt-2">{item.serviceIds.map((id) => props.services.find((service) => service.id === id)?.name).filter(Boolean).join(" · ")}</p></Card>)}</AdminSection> : null}
    {tab === "products" ? <AdminSection title="Product Catalog" action="Add Product" onAction={() => setProductForm({ name: "", sku: "", unit: "unit", cost: "" })}>{props.products.map((item) => <Card key={item.id} title={item.name} meta={`${item.sku || "No SKU"} · ${item.unit} · ${item.active ? "Active" : "Inactive"}`} value={`$${(item.unitCostCents / 100).toFixed(2)}`} inactive={!item.active} onEdit={() => setProductForm({ id: item.id, name: item.name, sku: item.sku, unit: item.unit, cost: (item.unitCostCents / 100).toFixed(2) })} onDeactivate={item.active ? () => void props.onDeactivateProduct(item.id) : undefined} />)}</AdminSection> : null}
    {tab === "labor" ? <AdminSection title="Labor Roles & Rates" action="Add Labor Role" onAction={() => setLaborForm({ name: "", rate: "" })}>{props.laborRoles.map((item) => <Card key={item.id} title={item.name} meta={item.active ? "Active" : "Inactive"} value={`$${(item.loadedRateCents / 100).toFixed(2)}/hr`} inactive={!item.active} onEdit={() => setLaborForm({ id: item.id, name: item.name, rate: (item.loadedRateCents / 100).toFixed(2) })} onDeactivate={item.active ? () => void props.onDeactivateLaborRole(item.id) : undefined} />)}</AdminSection> : null}
    {tab === "defaults" ? <section className="bg-white rounded-2xl p-5 shadow-sm max-w-2xl"><h2 className="font-display text-xl font-bold text-brand-dark uppercase mb-4">Default Costing Assumptions</h2><div className="space-y-3"><MoneyField label="Default Equipment / Travel / Disposal" cents={settings.equipmentTravelDisposalCents} onChange={(value) => setSettings({ ...settings, equipmentTravelDisposalCents: value })} /><NumberField label="Overhead %" value={settings.overheadPercent} onChange={(value) => setSettings({ ...settings, overheadPercent: value })} /><NumberField label="Contingency %" value={settings.contingencyPercent} onChange={(value) => setSettings({ ...settings, contingencyPercent: value })} /><NumberField label="Target Gross Margin %" value={settings.targetMarginPercent} onChange={(value) => setSettings({ ...settings, targetMarginPercent: value })} /></div><button onClick={() => void props.onSaveCostingSettings(settings)} className="mt-5 w-full bg-brand-red text-white rounded-xl py-3 font-display text-lg font-bold uppercase">Save Costing Defaults</button></section> : null}
    {tab === "employees" ? isAdmin ? <AdminSection title="Delegated Gmail Sender Profiles" action="Add Employee" onAction={() => setEmployeeForm({ username: "", displayName: "", email: "", active: true, gmailEnabled: false })}>{props.employeeProfiles.map((item) => <Card key={item.username} title={item.displayName} meta={`${item.username} · ${item.active ? "Active" : "Inactive"}`} value={item.gmailEnabled ? "Gmail On" : "Gmail Off"} inactive={!item.active} onEdit={() => setEmployeeForm({ username: item.username, displayName: item.displayName, email: item.email, active: item.active, gmailEnabled: item.gmailEnabled })} onDelete={() => void deleteEmployee(item)}><p className="text-sm text-steel mt-2"><Mail size={14} className="inline mr-1" />{item.email}</p></Card>)}</AdminSection> : <EmptyAdmin title="Admin access required" detail="Only Admin can view or edit Gmail sender profiles." /> : null}

    {serviceForm ? <Editor title={serviceForm.id ? "Edit Service" : "Add Service"} error={formError} saving={props.saving} onClose={() => setServiceForm(null)} onSave={saveService}><TextField label="Name" value={serviceForm.name} onChange={(value) => setServiceForm({ ...serviceForm, name: value })} /><TextField label="Category" value={serviceForm.category} onChange={(value) => setServiceForm({ ...serviceForm, category: value })} /><TextField label="Selling Price / Unit (USD)" type="number" value={serviceForm.price} onChange={(value) => setServiceForm({ ...serviceForm, price: value })} /><SelectField label="Price By" value={serviceForm.priceBy} options={[["per_lf", "Per LF"], ["per_sf", "Per SF"], ["per_acre", "Per Acre"], ["per_bedroom", "Per Bedroom"], ["variable", "Variable"]]} onChange={(value) => setServiceForm({ ...serviceForm, priceBy: value as PricebookService["priceBy"] })} /><CheckboxList title="Products / Materials Used" rows={props.products.filter((item) => item.active).map((item) => [item.id, `${item.name} (${item.sku || item.unit})`])} selected={serviceForm.productIds} onChange={(productIds) => setServiceForm({ ...serviceForm, productIds })} /><TextArea label="Description" value={serviceForm.description} onChange={(description) => setServiceForm({ ...serviceForm, description })} /></Editor> : null}
    {packageForm ? <Editor title={packageForm.id ? "Edit Service Package" : "Add Service Package"} error={formError} onClose={() => setPackageForm(null)} onSave={savePackage}><TextField label="Package Name" value={packageForm.name} onChange={(name) => setPackageForm({ ...packageForm, name })} /><TextArea label="Description" value={packageForm.description} onChange={(description) => setPackageForm({ ...packageForm, description })} /><CheckboxList title="Included Pricebook Services" rows={props.services.filter((item) => item.active).map((item) => [item.id, item.name])} selected={packageForm.serviceIds} onChange={(serviceIds) => setPackageForm({ ...packageForm, serviceIds })} /></Editor> : null}
    {productForm ? <Editor title={productForm.id ? "Edit Product" : "Add Product"} error={formError} onClose={() => setProductForm(null)} onSave={saveProduct}><TextField label="Product Name" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} /><TextField label="SKU" value={productForm.sku} onChange={(value) => setProductForm({ ...productForm, sku: value })} /><TextField label="Unit" value={productForm.unit} onChange={(value) => setProductForm({ ...productForm, unit: value })} /><TextField label="Unit Cost (USD)" type="number" value={productForm.cost} onChange={(value) => setProductForm({ ...productForm, cost: value })} /></Editor> : null}
    {laborForm ? <Editor title={laborForm.id ? "Edit Labor Role" : "Add Labor Role"} error={formError} onClose={() => setLaborForm(null)} onSave={saveLabor}><TextField label="Role Name" value={laborForm.name} onChange={(value) => setLaborForm({ ...laborForm, name: value })} /><TextField label="Loaded Hourly Rate (USD)" type="number" value={laborForm.rate} onChange={(value) => setLaborForm({ ...laborForm, rate: value })} /></Editor> : null}
    {employeeForm ? <Editor title="Employee Gmail Profile" error={formError} onClose={() => setEmployeeForm(null)} onSave={saveEmployee}><TextField label="Ops Brain Username" value={employeeForm.username} onChange={(username) => setEmployeeForm({ ...employeeForm, username })} /><TextField label="Display Name" value={employeeForm.displayName} onChange={(displayName) => setEmployeeForm({ ...employeeForm, displayName })} /><TextField label="Holloman Email" type="email" value={employeeForm.email} onChange={(email) => setEmployeeForm({ ...employeeForm, email })} /><Toggle label="Active Employee" checked={employeeForm.active} onChange={(active) => setEmployeeForm({ ...employeeForm, active })} /><Toggle label="Gmail Sending Enabled" checked={employeeForm.gmailEnabled} onChange={(gmailEnabled) => setEmployeeForm({ ...employeeForm, gmailEnabled })} /><p className="text-xs text-steel">This stores identity and enablement only. OAuth tokens and service-account keys are never stored in D1.</p></Editor> : null}
  </div>
}

function AdminSection({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children: ReactNode }) { return <section><div className="flex items-center justify-between mb-3"><h2 className="font-display text-xl font-bold text-brand-dark uppercase">{title}</h2><button onClick={onAction} className="bg-brand-red text-white rounded-xl px-4 py-2.5 text-sm font-bold"><Plus size={15} className="inline" /> {action}</button></div><div className="grid lg:grid-cols-2 gap-3">{children}</div></section> }
function Card({ title, meta, value, inactive, onEdit, onDeactivate, onDelete, children }: { title: string; meta: string; value: string; inactive?: boolean; onEdit: () => void; onDeactivate?: () => void; onDelete?: () => void; children?: ReactNode }) { return <article className={`bg-white rounded-2xl p-4 shadow-sm ${inactive ? "opacity-60" : ""}`}><div className="flex items-start justify-between gap-3"><div><div className="font-display text-lg font-bold text-brand-dark uppercase">{title}</div><div className="text-xs text-steel mt-1">{meta}</div></div><div className="font-mono text-lg font-bold text-brand-dark">{value}</div></div>{children}<div className="flex gap-3 mt-4"><button onClick={onEdit} className="text-xs text-brand-red font-bold"><Edit3 size={13} className="inline" /> Edit</button>{onDeactivate ? <button onClick={onDeactivate} className="text-xs text-danger font-bold"><Trash2 size={13} className="inline" /> Deactivate</button> : null}{onDelete ? <button onClick={onDelete} className="text-xs text-danger font-bold"><Trash2 size={13} className="inline" /> Delete</button> : null}</div></article> }
function Editor({ title, error, saving, onClose, onSave, children }: { title: string; error: string; saving?: boolean; onClose: () => void; onSave: () => Promise<void>; children: ReactNode }) { return <div className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center p-4" onClick={onClose}><div className="bg-white rounded-3xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}><div className="flex justify-between mb-4"><h2 className="font-display text-xl font-bold text-brand-dark uppercase">{title}</h2><button onClick={onClose}><X size={19} /></button></div><div className="space-y-3">{children}</div>{error ? <div className="mt-3 text-sm text-danger">{error}</div> : null}<button onClick={() => void onSave()} disabled={saving} className="mt-4 w-full bg-brand-red text-white rounded-xl py-3 font-display text-lg font-bold uppercase disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div></div> }
function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-xs font-semibold text-steel">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full border border-surface rounded-xl px-3 py-2.5 text-sm" /></label> }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-xs font-semibold text-steel">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-1 w-full border border-surface rounded-xl px-3 py-2 text-sm" /></label> }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) { return <label className="block text-xs font-semibold text-steel">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full border border-surface rounded-xl px-3 py-2.5 text-sm">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label> }
function CheckboxList({ title, rows, selected, onChange }: { title: string; rows: Array<[string, string]>; selected: string[]; onChange: (ids: string[]) => void }) { return <fieldset><legend className="text-xs font-semibold text-steel">{title}</legend><div className="mt-2 max-h-40 overflow-auto space-y-2 rounded-xl border border-surface p-3">{rows.length ? rows.map(([id, label]) => <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(id)} onChange={(event) => onChange(event.target.checked ? [...selected, id] : selected.filter((item) => item !== id))} />{label}</label>) : <p className="text-xs text-steel">Create the reference items first.</p>}</div></fieldset> }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center justify-between gap-3 text-sm text-steel border border-surface rounded-xl px-3 py-2.5">{label}<input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label> }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="grid grid-cols-[1fr_150px] gap-3 items-center text-sm text-steel">{label}<input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="border border-surface rounded-xl px-3 py-2 text-right text-brand-dark" /></label> }
function MoneyField({ label, cents, onChange }: { label: string; cents: number; onChange: (value: number) => void }) { return <label className="grid grid-cols-[1fr_150px] gap-3 items-center text-sm text-steel">{label}<CurrencyInput ariaLabel={label} cents={cents} onChange={onChange} className="border border-surface rounded-xl px-3 py-2 text-right text-brand-dark min-w-0" /></label> }
function EmptyAdmin({ title, detail }: { title: string; detail: string }) { return <div className="bg-white rounded-2xl p-6 text-center"><div className="font-semibold text-brand-dark">{title}</div><p className="text-sm text-steel mt-1">{detail}</p></div> }
function priceByLabel(value: PricebookService["priceBy"]) { return value === "per_lf" ? "Per LF" : value === "per_sf" ? "Per SF" : value === "per_acre" ? "Per Acre" : value === "per_bedroom" ? "Per Bedroom" : "Variable" }
