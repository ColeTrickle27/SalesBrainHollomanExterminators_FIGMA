export interface GraphReportContext { billToNumber: string; locationNumber: string; graphKey: string }

export function graphReportContext(search: string): GraphReportContext | null {
  const query = new URLSearchParams(search)
  const billToNumber = query.get("billTo")?.trim() || ""
  const locationNumber = query.get("location")?.trim() || ""
  const graphKey = query.get("graphKey")?.trim() || ""
  return billToNumber && locationNumber && graphKey ? { billToNumber, locationNumber, graphKey } : null
}

export function exactGraphReportIdentity<T extends { identityState: string; pestpacBillToNumber: string | null; pestpacLocationNumber: string | null }>(rows: T[], context: GraphReportContext): T {
  const matches = rows.filter(row => row.identityState === "permanent" && row.pestpacBillToNumber === context.billToNumber && row.pestpacLocationNumber === context.locationNumber)
  if (matches.length !== 1) throw new Error("This graph's customer could not be uniquely verified. Select the customer in New Quote instead.")
  return matches[0]
}

export function verifyGraphReportOwnership(rows: Array<{ key: string; billToNumber: string; locationNumber: string }>, context: GraphReportContext) {
  if (!rows.some(row => row.key === context.graphKey && row.billToNumber === context.billToNumber && row.locationNumber === context.locationNumber)) throw new Error("This graph could not be verified for the selected customer location.")
}
