import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react"
import type { SalesBrainEstimateListItem } from "../services/opsBrain"
import type { OpsBrainUser } from "../types/user"

interface DashboardProps {
  user: OpsBrainUser | null
  userLoading: boolean
  estimates: SalesBrainEstimateListItem[]
  loading: boolean
  error: string | null
  onStartInspection: () => void
  onOpenEstimate: (id: string) => void
  onRefresh: () => void
}

export default function Dashboard({
  user,
  userLoading,
  estimates,
  loading,
  error,
  onStartInspection,
  onOpenEstimate,
  onRefresh,
}: DashboardProps) {
  const firstName = user?.name?.split(/\s+/)[0] || "there"
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  return (
    <div className="pb-10">
      <div className="bg-brand-charcoal px-5 pt-5 pb-6">
        <div className="text-silver text-xs uppercase tracking-widest font-semibold font-mono mb-0.5">
          {today}
        </div>
        <div className="font-display text-3xl font-bold text-white tracking-wide">
          {userLoading
            ? "Loading your inspections..."
            : `Good morning, ${firstName}`}
        </div>
        <p className="mt-2 max-w-xl text-sm text-silver">
          Document the structure in BugMan Graphs, then review the automatically
          synchronized findings and photos in one professional inspection
          record.
        </p>
      </div>
      <div className="px-4 pt-4 space-y-6 max-w-6xl mx-auto">
        <button
          onClick={onStartInspection}
          className="w-full sm:w-auto bg-brand-red rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm"
        >
          <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center">
            <Plus size={22} className="text-white" />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white uppercase">
              Start inspection
            </div>
            <div className="text-white/70 text-xs">
              Select an existing Ops Brain customer, then open BugMan Graphs
            </div>
          </div>
        </button>
        {error ? (
          <div className="bg-danger-light border border-danger/25 rounded-2xl p-4 flex gap-2 text-sm text-danger">
            <AlertTriangle size={17} />
            {error}
          </div>
        ) : null}
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={20} className="text-brand-red" />
              <h1 className="font-display text-xl font-bold text-brand-dark uppercase tracking-wide">
                Saved inspections
              </h1>
              <span className="bg-brand-dark text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {estimates.length}
              </span>
            </div>
            <button
              onClick={onRefresh}
              className="text-xs text-brand-red font-semibold flex items-center gap-1"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="bg-white rounded-2xl p-7 text-center text-sm text-steel">
              Loading saved inspections…
            </div>
          ) : null}
          {!loading && estimates.length === 0 ? (
            <div className="bg-white rounded-2xl p-7 text-center">
              <ClipboardList size={32} className="text-silver mx-auto mb-2" />
              <div className="font-semibold text-brand-dark">
                No saved inspections
              </div>
              <p className="mt-1 text-sm text-steel">
                Start an inspection to create a graph-connected record.
              </p>
            </div>
          ) : null}
          <div className="grid lg:grid-cols-2 gap-3">
            {estimates.map((inspection) => (
              <button
                key={inspection.id}
                onClick={() => onOpenEstimate(inspection.id)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-3"
              >
                <div className="w-10 h-10 shrink-0 bg-surface rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-steel" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brand-dark truncate">
                    {inspection.customerName || "Customer not selected"}
                  </div>
                  <div className="text-xs text-steel truncate mt-1">
                    {inspection.locationAddress ||
                      inspection.locationName ||
                      "No location"}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-silver">
                    <CalendarClock size={12} /> Updated{" "}
                    {new Date(inspection.updatedAt).toLocaleDateString()}
                    <span className="font-mono ml-auto">
                      {inspection.estimateNumber}
                    </span>
                  </div>
                </div>
                <ChevronRight size={17} className="text-silver mt-2" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
