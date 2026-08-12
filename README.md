# SalesBrain for Holloman Exterminators

This repository is the source implementation for the SalesBrain tool mounted inside Holloman Ops Brain at `/sales-brain/`.

## Local development

```sh
pnpm install
pnpm dev
```

The app expects the same-origin Ops Brain `/api/*` routes for authentication, Customer Files, saved estimates, quote photos, the Sales Brain Pricebook, and BugMan Graphs. Development mode can display local fallback findings, but production does not fabricate customers, quotes, pricing, or operational status.

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
