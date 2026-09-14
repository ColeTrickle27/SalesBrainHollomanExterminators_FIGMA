import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, Wifi, WifiOff } from "lucide-react"
import { BugManGraphChoiceModal } from "./components/property/BugManGraphChoiceModal"
import { BugManGraphPickerModal } from "./components/property/BugManGraphPickerModal"
import { BugManGraphsWorkspace } from "./components/property/BugManGraphsWorkspace"
import { useSalesWorkflow } from "./features/sales/useSalesWorkflow"
import logoImg from "./imports/Screenprint_HEcenter.png"
import CustomerSearch from "./screens/CustomerSearch"
import Dashboard from "./screens/Dashboard"
import InspectionWizard from "./screens/InspectionWizard"
import ProposalPreview from "./screens/ProposalPreview"
import { normalizeSalesBrainWorkflowData } from "./types/figma-workflow"
import type { CustomerIdentitySearchResult } from "./types/customer"

type Screen = "dashboard" | "customer-search" | "inspection" | "report"
const SCREEN_HASH: Record<Screen, string> = {
  dashboard: "home",
  "customer-search": "customer-search",
  inspection: "inspection",
  report: "inspection-report",
}
const HASH_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_HASH).map(([screen, hash]) => [hash, screen]),
) as Record<string, Screen>
function screenFromLocation(): Screen {
  return HASH_SCREEN[window.location.hash.replace(/^#\/?/, "")] || "dashboard"
}

export default function App() {
  const workflow = useSalesWorkflow()
  const [screen, setScreen] = useState<Screen>(() => screenFromLocation())
  const [isOffline, setIsOffline] = useState(false)
  const workflowData = normalizeSalesBrainWorkflowData(
    workflow.inspection.workflowData,
  )
  useEffect(() => {
    const onNavigation = () => setScreen(screenFromLocation())
    window.addEventListener("hashchange", onNavigation)
    return () => window.removeEventListener("hashchange", onNavigation)
  }, [])
  useEffect(() => {
    if (screen === "dashboard") void workflow.loadEstimates()
  }, [screen])
  const go = (next: Screen) => {
    const hash = SCREEN_HASH[next]
    if (window.location.hash.replace(/^#\/?/, "") === hash) setScreen(next)
    else window.location.hash = hash
  }
  const beginInspection = () => {
    workflow.startNewEstimate()
    go("customer-search")
  }
  const selectCustomer = (customer: CustomerIdentitySearchResult) => {
    workflow.selectCustomer(customer)
    go("inspection")
  }
  const openInspection = async (id: string) => {
    const opened = await workflow.openEstimate(id)
    if (opened) go("inspection")
  }
  const initials = useMemo(() => {
    const name = workflow.currentUser?.name || ""
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "—"
    )
  }, [workflow.currentUser?.name])

  if (screen === "customer-search")
    return (
      <CustomerSearch
        onSelectCustomer={selectCustomer}
        onClose={() => go("dashboard")}
      />
    )
  if (!workflow.restoringEstimate && screen === "report")
    return (
      <ProposalPreview
        inspection={workflow.inspection}
        workflowData={workflowData}
        onClose={() => go("inspection")}
        onGeneratePdf={workflow.createProposalPdf}
      />
    )

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {isOffline ? (
        <div className="bg-amber flex items-center gap-2 px-4 py-2 z-40">
          <WifiOff size={15} className="text-white" />
          <span className="text-white text-xs font-bold">
            Offline • Keep this page open. Saving requires Ops Brain
            connectivity.
          </span>
          <button
            onClick={() => setIsOffline(false)}
            className="ml-auto text-white/80 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <header className="bg-brand-black px-4 py-3 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {screen === "inspection" ? (
              <button
                onClick={() => go("dashboard")}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white"
                aria-label="Back to inspections"
              >
                <ChevronLeft size={18} />
              </button>
            ) : null}
            <a
              href="/"
              className="flex items-center gap-2.5 min-w-0"
              title="Return to Ops Brain"
            >
              <div className="w-8 h-8 rounded-lg bg-white overflow-hidden flex items-center justify-center p-0.5">
                <img
                  src={logoImg}
                  alt="Holloman Exterminators"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg font-bold text-white uppercase tracking-wider leading-none whitespace-nowrap">
                  Sales Brain Inspections
                </div>
                <div className="hidden sm:block text-silver text-[10px] font-mono tracking-wider">
                  Holloman Exterminators • Ops Brain
                </div>
              </div>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOffline((value) => !value)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl ${
                isOffline
                  ? "text-amber bg-amber/15"
                  : "text-success bg-success/15"
              }`}
              title="Show connectivity guidance"
            >
              {isOffline ? <WifiOff size={12} /> : <Wifi size={12} />}
              <span className="hidden sm:inline">
                {isOffline ? "Offline" : "Connected"}
              </span>
            </button>
            <div
              className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center text-white text-xs font-bold"
              title={workflow.currentUser?.name || "Not signed in"}
            >
              {initials}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        {screen === "dashboard" ? (
          <Dashboard
            user={workflow.currentUser}
            userLoading={workflow.currentUserLoading}
            estimates={workflow.estimates}
            loading={workflow.estimatesLoading}
            error={workflow.estimatesError}
            onStartInspection={beginInspection}
            onOpenEstimate={(id) => void openInspection(id)}
            onRefresh={() => void workflow.loadEstimates()}
          />
        ) : null}
        {!workflow.restoringEstimate && screen === "inspection" ? (
          <InspectionWizard
            inspection={workflow.inspection}
            workflowData={workflowData}
            pricebookServices={workflow.pricebookServices}
            pricebookLoading={workflow.pricebookLoading}
            pricebookError={workflow.pricebookError}
            servicePackages={workflow.servicePackages}
            currentUser={workflow.currentUser}
            employeeProfile={workflow.employeeProfile}
            generatedDocuments={workflow.generatedDocuments}
            deliveries={workflow.deliveries}
            signatureRequest={workflow.signatureRequest}
            pestPacHandoff={workflow.pestPacHandoff}
            providerActionLoading={workflow.providerActionLoading}
            graphNotes={workflow.graphNotes}
            availableGraphFindings={workflow.availableGraphFindings}
            onWorkflowDataChange={workflow.updateWorkflowData}
            onSelectService={workflow.confirmRecommendation}
            onSave={() => void workflow.saveEstimate()}
            isSaving={workflow.isSaving}
            savedAt={workflow.savedAt}
            saveError={workflow.saveError}
            onPresentation={() => go("report")}
            onProposal={() => go("report")}
            onOpenGraph={workflow.openBugmanGraphsChoice}
            onAddFinding={workflow.addCustomNote}
            onUpdateFinding={workflow.updateFindingSummary}
            onUpdateFindingDetails={workflow.updateFindingDetails}
            onRemoveFinding={workflow.removeFinding}
            onToggleGraphFinding={workflow.toggleGraphFinding}
            onAddPhotos={workflow.addPhotos}
            onUpdatePhoto={workflow.updatePhoto}
            onRetryPhoto={workflow.retryPhoto}
            onRemovePhoto={(id) => void workflow.removePhoto(id)}
            photoInputRef={workflow.fileInputRef}
            onStatusChange={workflow.setEstimateStatus}
            onAddQuoteActivity={async () => undefined}
            onLoadProviderState={async () => undefined}
            onCreateDocument={async () => undefined}
            onSendDelivery={async () => undefined}
            onRequestSignature={async () => undefined}
            onSavePestPacHandoff={async () => undefined}
          />
        ) : null}
      </main>
      <BugManGraphChoiceModal
        open={workflow.bugmanGraphChoiceOpen}
        onClose={() => workflow.setBugmanGraphChoiceOpen(false)}
        onSelectExisting={workflow.showExistingGraphPicker}
        onCreateNew={workflow.createNewGraph}
      />
      <BugManGraphPickerModal
        open={workflow.bugmanGraphPickerOpen}
        graphs={workflow.propertyGraphs}
        loading={workflow.propertyGraphsLoading}
        error={workflow.propertyGraphsError}
        onClose={() => workflow.setBugmanGraphPickerOpen(false)}
        onRetry={() => void workflow.loadPropertyGraphs()}
        onSelect={workflow.selectExistingGraph}
      />
      {workflow.selectedCustomer ? (
        <BugManGraphsWorkspace
          open={workflow.bugmanGraphsOpen}
          onClose={workflow.closeBugmanGraphsWorkspace}
          billToNumber={workflow.selectedCustomer.billTo.billToNumber}
          locationNumber={workflow.selectedCustomer.location.locationNumber}
          graphKey={workflow.workspaceGraphKey ?? undefined}
          onGraphSaved={workflow.handleGraphSaved}
        />
      ) : null}
    </div>
  )
}
