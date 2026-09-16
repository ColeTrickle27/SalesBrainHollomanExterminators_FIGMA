import { spawnSync } from "node:child_process"
import { resolve } from "node:path"

const env = {
  ...process.env,
  MOUNT_BASE_PATH: "/",
  VITE_OPS_BRAIN_BASE_URL: process.env.VITE_OPS_BRAIN_BASE_URL || "https://ops.holloman-ext.com",
  VITE_BUGMAN_GRAPHS_URL: process.env.VITE_BUGMAN_GRAPHS_URL || "https://graphs.holloman-ext.com",
}
for (const name of ["CUSTOMER_FILES", "CUSTOMER_IDENTITY", "CURRENT_USER", "SALES_BRAIN_ESTIMATES", "SALES_BRAIN_PRICEBOOK", "SALES_BRAIN_OPERATIONS", "BUGMAN_GRAPHS"]) env[`VITE_${name}_MODE`] = "http"
const result = spawnSync(process.execPath, [resolve(import.meta.dirname, "../node_modules/vite/bin/vite.js"), "build"], { env, stdio: "inherit" })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
