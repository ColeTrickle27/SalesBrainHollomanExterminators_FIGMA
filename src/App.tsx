import { useEffect, useMemo, useState } from "react"

import {
  Calculator,
  ChevronLeft,
  FileText,
  History,
  Home,
  Plus,
  Settings,
  Trash2,
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

import QuoteHistory from "./screens/QuoteHistory"

import type { CustomerSearchResult } from "./types/customer"

import { normalizeSalesBrainWorkflowData } from "./types/figma-workflow"

type Screen = "dashboard" | "customer-search" | "wizard" | "job-costing" | "presentation" | "proposal" | "quote-history" | "admin-detail"

const SCREEN_HASH: Record<Screen, string> = {
  dashboard: "home",

  "customer-search": "customer-search",

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

  { id: "wizard", icon: FileText, label: "Active Quote" },

  { id: "job-costing", icon: Calculator, label: "Quote Builder" },
  { id: "quote-history", icon: History, label: "Quotes" },

  { id: "admin-detail", icon: Settings, label: "Admin" },
] as const

function screenFromLocation(): Screen {
  return HASH_SCREEN[window.location.hash.replace(/^#\/?/, "")] || "dashboard"
}

export default function App() {
  const workflow = useSalesWorkflow()

  const [screen, setScreen] = useState<Screen>(() => screenFromLocation())

  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const onNavigation = () => setScreen(screenFromLocation())

    window.addEventListener("hashchange", onNavigation)

    return () => window.removeEventListener("hashchange", onNavigation)
  }, [])

  useEffect(() => {
    if (
      screen === "dashboard" ||
      screen === "quote-history" ||
      screen === "wizard" ||
      screen === "job-costing"
    )
      void workflow.loadEstimates()
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

    go("customer-search")
  }

  const selectCustomer = (customer: CustomerSearchResult) => {
    workflow.selectCustomer(customer)

    go("wizard")
  }

  const openEstimate = async (id: string) => {
    await workflow.openEstimate(id)

    go("wizard")
  }

  const workflowData = normalizeSalesBrainWorkflowData(
    workflow.inspection.workflowData,
  )

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

  if (screen === "presentation")
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

  if (screen === "proposal")
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
                  Sales Brain
                </div>
                <div className="hidden sm:block text-silver text-[10px] font-mono tracking-wider">
                  Holloman Exterminators • Ops Brain
                </div>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {screen === "wizard" || screen === "job-costing" ? (
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
            leadActivities={workflow.leadActivities}
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
            onLoadActivities={workflow.loadLeadActivities}
            onAddActivity={workflow.addLeadActivity}
          />
        ) : null}
        {screen === "wizard" && !workflow.selectedCustomer ? (
          <ActiveQuoteLanding
            estimates={workflow.estimates}
            loading={workflow.estimatesLoading}
            onNewQuote={beginCustomerSearch}
            onOpenEstimate={(id) => void openEstimate(id)}
            onDeleteEstimate={workflow.deleteEstimate}
          />
        ) : null}
        {screen === "wizard" && workflow.selectedCustomer ? (
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
        {screen === "job-costing" ? (
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

function ActiveQuoteLanding({
  estimates,
  loading,
  onNewQuote,
  onOpenEstimate,
  onDeleteEstimate,
}: {
  estimates: Array<{
    id: string
    estimateNumber: string
    customerName: string | null
    locationAddress: string | null
    status: string
  }>
  loading: boolean
  onNewQuote: () => void
  onOpenEstimate: (id: string) => void
  onDeleteEstimate: (id: string) => Promise<void>
}) {
  return (
    <div className="pb-24 px-4 pt-5 max-w-4xl mx-auto space-y-5">
      <button
        onClick={onNewQuote}
        className="w-full bg-brand-red rounded-2xl p-5 flex items-center gap-4 shadow-sm"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Plus size={26} className="text-white" />
        </div>
        <div className="text-left">
          <div className="font-display text-xl font-bold text-white uppercase">
            Create New Quote
          </div>
          <div className="text-white/70 text-sm mt-0.5">
            Search Ops Brain Customer Files to begin
          </div>
        </div>
      </button>
      <section>
        <h2 className="font-display text-xl font-bold text-brand-dark uppercase mb-3">
          Saved Quotes
        </h2>
        {loading ? (
          <div className="bg-white rounded-2xl p-6 text-center text-sm text-steel">
            Loading…
          </div>
        ) : null}
        <div className="space-y-2">
          {estimates.slice(0, 20).map((estimate) => (
            <article
              key={estimate.id}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
            >
              <button
                onClick={() => onOpenEstimate(estimate.id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-brand-dark truncate">
                      {estimate.customerName || "Customer not selected"}
                    </div>
                    <div className="text-xs text-steel mt-1 truncate">
                      {estimate.locationAddress || "No location"} •{" "}
                      {estimate.estimateNumber}
                    </div>
                  </div>
                  <span className="text-xs capitalize text-amber font-bold">
                    {estimate.status}
                  </span>
                </div>
              </button>
              {estimate.status === "draft" || estimate.status === "sent" ? (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete open quote ${estimate.estimateNumber}? This removes it from SalesBrain.`,
                      )
                    )
                      void onDeleteEstimate(estimate.id).catch(() => undefined)
                  }}
                  className="p-2 text-danger hover:bg-danger-light rounded-xl"
                  aria-label={`Delete quote ${estimate.estimateNumber}`}
                  title="Delete open quote"
                >
                  <Trash2 size={17} />
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
