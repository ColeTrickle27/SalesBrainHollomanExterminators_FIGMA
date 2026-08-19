import { useEffect, useState } from "react"

import { createBugManGraphsService } from "../../services/bugmanGraphs"

interface Props {
  graphKey?: string
  billToNumber?: string
  locationNumber?: string
  visibleMarkerIds: string[]
}

export function BugManGraphPresentation({ graphKey, billToNumber, locationNumber, visibleMarkerIds }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!graphKey || !billToNumber || !locationNumber) {
      setUrl(null)
      setError(null)
      return
    }
    let cancelled = false
    setUrl(null)
    setError(null)
    createBugManGraphsService().openInspection({
      billToNumber,
      locationNumber,
      graphKey,
      mode: "presentation",
      visibleMarkerIds,
    }).then((result) => {
      if (!cancelled) setUrl(result.url)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "The structure graph could not be opened.")
    })
    return () => { cancelled = true }
  }, [billToNumber, graphKey, locationNumber, visibleMarkerIds.join("|")])

  if (!graphKey || !billToNumber || !locationNumber) return <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">No saved structure graph is linked to this quote.</div>
  if (error) return <div className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>
  if (!url) return <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">Loading structure graph…</div>

  return <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
    <iframe title="Customer structure graph" src={url} className="h-[62vh] min-h-[420px] w-full border-0" sandbox="allow-scripts allow-same-origin" />
    <div className="border-t border-gray-100 bg-white px-4 py-2 text-xs text-gray-500">Read-only structure and customer-visible findings. Internal treatment notes, photos, and staff layers are hidden.</div>
  </div>
}
