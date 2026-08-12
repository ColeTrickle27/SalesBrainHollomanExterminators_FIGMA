/**
 * ============================================================================
 * INTEGRATION BOUNDARY: BugMan Graphs (Property step)
 * ============================================================================
 * BugMan Graphs is a separate Flutter web application (ColeTrickle27/
 * BugManInspects), already deployed as a static web build inside Holloman
 * Ops Brain at `/bugman-graphs/` and reachable standalone at
 * graphs.holloman-ext.com. Sales Brain does NOT reimplement diagramming,
 * wall drawing, or marker placement -- this component is the ONLY place
 * Sales Brain talks to that surface, and it does so by embedding the real
 * app in an iframe, matching how Ops Brain itself hosts it.
 *
 * Ops Brain's CORS allowlist for the underlying /api/bugman-graphs/* routes
 * (see functions/api/[[path]].js -> BUGMAN_GRAPH_ORIGINS) currently permits
 * only https://graphs.holloman-ext.com and https://bugman-graphs.pages.dev.
 * Until Sales Brain's own deployment origin is added to that allowlist (or
 * Sales Brain is mounted under Ops Brain per the long-term architecture),
 * this iframe will load the real app's UI but graph save/load calls made
 * from inside it will still authenticate against Ops Brain's own session
 * cookie on Ops Brain's origin, not Sales Brain's -- there is nothing to fix
 * here, that's simply how the boundary is designed to work.
 *
 * Do not add drawing/canvas/marker-placement code to this file. If BugMan
 * Graphs' embed contract changes (e.g. adds postMessage events), extend the
 * listener below -- don't reach into the iframe's DOM.
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { createBugManGraphsService } from "../../services/bugmanGraphs";

export interface BugManGraphsWorkspaceProps {
  open: boolean;
  onClose: () => void;
  billToNumber: string;
  locationNumber: string;
  graphKey?: string;
  /**
   * Real Property-step completion signal. Called when BugMan Graphs
   * postMessages "bugman-graph:saved" (see handler below). Not implemented
   * upstream in BugManInspects yet, so this currently never fires in
   * practice -- Property can only be marked complete once it does. See
   * docs/SALES_BRAIN_ARCHITECTURE.md §18.
   */
  onGraphSaved?: (payload: { graphKey?: string }) => void;
}

export function BugManGraphsWorkspace({ open, onClose, billToNumber, locationNumber, graphKey, onGraphSaved }: BugManGraphsWorkspaceProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("loading");
    const service = createBugManGraphsService();
    service
      .openInspection({ billToNumber, locationNumber, graphKey })
      .then(({ url }) => {
        if (cancelled) return;
        setEmbedUrl(url);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to open BugMan Graphs.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [open, billToNumber, locationNumber, graphKey]);

  // Handshake: BugMan Graphs may eventually postMessage a
  // "bugman-graph:saved" event with { graphKey } when a technician saves
  // inside the embedded app. Not implemented upstream in BugManInspects yet,
  // so onGraphSaved currently never fires in the real product -- but the
  // wiring is real (not a stub) so Property completion flips the moment
  // BugManInspects starts sending this event, with no further changes needed
  // here.
  useEffect(() => {
    if (!open) return;
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "bugman-graph:saved") {
        onGraphSaved?.({ graphKey: event.data?.graphKey });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [open, onGraphSaved]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#112018]/55 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ddd8cb] px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#7c796e]">Property · Integration boundary</p>
            <p className="font-serif text-lg text-[#173a30]">BugMan Graphs</p>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-bold hover:bg-black/5">
            Close
          </button>
        </div>
        <div className="relative flex-1 bg-[#f3f5f1]">
          {status === "loading" && (
            <div className="grid h-full place-items-center text-sm text-[#69746b]">Opening BugMan Graphs…</div>
          )}
          {status === "error" && (
            <div className="grid h-full place-items-center px-8 text-center text-sm text-[#b71f2a]">{error}</div>
          )}
          {status === "ready" && embedUrl && (
            <iframe
              title="BugMan Graphs"
              src={embedUrl}
              className="h-full w-full border-0"
              // Same-origin-adjacent sandboxing: BugMan Graphs needs scripts
              // and storage for its own session, but should never navigate
              // Sales Brain's top-level window.
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allow="clipboard-write"
            />
          )}
        </div>
      </div>
    </div>
  );
}
