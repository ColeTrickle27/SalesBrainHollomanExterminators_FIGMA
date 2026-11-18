# DEACTIVATED — SalesBrain

**Replaced by [BugMan Quotes](https://github.com/ColeTrickle27/BugMan-Quotes).**  
**Owner-confirmed status: November 18, 2026.**

SalesBrain is deactivated. BugMan Quotes is the active replacement for Holloman's quoting workflow. This repository is retained as legacy source and history; it is not the current sales/quoting application or a future standalone product rollout.

The **HubSpot leads live feed is the only remaining useful SalesBrain component identified by the owner**. It can be displayed elsewhere if needed. Keeping that feed available does not make the rest of SalesBrain active. Relocating it is separate work and has not been completed by this documentation change.

## Current ownership

- **Active quoting:** [ColeTrickle27/BugMan-Quotes](https://github.com/ColeTrickle27/BugMan-Quotes).
- **Operations hub and existing shared APIs:** [Holloman Ops Brain](https://github.com/ColeTrickle27/holloman-ops-brain).
- **Drawings and measurements:** [BugMan Graphs](https://github.com/ColeTrickle27/BugManGraphs).
- **This repository:** Deactivated SalesBrain source, historical integration reference, and the legacy HubSpot leads feed.

Existing source, saved records, API routes, mounted assets, and feed wiring are retained. This status label does not assert that every old URL has been taken offline or that the GitHub repository has been archived.

## Superseded rollout plans

The earlier plan to activate standalone SalesBrain at `sales.holloman-ext.com` is superseded. Old SalesBrain ownership tables, build instructions, and deployment plans describe historical work and are not an active roadmap. New quote-related development belongs in BugMan Quotes.

## Legacy technical reference

The retained source uses React, TypeScript, Vite, and Tailwind CSS v4. Existing OpsBrain connections and the `/sales-brain/` mount are legacy compatibility details.

For explicitly scoped inspection or maintenance of retained code:

```sh
pnpm install
pnpm dev
pnpm test
pnpm run build
```

The historical `build:mounted` and `build:standalone` scripts remain in source for reproducibility. Their presence is not authorization or a requirement to publish or reactivate SalesBrain. The previous documentation remains available in Git history.

See [AGENTS.md](AGENTS.md) for the same deactivation status and retained maintenance safeguards.
