import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronRight, Link2, MapPin, Plus, Search, User, X } from 'lucide-react'

import { createCustomerFilesService, OpsBrainAuthError } from '../services/opsBrain'
import type { CustomerSearchResult } from '../types/customer'

interface Props {
  onSelectCustomer: (customer: CustomerSearchResult) => void
  onClose: () => void
}

type NewCustomerForm = {
  billToName: string
  billToNumber: string
  locationName: string
  locationNumber: string
  locationAddress: string
}

const EMPTY_FORM: NewCustomerForm = {
  billToName: '',
  billToNumber: '',
  locationName: '',
  locationNumber: '',
  locationAddress: '',
}

export default function CustomerSearch({ onSelectCustomer, onClose }: Props) {
  const serviceRef = useRef(createCustomerFilesService())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CustomerSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authExpired, setAuthExpired] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [form, setForm] = useState<NewCustomerForm>(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const normalized = query.trim()
    if (normalized.length < 2) {
      setResults([])
      setError(null)
      setAuthExpired(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      setAuthExpired(false)
      try {
        const matches = await serviceRef.current.searchCustomers(normalized)
        if (!cancelled) setResults(matches)
      } catch (searchError) {
        if (cancelled) return
        setResults([])
        if (searchError instanceof OpsBrainAuthError) {
          setAuthExpired(true)
        } else {
          setError(searchError instanceof Error ? searchError.message : 'Could not search Customer Files.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query])

  const canCreate = useMemo(
    () => Object.values(form).every((value) => value.trim()),
    [form],
  )

  const updateForm = (field: keyof NewCustomerForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const createMappedCustomer = async () => {
    if (!canCreate || creating) return
    setCreating(true)
    setError(null)
    try {
      const billTo = await serviceRef.current.createBillTo({
        billToName: form.billToName.trim(),
        billToNumber: form.billToNumber.trim(),
        accountType: 'company',
      })
      const location = await serviceRef.current.createLocation({
        billToNumber: form.billToNumber.trim(),
        locationNumber: form.locationNumber.trim(),
        locationName: form.locationName.trim(),
        locationAddress: form.locationAddress.trim(),
      })
      onSelectCustomer({ billTo, location: { ...location, billToName: billTo.billToName } })
    } catch (createError) {
      if (createError instanceof OpsBrainAuthError) {
        setAuthExpired(true)
      } else {
        setError(createError instanceof Error ? createError.message : 'Could not create the Ops Brain customer folder.')
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-6">
      <div className="bg-brand-black px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all" aria-label="Close customer search">
          <X size={20} />
        </button>
        <div className="flex-1">
          <div className="font-display text-xl font-bold text-white uppercase tracking-wide leading-none">Find Customer</div>
          <div className="text-silver text-xs mt-0.5">Search authenticated Ops Brain Customer Files</div>
        </div>
        <button onClick={() => setShowNewForm((value) => !value)} className="flex items-center gap-1.5 bg-brand-red text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-97 transition-all">
          <Plus size={16} /> New
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3 max-w-3xl w-full mx-auto">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            className="w-full bg-white border border-surface rounded-2xl pl-10 pr-10 py-3.5 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red shadow-sm"
            placeholder="Search name, Bill-To, Location, or address…"
          />
          {query ? <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-silver" aria-label="Clear search"><X size={16} /></button> : null}
        </div>

        {authExpired ? (
          <div className="bg-danger-light border border-danger/25 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-danger mt-0.5" />
            <div className="text-sm text-danger">
              <div className="font-bold">Your Ops Brain session has expired.</div>
              <a href="/" className="underline font-semibold">Return to Ops Brain and sign in</a>
            </div>
          </div>
        ) : null}
        {error ? <div className="bg-danger-light border border-danger/25 rounded-2xl p-4 text-sm text-danger">{error}</div> : null}

        {showNewForm ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 border-2 border-brand-red">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-display text-lg font-bold text-brand-dark uppercase tracking-wide">Create Ops Brain Mapping</div>
                <p className="text-xs text-steel mt-1">Use the exact Bill-To and Location identifiers. This does not create or sync a PestPac record.</p>
              </div>
              <Link2 size={20} className="text-brand-red" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {([
                ['billToName', 'Bill-To Name'],
                ['billToNumber', 'Bill-To Number'],
                ['locationName', 'Location Name'],
                ['locationNumber', 'Location Number'],
              ] as const).map(([field, label]) => (
                <label key={field} className="text-xs text-steel font-semibold uppercase tracking-wider">
                  {label}
                  <input value={form[field]} onChange={(event) => updateForm(field, event.target.value)} className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red normal-case tracking-normal text-brand-dark" />
                </label>
              ))}
              <label className="sm:col-span-2 text-xs text-steel font-semibold uppercase tracking-wider">
                Service Address
                <input value={form.locationAddress} onChange={(event) => updateForm('locationAddress', event.target.value)} className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red normal-case tracking-normal text-brand-dark" />
              </label>
            </div>
            <button disabled={!canCreate || creating} onClick={() => void createMappedCustomer()} className="mt-4 w-full bg-brand-red text-white font-bold py-3 rounded-xl font-display text-lg uppercase tracking-wide disabled:opacity-40">
              {creating ? 'Creating…' : 'Select Customer & Start Quote'}
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-xs text-steel font-semibold uppercase tracking-wider">
            {loading ? 'Searching…' : query.trim().length < 2 ? 'Enter at least 2 characters' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {!loading && query.trim().length >= 2 && results.length === 0 && !error && !authExpired ? (
          <div className="bg-white rounded-2xl p-7 text-center shadow-sm">
            <User size={32} className="text-silver mx-auto mb-2" />
            <div className="font-semibold text-brand-dark">No matching Customer Files record</div>
            <p className="text-sm text-steel mt-1">Confirm the identifiers before creating a new mapping.</p>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {results.map((customer) => {
            const name = customer.billTo.billToName || customer.location.locationName
            return (
              <button key={`${customer.billTo.billToNumber}:${customer.location.locationNumber}`} onClick={() => onSelectCustomer(customer)} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left active:scale-98 transition-all hover:shadow-md border border-transparent hover:border-surface">
                <div className="w-11 h-11 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0 text-white font-display font-bold">
                  {name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brand-dark truncate">{name}</div>
                  <div className="flex items-center gap-1.5 mt-1"><MapPin size={12} className="text-silver" /><span className="text-xs text-steel truncate">{customer.location.locationAddress || customer.location.locationName}</span></div>
                  <div className="mt-2 flex gap-2 text-xs font-mono text-silver">
                    <span>Bill-To {customer.billTo.billToNumber}</span><span>•</span><span>Location {customer.location.locationNumber}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-silver flex-shrink-0 mt-2" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
