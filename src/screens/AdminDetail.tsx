import { useMemo, useState } from 'react'
import { AlertTriangle, Edit3, FileText, Package, Plus, RefreshCw, Search, Settings, Trash2, X } from 'lucide-react'

import type { PricebookService, PricebookServiceInput } from '../types/pricebook'

interface Props {
  services: PricebookService[]
  loading: boolean
  error: string | null
  saving: boolean
  onRefresh: () => void
  onCreate: (input: PricebookServiceInput) => Promise<void>
  onUpdate: (id: string, input: PricebookServiceInput) => Promise<void>
  onDeactivate: (id: string) => Promise<void>
}

type FormState = { id?: string; name: string; category: string; description: string; price: string }
const EMPTY_FORM: FormState = { name: '', category: '', description: '', price: '' }

export default function AdminDetail({ services, loading, error, saving, onRefresh, onCreate, onUpdate, onDeactivate }: Props) {
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return services.filter((service) => (showInactive || service.active) && (!normalized || `${service.name} ${service.category} ${service.description}`.toLowerCase().includes(normalized)))
  }, [query, services, showInactive])

  const submit = async () => {
    if (!form) return
    const price = Math.round(Number(form.price) * 100)
    if (!form.name.trim() || !form.category.trim() || !Number.isSafeInteger(price) || price < 0) {
      setFormError('Enter a service name, category, and valid selling price.')
      return
    }
    const input = { name: form.name.trim(), category: form.category.trim(), description: form.description.trim(), price }
    try {
      if (form.id) await onUpdate(form.id, input)
      else await onCreate(input)
      setForm(null)
      setFormError(null)
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Could not save the Pricebook service.')
    }
  }

  return (
    <div className="pb-24 px-4 pt-5 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div><div className="flex items-center gap-2"><Settings size={22} className="text-brand-red" /><h1 className="font-display text-2xl font-bold text-brand-dark uppercase tracking-wide">Administration</h1></div><p className="text-sm text-steel mt-1">Live Sales Brain Pricebook. No inventory tracking or approval gates.</p></div>
        <button onClick={onRefresh} className="text-sm text-brand-red font-semibold flex items-center gap-1"><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-brand-red"><Package size={20} className="text-brand-red" /><div className="font-display text-lg font-bold text-brand-dark uppercase mt-2">Pricebook Services</div><div className="text-xs text-success mt-1">Live Ops Brain storage</div></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm"><Package size={20} className="text-steel" /><div className="font-display text-lg font-bold text-brand-dark uppercase mt-2">Product Catalog</div><div className="text-xs text-steel mt-1">Future domain • not live</div></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm"><FileText size={20} className="text-steel" /><div className="font-display text-lg font-bold text-brand-dark uppercase mt-2">Proposal Templates</div><div className="text-xs text-steel mt-1">Future domain • not live</div></div>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3"><h2 className="font-display text-xl font-bold text-brand-dark uppercase">Pricebook</h2><button onClick={() => setForm(EMPTY_FORM)} className="bg-brand-red text-white rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-1"><Plus size={15} /> Add Service</button></div>
        <div className="grid md:grid-cols-[1fr_auto] gap-2 mb-3"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-white border border-surface rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" placeholder="Search Pricebook…" /></div><label className="bg-white border border-surface rounded-xl px-3 py-2.5 text-xs text-steel font-semibold flex items-center gap-2"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} /> Show inactive</label></div>
        {error ? <div className="bg-danger-light border border-danger/25 rounded-xl p-3 text-sm text-danger flex items-center gap-2"><AlertTriangle size={16} />{error}</div> : null}
        {loading ? <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">Loading Pricebook…</div> : null}
        {!loading && filtered.length === 0 ? <div className="bg-white rounded-2xl p-7 text-center"><div className="font-semibold text-brand-dark">No matching Pricebook services</div></div> : null}
        <div className="grid lg:grid-cols-2 gap-3">{filtered.map((service) => <article key={service.id} className={`bg-white rounded-2xl p-4 shadow-sm ${service.active ? '' : 'opacity-60'}`}><div className="flex items-start justify-between gap-3"><div><div className="font-display text-lg font-bold text-brand-dark uppercase">{service.name}</div><div className="text-xs text-steel mt-1">{service.category} • {service.active ? 'Active' : 'Inactive'}</div></div><div className="font-mono text-xl font-bold text-brand-dark">${(service.price / 100).toLocaleString()}</div></div><p className="text-sm text-steel mt-3">{service.description || 'No description'}</p><div className="flex gap-2 mt-4"><button onClick={() => setForm({ id: service.id, name: service.name, category: service.category, description: service.description, price: (service.price / 100).toFixed(2) })} className="text-xs text-brand-red font-bold flex items-center gap-1"><Edit3 size={13} /> Edit</button>{service.active ? <button onClick={() => { if (window.confirm(`Deactivate ${service.name}? Existing saved quotes keep their pricing snapshots.`)) void onDeactivate(service.id) }} className="text-xs text-danger font-bold flex items-center gap-1"><Trash2 size={13} /> Deactivate</button> : null}</div></article>)}</div>
      </section>

      {form ? <div className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center p-4" onClick={() => setForm(null)}><div className="bg-white rounded-3xl p-5 w-full max-w-lg" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between mb-4"><div className="font-display text-xl font-bold text-brand-dark uppercase">{form.id ? 'Edit Service' : 'Add Service'}</div><button onClick={() => setForm(null)} className="text-silver"><X size={19} /></button></div><div className="space-y-3">{(['name', 'category', 'price'] as const).map((field) => <label key={field} className="block text-xs text-steel font-semibold uppercase tracking-wide">{field === 'price' ? 'Selling Price (USD)' : field}<input type={field === 'price' ? 'number' : 'text'} step={field === 'price' ? '0.01' : undefined} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="w-full mt-1 border border-surface rounded-xl px-3 py-2.5 text-sm normal-case tracking-normal text-brand-dark" /></label>)}<label className="block text-xs text-steel font-semibold uppercase tracking-wide">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="w-full mt-1 border border-surface rounded-xl px-3 py-2.5 text-sm normal-case tracking-normal text-brand-dark resize-none" /></label></div>{formError ? <div className="mt-3 text-sm text-danger">{formError}</div> : null}<button onClick={() => void submit()} disabled={saving} className="mt-4 w-full bg-brand-red text-white font-display text-lg font-bold uppercase py-3 rounded-xl disabled:opacity-50">{saving ? 'Saving…' : 'Save Service'}</button></div></div> : null}
    </div>
  )
}
