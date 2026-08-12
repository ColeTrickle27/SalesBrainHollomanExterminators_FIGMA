import { useState } from 'react'
import { Search, Plus, ChevronRight, MapPin, Phone, Clock, User, X, Star } from 'lucide-react'

interface Props {
  onSelectCustomer: (id: string, name: string) => void
  onNewCustomer: (name: string) => void
  onClose: () => void
}

const RECENT_CUSTOMERS = [
  { id: 'c1', name: 'Sarah & David Chen', address: '4821 Magnolia Trace, Warner Robins, GA', phone: '(478) 555-0182', lastService: 'Jul 23, 2026', status: 'active-quote', serviceType: 'Termite + Moisture', starred: true },
  { id: 'c2', name: 'Thomas Abernethy', address: '208 Ridgecrest Dr, Perry, GA 31069', phone: '(478) 555-0204', lastService: 'Jul 21, 2026', status: 'active', serviceType: 'General Pest', starred: false },
  { id: 'c3', name: 'Robert & Linda Tanner', address: '209 Briarwood Cir, Byron, GA 31008', phone: '(478) 555-0139', lastService: 'Annual due Aug 2026', status: 'renewal-due', serviceType: 'Termite Renewal', starred: false },
  { id: 'c4', name: 'Marcus & Tonya Reynolds', address: '5503 Peach Orchard Rd, Macon, GA', phone: '(478) 555-0276', lastService: 'Jul 22, 2026', status: 'draft', serviceType: 'Encapsulation Quote', starred: false },
  { id: 'c5', name: 'Greenway HOA', address: '1200 Greenway Blvd, Warner Robins, GA', phone: '(478) 555-0500', lastService: 'Jun 15, 2026', status: 'active', serviceType: 'Commercial Pest', starred: true },
  { id: 'c6', name: 'Patricia Hollis', address: '88 Lakewood Dr, Centerville, GA 31028', phone: '(478) 555-0348', lastService: 'Jul 18, 2026', status: 'expired', serviceType: 'General Pest Quote', starred: false },
  { id: 'c7', name: 'Amanda Porter', address: '1144 Forsyth Rd, Macon, GA 31210', phone: '(478) 555-0462', lastService: 'Jul 21, 2026', status: 'draft', serviceType: 'Crawlspace Assessment', starred: false },
  { id: 'c8', name: 'Westgate Business Park', address: '1100 Russell Pkwy, Warner Robins, GA', phone: '(478) 555-0600', lastService: 'Jul 23, 2026', status: 'active', serviceType: 'Quarterly General Pest', starred: false },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  'active': { label: 'Active Customer', color: 'text-success', dotColor: 'bg-success' },
  'active-quote': { label: 'Open Quote', color: 'text-brand-red', dotColor: 'bg-brand-red' },
  'draft': { label: 'Draft in Progress', color: 'text-amber', dotColor: 'bg-amber' },
  'renewal-due': { label: 'Renewal Due', color: 'text-info', dotColor: 'bg-info' },
  'expired': { label: 'Quote Expired', color: 'text-silver', dotColor: 'bg-silver' },
}

export default function CustomerSearch({ onSelectCustomer, onNewCustomer, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')

  const filtered = RECENT_CUSTOMERS.filter(c => {
    const matchesQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.address.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)
    const matchesFilter = !filterStatus || c.status === filterStatus
    return matchesQuery && matchesFilter
  })

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-6">
      {/* Header */}
      <div className="bg-brand-black px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all">
          <X size={20} />
        </button>
        <div className="flex-1">
          <div className="font-display text-xl font-bold text-white uppercase tracking-wide leading-none">Find Customer</div>
          <div className="text-silver text-xs mt-0.5">{RECENT_CUSTOMERS.length} customers in your territory</div>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 bg-brand-red text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-97 transition-all"
        >
          <Plus size={16} /> New
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-white border border-surface rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red shadow-sm"
            placeholder="Search by name, address, or phone…"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-silver hover:text-steel transition-all">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterStatus(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${!filterStatus ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-surface text-steel'}`}
          >
            All ({RECENT_CUSTOMERS.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => {
            const count = RECENT_CUSTOMERS.filter(c => c.status === key).length
            if (count === 0) return null
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? null : key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${filterStatus === key ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-surface text-steel'}`}
              >
                {val.label} ({count})
              </button>
            )
          })}
        </div>

        {/* New customer inline form */}
        {showNewForm && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border-2 border-brand-red">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-lg font-bold text-brand-dark uppercase tracking-wide">New Customer</div>
              <button onClick={() => setShowNewForm(false)} className="text-silver hover:text-steel transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-steel font-semibold uppercase tracking-wider">Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red"
                  placeholder="e.g. John & Mary Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-steel font-semibold uppercase tracking-wider">Phone</label>
                  <input
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    type="tel"
                    className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red"
                    placeholder="(478) 555-0000"
                  />
                </div>
                <div>
                  <label className="text-xs text-steel font-semibold uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-steel font-semibold uppercase tracking-wider">Service Address</label>
                <input
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red"
                  placeholder="123 Main St, City, GA 31000"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-steel font-semibold uppercase tracking-wider">Referral Source</label>
                  <select className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red bg-white">
                    <option>Select…</option>
                    <option>Customer Referral</option>
                    <option>Web Lead</option>
                    <option>Call-In</option>
                    <option>Self-Solicit</option>
                    <option>Existing Customer Add Service</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-steel font-semibold uppercase tracking-wider">Preferred Contact</label>
                  <select className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red bg-white">
                    <option>Text</option>
                    <option>Call</option>
                    <option>Email</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-steel font-semibold uppercase tracking-wider">Ops Brain Bill-To Number</label>
                  <input
                    className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red font-mono"
                    placeholder="e.g. 100042"
                  />
                </div>
                <div>
                  <label className="text-xs text-steel font-semibold uppercase tracking-wider">Ops Brain Location Number</label>
                  <input
                    className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-red font-mono"
                    placeholder="e.g. 200017"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowNewForm(false); onNewCustomer(newName) }}
                className="flex-1 bg-brand-red text-white font-bold py-3 rounded-xl font-display text-lg uppercase tracking-wide active:scale-97 transition-all"
              >
                Create & Start Inspection
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-steel font-semibold uppercase tracking-wider">
              {query ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'Recent / All Customers'}
            </span>
            {query && filtered.length === 0 && (
              <button onClick={() => setShowNewForm(true)} className="text-xs text-brand-red font-semibold">Create New →</button>
            )}
          </div>

          {filtered.length === 0 && query && (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <User size={32} className="text-silver mx-auto mb-2" />
              <div className="font-semibold text-brand-dark">No customers found</div>
              <p className="text-sm text-steel mt-1">No match for "{query}"</p>
              <button
                onClick={() => { setNewName(query); setShowNewForm(true) }}
                className="mt-3 bg-brand-red text-white text-sm font-bold px-5 py-2.5 rounded-xl active:scale-97 transition-all"
              >
                Create New Customer
              </button>
            </div>
          )}

          <div className="space-y-2.5">
            {filtered.map(customer => {
              const st = STATUS_CONFIG[customer.status]
              return (
                <button
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer.id, customer.name)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left active:scale-98 transition-all hover:shadow-md border border-transparent hover:border-surface"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-display font-bold text-base">
                      {customer.name.split(' ').map(w => w[0]).filter((_, i) => i < 2).join('')}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-brand-dark truncate">{customer.name}</span>
                        {customer.starred && <Star size={13} className="text-amber fill-amber flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${st.dotColor}`} />
                        <span className={`text-xs font-semibold ${st.color}`}>{st.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={11} className="text-silver flex-shrink-0" />
                      <span className="text-xs text-steel truncate">{customer.address}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-steel">
                          <Phone size={11} />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-silver">
                        <Clock size={11} />
                        <span>{customer.lastService}</span>
                      </div>
                    </div>

                    <div className="mt-1.5">
                      <span className="inline-block bg-surface text-steel text-xs px-2 py-0.5 rounded-full">{customer.serviceType}</span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-silver flex-shrink-0 mt-3" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
