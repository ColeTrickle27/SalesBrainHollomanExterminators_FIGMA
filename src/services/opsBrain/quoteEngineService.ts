import type {
  QuoteEngineCalculation,
  QuoteEngineInput,
} from "../../types/quote-engine"

/** Focused boundary for OpsBrain's authoritative quote calculation. */
export interface QuoteEngineService {
  calculate(input: QuoteEngineInput): Promise<QuoteEngineCalculation>
}
