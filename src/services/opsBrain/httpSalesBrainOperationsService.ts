import type { SalesBrainOperationsService } from "./salesBrainOperationsService"
import type {
  LeadActivity,
  LeadInput,
  SalesCostingSettings,
  SalesDashboardData,
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
import type { OpsBrainClientConfig } from "./httpCustomerFilesService"
import { OpsBrainAuthError } from "./errors"

export class HttpSalesBrainOperationsService implements SalesBrainOperationsService {
  constructor(private readonly config: OpsBrainClientConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}/api${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...init,
    })
    const payload = await response.json().catch(() => ({})) as { error?: string } & T
    if (!response.ok) {
      if (response.status === 401) throw new OpsBrainAuthError(payload.error)
      throw new Error(payload.error || `Ops Brain request failed (${response.status}).`)
    }
    return payload
  }

  async loadDashboard() { return (await this.request<{ dashboard: SalesDashboardData }>("/sales-brain/dashboard")).dashboard }
  async listLeads() { return (await this.request<{ leads: SalesLead[] }>("/sales-brain/leads")).leads }
  async createLead(input: LeadInput) { return (await this.request<{ lead: SalesLead }>("/sales-brain/leads", { method: "POST", body: JSON.stringify(input) })).lead }
  async updateLead(id: string, input: Partial<LeadInput>) { return (await this.request<{ lead: SalesLead }>(`/sales-brain/leads/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })).lead }
  async listActivities(leadId: string) { return (await this.request<{ activities: LeadActivity[] }>(`/sales-brain/leads/${encodeURIComponent(leadId)}/activities`)).activities }
  async addActivity(leadId: string, input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">) { return (await this.request<{ activity: LeadActivity }>(`/sales-brain/leads/${encodeURIComponent(leadId)}/activities`, { method: "POST", body: JSON.stringify(input) })).activity }
  async listProducts() { return (await this.request<{ products: SalesProduct[] }>("/sales-brain/products")).products }
  async createProduct(input: SalesProductInput) { return (await this.request<{ product: SalesProduct }>("/sales-brain/products", { method: "POST", body: JSON.stringify(input) })).product }
  async updateProduct(id: string, input: SalesProductInput) { return (await this.request<{ product: SalesProduct }>(`/sales-brain/products/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })).product }
  async deactivateProduct(id: string) { return (await this.request<{ product: SalesProduct }>(`/sales-brain/products/${encodeURIComponent(id)}`, { method: "DELETE" })).product }
  async listLaborRoles() { return (await this.request<{ laborRoles: SalesLaborRole[] }>("/sales-brain/labor-roles")).laborRoles }
  async createLaborRole(input: SalesLaborRoleInput) { return (await this.request<{ laborRole: SalesLaborRole }>("/sales-brain/labor-roles", { method: "POST", body: JSON.stringify(input) })).laborRole }
  async updateLaborRole(id: string, input: SalesLaborRoleInput) { return (await this.request<{ laborRole: SalesLaborRole }>(`/sales-brain/labor-roles/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })).laborRole }
  async deactivateLaborRole(id: string) { return (await this.request<{ laborRole: SalesLaborRole }>(`/sales-brain/labor-roles/${encodeURIComponent(id)}`, { method: "DELETE" })).laborRole }
  async getCostingSettings() { return (await this.request<{ settings: SalesCostingSettings }>("/sales-brain/costing-settings")).settings }
  async updateCostingSettings(input: SalesCostingSettings) { return (await this.request<{ settings: SalesCostingSettings }>("/sales-brain/costing-settings", { method: "PUT", body: JSON.stringify(input) })).settings }
  async listServicePackages() { return (await this.request<{ packages: SalesServicePackage[] }>("/sales-brain/service-packages")).packages }
  async createServicePackage(input: SalesServicePackageInput) { return (await this.request<{ package: SalesServicePackage }>("/sales-brain/service-packages", { method: "POST", body: JSON.stringify(input) })).package }
  async updateServicePackage(id: string, input: SalesServicePackageInput) { return (await this.request<{ package: SalesServicePackage }>(`/sales-brain/service-packages/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })).package }
  async deactivateServicePackage(id: string) { return (await this.request<{ package: SalesServicePackage }>(`/sales-brain/service-packages/${encodeURIComponent(id)}`, { method: "DELETE" })).package }
  async getMyEmployeeProfile() { return (await this.request<{ employee: SalesEmployeeProfile | null }>("/sales-brain/employees/me")).employee }
  async listEmployeeProfiles() { return (await this.request<{ employees: SalesEmployeeProfile[] }>("/sales-brain/employees")).employees }
  async updateEmployeeProfile(username: string, input: Omit<SalesEmployeeProfile, "username" | "updatedAt" | "updatedBy">) { return (await this.request<{ employee: SalesEmployeeProfile }>(`/sales-brain/employees/${encodeURIComponent(username)}`, { method: "PATCH", body: JSON.stringify(input) })).employee }
  async migrateLegacyData() { return (await this.request<{ migration: SalesBrainMigrationResult }>("/sales-brain/migrate", { method: "POST", body: "{}" })).migration }
}
