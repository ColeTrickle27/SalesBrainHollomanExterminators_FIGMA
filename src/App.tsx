import { useState } from 'react'
import { Home, FileText, Settings, Wifi, WifiOff, ChevronLeft, History, Plus, Edit3, MapPin, ChevronRight } from 'lucide-react'

import Dashboard from './screens/Dashboard'
import InspectionWizard from './screens/InspectionWizard'
import CustomerPresentation from './screens/CustomerPresentation'
import ProposalPreview from './screens/ProposalPreview'
import ManagerApproval from './screens/ManagerApproval'
import PhotoAnnotation from './screens/PhotoAnnotation'
import CustomerSearch from './screens/CustomerSearch'
import QuoteHistory from './screens/QuoteHistory'
import ServiceBundles from './screens/ServiceBundles'
import AdminDetail from './screens/AdminDetail'
import logoImg from './imports/Screenprint_HEcenter.png'

type Screen =
  | 'dashboard'
  | 'customer-search'
  | 'wizard'
  | 'photo-annotation'
  | 'presentation'
  | 'proposal'
  | 'manager-approval'
  | 'quote-history'
  | 'service-bundles'
  | 'admin-detail'

const NAV_ITEMS = [
  { id: 'dashboard', icon: Home, label: 'Home' },
  { id: 'wizard', icon: FileText, label: 'Active Quote' },
  { id: 'quote-history', icon: History, label: 'Quotes' },
  { id: 'admin-detail', icon: Settings, label: 'Admin' },
] as const

const SCREEN_TITLES: Record<Screen, string> = {
  dashboard: 'Sales Brain',
  'customer-search': 'Find Customer',
  wizard: 'Inspection',
  'photo-annotation': 'Photo Annotation',
  presentation: 'Customer View',
  proposal: 'Proposal',
  'manager-approval': 'Approvals',
  'quote-history': 'Quote History',
  'service-bundles': 'Service Bundles',
  'admin-detail': 'Administration',
}

// Screens where no shared chrome is shown (full-page takeover)


const DRAFT_QUOTES = [
  { id: 'JQ-2026-0847', customer: 'Raymond Castillo', address: '312 Peachtree Blvd, Warner Robins', step: 'Step 3: Moisture Assessment', modified: 'Today, 9:41 AM' },
  { id: 'JQ-2026-0841', customer: 'Greenway HOA – Bldg 4', address: '800 Greenway Dr, Warner Robins', step: 'Step 2: Inspection Findings', modified: 'Yesterday, 4:12 PM' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [isOffline, setIsOffline] = useState(false)
  const [wizardStep] = useState(1)
  const [hasActiveQuote, setHasActiveQuote] = useState(false)
  const [activeCustomerName, setActiveCustomerName] = useState('')

  const go = (s: Screen) => setScreen(s)
  const openQuote = (customerName = '') => { setActiveCustomerName(customerName); setHasActiveQuote(true); go('wizard') }

  // ── Full-screen mode (no shared header / nav) ──
  if (screen === 'photo-annotation') {
    return (
      <PhotoAnnotation
        onClose={() => go('wizard')}
        onSave={() => go('wizard')}
      />
    )
  }

  if (screen === 'customer-search') {
    return (
      <CustomerSearch
        onSelectCustomer={(_, name) => openQuote(name)}
        onNewCustomer={(name) => openQuote(name)}
        onClose={() => go('dashboard')}
      />
    )
  }

  if (screen === 'service-bundles') {
    return (
      <ServiceBundles
        onClose={() => go('wizard')}
        onSelectBundle={() => go('wizard')}
      />
    )
  }

  if (screen === 'presentation') {
    return (
      <CustomerPresentation
        onClose={() => go('wizard')}
        onProposal={() => go('proposal')}
      />
    )
  }

  if (screen === 'proposal') {
    return <ProposalPreview onClose={() => go('dashboard')} />
  }

  // ── Main app shell (header + bottom nav) ──
  const showBack = !['dashboard', 'wizard', 'quote-history', 'manager-approval', 'admin-detail'].includes(screen)

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Offline banner */}
      {isOffline && (
        <div className="bg-amber flex items-center gap-2 px-4 py-2 z-40">
          <WifiOff size={15} className="text-white" />
          <span className="text-white text-xs font-bold">Offline Mode — Changes saved locally. Will sync when connected.</span>
          <button onClick={() => setIsOffline(false)} className="ml-auto text-white/70 hover:text-white transition-all text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Top header */}
      <header className="bg-brand-black px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => go('dashboard')}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white overflow-hidden flex items-center justify-center p-0.5 flex-shrink-0">
              <img src={logoImg} alt="Holloman" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-white uppercase tracking-wider leading-none">
                {screen === 'dashboard' ? 'Sales Brain' : SCREEN_TITLES[screen]}
              </div>
              {screen === 'dashboard' && (
                <div className="text-silver text-[10px] font-mono tracking-wider">Holloman Exterminators</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Job ID badge for active wizard */}
          {screen === 'wizard' && (
            <div className="text-xs font-mono text-silver bg-white/8 px-2.5 py-1.5 rounded-xl">
              JQ-2026-0847
            </div>
          )}

          {/* Sync / Offline toggle (for prototype demo) */}
          <button
            onClick={() => setIsOffline(v => !v)}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all ${
              isOffline
                ? 'text-amber bg-amber/15'
                : 'text-success bg-success/15'
            }`}
            title="Toggle offline demo"
          >
            {isOffline ? <WifiOff size={12} /> : <Wifi size={12} />}
            <span className="hide-mobile">{isOffline ? 'Offline' : 'Synced'}</span>
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            CM
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {screen === 'dashboard' && (
          <Dashboard
            onStartInspection={() => go('customer-search')}
            onOpenLead={(name) => openQuote(name)}
            onOpenDraft={openQuote}
          />
        )}
        {screen === 'wizard' && !hasActiveQuote && (
          <ActiveQuoteLanding onNewQuote={() => { go('customer-search') }} onOpenDraft={openQuote} />
        )}
        {screen === 'wizard' && hasActiveQuote && (
          <InspectionWizard
            onPresentation={() => go('presentation')}
            onProposal={() => go('proposal')}
            onPhotoAnnotation={() => go('photo-annotation')}
            onServiceBundles={() => go('service-bundles')}
            initialStep={wizardStep}
            customerName={activeCustomerName}
          />
        )}
        {screen === 'manager-approval' && <ManagerApproval />}
        {screen === 'quote-history' && <QuoteHistory />}
        {screen === 'admin-detail' && <AdminDetail onClose={() => go('dashboard')} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface z-20">
        <div className="flex items-center justify-around px-1 py-2">
          {NAV_ITEMS.map(item => {
            const active = screen === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => go(item.id as Screen)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active ? 'text-brand-red' : 'text-silver hover:text-steel'
                }`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-brand-red' : 'text-silver'}`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function ActiveQuoteLanding({ onNewQuote, onOpenDraft }: { onNewQuote: () => void; onOpenDraft: () => void }) {
  return (
    <div className="pb-24 px-4 pt-5 space-y-5">
      {/* CTA */}
      <button
        onClick={onNewQuote}
        className="w-full bg-brand-red rounded-2xl p-5 flex items-center gap-4 active:scale-97 transition-all shadow-sm"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Plus size={26} className="text-white" />
        </div>
        <div className="text-left">
          <div className="font-display text-xl font-bold text-white leading-tight uppercase">Create New Quote</div>
          <div className="text-white/70 text-sm mt-0.5">Search or add a customer to begin</div>
        </div>
      </button>

      {/* Drafts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">Open Drafts</h2>
          <span className="text-xs text-steel font-mono">{DRAFT_QUOTES.length} in progress</span>
        </div>
        <div className="space-y-2.5">
          {DRAFT_QUOTES.map(draft => (
            <button
              key={draft.id}
              onClick={onOpenDraft}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 text-left active:scale-98 transition-all"
            >
              <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center flex-shrink-0">
                <Edit3 size={18} className="text-steel" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-brand-dark truncate">{draft.customer}</span>
                  <span className="font-mono text-xs text-silver flex-shrink-0">{draft.id}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} className="text-silver flex-shrink-0" />
                  <span className="text-xs text-steel truncate">{draft.address}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber" />
                    <span className="text-xs text-amber font-semibold">{draft.step}</span>
                  </div>
                  <span className="text-xs text-silver">{draft.modified}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-silver flex-shrink-0 mt-2" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
