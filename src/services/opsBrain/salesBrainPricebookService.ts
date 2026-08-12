import type {
  PricebookService,
  PricebookServiceInput,
} from "../../types/pricebook"

/** Pricebook persistence boundary. UI components use this contract, never fetch directly. */
export interface SalesBrainPricebookService {
  listServices(): Promise<PricebookService[]>
  createService(input: PricebookServiceInput): Promise<PricebookService>
  updateService(
    id: string,
    input: PricebookServiceInput,
  ): Promise<PricebookService>
  deactivateService(id: string): Promise<PricebookService>
}
