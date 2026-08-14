import type {
  PricebookService,
  PricebookServiceInput,
} from "../../types/pricebook"
import type { SalesBrainPricebookService } from "./salesBrainPricebookService"

const INITIAL_SERVICES: PricebookServiceInput[] = [
  {
    name: "Whole-home protection",
    description: "Best value · annual coverage",
    price: 184000,
    category: "Protection",
    priceBy: "variable",
    productIds: [],
  },
  {
    name: "Targeted treatment",
    description: "Focus on active areas",
    price: 126000,
    category: "Treatment",
    priceBy: "variable",
    productIds: [],
  },
  {
    name: "Protection + repairs",
    description: "Long-term property care",
    price: 218500,
    category: "Protection",
    priceBy: "variable",
    productIds: [],
  },
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
function idFor(index: number) {
  return `preview-pricebook-${index + 1}`
}

/** In-memory dev adapter. It is never selected by default in production builds. */
export class MockSalesBrainPricebookService
  implements SalesBrainPricebookService
{
  private readonly services = new Map<string, PricebookService>(
    INITIAL_SERVICES.map((service, index) => {
      const now = "2026-01-01T00:00:00.000Z"
      const record: PricebookService = {
        id: idFor(index),
        ...service,
        active: true,
        createdAt: now,
        updatedAt: now,
      }
      return [record.id, record]
    }),
  )

  async listServices(): Promise<PricebookService[]> {
    return [...this.services.values()]
      .sort(
        (a, b) =>
          Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
      )
      .map(clone)
  }

  async createService(input: PricebookServiceInput): Promise<PricebookService> {
    const now = new Date().toISOString()
    const service: PricebookService = {
      id: crypto.randomUUID().replace(/[^A-Za-z0-9_-]/g, ""),
      ...clone(input),
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    this.services.set(service.id, service)
    return clone(service)
  }

  async updateService(
    id: string,
    input: PricebookServiceInput,
  ): Promise<PricebookService> {
    const existing = this.services.get(id)
    if (!existing) throw new Error("Pricebook service not found.")
    const service = {
      ...existing,
      ...clone(input),
      updatedAt: new Date().toISOString(),
    }
    this.services.set(id, service)
    return clone(service)
  }

  async deactivateService(id: string): Promise<PricebookService> {
    const existing = this.services.get(id)
    if (!existing) throw new Error("Pricebook service not found.")
    const service = {
      ...existing,
      active: false,
      updatedAt: new Date().toISOString(),
    }
    this.services.set(id, service)
    return clone(service)
  }
}
