/** Resolve server-owned links against the API host, preserving mounted use. */
export function resolveOpsBrainUrl(path: string, baseUrl: string): string {
  return baseUrl ? new URL(path, baseUrl).href : path
}

export function opsBrainUrl(path = "/"): string {
  return resolveOpsBrainUrl(path, import.meta.env?.VITE_OPS_BRAIN_BASE_URL ?? "")
}
