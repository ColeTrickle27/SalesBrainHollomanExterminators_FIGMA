import { spawn } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const child = spawn(process.execPath, [resolve(import.meta.dirname, "../node_modules/vite/bin/vite.js"), "build"], {
  stdio: "inherit",
  env: { ...process.env, MOUNT_BASE_PATH: "/sales-brain/" },
})

child.on("exit", async (code) => {
  if (code !== 0) {
    process.exitCode = code ?? 1
    return
  }

  try {
    const indexPath = resolve(import.meta.dirname, "../dist/index.html")
    const html = await readFile(indexPath, "utf8")
    await writeFile(indexPath, html.replace(/[ \t]+$/gm, ""), "utf8")
  } catch (error) {
    console.error("Unable to finalize the mounted SalesBrain build.", error)
    process.exitCode = 1
  }
})
