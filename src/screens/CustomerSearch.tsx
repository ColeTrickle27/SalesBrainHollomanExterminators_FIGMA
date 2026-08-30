import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronRight, MapPin, Search, User, X } from 'lucide-react'

import { createCustomerIdentityService, OpsBrainAuthError } from '../services/opsBrain'
import type { CustomerIdentitySearchResult } from '../types/customer'

interface Props {
  onSelectCustomer: (customer: CustomerIdentitySearchResult) => void
  onClose: () => void
}

export default function CustomerSearch({ onSelectCustomer, onClose }: Props) {
  const serviceRef = useRef(createCustomerIdentityService())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CustomerIdentitySearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authExpired, setAuthExpired] = useState(false)

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
        const matches = await serviceRef.current.searchCustomerIdentities(normalized)
        if (!cancelled) setResults(matches)
      } catch (searchError) {
        if (cancelled) return
        setResults([])
        if (searchError instanceof OpsBrainAuthError) {
          setAuthExpired(true)
        } else {
          setError(searchError instanceof Error ? searchError.message : 'Could not search canonical customer identities.')
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

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-6">
      <div className="bg-brand-black px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all" aria-label="Close customer search">
          <X size={20} />
        </button>
        <div className="flex-1">
          <div className="font-display text-xl font-bold text-white uppercase tracking-wide leading-none">Find Customer</div>
          <div className="text-silver text-xs mt-0.5">Search canonical OpsBrain customer identities</div>
        </div>
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

        <div className="flex items-center justify-between">
          <span className="text-xs text-steel font-semibold uppercase tracking-wider">
            {loading ? 'Searching…' : query.trim().length < 2 ? 'Enter at least 2 characters' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {!loading && query.trim().length >= 2 && results.length === 0 && !error && !authExpired ? (
          <div className="bg-white rounded-2xl p-7 text-center shadow-sm">
            <User size={32} className="text-silver mx-auto mb-2" />
            <div className="font-semibold text-brand-dark">No matching customer or location</div>
            <p className="text-sm text-steel mt-1">New customers should begin through the New Lead workflow.</p>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {results.map((customer) => {
            const name = customer.customerName || customer.locationName
            return (
              <button key={customer.customerLocationId} onClick={() => onSelectCustomer(customer)} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left active:scale-98 transition-all hover:shadow-md border border-transparent hover:border-surface">
                <div className="w-11 h-11 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0 text-white font-display font-bold">
                  {name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brand-dark truncate">{name}</div>
                  <div className="text-xs text-steel truncate mt-0.5">{customer.locationName}</div>
                  <div className="flex items-center gap-1.5 mt-1"><MapPin size={12} className="text-silver" /><span className="text-xs text-steel truncate">{customer.serviceAddress || customer.locationName}</span></div>
                  <div className="mt-2 flex gap-2 text-xs font-mono text-silver">
                    <span>Bill-To {customer.pestpacBillToNumber ?? 'Not assigned'}</span><span>•</span><span>Location {customer.pestpacLocationNumber ?? 'Not assigned'}</span>
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
