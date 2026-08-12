import { useState } from 'react'
import { X, Check, ChevronLeft, ToggleLeft, ToggleRight, Camera, MessageSquare, MapPin, Tag, Clock, Pen, ArrowUpRight, Square, Type, Trash2, RotateCcw, Lock, Eye } from 'lucide-react'

interface Photo {
  id: string
  photoNum: number
  area: string
  category: string
  caption: string
  includeInReport: boolean
  timestamp: string
  bgColor: string
}

interface Props {
  onClose: () => void
  onSave: () => void
}

const AREA_OPTIONS = ['Crawlspace – North Wall', 'Crawlspace – SW Corner', 'Crawlspace – Center', 'Exterior – Foundation', 'Interior – Kitchen', 'Interior – Master Bedroom', 'Attic', 'Garage', 'Utility Room', 'Other']
const CATEGORY_OPTIONS = ['Termite Activity', 'Moisture / Humidity', 'Wood Damage', 'Mud Tubes', 'Frass / Droppings', 'Vapor Barrier', 'Insulation', 'Structural', 'General Observation']
const ANNOTATION_TOOLS = [
  { id: 'pen', icon: Pen, label: 'Draw' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'box', icon: Square, label: 'Region' },
  { id: 'label', icon: Type, label: 'Label' },
]

const SAMPLE_PHOTOS: Photo[] = [
  { id: 'p1', photoNum: 1, area: 'Crawlspace – North Wall', category: 'Termite Activity', caption: 'Active mud tubes visible on north foundation wall, approx. 8 LF', includeInReport: true, timestamp: '2026-07-23 9:12 AM', bgColor: '#1a2a3a' },
  { id: 'p2', photoNum: 2, area: 'Crawlspace – North Wall', category: 'Wood Damage', caption: 'Band joist damage — hollow galleries confirmed by probing, 12 LF affected', includeInReport: true, timestamp: '2026-07-23 9:15 AM', bgColor: '#2a1a1a' },
  { id: 'p3', photoNum: 3, area: 'Crawlspace – North Wall', category: 'Mud Tubes', caption: 'Close-up: mud tube cross-section showing live termite activity', includeInReport: true, timestamp: '2026-07-23 9:17 AM', bgColor: '#2a2a1a' },
  { id: 'p4', photoNum: 4, area: 'Crawlspace – SW Corner', category: 'Moisture / Humidity', caption: 'Standing water near partially blocked drain — approx. 4 sq ft pool', includeInReport: true, timestamp: '2026-07-23 9:24 AM', bgColor: '#1a2a2a' },
  { id: 'p5', photoNum: 5, area: 'Crawlspace – Center', category: 'Vapor Barrier', caption: 'Vapor barrier condition — torn and missing across approx. 60% of floor area', includeInReport: true, timestamp: '2026-07-23 9:28 AM', bgColor: '#1a1a2a' },
]

export default function PhotoAnnotation({ onClose, onSave }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(SAMPLE_PHOTOS)
  const [selectedId, setSelectedId] = useState<string>('p1')
  const [activeTool, setActiveTool] = useState<string>('arrow')
  const [annotations, setAnnotations] = useState<string[]>(['Mud tube', 'Wood damage zone'])
  const [showAddAnnotation, setShowAddAnnotation] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState('')
  const [editingCaption, setEditingCaption] = useState(false)

  const selected = photos.find(p => p.id === selectedId)!

  const updatePhoto = (id: string, updates: Partial<Photo>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const toggleInclude = () => updatePhoto(selectedId, { includeInReport: !selected.includeInReport })

  const addAnnotation = () => {
    if (newAnnotation.trim()) {
      setAnnotations(prev => [...prev, newAnnotation.trim()])
      setNewAnnotation('')
      setShowAddAnnotation(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="font-display text-lg font-bold text-white uppercase tracking-wide leading-none">Photo Annotation</div>
          <div className="text-silver text-xs mt-0.5 font-mono">{photos.length} photos · {photos.filter(p => p.includeInReport).length} in report</div>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 bg-brand-red text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-97 transition-all"
        >
          <Check size={16} /> Save All
        </button>
      </div>

      {/* Photo strip */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-white/10">
        {photos.map(photo => (
          <button
            key={photo.id}
            onClick={() => setSelectedId(photo.id)}
            className={`flex-shrink-0 relative transition-all ${selectedId === photo.id ? 'ring-2 ring-brand-red rounded-xl' : 'opacity-60 hover:opacity-80'}`}
          >
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: photo.bgColor }}>
              <Camera size={20} className="text-white/60" />
              <span className="absolute bottom-1 left-1 text-white text-[9px] font-mono bg-black/50 px-1 rounded">
                {photo.photoNum}
              </span>
            </div>
            {!photo.includeInReport && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-amber rounded-full flex items-center justify-center">
                <Lock size={8} className="text-white" />
              </div>
            )}
          </button>
        ))}
        <button className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/40 hover:border-brand-red/50 hover:text-white/70 transition-all">
          <Camera size={18} />
          <span className="text-[9px]">Add</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main photo view */}
        <div className="relative flex-1 flex items-center justify-center bg-brand-charcoal" style={{ minHeight: '220px', maxHeight: '280px' }}>
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: selected.bgColor }}>
            <div className="text-center text-white/40">
              <Camera size={48} className="mx-auto mb-2 opacity-40" />
              <span className="text-sm opacity-50">Photo {selected.photoNum} — {selected.area}</span>
            </div>
          </div>

          {/* Annotation overlays (static positions for prototype) */}
          {annotations.map((ann, i) => (
            <div
              key={i}
              className="absolute bg-brand-red text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg cursor-pointer hover:bg-brand-red-dark transition-all"
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
              }}
            >
              {ann}
              <div className="absolute bottom-0 left-3 w-px h-3 bg-brand-red translate-y-full" />
            </div>
          ))}

          {/* Annotation toolbar overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 rounded-xl p-1.5 backdrop-blur-sm">
            {ANNOTATION_TOOLS.map(tool => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all ${activeTool === tool.id ? 'bg-brand-red text-white' : 'text-white/60 hover:bg-white/10'}`}
                >
                  <Icon size={16} />
                  <span className="text-[9px]">{tool.label}</span>
                </button>
              )
            })}
            <div className="w-px h-8 bg-white/20 mx-1" />
            <button
              onClick={() => setAnnotations([])}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-white/40 hover:text-danger hover:bg-danger/10 transition-all"
            >
              <RotateCcw size={16} />
              <span className="text-[9px]">Clear</span>
            </button>
          </div>
        </div>

        {/* Metadata panel */}
        <div className="overflow-y-auto bg-white flex-1">
          <div className="p-4 space-y-4">
            {/* Include / Exclude toggle */}
            <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selected.includeInReport ? 'border-success bg-success-light' : 'border-amber bg-amber-light'}`}>
              <div className="flex items-center gap-2">
                {selected.includeInReport
                  ? <><Eye size={18} className="text-success" /><span className="text-success font-bold text-sm">Included in Customer Report</span></>
                  : <><Lock size={18} className="text-amber" /><span className="text-amber font-bold text-sm">Internal Only — Hidden from Customer</span></>
                }
              </div>
              <button onClick={toggleInclude} className="flex items-center gap-1">
                {selected.includeInReport
                  ? <ToggleRight size={28} className="text-success" />
                  : <ToggleLeft size={28} className="text-amber" />
                }
              </button>
            </div>

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs text-steel uppercase tracking-wider font-bold">
                  <MessageSquare size={13} /> Caption
                </label>
                <button onClick={() => setEditingCaption(v => !v)} className="text-xs text-brand-red font-semibold">
                  {editingCaption ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingCaption ? (
                <textarea
                  value={selected.caption}
                  onChange={e => updatePhoto(selectedId, { caption: e.target.value })}
                  rows={2}
                  className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red resize-none"
                />
              ) : (
                <p className="text-sm text-brand-dark bg-surface rounded-xl px-3 py-2.5">{selected.caption}</p>
              )}
            </div>

            {/* Area / Room */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-steel uppercase tracking-wider font-bold mb-2">
                <MapPin size={13} /> Area / Room
              </label>
              <select
                value={selected.area}
                onChange={e => updatePhoto(selectedId, { area: e.target.value })}
                className="w-full border border-surface rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red bg-white"
              >
                {AREA_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-steel uppercase tracking-wider font-bold mb-2">
                <Tag size={13} /> Finding Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_OPTIONS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => updatePhoto(selectedId, { category: cat })}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${selected.category === cat ? 'bg-brand-red border-brand-red text-white' : 'bg-white border-surface text-steel hover:border-steel/40'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Annotations list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-xs text-steel uppercase tracking-wider font-bold">
                  <ArrowUpRight size={13} /> Annotations ({annotations.length})
                </label>
                <button onClick={() => setShowAddAnnotation(true)} className="text-xs text-brand-red font-semibold">
                  + Add Label
                </button>
              </div>
              {annotations.length === 0 && (
                <p className="text-xs text-silver italic text-center py-3 bg-surface rounded-xl">No annotations yet. Use the tools above to mark areas of interest.</p>
              )}
              {annotations.map((ann, i) => (
                <div key={i} className="flex items-center justify-between bg-surface rounded-xl px-3 py-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand-red flex-shrink-0" />
                    <span className="text-sm text-brand-dark">{ann}</span>
                  </div>
                  <button onClick={() => setAnnotations(prev => prev.filter((_, idx) => idx !== i))} className="text-silver hover:text-danger transition-all p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {showAddAnnotation && (
                <div className="flex gap-2 mt-2">
                  <input
                    autoFocus
                    value={newAnnotation}
                    onChange={e => setNewAnnotation(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAnnotation()}
                    className="flex-1 border border-brand-red/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
                    placeholder="e.g. Active mud tube, Wood damage…"
                  />
                  <button onClick={addAnnotation} className="bg-brand-red text-white px-4 rounded-xl font-bold text-sm">Add</button>
                  <button onClick={() => setShowAddAnnotation(false)} className="bg-surface text-steel px-3 rounded-xl">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-silver">
              <Clock size={13} />
              <span>Captured: {selected.timestamp}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
