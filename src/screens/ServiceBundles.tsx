import { useState } from 'react'
import { CheckCircle, ChevronRight, Info, Shield, Tag, Zap, X } from 'lucide-react'

interface Bundle {
  id: string
  name: string
  tagline: string
  color: string
  services: string[]
  savings: number
  monthlyPrice: number
  annualPrice: number
  contractTerm: string
  warranty: string
  popular: boolean
  description: string
  highlights: string[]
}

const BUNDLES: Bundle[] = [
  {
    id: 'b1',
    name: 'Pest Essentials',
    tagline: 'Year-round general pest protection',
    color: '#3A3A3A',
    services: ['Initial General Pest Treatment', 'Quarterly Recurring Service', 'Free Callbacks Between Services'],
    savings: 60,
    monthlyPrice: 0,
    annualPrice: 380,
    contractTerm: 'Annual agreement (month-to-month after first year)',
    warranty: 'Free callback guarantee between scheduled visits',
    popular: false,
    description: 'Our most popular entry-level plan. Covers general household pests including ants, roaches, spiders, and silverfish with quarterly service visits.',
    highlights: ['Covers 25+ common household pests', 'Quarterly interior + exterior service', 'Free callbacks if issues arise between visits', 'Digital service reports after each visit'],
  },
  {
    id: 'b2',
    name: 'Home Shield Plus',
    tagline: 'Termite + general pest + moisture protection',
    color: '#CC1A1A',
    services: ['Initial General Pest Treatment', 'Quarterly Recurring Service', 'Annual Termite Renewal Inspection', 'Termite Warranty Included', 'Crawlspace Moisture Assessment', '6-Month Moisture Follow-Up'],
    savings: 225,
    monthlyPrice: 0,
    annualPrice: 770,
    contractTerm: 'Annual agreement',
    warranty: '1-Year Termite Warranty + Pest Callback Guarantee',
    popular: true,
    description: 'Our most comprehensive value bundle — combining year-round pest protection with termite warranty coverage and annual crawlspace monitoring. Ideal for homes with crawlspace foundations.',
    highlights: ['Everything in Pest Essentials, plus:', 'Annual termite inspection + warranty', 'Termite callback coverage', 'Annual crawlspace moisture assessment', 'Priority scheduling'],
  },
  {
    id: 'b3',
    name: 'Total Home Defense',
    tagline: 'Full encapsulation + termite + year-round pest',
    color: '#1F1F21',
    services: ['Initial General Pest Treatment', 'Quarterly Recurring Service', 'Termite Liquid Barrier Treatment (full perimeter)', 'Annual Termite Renewal Inspection', 'Full Crawlspace Encapsulation System', 'SaniDry XP Dehumidifier Installation', 'Annual Dehumidifier Service'],
    savings: 680,
    monthlyPrice: 0,
    annualPrice: 1150,
    contractTerm: '3-Year protection agreement',
    warranty: '1-Year Termite + 5-Year Encapsulation + 5-Year Dehumidifier + Pest Callback',
    popular: false,
    description: 'The ultimate whole-home protection package for long-term homeowners. Includes full crawlspace encapsulation, termite barrier treatment, and comprehensive pest coverage in one bundled price.',
    highlights: ['Everything in Home Shield Plus, plus:', 'Full-perimeter termite barrier treatment', 'CleanSpace encapsulation system', 'SaniDry XP dehumidifier', 'Annual dehumidifier service', '5-year structural protection warranty'],
  },
  {
    id: 'b4',
    name: 'Mosquito + Pest Combo',
    tagline: 'Outdoor mosquito control + general pest',
    color: '#1a4a2a',
    services: ['Monthly Mosquito Barrier Treatments (Apr–Oct)', 'Quarterly General Pest Service', 'Free Mosquito Callbacks During Season'],
    savings: 95,
    monthlyPrice: 0,
    annualPrice: 590,
    contractTerm: 'Annual agreement',
    warranty: 'Free mosquito re-treatment guarantee',
    popular: false,
    description: 'Perfect for families who spend time outdoors. Combines seasonal mosquito control with year-round indoor pest protection.',
    highlights: ['7 monthly mosquito barrier treatments (Apr–Oct)', 'Quarterly interior + exterior pest service', 'Free re-treatment if mosquitoes return within 21 days', 'Covers ants, roaches, spiders + more'],
  },
]

interface Props {
  onClose: () => void
  onSelectBundle: (id: string) => void
}

export default function ServiceBundles({ onClose, onSelectBundle }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>('b2')
  const [expandedId, setExpandedId] = useState<string | null>('b2')

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-6">
      {/* Header */}
      <div className="bg-brand-black px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all">
          <X size={20} />
        </button>
        <div className="flex-1">
          <div className="font-display text-xl font-bold text-white uppercase tracking-wide leading-none">Service Bundles</div>
          <div className="text-silver text-xs mt-0.5">Pre-configured plans with bundled savings</div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-info-light border border-info/20 rounded-xl p-3 flex items-start gap-2">
          <Info size={15} className="text-info flex-shrink-0 mt-0.5" />
          <p className="text-xs text-info">
            <strong>SAMPLE DATA — Prototype Only.</strong> Bundle pricing and inclusions are representative. Actual bundle terms are set by the administrator from approved pricing schedules.
          </p>
        </div>

        {BUNDLES.map(bundle => {
          const isExpanded = expandedId === bundle.id
          const isSelected = selectedId === bundle.id

          return (
            <div
              key={bundle.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all ${isSelected ? 'border-brand-red' : 'border-transparent'}`}
            >
              {/* Bundle header */}
              <div
                className="px-4 py-3 flex items-start justify-between cursor-pointer"
                style={{ backgroundColor: bundle.color }}
                onClick={() => setExpandedId(isExpanded ? null : bundle.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-xl font-bold text-white uppercase tracking-wide leading-tight">{bundle.name}</span>
                    {bundle.popular && (
                      <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Zap size={10} /> Popular
                      </span>
                    )}
                  </div>
                  <div className="text-white/70 text-xs mt-0.5">{bundle.tagline}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-2xl font-bold text-white">${bundle.annualPrice.toLocaleString()}</span>
                    <span className="text-white/60 text-xs">/year</span>
                    {bundle.savings > 0 && (
                      <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag size={10} /> Save ${bundle.savings}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-1 transition-all ${isSelected ? 'border-white bg-white' : 'border-white/40'}`}>
                  {isSelected && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bundle.color }} />}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  <p className="text-sm text-brand-dark leading-relaxed">{bundle.description}</p>

                  <div>
                    <div className="text-xs text-steel uppercase tracking-wider font-bold mb-2">What's Included</div>
                    <ul className="space-y-1.5">
                      {bundle.highlights.map((h, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm ${h.startsWith('Everything') ? 'text-steel italic' : 'text-brand-dark'}`}>
                          <CheckCircle size={14} className={`flex-shrink-0 mt-0.5 ${h.startsWith('Everything') ? 'text-silver' : 'text-success'}`} />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-surface rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <span className="text-steel w-24 flex-shrink-0">Contract Term</span>
                      <span className="text-brand-dark font-semibold">{bundle.contractTerm}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-steel w-24 flex-shrink-0">Warranty</span>
                      <span className="text-brand-dark font-semibold">{bundle.warranty}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-steel w-24 flex-shrink-0">Bundle Savings</span>
                      <span className="text-success font-bold">${bundle.savings} vs. individual services</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedId(bundle.id)}
                      className={`flex-1 font-display font-bold text-lg uppercase tracking-wide py-3 rounded-xl transition-all active:scale-97 ${isSelected ? 'bg-success text-white' : 'bg-brand-red text-white hover:bg-brand-red-dark'}`}
                    >
                      {isSelected ? '✓ Selected' : 'Select This Bundle'}
                    </button>
                  </div>
                </div>
              )}

              {!isExpanded && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-surface">
                  <div className="flex items-center gap-1.5 text-xs text-steel">
                    <Shield size={13} className="text-brand-red" />
                    <span>{bundle.warranty.split('+')[0].trim()}</span>
                  </div>
                  <button
                    onClick={() => setExpandedId(bundle.id)}
                    className="flex items-center gap-1 text-xs text-brand-red font-bold"
                  >
                    Details <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {selectedId && (
          <button
            onClick={() => onSelectBundle(selectedId)}
            className="w-full bg-brand-red text-white font-display text-xl font-bold uppercase tracking-wider py-4 rounded-2xl active:scale-97 transition-all shadow-lg"
          >
            Apply {BUNDLES.find(b => b.id === selectedId)?.name} Bundle →
          </button>
        )}
      </div>
    </div>
  )
}
