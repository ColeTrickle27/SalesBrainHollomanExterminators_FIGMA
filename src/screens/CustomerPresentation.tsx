import { useState } from 'react'
import { CheckCircle, ChevronRight, Shield, Camera, Droplets, X } from 'lucide-react'
import { sampleCustomer, sampleStructure, sampleFindings, sampleMoisture, sampleQuoteOptions, sampleProducts, sampleServices } from '../data/sample'
import logoImg from '../imports/Artboard_4.png'

interface Props {
  onClose: () => void
  onProposal: () => void
}

export default function CustomerPresentation({ onClose, onProposal }: Props) {
  const [activeSection, setActiveSection] = useState<'overview' | 'findings' | 'plan' | 'options'>('overview')
  const [selectedOption, setSelectedOption] = useState('opt-recommended')
  void selectedOption // used in options section

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'findings', label: 'Findings' },
    { id: 'plan', label: 'Treatment Plan' },
    { id: 'options', label: 'Our Recommendation' },
  ] as const


  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Customer presentation header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 p-1 flex-shrink-0 overflow-hidden shadow-sm">
            <img src={logoImg} alt="Holloman Exterminators" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-gray-900 uppercase tracking-wide leading-none">Holloman Exterminators</div>
            <div className="text-xs text-gray-400 mt-0.5">Property Protection Proposal</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Section nav */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex gap-1 overflow-x-auto">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`py-3 px-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeSection === s.id ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── OVERVIEW ── */}
        {activeSection === 'overview' && (
          <div className="px-5 pt-6 space-y-5">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Prepared for</div>
              <div className="font-display text-3xl font-bold text-gray-900 mt-1 leading-tight">{sampleCustomer.name}</div>
              <div className="text-gray-500 text-sm mt-0.5">{sampleCustomer.serviceAddress}</div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-400 font-mono">JQ-2026-0847</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">July 23, 2026</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">Expires Aug 7, 2026</span>
              </div>
            </div>

            {/* Executive summary */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <div className="font-display text-xl font-bold text-gray-900 uppercase tracking-wide mb-3">What We Found</div>
              <p className="text-sm text-gray-700 leading-relaxed">
                During our inspection on July 23, 2026, our team identified <strong>active subterranean termite activity</strong> in your crawlspace, along with <strong>elevated moisture conditions</strong> that are creating an environment favorable to continued pest activity and wood deterioration. The good news: both issues are fully addressable with the right treatment and moisture management plan.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mt-3">
                Below you will find a detailed summary of our findings, a recommended treatment plan, the products we will use, and three service options for your consideration — from targeted termite protection to a comprehensive, long-term solution.
              </p>
            </div>

            {/* Property summary */}
            <div>
              <div className="font-display text-xl font-bold text-gray-900 uppercase tracking-wide mb-3">Your Property</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Property Type', value: sampleStructure.structureType },
                  { label: 'Year Built', value: sampleStructure.yearBuilt.toString() },
                  { label: 'Total Area', value: `${sampleStructure.sqft.toLocaleString()} sq ft` },
                  { label: 'Foundation', value: sampleStructure.foundation },
                  { label: 'Crawlspace', value: `${sampleStructure.crawlspaceSqft.toLocaleString()} sq ft` },
                  { label: 'Construction', value: 'Brick Veneer / Wood Frame' },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="text-xs text-gray-400 font-semibold">{item.label}</div>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concern alerts */}
            <div>
              <div className="font-display text-xl font-bold text-gray-900 uppercase tracking-wide mb-3">Issues Identified</div>
              <div className="space-y-2">
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">Active Termite Activity</div>
                    <p className="text-xs text-gray-600 mt-0.5">Live subterranean termites found in crawlspace. Mud tubes and wood damage observed along the north foundation wall.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center flex-shrink-0">
                    <Droplets size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">Elevated Crawlspace Moisture</div>
                    <p className="text-xs text-gray-600 mt-0.5">Humidity readings between 68–84% RH. Damaged vapor barrier and partial drainage blockage are contributing factors.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveSection('findings')}
              className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 transition-all active:scale-98"
            >
              <span className="font-semibold text-gray-900">See detailed inspection findings</span>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* ── FINDINGS ── */}
        {activeSection === 'findings' && (
          <div className="px-5 pt-6 space-y-5">
            <div className="font-display text-2xl font-bold text-gray-900 uppercase tracking-wide">Inspection Findings</div>

            {sampleFindings.filter(f => f.includeInReport).map((finding) => (
              <div key={finding.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`px-4 py-3 ${finding.severity === 'Active' ? 'bg-brand-red' : 'bg-amber'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-display text-base font-bold text-white uppercase tracking-wide">{finding.category}</div>
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">{finding.severity}</span>
                  </div>
                  <div className="text-white/80 text-xs mt-0.5">{finding.area}</div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">What We Observed</div>
                    <p className="text-sm text-gray-700">{finding.evidence}</p>
                  </div>
                  {finding.damage && (
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Damage Assessment</div>
                      <p className="text-sm text-gray-700">{finding.damage}</p>
                    </div>
                  )}
                  {/* Photo placeholders */}
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Inspection Photos</div>
                    <div className="flex gap-2">
                      {finding.photos.map((_p, pi) => (
                        <div key={pi} className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 ${pi === 0 ? 'bg-gray-800' : pi === 1 ? 'bg-gray-600' : 'bg-gray-400'}`}>
                          <div className="text-center text-white">
                            <Camera size={16} className="mx-auto mb-0.5 opacity-60" />
                            <span className="text-xs opacity-60">Photo {pi + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Moisture summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-amber">
                <div className="font-display text-base font-bold text-white uppercase tracking-wide">Moisture Assessment</div>
                <div className="text-white/80 text-xs mt-0.5">Crawlspace — Full Assessment</div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-700">
                  We recorded relative humidity readings ranging from <strong>68% to 84% RH</strong> in your crawlspace. For reference, readings above 60% RH are considered elevated for crawlspaces, and prolonged exposure above 70% RH can accelerate wood deterioration and create conditions favorable to pest activity.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {sampleMoisture.readings.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{r.location}</div>
                        <div className="text-xs text-gray-500">{r.material}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-lg font-bold ${r.riskColor === 'red' ? 'text-brand-red' : r.riskColor === 'amber' ? 'text-amber' : 'text-success'}`}>
                          {r.value} {r.unit}
                        </div>
                        <div className={`text-xs font-semibold ${r.riskColor === 'red' ? 'text-brand-red' : r.riskColor === 'amber' ? 'text-amber' : 'text-success'}`}>
                          {r.category}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TREATMENT PLAN ── */}
        {activeSection === 'plan' && (
          <div className="px-5 pt-6 space-y-5">
            <div className="font-display text-2xl font-bold text-gray-900 uppercase tracking-wide">Our Treatment Plan</div>
            <p className="text-sm text-gray-600">Based on our findings, here is what we recommend and the products we will use.</p>

            {sampleServices.filter(s => s.selected).map(svc => {
              const products = sampleProducts.filter(p => svc.products.includes(p.id))
              return (
                <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-red rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-display font-bold text-base">{svc.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-display text-base font-bold text-gray-900 uppercase tracking-wide">{svc.name}</div>
                      <div className="text-xs text-gray-400">{svc.category}</div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Scope of Work</div>
                      <ul className="space-y-1">
                        {svc.areas.map((area, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle size={14} className="text-success flex-shrink-0 mt-0.5" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-gray-400 font-semibold">Warranty</div>
                        <div className="text-gray-900 font-bold mt-0.5">{svc.warranty}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-gray-400 font-semibold">Frequency</div>
                        <div className="text-gray-900 font-bold mt-0.5">{svc.frequency}</div>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <div className="text-xs text-amber font-bold uppercase tracking-wider mb-1">Your Preparation Checklist</div>
                      <p className="text-xs text-gray-700">{svc.prepRequired}</p>
                    </div>

                    {/* Products */}
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Products Used</div>
                      {products.map(prod => (
                        <div key={prod.id} className="flex items-start gap-3 mb-3 last:mb-0">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: prod.imageColor }}>
                            <div className="text-center px-1">
                              <div className="text-[10px] leading-tight font-bold">{prod.imageLabel}</div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 text-sm">{prod.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{prod.purpose}</div>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{prod.customerDescription}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── OPTIONS ── */}
        {activeSection === 'options' && (
          <div className="px-5 pt-6 space-y-4">
            <div>
              <div className="font-display text-2xl font-bold text-gray-900 uppercase tracking-wide">Choose Your Plan</div>
              <p className="text-sm text-gray-500 mt-1">We have three levels of protection to fit your needs and budget.</p>
            </div>

            {sampleQuoteOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`w-full bg-white rounded-2xl border-2 overflow-hidden text-left transition-all active:scale-98 ${
                  selectedOption === opt.id ? 'border-brand-red shadow-md' : 'border-gray-100 shadow-sm'
                }`}
              >
                {opt.isRecommended && (
                  <div className="bg-brand-red px-4 py-1.5 text-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">⭐ Our Recommendation</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-2xl font-bold text-gray-900 uppercase tracking-wide">{opt.label}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{opt.tagline}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      selectedOption === opt.id ? 'border-brand-red bg-brand-red' : 'border-gray-300'
                    }`}>
                      {selectedOption === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="flex items-end gap-3 mt-4 pb-3 border-b border-gray-100">
                    <div>
                      <div className="font-mono text-3xl font-bold text-gray-900">${opt.oneTimePrice.toLocaleString()}</div>
                      <div className="text-xs text-gray-400 mt-0.5">one-time treatment</div>
                    </div>
                    <div className="text-gray-400 mb-1">+</div>
                    <div>
                      <div className="font-mono text-lg font-semibold text-gray-600">${opt.recurringPrice}<span className="text-gray-400 text-sm font-normal">/yr</span></div>
                      <div className="text-xs text-gray-400">{opt.recurringFrequency}</div>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {opt.highlights.map((h, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${i === 0 && h.startsWith('Everything') ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                        <CheckCircle size={14} className={`flex-shrink-0 mt-0.5 ${h.startsWith('Everything') ? 'text-gray-300' : 'text-success'}`} />
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Shield size={13} />
                    <span>{opt.warranty}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 z-20">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="font-bold text-gray-900">
              {sampleQuoteOptions.find(o => o.id === selectedOption)?.label}
              {' '}— ${sampleQuoteOptions.find(o => o.id === selectedOption)?.oneTimePrice.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Tap "Continue" to review and sign</div>
          </div>
          <button
            onClick={onProposal}
            className="bg-brand-red text-white font-display text-lg font-bold uppercase tracking-wide px-6 py-3 rounded-xl flex items-center gap-2 active:scale-97 transition-all"
          >
            Continue <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
