import { reportGraphJpeg } from "./reportGraphImage"
import { createBugManGraphsService } from "../../services/bugmanGraphs"
import type { SalesInspection } from "../../types/sales-inspection"
import { customerReviewContent } from "./customerReview"

/** Capture the same filtered Flutter surface used during customer review. */
export async function exportCustomerGraph(inspection: SalesInspection): Promise<Blob | null> {
  const graphKey = inspection.property?.graphKey
  if (!graphKey) return null
  const billToNumber = inspection.billTo?.billToNumber
  const locationNumber = inspection.location?.locationNumber
  if (!billToNumber || !locationNumber) throw new Error("Select this graph's customer before exporting the inspection.")
  const visibleMarkerIds = customerReviewContent(inspection).findings
    .filter(item => item.source === "graph" && (!item.sourceGraphKey || item.sourceGraphKey === graphKey))
    .flatMap(item => item.markerIds)
  const result = await createBugManGraphsService().openInspection({graphKey,billToNumber,locationNumber,mode:"presentation",visibleMarkerIds})
  const url = new URL(result.url, window.location.origin)
  url.searchParams.set("returnOrigin", window.location.origin)
  const requestId = crypto.randomUUID()
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe")
    frame.title = "Preparing customer graph export"
    frame.setAttribute("aria-hidden", "true")
    // Offscreen frames may stop animation frames, which prevents Flutter capture.
    // Keep the customer-safe surface painted while the report is prepared.
    frame.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;border:0;pointer-events:none;z-index:100;background:white"
    frame.sandbox.add("allow-scripts", "allow-same-origin")
    const notice = document.createElement("div")
    notice.textContent = "Preparing your inspection report…"
    notice.setAttribute("role", "status")
    notice.style.cssText = "position:fixed;top:0;left:0;right:0;padding:16px;background:#fff;color:#222;z-index:101;font:600 16px sans-serif"
    let timer: ReturnType<typeof setInterval>
    const cleanup = () => { clearInterval(timer); clearTimeout(timeout); window.removeEventListener("message", receive); frame.remove(); notice.remove() }
    const fail = (message: string) => { cleanup(); reject(new Error(message)) }
    let converting = false
    const receive = async (event: MessageEvent) => {
      if (converting) return
      if (event.source !== frame.contentWindow || event.origin !== url.origin || event.data?.requestId !== requestId || event.data?.graphKey !== graphKey) return
      if (event.data.type === "bugman-graph:presentation-error") { fail("The graph could not be prepared. Your inspection is saved; open the graph and try again."); return }
      if (event.data.type !== "bugman-graph:presentation-png") return
      converting = true
      clearInterval(timer)
      const encoded = event.data.pngBase64
      if (typeof encoded !== "string" || encoded.length > 14_000_000) { fail("The graph image is too large to include in this report."); return }
      try {
        const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
        if (bytes.length < 8 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) throw new Error("Invalid image")
        const reportImage = await reportGraphJpeg(new Blob([bytes], { type: "image/png" }))
        cleanup(); resolve(reportImage)
      } catch { fail("The graph image could not be read. Please try again.") }
    }
    const timeout = setTimeout(() => fail("The graph export timed out. Your inspection is saved; check your connection and try again."), 45000)
    window.addEventListener("message", receive)
    timer = setInterval(() => frame.contentWindow?.postMessage({type:"bugman-graph:export-presentation",requestId,graphKey}, url.origin), 1000)
    frame.src = url.href
    document.body.appendChild(frame)
    document.body.appendChild(notice)
  })
}
