import assert from "node:assert/strict"
import test from "node:test"
import { effectiveLeadStatus, filterDashboardLeads, leadBusinessDate, leadDateLabel, leadFollowUpIssue, leadCommentIssue, leadSourceLabel, leadAssigneeLabel, LEAD_STATUS_LABELS } from "../src/features/sales/leadDashboard.ts"

const leads = [
  { id: "open", status: "open", temperature: "hot", customerName: "Open" },
  { id: "won", status: "sold", temperature: "warm", customerName: "Won" },
  { id: "lost", status: "lost", temperature: "cold", customerName: "Lost" },
  { id: "future", status: "ex_dated", temperature: "warm", customerName: "Future", exDate: "2026-10-01", exDateNote: "Call at contract renewal" },
  { id: "due", status: "ex_dated", temperature: "cold", customerName: "Due", exDate: "2026-09-09", exDateNote: "Check repair completion" },
]
test("All includes won, lost, deferred and open leads while filters remain independent", () => {
  assert.deepEqual(filterDashboardLeads(leads, "all", "all", "", "2026-09-09").map((item) => item.id), ["open", "won", "lost", "future", "due"])
  assert.deepEqual(filterDashboardLeads(leads, "all", "warm", "", "2026-09-09").map((item) => item.id), ["won", "future"])
  assert.deepEqual(filterDashboardLeads(leads, "open", "all", "", "2026-09-09").map((item) => item.id), ["open", "due"])
  assert.deepEqual(filterDashboardLeads(leads, "ex_dated", "all", "", "2026-09-09").map((item) => item.id), ["future"])
  assert.equal(LEAD_STATUS_LABELS.sold, "Won")
})
test("Ex-Dated requires a valid future NY business date and note", () => {
  assert.match(leadFollowUpIssue({ status: "ex_dated", exDate: "2026-09-09", exDateNote: "today" }, "2026-09-09"), /future/)
  assert.match(leadFollowUpIssue({ status: "ex_dated", exDate: "2027-02-30", exDateNote: "invalid" }, "2026-09-09"), /future/)
  assert.match(leadFollowUpIssue({ status: "ex_dated", exDate: "2026-09-10", exDateNote: "  " }, "2026-09-09"), /note/)
  assert.equal(leadFollowUpIssue({ status: "ex_dated", exDate: "2026-09-10", exDateNote: "Renewal call" }, "2026-09-09"), null)
  assert.equal(leadFollowUpIssue({ status: "open", exDate: "2026-08-10", exDateNote: "Retained history" }, "2026-09-09"), null)
})
test("due leads reappear as Open without deleting the Ex-Date or reason", () => {
  assert.equal(effectiveLeadStatus(leads[4], "2026-09-09"), "open")
  assert.equal(leads[4].exDate, "2026-09-09")
  assert.equal(leads[4].exDateNote, "Check repair completion")
  assert.equal(leadBusinessDate(new Date("2026-09-10T02:00:00Z")), "2026-09-09")
  assert.equal(leadBusinessDate(new Date("2026-09-10T04:01:00Z")), "2026-09-10")
  assert.equal(leadDateLabel("2026-09-09"), "09/09/2026")
})

test("every lead shows an explicit assignee and received source without inventing an assignment", () => {
  assert.equal(leadAssigneeLabel({ createdBy: "cole", assignedTo: null }), "UNASSIGNED")
  assert.equal(leadAssigneeLabel({ assignedTo: "virginia", assignedToName: "Virginia Tyler" }), "Virginia Tyler")
  assert.equal(leadAssigneeLabel({ assignedTo: "cole" }), "cole")
  assert.equal(leadSourceLabel({ source: "hubspot_form" }), "HubSpot Form")
  assert.equal(leadSourceLabel({ source: "quote" }), "Quote")
  assert.equal(leadSourceLabel({ source: "manual" }), "Manual Lead")
})

test("comments require actual text without blocking other recorded interaction types", () => {
  assert.equal(leadCommentIssue("Comment", "  \n  "), "Enter a comment before saving.")
  assert.equal(leadCommentIssue("Comment", "Customer asked for a call Friday."), null)
  assert.equal(leadCommentIssue("Called", ""), null)
})
