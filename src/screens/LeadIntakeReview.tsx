import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import type { LeadIntakeIssue } from "../types/sales-operations"

export function LeadIntakeReview({ onLoad }: { onLoad: () => Promise<LeadIntakeIssue[]> }) {
  const [issues, setIssues] = useState<LeadIntakeIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    onLoad().then((rows) => { if (!cancelled) { setIssues(rows); setError("") } }).catch(() => { if (!cancelled) setError("Inbox intake flags could not be loaded. Choose Refresh to try again.") }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [onLoad])
  const refresh = async () => {
    setLoading(true); setError("")
    try { setIssues(await onLoad()) } catch { setError("Inbox intake flags could not be loaded. Choose Refresh to try again.") } finally { setLoading(false) }
  }
  const review = issues.filter((item) => item.status === "review")
  const excluded = issues.filter((item) => item.status === "excluded")
  return <section className="rounded-2xl bg-white p-5 shadow-sm" aria-label="Inbox Intake Review">
    <div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl font-bold text-brand-dark">Inbox Intake Review</h2><button type="button" disabled={loading} onClick={() => void refresh()} className="text-sm font-bold text-brand-red disabled:opacity-40"><RefreshCw size={14} className="inline mr-1" />Refresh</button></div>
    <p className="mt-2 text-sm text-steel">Flagged submissions need an administrator's review before becoming leads.</p>
    {loading && <p role="status" className="mt-3 text-sm text-steel">Checking inbox intake…</p>}
    {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    {!loading && !error && <div className="mt-4 space-y-4"><div><h3 className="font-bold text-amber">Needs Review · {review.length}</h3>{review.length ? <IssueList issues={review} /> : <p className="mt-2 text-sm text-steel">No submissions are awaiting review.</p>}</div><div className="border-t border-surface pt-4"><h3 className="font-bold text-steel">Excluded · {excluded.length}</h3><p className="mt-1 text-xs text-steel">These submissions were excluded from lead creation.</p>{excluded.length > 0 && <IssueList issues={excluded} />}</div></div>}
  </section>
}

function IssueList({ issues }: { issues: LeadIntakeIssue[] }) {
  return <ul className="mt-2 space-y-2">{issues.map((issue) => <li key={issue.messageId} className="rounded-xl border border-surface p-3"><time className="text-xs text-steel">{Number.isFinite(Date.parse(issue.receivedAt)) ? new Date(issue.receivedAt).toLocaleString("en-US", { timeZone: "America/New_York" }) : "Received date unavailable"}</time><p className="mt-1 text-sm text-brand-dark whitespace-pre-wrap break-words">{issue.reason}</p></li>)}</ul>
}
