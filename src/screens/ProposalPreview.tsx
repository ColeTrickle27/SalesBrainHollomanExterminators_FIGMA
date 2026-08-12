import { useState } from 'react'
import { Download, Send, CheckCircle, Shield, Phone, Mail, Printer, X } from 'lucide-react'
import { sampleCustomer, sampleFindings, sampleMoisture, sampleQuoteOptions, sampleTech } from '../data/sample'
import logoImg from '../imports/Screenprint_HEcenter.png'

interface Props {
  onClose: () => void
}

export default function ProposalPreview({ onClose }: Props) {
  const [sent, setSent] = useState(false)
  const opt = sampleQuoteOptions.find(o => o.id === 'opt-recommended')!

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="bg-brand-charcoal px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white/70 hover:text-white transition-all">
            <X size={20} />
          </button>
          <div>
            <div className="font-display text-base font-bold text-white uppercase tracking-wide">Proposal Preview</div>
            <div className="text-silver text-xs font-mono">JQ-2026-0847 · Signed Copy</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
            <Printer size={15} />
            <span className="hide-mobile">Print</span>
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
            <Download size={15} />
            <span className="hide-mobile">PDF</span>
          </button>
          <button
            onClick={() => setSent(true)}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${sent ? 'bg-success text-white' : 'bg-brand-red text-white hover:bg-brand-red-dark'}`}
          >
            {sent ? <><CheckCircle size={15} /> Sent</> : <><Send size={15} /> Send to Customer</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3">

        {/* PAGE 1: Cover */}
        <div className="proposal-page overflow-hidden">
          {/* Red brand bar */}
          <div className="h-2 bg-brand-red w-full" />

          {/* Cover content */}
          <div className="bg-brand-charcoal px-10 py-12 flex flex-col items-center text-center">
            <div className="w-28 h-28 bg-white rounded-2xl overflow-hidden p-3 mb-6 shadow-lg">
              <img src={logoImg} alt="Holloman Exterminators" className="w-full h-full object-contain" />
            </div>
            <div className="font-display text-5xl font-bold text-white uppercase tracking-widest leading-none">Holloman</div>
            <div className="font-display text-2xl font-bold text-brand-red uppercase tracking-widest mt-1">Exterminators</div>
            <div className="text-silver text-sm mt-2 font-mono tracking-wider">Since 1968 · Warner Robins, Georgia</div>
          </div>

          <div className="bg-white px-10 py-10">
            <div className="border-l-4 border-brand-red pl-5 mb-8">
              <div className="font-display text-3xl font-bold text-brand-dark uppercase tracking-wide leading-tight">Property Protection Proposal</div>
              <div className="text-steel text-sm mt-1">Prepared exclusively for {sampleCustomer.name}</div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm mb-8">
              <div>
                <div className="text-xs text-silver uppercase tracking-widest font-semibold mb-1.5">Prepared For</div>
                <div className="font-bold text-brand-dark">{sampleCustomer.name}</div>
                <div className="text-steel mt-0.5">{sampleCustomer.serviceAddress}</div>
                <div className="text-steel mt-0.5">{sampleCustomer.phone}</div>
                <div className="text-steel mt-0.5">{sampleCustomer.email}</div>
              </div>
              <div>
                <div className="text-xs text-silver uppercase tracking-widest font-semibold mb-1.5">Prepared By</div>
                <div className="font-bold text-brand-dark">{sampleTech.name}</div>
                <div className="text-steel mt-0.5">{sampleTech.role}</div>
                <div className="text-steel mt-0.5">{sampleTech.branch} Branch</div>
                <div className="text-steel mt-0.5">{sampleTech.phone}</div>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Proposal Number', value: 'JQ-2026-0847' },
                { label: 'Prepared', value: 'July 23, 2026' },
                { label: 'Expires', value: 'August 7, 2026' },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xs text-silver uppercase tracking-wider font-semibold">{item.label}</div>
                  <div className="font-mono font-bold text-brand-dark mt-1">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PAGE 2: Executive Summary */}
        <div className="proposal-page">
          <PageHeader title="Executive Summary" number="1" />
          <div className="px-10 py-8 space-y-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              On <strong>July 23, 2026</strong>, a Holloman Exterminators certified inspector conducted a comprehensive inspection of the property at <strong>4821 Magnolia Trace, Warner Robins, GA</strong>. The following report summarizes our findings, recommended treatment plan, and service options for your review.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  title: 'Active Subterranean Termite Activity',
                  severity: 'Active',
                  desc: 'Live termite activity, mud tubes, and moderate wood damage were confirmed in the crawlspace along the north foundation wall. Immediate treatment is recommended.',
                  color: 'border-brand-red bg-red-50',
                  badge: 'bg-brand-red text-white'
                },
                {
                  title: 'Elevated Crawlspace Moisture',
                  severity: 'Elevated',
                  desc: 'Relative humidity in the crawlspace ranged from 68–84% RH, with deteriorated vapor barrier and partial drainage blockage contributing to these conditions.',
                  color: 'border-amber bg-amber-50',
                  badge: 'bg-amber text-white'
                },
              ].map(item => (
                <div key={item.title} className={`border-l-4 rounded-r-xl p-4 ${item.color}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badge}`}>{item.severity}</span>
                    <span className="font-bold text-gray-900 text-sm">{item.title}</span>
                  </div>
                  <p className="text-xs text-gray-700">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <div className="font-display text-lg font-bold text-gray-900 uppercase tracking-wide mb-2">Our Recommendation</div>
              <p className="text-sm text-gray-700 leading-relaxed">
                We recommend the <strong>{opt.label}</strong> option at <strong>${opt.oneTimePrice.toLocaleString()}</strong>, which addresses both the termite infestation and the moisture conditions that are enabling it. This plan includes a full-perimeter termite barrier treatment, borate wood treatment, complete new vapor barrier installation, and drainage system service.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Shield size={15} className="text-brand-red" />
                <span className="text-sm font-bold text-brand-red">{opt.warranty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 3: Inspection Findings */}
        <div className="proposal-page">
          <PageHeader title="Inspection Findings" number="2" />
          <div className="px-10 py-8 space-y-6">
            {sampleFindings.filter(f => f.includeInReport).map(finding => (
              <div key={finding.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className={`px-5 py-3 flex items-center justify-between ${finding.severity === 'Active' ? 'bg-brand-red' : 'bg-amber'}`}>
                  <span className="font-display text-base font-bold text-white uppercase tracking-wide">{finding.category}</span>
                  <span className="text-xs bg-white/25 text-white px-2.5 py-0.5 rounded-full font-bold">{finding.severity}</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-lg px-3 py-1.5">
                    Location: {finding.area}
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Evidence Observed</div>
                      <p className="text-gray-700 leading-relaxed">{finding.evidence}</p>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Damage Assessment</div>
                      <p className="text-gray-700 leading-relaxed">{finding.damage}</p>
                    </div>
                  </div>
                  {/* Photo grid */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {finding.photos.map((_p, pi) => (
                      <div key={pi} className={`rounded-xl aspect-square flex items-center justify-center text-white text-xs ${
                        pi === 0 ? 'bg-gray-800' : pi === 1 ? 'bg-gray-600' : 'bg-gray-400'
                      }`}>
                        <div className="text-center opacity-70">
                          <div className="text-lg">📷</div>
                          <div className="text-xs mt-0.5">Photo {pi + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAGE 4: Moisture */}
        <div className="proposal-page">
          <PageHeader title="Moisture Assessment" number="3" />
          <div className="px-10 py-8 space-y-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              Our technician recorded multiple moisture readings throughout your crawlspace. Elevated relative humidity (above 60% RH) and elevated wood moisture content (above 19%) create conditions that accelerate wood deterioration and support pest activity. The readings below reflect conditions at the time of inspection.
            </p>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Reading</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleMoisture.readings.map((r, i) => (
                    <tr key={r.id} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.location}</td>
                      <td className="px-4 py-3 text-gray-600">{r.material}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{r.value} {r.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.riskColor === 'red' ? 'bg-red-100 text-brand-red' : r.riskColor === 'amber' ? 'bg-amber-50 text-amber' : 'bg-green-50 text-success'}`}>
                          {r.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-gray-700">
                <strong>Observation:</strong> Discoloration consistent with microbial growth was observed on approximately 15% of floor joist surfaces in the northern and western sections of the crawlspace. We recommend prompt moisture remediation to address the underlying humidity levels. For questions regarding this observation, please contact our office.
              </p>
            </div>
          </div>
        </div>

        {/* PAGE 5: Option Comparison */}
        <div className="proposal-page">
          <PageHeader title="Service Options" number="4" />
          <div className="px-10 py-8 space-y-5">
            <p className="text-sm text-gray-700">We offer three levels of protection. Our recommendation is highlighted.</p>

            <div className="grid grid-cols-3 gap-4">
              {sampleQuoteOptions.map(o => (
                <div key={o.id} className={`rounded-xl overflow-hidden border-2 ${o.isRecommended ? 'border-brand-red' : 'border-gray-200'}`}>
                  {o.isRecommended && <div className="bg-brand-red text-white text-center text-xs font-bold py-1.5 uppercase tracking-wider">Recommended</div>}
                  <div className="p-4">
                    <div className="font-display text-xl font-bold text-gray-900 uppercase tracking-wide">{o.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 mb-3">{o.tagline}</div>
                    <div className="font-mono text-2xl font-bold text-gray-900">${o.oneTimePrice.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-0.5 mb-3">+ ${o.recurringPrice}/yr renewal</div>
                    <ul className="space-y-1.5">
                      {o.highlights.map((h, i) => (
                        <li key={i} className={`flex items-start gap-1.5 text-xs ${h.startsWith('Everything') ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                          <CheckCircle size={11} className={`flex-shrink-0 mt-0.5 ${h.startsWith('Everything') ? 'text-gray-300' : 'text-success'}`} />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Shield size={11} className="text-brand-red flex-shrink-0" />
                        <span>{o.warranty}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PAGE 6: Acceptance */}
        <div className="proposal-page">
          <PageHeader title="Acceptance & Signature" number="5" />
          <div className="px-10 py-8 space-y-5">
            <div className="bg-brand-red/5 border border-brand-red/20 rounded-xl p-5">
              <div className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide mb-1">Selected Option: {opt.label}</div>
              <div className="flex items-end gap-4">
                <div>
                  <div className="font-mono text-3xl font-bold text-brand-dark">${opt.oneTimePrice.toLocaleString()}</div>
                  <div className="text-xs text-steel">one-time treatment</div>
                </div>
                <div className="text-steel mb-1">+</div>
                <div>
                  <div className="font-mono text-lg font-semibold text-steel">${opt.recurringPrice}/yr</div>
                  <div className="text-xs text-steel">annual renewal</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-600 leading-relaxed">
              By signing below, I confirm that I have read and understood this proposal, including the scope of work, preparation requirements, warranty terms, and pricing. I authorize Holloman Exterminators to perform the services described in the <strong>{opt.label}</strong> plan at the address listed above.
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-500 font-semibold mb-2">Customer Signature</div>
                <div className="border-b-2 border-gray-900 pb-1 mb-1 h-12 flex items-end">
                  <span className="font-display text-xl italic text-gray-700">Sarah Chen</span>
                </div>
                <div className="text-xs text-gray-400">Sarah Chen · July 23, 2026</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold mb-2">Representative</div>
                <div className="border-b-2 border-gray-900 pb-1 mb-1 h-12 flex items-end">
                  <span className="font-display text-xl italic text-gray-700">Marcus Webb</span>
                </div>
                <div className="text-xs text-gray-400">{sampleTech.name} · July 23, 2026</div>
              </div>
            </div>

            <div className="bg-success-light border border-success/20 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={18} className="text-success" />
              <div>
                <div className="text-sm font-bold text-success">Proposal Accepted and Signed</div>
                <div className="text-xs text-success/70">Locked revision · JQ-2026-0847-v1 · July 23, 2026 at 11:14 AM</div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 p-1">
                  <img src={logoImg} alt="Holloman" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-gray-900 uppercase tracking-wide">Holloman Exterminators</div>
                  <div className="text-xs text-gray-400">Warner Robins, GA · hollomanext.com</div>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400 space-y-0.5">
                <div className="flex items-center gap-1"><Phone size={11} />(478) 555-0100</div>
                <div className="flex items-center gap-1"><Mail size={11} />info@hollomanext.com</div>
                <div>GA PCO License #GA-PCO-CORP-1001</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function PageHeader({ title, number }: { title: string, number: string }) {
  return (
    <div className="flex items-center border-b border-gray-200 px-10 py-4">
      <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center flex-shrink-0 mr-3">
        <span className="font-display font-bold text-white text-sm">{number}</span>
      </div>
      <div className="font-display text-2xl font-bold text-brand-dark uppercase tracking-wide flex-1">{title}</div>
      <div className="font-mono text-xs text-silver">JQ-2026-0847</div>
    </div>
  )
}
