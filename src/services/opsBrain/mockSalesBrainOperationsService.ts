import type { SalesBrainOperationsService } from "./salesBrainOperationsService"
import type {
  LeadActivity,
  LeadInput,
  SalesCostingSettings,
  SalesLaborRole,
  SalesLaborRoleInput,
  SalesLead,
  SalesProduct,
  SalesProductInput,
  SalesEmployeeProfile,
  SalesBrainMigrationResult,
  SalesServicePackage,
  SalesServicePackageInput,
} from "../../types/sales-operations"

export class MockSalesBrainOperationsService implements SalesBrainOperationsService {
  private leads: SalesLead[] = []
  private activities: LeadActivity[] = []
  private products: SalesProduct[] = []
  private laborRoles: SalesLaborRole[] = []
  private settings: SalesCostingSettings = { equipmentTravelDisposalCents: 0, overheadPercent: 10, contingencyPercent: 5, targetMarginPercent: 50 }
  private packages: SalesServicePackage[] = []
  private employees: SalesEmployeeProfile[] = [{ username: "preview", displayName: "Preview User", email: "preview@holloman-ext.com", active: true, gmailEnabled: false }]
  async loadDashboard() { return { leads: structuredClone(this.leads), drafts: [], pending: [], metrics: { acceptedCount: 0, acceptedRevenueCents: 0, closeRatePercent: null, averageMarginPercent: null } } }
  async listLeads() { return structuredClone(this.leads) }
  async createLead(input: LeadInput) { const now = new Date().toISOString(); const lead: SalesLead = { ...input, id: crypto.randomUUID(), createdBy: "preview", createdAt: now, updatedAt: now, lastInteractionAt: now }; this.leads.unshift(lead); return structuredClone(lead) }
  async updateLead(id: string, input: Partial<LeadInput>) { const index = this.leads.findIndex((item) => item.id === id); if (index < 0) throw new Error("Lead not found."); this.leads[index] = { ...this.leads[index], ...input, updatedAt: new Date().toISOString() }; return structuredClone(this.leads[index]) }
  async listActivities(leadId: string) { return structuredClone(this.activities.filter((item) => item.leadId === leadId)) }
  async addActivity(leadId: string, input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">) { const now = new Date().toISOString(); const activity: LeadActivity = { ...input, id: crypto.randomUUID(), leadId, createdBy: "preview", createdAt: now }; this.activities.unshift(activity); return structuredClone(activity) }
  async listProducts() { return structuredClone(this.products) }
  async createProduct(input: SalesProductInput) { const item = makeProduct(input); this.products.push(item); return structuredClone(item) }
  async updateProduct(id: string, input: SalesProductInput) { const item = this.products.find((entry) => entry.id === id); if (!item) throw new Error("Product not found."); Object.assign(item, input, { updatedAt: new Date().toISOString() }); return structuredClone(item) }
  async deactivateProduct(id: string) { const item = this.products.find((entry) => entry.id === id); if (!item) throw new Error("Product not found."); item.active = false; return structuredClone(item) }
  async listLaborRoles() { return structuredClone(this.laborRoles) }
  async createLaborRole(input: SalesLaborRoleInput) { const now = new Date().toISOString(); const item: SalesLaborRole = { ...input, id: crypto.randomUUID(), active: true, createdAt: now, updatedAt: now }; this.laborRoles.push(item); return structuredClone(item) }
  async updateLaborRole(id: string, input: SalesLaborRoleInput) { const item = this.laborRoles.find((entry) => entry.id === id); if (!item) throw new Error("Labor role not found."); Object.assign(item, input, { updatedAt: new Date().toISOString() }); return structuredClone(item) }
  async deactivateLaborRole(id: string) { const item = this.laborRoles.find((entry) => entry.id === id); if (!item) throw new Error("Labor role not found."); item.active = false; return structuredClone(item) }
  async getCostingSettings() { return structuredClone(this.settings) }
  async updateCostingSettings(input: SalesCostingSettings) { this.settings = { ...input, updatedAt: new Date().toISOString(), updatedBy: "preview" }; return structuredClone(this.settings) }
  async listServicePackages() { return structuredClone(this.packages) }
  async createServicePackage(input: SalesServicePackageInput) { const now = new Date().toISOString(); const item: SalesServicePackage = { ...input, id: crypto.randomUUID(), active: true, createdAt: now, updatedAt: now }; this.packages.push(item); return structuredClone(item) }
  async updateServicePackage(id: string, input: SalesServicePackageInput) { const item = this.packages.find((entry) => entry.id === id); if (!item) throw new Error("Service package not found."); Object.assign(item, input, { updatedAt: new Date().toISOString() }); return structuredClone(item) }
  async deactivateServicePackage(id: string) { const item = this.packages.find((entry) => entry.id === id); if (!item) throw new Error("Service package not found."); item.active = false; return structuredClone(item) }
  async getMyEmployeeProfile() { return structuredClone(this.employees[0] || null) }
  async listEmployeeProfiles() { return structuredClone(this.employees) }
  async updateEmployeeProfile(username: string, input: Omit<SalesEmployeeProfile, "username" | "updatedAt" | "updatedBy">) { const current = this.employees.find((item) => item.username === username); const saved = { ...input, username, updatedAt: new Date().toISOString(), updatedBy: "preview" }; if (current) Object.assign(current, saved); else this.employees.push(saved); return structuredClone(saved) }
  async deleteEmployeeProfile(username: string) { const index = this.employees.findIndex((item) => item.username === username); if (index < 0) throw new Error("Employee Gmail profile not found."); this.employees.splice(index, 1) }
  async migrateLegacyData(): Promise<SalesBrainMigrationResult> { return { estimates: { imported: 0, skipped: 0, d1Count: 0 }, pricebookServices: { imported: 0, skipped: 0, d1Count: 0 }, sourceObjectsDeleted: 0 } }
}

function makeProduct(input: SalesProductInput): SalesProduct {
  const now = new Date().toISOString()
  return { ...input, id: crypto.randomUUID(), active: true, createdAt: now, updatedAt: now }
}
