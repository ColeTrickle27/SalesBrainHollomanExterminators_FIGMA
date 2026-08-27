import type {
  QuoteEngineCalculation,
  QuoteEngineInput,
} from "../../types/quote-engine"
import { OpsBrainAuthError } from "./errors"
import type { OpsBrainClientConfig } from "./httpCustomerFilesService"
import type { QuoteEngineService } from "./quoteEngineService"

type QuoteEngineResponse = { calculation: QuoteEngineCalculation }

/** Same-origin, session-authenticated client for the canonical Quote Engine. */
export class HttpQuoteEngineService implements QuoteEngineService {
  private readonly config: OpsBrainClientConfig

  constructor(config: OpsBrainClientConfig) {
    this.config = config
  }

  async calculate(input: QuoteEngineInput): Promise<QuoteEngineCalculation> {
    const response = await fetch(
      `${this.config.baseUrl}/api/sales-brain/quote/calculate`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    )
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error(
        "Ops Brain returned an unexpected (non-JSON) Quote Engine response.",
      )
    }
    const error = (payload as { error?: string } | undefined)?.error
    if (!response.ok) {
      if (response.status === 401) throw new OpsBrainAuthError(error)
      throw new Error(
        error || `Ops Brain Quote Engine request failed (${response.status}).`,
      )
    }
    const calculation = (payload as QuoteEngineResponse).calculation
    if (!calculation) {
      throw new Error("Ops Brain returned an incomplete Quote Engine response.")
    }
    return calculation
  }
}
