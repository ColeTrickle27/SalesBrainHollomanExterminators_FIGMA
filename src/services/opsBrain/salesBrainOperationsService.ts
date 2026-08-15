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

export interface SalesBrainOperationsService {
  loadDashboard(): Promise<SalesDashboardData>
  listLeads(): Promise<SalesLead[]>
  createLead(input: LeadInput): Promise<SalesLead>
  updateLead(id: string, input: Partial<LeadInput>): Promise<SalesLead>
  listActivities(leadId: string): Promise<LeadActivity[]>
  addActivity(leadId: string, input: Pick<LeadActivity, "type" | "note" | "happenedAt" | "quoteId">): Promise<LeadActivity>
  listProducts(): Promise<SalesProduct[]>
  createProduct(input: SalesProductInput): Promise<SalesProduct>
  updateProduct(id: string, input: SalesProductInput): Promise<SalesProduct>
  deactivateProduct(id: string): Promise<SalesProduct>
  listLaborRoles(): Promise<SalesLaborRole[]>
  createLaborRole(input: SalesLaborRoleInput): Promise<SalesLaborRole>
  updateLaborRole(id: string, input: SalesLaborRoleInput): Promise<SalesLaborRole>
  deactivateLaborRole(id: string): Promise<SalesLaborRole>
  getCostingSettings(): Promise<SalesCostingSettings>
  updateCostingSettings(input: SalesCostingSettings): Promise<SalesCostingSettings>
  listServicePackages(): Promise<SalesServicePackage[]>
  createServicePackage(input: SalesServicePackageInput): Promise<SalesServicePackage>
  updateServicePackage(id: string, input: SalesServicePackageInput): Promise<SalesServicePackage>
  deactivateServicePackage(id: string): Promise<SalesServicePackage>
  getMyEmployeeProfile(): Promise<SalesEmployeeProfile | null>
  listEmployeeProfiles(): Promise<SalesEmployeeProfile[]>
  updateEmployeeProfile(username: string, input: Omit<SalesEmployeeProfile, "username" | "updatedAt" | "updatedBy">): Promise<SalesEmployeeProfile>
  deleteEmployeeProfile(username: string): Promise<void>
  migrateLegacyData(): Promise<SalesBrainMigrationResult>
}
