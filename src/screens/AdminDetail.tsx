import { useState, useRef } from 'react'
import { ChevronLeft, Plus, Search, Edit3, Upload, Package, DollarSign, Users, Shield, FileText, ToggleLeft, ToggleRight, X, Info, Check, ChevronRight as CR, Trash2 } from 'lucide-react'

type AdminSection = 'menu' | 'pricing' | 'products' | 'users' | 'templates'

interface Props {
  onClose: () => void
}

/* ─── Generic bottom-sheet modal ─── */
interface ModalField { key: string; label: string; type?: 'text' | 'select'; options?: string[] }
interface EditModalProps {
  title: string
  fields: ModalField[]
  values: Record<string, string>
  onSave: (v: Record<string, string>) => void
  onClose: () => void
}
function EditModal({ title, fields, values, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState({ ...values })
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-3xl p-5 space-y-4 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="font-display text-lg font-bold text-brand-dark uppercase tracking-wide">{title}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-steel"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-steel uppercase tracking-wider block mb-1">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={form[f.key] || ''}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red bg-white"
                >
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  value={form[f.key] || ''}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => { onSave(form); onClose() }}
          className="w-full bg-brand-red text-white font-bold py-3 rounded-xl font-display uppercase tracking-wide active:scale-97 transition-all flex items-center justify-center gap-2"
        >
          <Check size={16} /> Save Changes
        </button>
      </div>
    </div>
  )
}

export default function AdminDetail({ onClose }: Props) {
  const [section, setSection] = useState<AdminSection>('menu')

  if (section !== 'menu') {
    return (
      <div className="min-h-screen bg-surface">
        <div className="bg-brand-black px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setSection('menu')} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="font-display text-xl font-bold text-white uppercase tracking-wide flex-1">
            {section === 'pricing' && 'Pricing Rules'}
            {section === 'products' && 'Product Catalog'}
            {section === 'users' && 'User Management'}
            {section === 'templates' && 'Proposal Templates'}
          </div>
        </div>
        <div className="px-4 pt-4 pb-24">
          {section === 'pricing' && <PricingRules />}
          {section === 'products' && <ProductCatalog />}
          {section === 'users' && <UserManagement />}
          {section === 'templates' && <ProposalTemplates />}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-24">
      <div className="bg-brand-black px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all">
          <X size={20} />
        </button>
        <div>
          <div className="font-display text-xl font-bold text-white uppercase tracking-wide leading-none">Administration</div>
          <div className="text-silver text-xs mt-0.5">Warner Robins Branch · Administrator</div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="bg-amber-light border border-amber/30 rounded-xl p-3 flex items-start gap-2">
          <Shield size={15} className="text-amber flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-dark">
            <strong>Administrator Access.</strong> Changes to pricing rules, warranty language, product descriptions, and approval thresholds affect all technicians and customer-facing documents. All changes are logged.
          </p>
        </div>

        {[
          { id: 'pricing', icon: DollarSign, label: 'Pricing Rules', sub: '2026 schedule active · 14 rules · Last updated Mar 15', badge: null, badgeColor: '' },
          { id: 'products', icon: Package, label: 'Product Catalog', sub: '47 approved products · 3 pending review', badge: '3', badgeColor: 'bg-amber text-white' },
          { id: 'users', icon: Users, label: 'Users & Permissions', sub: '9 active users · 2 roles assigned this week', badge: null, badgeColor: '' },
          { id: 'templates', icon: FileText, label: 'Proposal Templates', sub: '3 active templates · Warranty text administrator-approved', badge: null, badgeColor: '' },
        ].map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id as AdminSection)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left hover:shadow-md transition-all active:scale-98"
            >
              <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={22} className="text-brand-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-brand-dark">{item.label}</div>
                <div className="text-xs text-steel mt-0.5 truncate">{item.sub}</div>
              </div>
              {item.badge && (
                <div className={`w-6 h-6 rounded-full ${item.badgeColor} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                  {item.badge}
                </div>
              )}
              <CR size={18} className="text-silver flex-shrink-0" />
            </button>
          )
        })}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-display text-base font-bold text-brand-dark uppercase tracking-wide mb-3">Recent Audit Events</div>
          {[
            { event: 'Pricing schedule imported', user: 'Cole Matthews', time: 'Mar 15, 2026', type: 'info' },
            { event: 'Product "Termidor SC" — description updated', user: 'Cole Matthews', time: 'Feb 28, 2026', type: 'info' },
            { event: 'Approval threshold changed: min margin 42% → 45%', user: 'Cole Matthews', time: 'Jan 15, 2026', type: 'warning' },
            { event: 'User "DeShawn Carter" — role updated to Technician', user: 'Cole Matthews', time: 'Jan 10, 2026', type: 'info' },
          ].map((e, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-t border-surface first:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.type === 'warning' ? 'bg-amber' : 'bg-success'}`} />
              <div className="flex-1">
                <div className="text-sm text-brand-dark">{e.event}</div>
                <div className="text-xs text-steel mt-0.5">{`${e.user} · ${e.time}`}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Pricing Rules ─── */
function PricingRules() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [rules, setRules] = useState([
    { id: 'PR-001', name: 'Termite Liquid Barrier — Base Price', trigger: 'Foundation perimeter (per LF)', formula: 'Base($950) + Perimeter × $8.50/LF', minCharge: '$1,200', marginTarget: '45%', status: 'active' },
    { id: 'PR-002', name: 'Termite Liquid Barrier — Low Clearance Modifier', trigger: 'Crawlspace clearance < 18"', formula: 'Base × 1.15 (15% access surcharge)', minCharge: 'N/A', marginTarget: '—', status: 'active' },
    { id: 'PR-003', name: 'Crawlspace Moisture Control — Vapor Barrier', trigger: 'Crawlspace sq ft', formula: 'SqFt × $0.85/sq ft + $350 flat', minCharge: '$800', marginTarget: '42%', status: 'active' },
    { id: 'PR-004', name: 'Full Encapsulation — System Price', trigger: 'Crawlspace sq ft + wall area', formula: 'SqFt × $2.75 + WallSqFt × $1.60 + Dehumidifier flat $1,400', minCharge: '$3,200', marginTarget: '45%', status: 'active' },
    { id: 'PR-005', name: 'General Pest — Initial Treatment', trigger: 'Structure sq ft', formula: 'Fixed tiers: <1500sq=$159, 1501–2500=$189, 2501–4000=$229, >4000=$279', minCharge: '$159', marginTarget: '52%', status: 'active' },
    { id: 'PR-006', name: 'Recurring Quarterly — Annual Plan', trigger: 'Structure sq ft tier', formula: 'Fixed tiers + 5% discount vs. per-visit', minCharge: '$75/qtr', marginTarget: '60%', status: 'active' },
    { id: 'PR-007', name: 'Bed Bug — Initial Heat + Chemical', trigger: 'Room count', formula: 'Rooms × $350 (1-2 rooms), Rooms × $300 (3+)', minCharge: '$350', marginTarget: '48%', status: 'active' },
  ])

  const fields: ModalField[] = [
    { key: 'name', label: 'Rule Name' },
    { key: 'trigger', label: 'Trigger Condition' },
    { key: 'formula', label: 'Pricing Formula' },
    { key: 'minCharge', label: 'Minimum Charge' },
    { key: 'marginTarget', label: 'Target Margin' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'draft'] },
  ]

  return (
    <div className="space-y-3">
      <div className="bg-info-light border border-info/20 rounded-xl p-3 flex items-start gap-2">
        <Info size={15} className="text-info flex-shrink-0 mt-0.5" />
        <p className="text-xs text-info">
          <strong>SAMPLE DATA.</strong> Pricing formulas shown are representative. Import your actual 2026 pricing schedule using the Import function below.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.csv,.xlsx"
        className="hidden"
        onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 bg-brand-red text-white font-bold py-3 rounded-xl font-display text-base uppercase tracking-wide active:scale-97 transition-all"
      >
        {fileName ? <><Check size={18} /> {fileName}</> : <><Upload size={18} /> Import 2026 Pricing Schedule (PDF/CSV)</>}
      </button>

      {rules.map((rule, i) => (
        <div key={rule.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-silver">{rule.id}</span>
                <span className="text-xs bg-success-light text-success font-bold px-2 py-0.5 rounded-full">{rule.status}</span>
              </div>
              <div className="font-semibold text-brand-dark mt-1 text-sm">{rule.name}</div>
              <div className="text-xs text-steel mt-0.5">Trigger: {rule.trigger}</div>
            </div>
            <button onClick={() => setEditing(i)} className="text-silver hover:text-brand-red transition-all p-1 flex-shrink-0 active:scale-90">
              <Edit3 size={16} />
            </button>
          </div>
          <div className="px-4 pb-3 space-y-1 text-xs">
            <div className="bg-surface rounded-lg px-3 py-2 font-mono text-brand-dark">{rule.formula}</div>
            <div className="flex gap-4">
              <span><span className="text-steel">Min charge:</span> <span className="font-mono font-bold text-brand-dark">{rule.minCharge}</span></span>
              <span><span className="text-steel">Target margin:</span> <span className="font-mono font-bold text-brand-dark">{rule.marginTarget}</span></span>
            </div>
          </div>
        </div>
      ))}

      {editing !== null && (
        <EditModal
          title="Edit Pricing Rule"
          fields={fields}
          values={rules[editing] as unknown as Record<string, string>}
          onSave={v => setRules(rs => rs.map((r, i) => i === editing ? { ...r, ...v } : r))}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

/* ─── Product Catalog ─── */
function ProductCatalog() {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [products, setProducts] = useState([
    { sku: 'TERM-SC-20OZ', name: 'Termidor SC', category: 'Termiticide', epaReg: '279-9179', status: 'approved', hasImage: true, hasLabel: true, hasSDS: true },
    { sku: 'BORA-CONC-GAL', name: 'Boracare', category: 'Wood Treatment', epaReg: '64405-2', status: 'approved', hasImage: true, hasLabel: true, hasSDS: true },
    { sku: 'VB-12MIL-10X100', name: '12-Mil Vapor Barrier', category: 'Moisture Control', epaReg: '', status: 'approved', hasImage: false, hasLabel: false, hasSDS: false },
    { sku: 'CS-WALL-LINER', name: 'CleanSpace Encapsulation', category: 'Encapsulation', epaReg: '', status: 'approved', hasImage: true, hasLabel: false, hasSDS: false },
    { sku: 'SANIDRY-XP', name: 'SaniDry XP Dehumidifier', category: 'Moisture Control', epaReg: '', status: 'approved', hasImage: true, hasLabel: false, hasSDS: false },
    { sku: 'TALF-CS-96OZ', name: 'Talstar Professional', category: 'General Pest', epaReg: '279-9538', status: 'approved', hasImage: false, hasLabel: true, hasSDS: true },
    { sku: 'ADVION-RG-30G', name: 'Advion Roach Gel', category: 'Roach / German Roach', epaReg: '352-746', status: 'approved', hasImage: false, hasLabel: true, hasSDS: true },
    { sku: 'NOVA-MOSQ-32OZ', name: 'NovaGard Mosquito Barrier', category: 'Mosquito', epaReg: '66222-189', status: 'pending-review', hasImage: false, hasLabel: false, hasSDS: false },
  ])

  const filtered = products.filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))

  const productFields: ModalField[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'epaReg', label: 'EPA Registration #' },
    { key: 'status', label: 'Status', type: 'select', options: ['approved', 'pending-review', 'inactive'] },
  ]

  const blankProduct = { sku: '', name: '', category: '', epaReg: '', status: 'pending-review', hasImage: false, hasLabel: false, hasSDS: false }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver" />
        <input value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-white border border-surface rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-red" placeholder="Search SKU or product name…" />
      </div>
      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface text-steel font-bold py-3 rounded-xl hover:border-brand-red/40 hover:text-brand-red transition-all active:scale-97"
      >
        <Plus size={18} /> Add New Product
      </button>
      {filtered.map((p) => {
        const realIdx = products.indexOf(p)
        return (
          <div key={p.sku} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center flex-shrink-0">
              <Package size={18} className={p.hasImage ? 'text-brand-red' : 'text-silver'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-brand-dark text-sm">{p.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'approved' ? 'bg-success-light text-success' : 'bg-amber-light text-amber'}`}>
                  {p.status === 'approved' ? '✓ Approved' : '⚠ Pending Review'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-silver">{p.sku}</span>
                <span className="text-silver text-xs">·</span>
                <span className="text-xs text-steel">{p.category}</span>
                {p.epaReg && <><span className="text-silver text-xs">·</span><span className="font-mono text-xs text-steel">EPA {p.epaReg}</span></>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {[{ label: 'Image', has: p.hasImage }, { label: 'Label', has: p.hasLabel }, { label: 'SDS', has: p.hasSDS }].map(f => (
                  <span key={f.label} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.has ? 'bg-success-light text-success' : 'bg-surface text-silver'}`}>
                    {f.has ? '✓' : '+'} {f.label}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setEditing(realIdx)} className="text-silver hover:text-brand-red transition-all p-1 flex-shrink-0 active:scale-90">
              <Edit3 size={16} />
            </button>
          </div>
        )
      })
}

      {editing !== null && (
        <EditModal
          title="Edit Product"
          fields={productFields}
          values={products[editing] as unknown as Record<string, string>}
          onSave={v => setProducts(ps => ps.map((p, i) => i === editing ? { ...p, ...v } : p))}
          onClose={() => setEditing(null)}
        />
      )}
      {adding && (
        <EditModal
          title="Add New Product"
          fields={productFields}
          values={blankProduct as unknown as Record<string, string>}
          onSave={v => setProducts(ps => [...ps, { ...blankProduct, ...v }])}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}

/* ─── User Management ─── */
function UserManagement() {
  const [editing, setEditing] = useState<number | null>(null)
  const [inviting, setInviting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [users, setUsers] = useState([
    { name: 'Cole Matthews', email: 'cole@holloman-ext.com', role: 'Administrator', branch: 'Warner Robins', status: 'active', lastLogin: 'Today, 7:22 AM' },
    { name: 'DeShawn Carter', email: 'dcarter@hollomanext.com', role: 'Technician / Sales', branch: 'Warner Robins', status: 'active', lastLogin: 'Today, 8:05 AM' },
    { name: 'Tamara Jackson', email: 'tjackson@hollomanext.com', role: 'Sales Manager', branch: 'Warner Robins', status: 'active', lastLogin: 'Today, 9:15 AM' },
    { name: 'James Holloman III', email: 'jholloman@hollomanext.com', role: 'Administrator', branch: 'All Branches', status: 'active', lastLogin: 'Jul 22, 2026' },
    { name: 'Brenda Willis', email: 'bwillis@hollomanext.com', role: 'Operations', branch: 'Warner Robins', status: 'active', lastLogin: 'Jul 22, 2026' },
  ])

  const roleColors: Record<string, string> = {
    'Administrator': 'bg-brand-red/10 text-brand-red',
    'Sales Manager': 'bg-amber-light text-amber',
    'Technician / Sales': 'bg-success-light text-success',
    'Operations': 'bg-info-light text-info',
  }

  const userFields: ModalField[] = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'role', label: 'Role', type: 'select', options: ['Administrator', 'Sales Manager', 'Technician / Sales', 'Operations'] },
    { key: 'branch', label: 'Branch' },
  ]

  const blankUser = { name: '', email: '', role: 'Technician / Sales', branch: 'Warner Robins', status: 'active', lastLogin: 'Never' }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setInviting(true)}
        className="w-full flex items-center justify-center gap-2 bg-brand-red text-white font-bold py-3 rounded-xl font-display text-base uppercase tracking-wide active:scale-97 transition-all"
      >
        <Plus size={18} /> Invite User
      </button>
      {users.map((u, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
            <span className="text-white font-display font-bold text-sm">
              {u.name.split(' ').map(w => w[0]).filter((_, i) => i < 2).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-brand-dark text-sm">{u.name}</div>
            <div className="text-xs text-steel">{u.email}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleColors[u.role] || 'bg-surface text-steel'}`}>{u.role}</span>
              <span className="text-xs text-silver">{u.branch}</span>
            </div>
            <div className="text-xs text-silver mt-1">Last active: {u.lastLogin}</div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={() => setEditing(i)} className="text-silver hover:text-brand-red transition-all p-1 active:scale-90">
              <Edit3 size={16} />
            </button>
            <button onClick={() => setConfirmDelete(i)} className="text-silver hover:text-danger transition-all p-1 active:scale-90">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-danger" />
              </div>
              <div>
                <div className="font-display text-lg font-bold text-brand-dark uppercase tracking-wide leading-none">Remove User</div>
                <div className="text-xs text-steel mt-0.5">This action cannot be undone</div>
              </div>
            </div>
            <p className="text-sm text-brand-dark">
              Are you sure you want to remove <strong>{users[confirmDelete]?.name}</strong> from the system? They will lose access immediately.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="py-3 rounded-xl border border-surface font-bold text-steel text-sm active:scale-97 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { setUsers(us => us.filter((_, idx) => idx !== confirmDelete)); setConfirmDelete(null) }}
                className="py-3 rounded-xl bg-danger text-white font-bold text-sm active:scale-97 transition-all"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}

      {editing !== null && (
        <EditModal
          title="Edit User"
          fields={userFields}
          values={users[editing] as unknown as Record<string, string>}
          onSave={v => setUsers(us => us.map((u, i) => i === editing ? { ...u, ...v } : u))}
          onClose={() => setEditing(null)}
        />
      )}
      {inviting && (
        <EditModal
          title="Invite User"
          fields={userFields}
          values={blankUser as unknown as Record<string, string>}
          onSave={v => setUsers(us => [...us, { ...blankUser, ...v }])}
          onClose={() => setInviting(false)}
        />
      )}
    </div>
  )
}

/* ─── Proposal Templates ─── */
function ProposalTemplates() {
  const [settings, setSettings] = useState([
    { label: 'Include warranty section', enabled: true },
    { label: 'Include preparation checklist attachment', enabled: true },
    { label: 'Show "Recommended" badge on middle option', enabled: true },
    { label: 'Include representative photo on cover', enabled: false },
  ])

  const toggle = (i: number) => setSettings(ss => ss.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s))

  return (
    <div className="space-y-3">
      {['Standard Residential Proposal', 'Commercial Proposal', 'Moisture / Encapsulation Proposal'].map((t, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="font-semibold text-brand-dark">{t}</div>
            <div className="text-xs text-steel mt-0.5">Last updated: {['Mar 15', 'Jan 10', 'Apr 02'][i]}, 2026</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-success-light text-success font-bold px-2 py-0.5 rounded-full">Active</span>
            <button className="text-silver hover:text-brand-red transition-all p-1 active:scale-90"><Edit3 size={16} /></button>
          </div>
        </div>
      ))}

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="font-display text-base font-bold text-brand-dark uppercase tracking-wide mb-3">Template Settings</div>
        {settings.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-t border-surface first:border-0">
            <span className="text-sm text-brand-dark">{s.label}</span>
            <button onClick={() => toggle(i)}>
              {s.enabled
                ? <ToggleRight size={26} className="text-brand-red" />
                : <ToggleLeft size={26} className="text-silver" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

