# SalesBrain for Holloman Exterminators

SalesBrain is an independent sales, leads, quotes, proposals, and signatures application. This repository owns its source and builds. OpsBrain is the operations hub.

The current production delivery still uses the compatibility mount `/sales-brain/` inside OpsBrain. Keep it working until a standalone deployment and authenticated API workflow are verified. A standalone frontend build alone does not establish that readiness.

BugManGraphs owns graphing, measurements, and site plans. Inventory owns inventory. holloman-mcp and shared APIs are the shared integration layer. Preserve existing OpsBrain API contracts and PestPac record ownership. The future inspection app will be a separate named product. Never import sibling app source or edit their compiled assets as development source.

## Local development

```sh
pnpm install
pnpm dev
```

The app uses protected OpsBrain `/api/*` routes through its configured API base URL for authentication, Customer Files, saved estimates, quote photos, the Sales Brain Pricebook, and BugMan Graphs. Development mode can display local fallback findings, but production does not fabricate customers, quotes, pricing, or operational status.

## Mounted production build

```sh
pnpm run build:mounted
```

This produces `dist/` with a `/sales-brain/` base path. Replace the contents of Ops Brain's `public/sales-brain/` directory with that output, then run the Ops Brain build and route checks.

## Runtime boundaries

- Ops Brain owns authentication and persistent operating data.
- Customer-facing presentation and proposal views exclude product cost estimates and internal notes.
- Product usage is an estimate only; SalesBrain does not track inventory or implement approval gates.
- PestPac is not connected to this application. Scheduling, billing, service history, and other PestPac-owned workflows remain outside SalesBrain.
- HubSpot, Gmail, DocuSign, Product Catalog, Pricing Rules, and Proposal Templates are future integration domains unless a screen explicitly identifies a live service.

## Standalone delivery (prepared, production cutover pending)

Run `pnpm run build:standalone` to produce a root-hosted `dist/` for `sales.holloman-ext.com`. It sets real HTTP adapters, the API origin `https://ops.holloman-ext.com`, and the graph origin `https://graphs.holloman-ext.com`. These public URLs are not credentials. Provider secrets and all storage bindings stay on the API host.

Deploy the matching OpsBrain origin-policy change before activating this frontend. Employees sign in through the existing Holloman sign-in in a separate tab, keep their draft open, then select **Check sign-in**. Requests include the existing host-scoped session cookie; no browser token or new identity system is introduced. The new origin must be same-site HTTPS in production.

For isolated preview testing, set `VITE_OPS_BRAIN_BASE_URL` and `VITE_BUGMAN_GRAPHS_URL` at build time and match `SALES_BRAIN_APP_ORIGIN` on the isolated OpsBrain API. The checked-in Pages CSP permits the production API/graph hosts; an alternate hosted preview must explicitly configure its matching CSP. Never point a write test at production data.

The Cloudflare Pages project/custom domain is pending a coordinated production release. Publish `dist/`, preserve the SPA redirects and security headers, and verify sign-in, customer lookup, save/reopen, graph handoff, protected photos/documents, and provider status before switching the OpsBrain hub build. The older mounted build remains a rollback path until that verification passes.
