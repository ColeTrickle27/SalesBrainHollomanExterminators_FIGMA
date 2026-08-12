export function BugManGraphChoiceModal({
  open,
  onClose,
  onSelectExisting,
  onCreateNew,
}: {
  open: boolean;
  onClose: () => void;
  onSelectExisting: () => void;
  onCreateNew: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#112018]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e6e0] px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#778378]">Property · BugMan Graphs</p>
            <h2 className="mt-0.5 font-serif text-xl text-[#173a30]">Choose a graph</h2>
          </div>
          <button onClick={onClose} className="text-sm font-bold text-[#376044] hover:text-[#b71f2a]">Close</button>
        </div>
        <div className="space-y-3 p-6">
          <button onClick={onSelectExisting} className="w-full rounded-xl border border-[#dbe1da] p-4 text-left transition hover:border-[#55784f] hover:bg-[#f7f9f6]">
            <p className="text-sm font-bold text-[#173a30]">Select existing graph</p>
            <p className="mt-1 text-xs text-[#6f786f]">Open a real saved graph for this Bill-To and Location.</p>
          </button>
          <button onClick={onCreateNew} className="w-full rounded-xl bg-[#376044] p-4 text-left text-white transition hover:bg-[#2b4d36]">
            <p className="text-sm font-bold">Create new graph</p>
            <p className="mt-1 text-xs text-white/80">Start a new property graph without changing an existing one.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
