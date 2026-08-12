/** A service offered by the Sales Brain Pricebook. Prices are stored as integer cents. */
export interface PricebookService {
  id: string
  name: string
  description: string
  price: number
  category: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PricebookServiceInput {
  name: string
  description: string
  price: number
  category: string
}
