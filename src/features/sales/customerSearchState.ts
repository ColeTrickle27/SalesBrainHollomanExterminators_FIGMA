import type { CustomerIdentitySearchResult } from "../../types/customer"

export function customerSearchShortQueryState() {
  return {
    results: [] as CustomerIdentitySearchResult[],
    loading: false,
    error: null,
    authExpired: false,
  }
}

export function customerSearchStatusLabel({
  loading,
  query,
  resultCount,
}: {
  loading: boolean
  query: string
  resultCount: number
}) {
  if (loading) return "Searching…"
  if (query.trim().length < 2) return "Enter at least 2 characters"
  return `${resultCount} result${resultCount === 1 ? "" : "s"}`
}
