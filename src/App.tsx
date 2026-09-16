import { opsBrainUrl } from "./services/opsBrain/appUrls"
import { signatureSendingBlocked } from "./features/sales/signatureEligibility"
import { useEffect, useMemo, useState } from "react"

import {
  ChevronLeft,
  History,
  Home,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react"

import { BugManGraphChoiceModal } from "./components/property/BugManGraphChoiceModal"

import { BugManGraphPickerModal } from "./components/property/BugManGraphPickerModal"

import { BugManGraphsWorkspace } from "./components/property/BugManGraphsWorkspace"

import { useSalesWorkflow } from "./features/sales/useSalesWorkflow"

import logoImg from "./imports/Screenprint_HEcenter.png"

import AdminDetail from "./screens/AdminDetail"

import CustomerPresentation from "./screens/CustomerPresentation"

import CustomerSearch from "./screens/CustomerSearch"

import Dashboard from "./screens/Dashboard"

import InspectionWizard from "./screens/InspectionWizard"

import JobCosting from "./screens/JobCosting"

import ProposalPreview from "./screens/ProposalPreview"

import QuoteHistory, { type QuoteAction } from "./screens/QuoteHistory"

import QuoteWorkspace, {
  type QuoteWorkspaceSection,
} from "./screens/QuoteWorkspace"

import {
  isQuoteEngineBackedQuote,
  resolveQuoteWorkspaceRoute,
  shouldRenderQuoteWorkspace,
  type QuoteWorkspaceRoute,
} from "./features/sales/quoteWorkspace"

import type { CustomerIdentitySearchResult } from "./types/customer"

import { normalizeSalesBrainWorkflowData } from "./types/figma-workflow"

import type { SalesLead } from "./types/sales-operations"
import { graphReportContext } from "./features/sales/graphReportIntake"

type Screen = "dashboard" | "customer-search" | "quote-workspace" | "wizard" | "job-costing" | "presentation" | "proposal" | "quote-history" | "admin-detail"

const SCREEN_HASH: Record<Screen, string> = {
  dashboard: "home",

  "customer-search": "customer-search",

  "quote-workspace": "quote-workspace",

  wizard: "active-quote",

  "job-costing": "job-costing",

  presentation: "customer-view",

  proposal: "proposal",

  "quote-history": "quotes",

  "admin-detail": "admin",
}

const HASH_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_HASH).map(([screen, hash]) => [hash, screen]),
) as Record<string, Screen>

const NAV_ITEMS = [
  { id: "dashboard", icon: Home, label: "Home" },

  { id: "quote-history", icon: History, label: "Quotes" },

  { id: "admin-detail", icon: Settings, label: "Admin" },
] as const

function screenFromLocation(): Screen {
  return HASH_SCREEN[window.location.hash.replace(/^#\/?/, "")] || "dashboard"
}

export default function App() {
  const workflow = useSalesWorkflow()
  const [incomingGraph, setIncomingGraph] = useState(() => graphReportContext(window.location.search))
  const [replaceDraftConfirmed, setReplaceDraftConfirmed] = useState(false)
  const [graphIntakeBusy, setGraphIntakeBusy] = useState(false)
  const [graphIntakeError, setGraphIntakeError] = useState("")

  const clearGraphIntake = () => {
    const url = new URL(window.location.href)
    for (const key of ["billTo", "location", "graphKey"]) url.searchParams.delete(key)
    window.history.replaceState(null, "", url)
    setIncomingGraph(null)
  }

  const startGraphReport = async () => {
    if (!incomingGraph || !replaceDraftConfirmed || graphIntakeBusy) return
    setGraphIntakeBusy(true)
    setGraphIntakeError("")
    try {
      await workflow.startQuoteFromGraphReport(incomingGraph)
      clearGraphIntake()
      setQuoteWorkspaceSection("inspection")
      go("quote-workspace")
    } catch (error) {
      setGraphIntakeError(error instanceof Error ? error.message : "Unable to open this graph's quote.")
    } finally { setGraphIntakeBusy(false) }
  }

  const [screen, setScreen] = useState<Screen>(() => screenFromLocation())

  const [customerSearchReturn, setCustomerSearchReturn] =
    useState<Screen>(
      "dashboard",
    )

  const [isOffline, setIsOffline] = useState(false)

  const [quoteWorkspaceSection, setQuoteWorkspaceSection] =
    useState<QuoteWorkspaceSection>("quote")

  useEffect(() => {
    const onNavigation = () => setScreen(screenFromLocation())

    window.addEventListener("hashchange", onNavigation)

    return () => window.removeEventListener("hashchange", onNavigation)
  }, [])

  useEffect(() => {
    if (
      screen === "dashboard" ||
      screen === "quote-history" ||
      screen === "quote-workspace" ||
      screen === "wizard" ||
      screen === "job-costing"
    )
      void workflow.loadEstimates()
    if (screen === "dashboard") void workflow.refreshOperations()
  }, [screen])

  const go = (next: Screen) => {
    const hash = SCREEN_HASH[next]

    if (window.location.hash.replace(/^#\/?/, "") === hash) {
      setScreen(next)
    } else {
      window.location.hash = hash
    }
  }

  const beginCustomerSearch = () => {
    workflow.startNewEstimate()

    setCustomerSearchReturn("dashboard")

    go("customer-search")
  }

  const changeCustomer = () => {
    setCustomerSearchReturn("quote-workspace")

    go("customer-search")
  }

  const selectCustomer = (customer: CustomerIdentitySearchResult) => {
    workflow.selectCustomer(customer)

    setQuoteWorkspaceSection("quote")

    go("quote-workspace")
  }

  const openEstimate = async (id: string) => {
    const opened = await workflow.openEstimate(id)

    if (!opened) return

    setQuoteWorkspaceSection("quote")

    go(isQuoteEngineBackedQuote(opened) ? "quote-workspace" : "job-costing")
  }

  const openEstimateAction = async (id: string, action: QuoteAction) => {
    const opened = await workflow.openEstimate(id)

    if (!opened) return
    if (action === "signature" && signatureSendingBlocked(opened)) return

    if (isQuoteEngineBackedQuote(opened)) {
      setQuoteWorkspaceSection("delivery")
      go("quote-workspace")
      return
    }

    const legacyWorkflowData = normalizeSalesBrainWorkflowData(
      opened.workflowData,
    )
    workflow.updateWorkflowData({
      ...legacyWorkflowData,
      currentStep: action === "signature" ? 8 : 7,
    })

    go(action === "view" || action === "download" ? "proposal" : "wizard")
  }

  const startQuoteForLead = (lead: SalesLead) => {
    workflow.startQuoteForLead(lead)

    setQuoteWorkspaceSection("quote")

    go("quote-workspace")
  }

  const workflowData = normalizeSalesBrainWorkflowData(
    workflow.inspection.workflowData,
  )

  const modernQuoteActive = isQuoteEngineBackedQuote(workflow.inspection)

  const quoteRoute: QuoteWorkspaceRoute | null =
    screen === "quote-workspace" ||
    screen === "wizard" ||
    screen === "job-costing" ||
    screen === "presentation" ||
    screen === "proposal"
      ? screen
      : null

  const quoteRouteRedirect = quoteRoute
    ? resolveQuoteWorkspaceRoute({
        route: quoteRoute,

        restoringEstimate: workflow.restoringEstimate,

        modernQuote: modernQuoteActive,
      })
    : null

  const renderQuoteWorkspace = quoteRoute
    ? shouldRenderQuoteWorkspace({
        route: quoteRoute,

        restoringEstimate: workflow.restoringEstimate,

        modernQuote: modernQuoteActive,
      })
    : false

  const activeQuoteLead = workflow.inspection.leadId
    ? (workflow.dashboardData?.leads.find(
        (lead) => lead.id === workflow.inspection.leadId,
      ) ?? null)
    : null

  useEffect(() => {
    if (quoteRouteRedirect) go(quoteRouteRedirect)
  }, [quoteRouteRedirect])

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
        onClose={() => go(customerSearchReturn)}
      />
    )

  if (
    !workflow.restoringEstimate &&
    screen === "presentation" &&
    !modernQuoteActive
  )
    return (
      <CustomerPresentation
        inspection={workflow.inspection}
        workflowData={workflowData}
        services={workflow.pricebookServices}
        onChange={workflow.updateWorkflowData}
        onClose={() => go("wizard")}
        onContinue={() => {
          workflow.updateWorkflowData({ ...workflowData, currentStep: 7 })

          void workflow.saveEstimate()

          go("wizard")
        }}
      />
    )

  if (
    !workflow.restoringEstimate &&
    screen === "proposal" &&
    !modernQuoteActive
  )
    return (
      <ProposalPreview
        inspection={workflow.inspection}
        workflowData={workflowData}
        onClose={() => go("wizard")}
        onGeneratePdf={workflow.createProposalPdf}
      />
    )

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {incomingGraph ? <div className="bg-white border-b border-surface p-4 space-y-3">
        <strong>Start a new quote from your saved graph</strong>
        <p className="text-sm">Bill-To {incomingGraph.billToNumber} · Location {incomingGraph.locationNumber}. Your current quote has not changed. Save any current work using Save Draft before continuing; saved quotes remain available in Quotes.</p>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={replaceDraftConfirmed} onChange={event => setReplaceDraftConfirmed(event.target.checked)} disabled={graphIntakeBusy} />I have saved my current work, or I choose to discard its unsaved changes and start a new quote.</label>
        <div className="flex gap-3"><button className="rounded-xl bg-brand-red px-4 py-2 text-white disabled:opacity-50" disabled={!replaceDraftConfirmed || graphIntakeBusy || workflow.restoringEstimate || workflow.currentUserLoading || workflow.isSaving} onClick={() => void startGraphReport()}>{graphIntakeBusy ? "Checking graph…" : "Start New Quote from Graph"}</button><button disabled={graphIntakeBusy} onClick={clearGraphIntake}>Keep Current Quote</button></div>
        {graphIntakeError ? <p role="alert" className="text-danger text-sm">{graphIntakeError}</p> : null}
      </div> : null}
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

      {!workflow.currentUserLoading && !workflow.currentUser && <div role="status" className="bg-amber-50 border-b border-amber-200 p-3 text-sm">Sign in to Holloman to load and save your work. <a href={opsBrainUrl()} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Open Holloman sign-in</a>. Keep this page open to preserve unsaved work. <button onClick={workflow.refreshSession} className="underline font-semibold">Check sign-in</button> after returning.</div>}

      <header className="bg-brand-black px-4 py-3 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {screen !== "dashboard" ? (
              <button
                onClick={() => go("dashboard")}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white"
                aria-label="Back to Sales Brain home"
              >
                <ChevronLeft size={18} />
              </button>
            ) : null}
            <a
              href={opsBrainUrl()}
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
                  Sales Brain
                </div>
                <div className="hidden sm:block text-silver text-[10px] font-mono tracking-wider">
                  Holloman Exterminators • Ops Brain
                </div>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {screen === "quote-workspace" ||
            screen === "wizard" ||
            screen === "job-costing" ? (
              <div className="hidden sm:block text-xs font-mono text-silver bg-white/8 px-2.5 py-1.5 rounded-xl">
                {workflow.inspection.estimateNumber}
              </div>
            ) : null}
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
            data={workflow.dashboardData}
            loading={workflow.estimatesLoading || workflow.operationsLoading}
            error={workflow.estimatesError || workflow.operationsError}
            onLoadAssignees={workflow.loadLeadAssignees}
            leadActivities={workflow.leadActivities}
            services={workflow.pricebookServices}
            onStartInspection={beginCustomerSearch}
            onOpenEstimate={(id) => void openEstimate(id)}
            onDeleteEstimate={workflow.deleteEstimate}
            onRefresh={() =>
              void Promise.all([
                workflow.loadEstimates(),

                workflow.refreshOperations(),
              ])
            }
            onCreateLead={workflow.createLead}
            onUpdateLead={workflow.updateLead}
            onStartQuoteForLead={startQuoteForLead}
            onLoadActivities={workflow.loadLeadActivities}
            onAddActivity={workflow.addLeadActivity}
          />
        ) : null}
        {!workflow.restoringEstimate &&
        screen === "wizard" &&
        !modernQuoteActive ? (
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
            onPresentation={() => {
              void workflow.saveEstimate()

              go("presentation")
            }}
            onProposal={() => {
              void workflow.saveEstimate()

              go("proposal")
            }}
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
            onAddQuoteActivity={async (input) => {
              if (!workflow.inspection.leadId)
                throw new Error(
                  "Link this quote to a lead before logging interactions.",
                )

              await workflow.addLeadActivity(workflow.inspection.leadId, input)
            }}
            onLoadProviderState={workflow.loadProviderState}
            onCreateDocument={workflow.createCustomerDocument}
            onSendDelivery={workflow.sendCustomerDocument}
            onRequestSignature={workflow.requestCustomerSignature}
            onSavePestPacHandoff={workflow.savePestPacHandoffRecord}
          />
        ) : null}
        {renderQuoteWorkspace ? (
          <QuoteWorkspace
            inspection={workflow.inspection}
            workflowData={workflowData}
            pricebookServices={workflow.pricebookServices}
            currentUser={workflow.currentUser}
            quoteEngineCalculation={workflow.quoteEngineCalculation}
            quoteEngineCalculating={workflow.quoteEngineCalculating}
            quoteEngineCalculationError={workflow.quoteEngineCalculationError}
            isSaving={workflow.isSaving}
            savedAt={workflow.savedAt}
            saveError={workflow.saveError}
            graphNotes={workflow.graphNotes}
            availableGraphFindings={workflow.availableGraphFindings}
            onWorkflowDataChange={workflow.updateWorkflowData}
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
            onQuoteNotesChange={workflow.updateQuoteNotes}
            onQuoteEngineInputChange={workflow.updateQuoteEngineInput}
            onSave={() => void workflow.saveEstimate()}
            onResumeSignature={workflow.resumeCustomerSignature}
            onPersist={() => workflow.saveEstimate({ required: true })}
            onCustomerDecision={workflow.saveCustomerDecision}
            onCreateAdditionalQuote={workflow.createAdditionalQuote}
            onChangeCustomer={changeCustomer}
            lead={activeQuoteLead}
            onUpdateLead={workflow.updateActiveQuoteLead}
            initialSection={quoteWorkspaceSection}
            generatedDocuments={workflow.generatedDocuments}
            deliveries={workflow.deliveries}
            signatureRequest={workflow.signatureRequest}
            employeeProfile={workflow.employeeProfile}
            providerActionLoading={workflow.providerActionLoading}
            onLoadProviderState={workflow.loadProviderState}
            onCreateDocument={workflow.createCustomerDocument}
            onSendDelivery={workflow.sendCustomerDocument}
            onRequestSignature={workflow.requestCustomerSignature}
            onCreateProposalPdf={workflow.createProposalPdf}
          />
        ) : null}
        {!workflow.restoringEstimate &&
        screen === "job-costing" &&
        !modernQuoteActive ? (
          <JobCosting
            inspection={workflow.inspection}
            workflowData={workflowData}
            products={workflow.products}
            laborRoles={workflow.laborRoles}
            settings={workflow.costingSettings}
            pricebookServices={workflow.pricebookServices}
            currentUser={workflow.currentUser}
            quoteEngineCalculation={workflow.quoteEngineCalculation}
            quoteEngineCalculating={workflow.quoteEngineCalculating}
            quoteEngineCalculationError={workflow.quoteEngineCalculationError}
            estimates={workflow.estimates}
            estimatesLoading={workflow.estimatesLoading}
            estimatesError={workflow.estimatesError}
            openingEstimateId={workflow.openingEstimateId}
            isSaving={workflow.isSaving}
            savedAt={workflow.savedAt}
            saveError={workflow.saveError}
            onOpenEstimate={workflow.openEstimate}
            onChange={workflow.updateWorkflowData}
            onQuoteNotesChange={workflow.updateQuoteNotes}
            onQuoteEngineInputChange={workflow.updateQuoteEngineInput}
            onSave={() => void workflow.saveEstimate()}
          />
        ) : null}
        {screen === "quote-history" ? (
          <QuoteHistory
            estimates={workflow.estimates}
            loading={workflow.estimatesLoading}
            error={workflow.estimatesError}
            metrics={workflow.dashboardData?.metrics}
            onOpen={(id) => void openEstimate(id)}
            onAction={(id, action) => void openEstimateAction(id, action)}
            onDelete={workflow.deleteEstimate}
            onRefresh={() =>
              void Promise.all([
                workflow.loadEstimates(),

                workflow.refreshOperations(),
              ])
            }
          />
        ) : null}
        {screen === "admin-detail" ? (
          <AdminDetail
            onLoadLeadIntakeIssues={workflow.loadLeadIntakeIssues}
            services={workflow.pricebookServices}
            loading={workflow.pricebookLoading}
            error={workflow.pricebookError}
            saving={workflow.pricebookSaving}
            onRefresh={() =>
              void Promise.all([
                workflow.refreshPricebook(),

                workflow.refreshOperations(),
              ])
            }
            onCreate={workflow.createPricebookService}
            onUpdate={workflow.updatePricebookService}
            onDeactivate={workflow.deactivatePricebookService}
            products={workflow.products}
            laborRoles={workflow.laborRoles}
            costingSettings={workflow.costingSettings}
            servicePackages={workflow.servicePackages}
            employeeProfiles={workflow.employeeProfiles}
            currentUser={workflow.currentUser}
            onCreateProduct={workflow.createProduct}
            onUpdateProduct={workflow.updateProduct}
            onDeactivateProduct={workflow.deactivateProduct}
            onCreateLaborRole={workflow.createLaborRole}
            onUpdateLaborRole={workflow.updateLaborRole}
            onDeactivateLaborRole={workflow.deactivateLaborRole}
            onSaveCostingSettings={workflow.saveCostingSettings}
            onCreateServicePackage={workflow.createServicePackage}
            onUpdateServicePackage={workflow.updateServicePackage}
            onDeactivateServicePackage={workflow.deactivateServicePackage}
            onLoadEmployeeProfiles={workflow.loadEmployeeProfiles}
            onUpdateEmployeeProfile={workflow.updateEmployeeProfile}
            onDeleteEmployeeProfile={workflow.deleteEmployeeProfile}
            onRunLegacyImport={workflow.migrateLegacyData}
          />
        ) : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface z-20 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto lg:rounded-t-2xl lg:shadow-xl">
        <div className="flex items-center justify-around px-1 py-2 lg:px-4 lg:gap-3">
          {NAV_ITEMS.map((item) => {
            const active = screen === item.id

            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl ${
                  active ? "text-brand-red" : "text-silver hover:text-steel"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

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
