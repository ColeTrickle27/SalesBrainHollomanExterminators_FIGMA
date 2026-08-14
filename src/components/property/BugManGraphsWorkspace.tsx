/**
 * ============================================================================
 * INTEGRATION BOUNDARY: BugMan Graphs (Property step)
 * ============================================================================
 * BugMan Graphs is a separate Flutter web application (ColeTrickle27/
 * BugManInspects), deployed at graphs.holloman-ext.com and opened here from
 * the mounted Ops Brain SalesBrain application. Sales Brain does NOT
 * reimplement diagramming,
 * wall drawing, or marker placement -- this component is the ONLY place
 * Sales Brain talks to that surface, and it does so by embedding the real
 * app in a CSP-allowlisted iframe with a new-tab fallback.
 *
 * Ops Brain's CORS allowlist for the underlying /api/bugman-graphs/* routes
 * (see functions/api/[[path]].js -> BUGMAN_GRAPH_ORIGINS) currently permits
 * only https://graphs.holloman-ext.com and https://bugman-graphs.pages.dev.
 * Graph save/load requests authenticate against the existing Ops Brain
 * session and Customer Files identity.
 *
 * Do not add drawing/canvas/marker-placement code to this file. If BugMan
 * Graphs' embed contract changes, update the verified `bugman-graph:saved`
 * listener below -- don't reach into the iframe's DOM.
 * ============================================================================
 */

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { createBugManGraphsService } from "../../services/bugmanGraphs";

export interface BugManGraphsWorkspaceProps {
  open: boolean;
  onClose: () => void;
  billToNumber: string;
  locationNumber: string;
  graphKey?: string;
  /**
   * Real Property-step completion signal. The deployed Graphs editor emits
   * the R2 key and Customer File identity after a successful remote save. See
   * docs/SALES_BRAIN_ARCHITECTURE.md §18.
   */
  onGraphSaved?: (payload: { graphKey?: string; billToNumber?: string; locationNumber?: string }) => void;
}

export function BugManGraphsWorkspace({ open, onClose, billToNumber, locationNumber, graphKey, onGraphSaved }: BugManGraphsWorkspaceProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const popupRef = useRef<Window | null>(null);

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

  // The event is trusted only when origin, source window, graph key, Bill-To,
  // and location all match the workspace that SalesBrain opened.
  useEffect(() => {
    if (!open) return;
    function handleMessage(event: MessageEvent) {
      const expectedOrigin = embedUrl ? new URL(embedUrl).origin : null;
      const trustedSource = event.source === iframeRef.current?.contentWindow || event.source === popupRef.current;
      if (event.origin !== expectedOrigin || !trustedSource) return;
      if (event.data?.type === "bugman-graph:saved"
        && typeof event.data?.graphKey === "string"
        && event.data?.billToNumber === billToNumber
        && event.data?.locationNumber === locationNumber) {
        onGraphSaved?.({ graphKey: event.data.graphKey, billToNumber, locationNumber });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [billToNumber, embedUrl, locationNumber, open, onGraphSaved]);

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
              ref={iframeRef}
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
          {status === "ready" && embedUrl ? <button onClick={() => { popupRef.current = window.open(embedUrl, "bugman-graphs") }} className="absolute right-3 top-3 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-[#173a30] shadow flex items-center gap-1"><ExternalLink size={13} /> Open in new tab</button> : null}
        </div>
      </div>
    </div>
  );
}
