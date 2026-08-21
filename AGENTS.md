# BugMan Sales Brain

## Purpose

This repository is the source implementation for Holloman Exterminators' SalesBrain tool.

SalesBrain is the sales workflow, inspection findings, recommendations, quoting, costing, and proposal module of Holloman Ops Brain.

The production application is mounted inside OpsBrain at:

`/sales-brain/`

Treat this repository as a production business application. Preserve working behavior, OpsBrain integration, employee usability, customer data, and the mounted build process.

---

# Core Working Rules

## Prefer the smallest safe change

- Change only what is required for the current task.
- Do not rewrite working features when a localized fix will work.
- Do not refactor unrelated code.
- Do not make unrelated styling, naming, dependency, formatting, or architecture changes.
- Preserve existing behavior unless the requested task explicitly replaces it.

If a larger architectural improvement would be useful but is not required for the task, report it separately.

## One task, one scope

Prefer:

`one task → one branch → one pull request`

Do not combine unrelated features, fixes, cleanup, refactors, or experiments.

If another issue is discovered, fix it only if it blocks or safely completes the current task. Otherwise report it separately.

---

# Technology Standard

The established SalesBrain stack is:

- React
- TypeScript
- Vite
- Tailwind CSS v4

Continue using this stack.

Do not introduce another:

- frontend framework
- programming language
- build system
- state-management framework
- database
- storage platform
- deployment platform

without explicit approval.

Do not rewrite SalesBrain into another framework for convenience.

Use existing React and TypeScript patterns before adding new architectural layers.

---

# Development Environment

## Figma Make

When running inside Figma Make, a Vite development server may already be provided by the environment and hot reload may already be active.

Do not start unnecessary duplicate development servers in that environment.

## Local / Codex development

Do not assume a development server is already running.

Use the repository's supported commands:

```bash
pnpm install
pnpm dev
```

Use the actual current environment rather than assuming Figma Make behavior applies everywhere.

---

# Key Files and Structure

Important areas include:

- `src/App.tsx` — application composition root
- `src/features/sales/` — centralized sales workflow state and related logic
- `src/components/` — UI components organized by domain
- `src/types/` — shared domain models
- `src/services/` — integration boundaries
- `src/main.tsx` — React entry point
- `src/index.css` — global styles and Tailwind import
- `package.json` — dependencies and scripts
- `vite.config.ts` — Vite configuration
- `.mise.toml` — toolchain versions when present

Prefer adding behavior to the appropriate existing domain rather than accumulating unrelated logic in the composition root.

---

# OpsBrain Relationship

OpsBrain is the platform and integration boundary.

OpsBrain owns or should increasingly own shared business capabilities including:

- authentication
- permissions
- customer/location lookup
- persistent operational data
- file storage
- company-wide employee identity
- shared integrations
- shared backend APIs

SalesBrain should consume those capabilities through OpsBrain APIs instead of creating duplicate systems.

Do not create independent SalesBrain implementations of:

- customer databases
- login/authentication
- user roles
- file-storage conventions
- company-wide customer identity
- shared operational records

when OpsBrain already owns or is intended to own them.

---

# API Boundary

SalesBrain should communicate with shared and persistent business data through OpsBrain `/api/*` routes.

Do not make browser code directly responsible for privileged:

- D1 access
- R2 access
- API secrets
- provider credentials
- email credentials
- electronic-signature credentials
- PestPac credentials

Keep privileged operations on the server.

Prefer stable API contracts over direct knowledge of OpsBrain's internal storage implementation.

SalesBrain should not need to care whether an OpsBrain API internally uses D1, R2, PestPac, or another approved provider unless that implementation detail is genuinely required.

---

# Customer Identity

Preserve Holloman's Bill-To / Location customer structure.

Do not create an incompatible SalesBrain-only customer identity model.

When SalesBrain records relate to an existing customer, preserve stable references where available to:

- Bill-To number
- Location number
- applicable OpsBrain customer/location identifiers

Design customer-related data so future PestPac synchronization remains practical.

---

# PestPac

PestPac remains Holloman Exterminators' operational system of record for customer, location, service, scheduling, billing, service-history, and related pest-control operational data unless explicitly [...]

SalesBrain does not independently own those workflows.

Do not duplicate PestPac-owned:

- scheduling
- billing
- service history
- recurring-service records

unless explicitly requested.

Do not write to PestPac unless PestPac integration is explicitly in scope.

---

# Data Ownership

## Structured records

Use approved OpsBrain backend APIs and structured data storage for records such as:

- leads
- sales activity
- quotes
- quote status
- pricebook data
- costing settings
- recommendations
- proposal metadata

Do not introduce a second database without explicit approval.

## Files

Use approved OpsBrain/R2 storage for:

- photos
- PDFs
- proposals
- graph files
- document attachments
- other file artifacts

Do not unnecessarily embed large binary data in structured records.

Do not expose private files through public URLs.

---

# Styling and UI

SalesBrain uses Tailwind CSS v4.

Use Tailwind utility classes directly in JSX where consistent with the existing codebase.

The existing SalesBrain visual shell should be treated as established unless a task explicitly requests a redesign.

Do not casually redesign:

- header
- sidebar
- workflow navigation
- primary colors
- typography
- major layout structure
- established workflow cards

Preserve visual consistency while making feature-level changes.

If a formal architecture/design document is later restored to the repository, follow its approved UI rules where they do not conflict with this file.

---

# Employee Workflow

SalesBrain is used during real inspection and sales workflows.

Prioritize:

- clear progression
- minimal unnecessary typing
- obvious next actions
- mobile/tablet usability
- understandable terminology
- fast data entry
- preservation of entered information
- clear error feedback
- clear distinction between internal and customer-facing information

Do not optimize for developer elegance at the expense of field usability.

---

# Internal vs Customer-Facing Information

Maintain a strict boundary between internal business information and customer-facing output.

Internal-only information may include:

- estimated product cost
- labor assumptions
- margins
- internal notes
- costing calculations
- internal recommendation reasoning

Do not expose internal costing, margins, or notes in customer-facing proposals unless explicitly requested.

Customer-facing wording should be accurate, understandable, professional, human-sounding, and free from unsupported promises.

---

# Findings and Recommendations

Do not fabricate:

- inspection findings
- customers
- pricing
- quote status
- service history
- operational information

Demo or fallback information may be used only when clearly identified as development/demo behavior.

Production behavior must never silently substitute demo findings for real inspection data.

Findings and recommendations should remain reviewable and editable by the salesperson or inspector.

AI-assisted recommendations may support human decisions but must not silently make regulated pesticide, treatment, pricing, or service decisions.

---

# Pricing and Costing

Treat pricing and costing as business-critical information.

Do not silently change:

- pricing formulas
- product costs
- labor assumptions
- margins
- service-package logic
- recommendation pricing

When changing pricing behavior:

1. Identify the actual source/formula being changed.
2. Preserve unaffected calculations.
3. Add or update appropriate tests.
4. Verify representative quote totals.

Do not create hidden competing sources of truth for company pricing.

---

# BugMan Graphs Integration

SalesBrain may consume BugMan Graphs information through approved OpsBrain integration boundaries.

Prefer structured graph data through a stable API contract.

Do not depend on compiled Flutter implementation details.

Graph markers and findings may inform SalesBrain findings and recommendations, but:

- preserve human review
- do not silently overwrite salesperson input
- do not invent missing findings
- allow correction and override

---

# State Management

Prefer existing React state/context patterns.

Do not introduce Redux, Zustand, MobX, or another state-management library unless existing patterns cannot reasonably support the requirement and the change is explicitly approved.

Avoid maintaining duplicate copies of the same business state in unrelated components.

Preserve entered user data while navigating workflow steps unless clearing it is intentional.

---

# Components

Prefer reusable components when they clearly improve:

- consistency
- maintainability
- repeated behavior
- testing

Do not create abstractions solely for abstraction's sake.

Keep business logic separate from purely visual components where practical.

---

# Mounted Application Rules

This repository is the source of truth for SalesBrain UI development.

Production mounted output is generated with:

```bash
pnpm run build:mounted
```

The resulting build must remain compatible with:

`/sales-brain/`

Do not make normal SalesBrain feature changes by hand-editing the compiled files under the OpsBrain repository's:

`public/sales-brain/`

Correct workflow:

1. Modify SalesBrain source in this repository.
2. Test it here.
3. Run the standard build.
4. Run the mounted build.
5. Copy the generated mounted output into OpsBrain.
6. Run OpsBrain validation.
7. Verify the OpsBrain branch preview.
8. Merge or deploy only with explicit authorization.

The compiled OpsBrain copy is deployment output, not development source.

---

# Dependencies

Before adding a production dependency:

1. Confirm React, TypeScript, browser APIs, or existing dependencies cannot reasonably solve the requirement.
2. Prefer small, actively maintained packages.
3. Avoid multiple libraries solving the same problem.
4. Explain why the dependency is necessary.

Do not add a framework or large dependency merely to simplify a small feature.

---

# Security

Never expose in browser code or committed files:

- API keys
- Cloudflare secrets
- service tokens
- authentication secrets
- Gmail credentials
- electronic-signature credentials
- PestPac credentials
- private provider keys

Assume all browser code is visible to the user.

Server authorization must protect privileged actions even when the frontend hides or disables the corresponding UI.

---

# Development Workflow

## Before editing

1. Understand the requested behavior.
2. Inspect the existing implementation.
3. Identify the smallest affected area.
4. Identify related components and APIs.
5. Identify data, integration, security, and regression risks.
6. Review existing tests.
7. Choose the smallest safe implementation.

Do not begin by redesigning the application.

## During implementation

- Keep changes tightly scoped.
- Follow existing React/TypeScript patterns.
- Preserve OpsBrain API compatibility.
- Preserve mounted `/sales-brain/` behavior.
- Add or update meaningful tests.
- Avoid unrelated cleanup.

---

# Required Validation

For normal SalesBrain changes, run as applicable:

```bash
pnpm test
pnpm run build
```

For changes intended for OpsBrain deployment, also run:

```bash
pnpm run build:mounted
```

For UI work, manually verify the affected workflow.

Automated tests do not replace visual verification.

If a check is skipped, explain why.

---

# OpsBrain Handoff

Before declaring a SalesBrain change production-ready:

1. Confirm SalesBrain tests pass.
2. Confirm the normal build passes.
3. Confirm `build:mounted` passes.
4. Replace the OpsBrain mounted SalesBrain output using the generated build.
5. Run the OpsBrain repository's required validation.
6. Verify SalesBrain from the OpsBrain Cloudflare preview.
7. Confirm authentication and `/api/*` integration still work.
8. Do not merge or deploy production without explicit authorization.

---

# Git and Pull Requests

Use a dedicated branch for each task.

Do not reuse an old feature branch for unrelated work.

A pull request should include:

## What changed
Concise implementation summary.

## Why
The business/workflow problem being solved.

## Validation
Exactly which tests and builds were run.

## Manual verification
What should be clicked or tested.

## OpsBrain handoff
Whether the mounted SalesBrain build needs to be updated in OpsBrain.

## Deployment requirements
Any API, D1, R2, secret, binding, migration, or configuration requirements.

## Not in scope
Important related behavior intentionally left unchanged.

Do not merge or deploy production without explicit authorization.

---

# Review Rules

Review changes for:

## Regression risk
Existing SalesBrain behavior changed unnecessarily.

## Workflow regressions
The salesperson's workflow became slower, harder, or less obvious.

## Architecture drift
New frameworks, databases, storage systems, dependencies, or duplicate OpsBrain capabilities.

## Customer identity
Bill-To / Location compatibility was weakened.

## Data ownership
SalesBrain began owning information that belongs in OpsBrain or PestPac.

## Internal-data exposure
Customer-facing output may expose cost, margin, internal notes, or internal reasoning.

## Fabricated data
Production behavior may use demo/fallback operational information.

## API coupling
SalesBrain relies on OpsBrain implementation details rather than a stable API.

## Mounted-build compatibility
The application may fail under `/sales-brain/`.

## Missing validation
Appropriate tests, builds, or visual verification were skipped.

---

# Decision Priority

When multiple solutions work, prefer:

1. Protect existing functionality and business data.
2. Preserve the employee sales workflow.
3. Preserve OpsBrain integration.
4. Preserve future PestPac compatibility.
5. Keep the React/TypeScript architecture simple.
6. Reuse existing APIs, components, and patterns.
7. Minimize new dependencies and technologies.
8. Reduce future maintenance burden.
9. Optimize developer cleverness last.

If a requested change conflicts with these rules, explain the concern and recommend the safer path rather than silently redesigning the system.
