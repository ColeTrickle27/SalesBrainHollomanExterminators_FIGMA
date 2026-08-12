import type { BugManGraphListItem } from "../../services/bugmanGraphs";

export function BugManGraphPickerModal({
  open, graphs, loading, error, onClose, onRetry, onSelect,
}: {
  open: boolean;
  graphs: BugManGraphListItem[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (graph: BugManGraphListItem) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#112018]/55 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e6e0] px-6 py-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#778378]">Property · Ops Brain</p><h2 className="mt-0.5 font-serif text-xl text-[#173a30]">Select existing graph</h2></div>
          <button onClick={onClose} className="text-sm font-bold text-[#376044] hover:text-[#b71f2a]">Close</button>
        </div>
        <div className="p-6">
          {loading && <p className="text-sm text-[#69746b]">Loading real saved graphs for this property…</p>}
          {error && <div className="rounded-xl border border-[#e8b4b4] bg-[#fdecec] p-4 text-sm text-[#8a2c2c]"><p>{error}</p><button onClick={onRetry} className="mt-2 font-bold underline">Try again</button></div>}
          {!loading && !error && graphs.length === 0 && <div className="rounded-xl border border-[#dbe1da] bg-[#f7f9f6] p-4 text-sm text-[#4a564b]">No saved graphs are available for this Bill-To / Location. This list never creates placeholder graph records.</div>}
          {!loading && !error && graphs.length > 0 && <ul className="space-y-2">{graphs.map((graph) => <li key={graph.key}><button onClick={() => onSelect(graph)} className="w-full rounded-xl border border-[#dbe1da] p-3 text-left transition hover:border-[#55784f] hover:bg-[#f7f9f6]"><p className="text-sm font-bold text-[#173a30]">{graph.name}</p><p className="text-xs text-[#6f786f]">{graph.customerName || "Saved property graph"}{graph.serviceAddress ? ` · ${graph.serviceAddress}` : ""}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#778378]">{graph.updatedAt ? `Updated ${new Date(graph.updatedAt).toLocaleDateString()}` : "Saved graph"}</p></button></li>)}</ul>}
        </div>
      </div>
    </div>
  );
}
