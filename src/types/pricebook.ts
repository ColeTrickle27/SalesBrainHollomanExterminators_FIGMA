/** A service offered by the Sales Brain Pricebook. Prices are stored as integer cents. */
export interface PricebookService {
  id: string
  name: string
  description: string
  price: number
  category: string
  priceBy: "per_lf" | "per_sf" | "per_acre" | "per_bedroom" | "variable"
  productIds: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PricebookServiceInput {
  name: string
  description: string
  price: number
  category: string
  priceBy: PricebookService["priceBy"]
  productIds: string[]
}
