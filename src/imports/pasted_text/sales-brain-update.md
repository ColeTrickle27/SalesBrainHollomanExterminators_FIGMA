Update the existing “Sales Brain | Holloman Exterminators” Figma Make project using the requirements below.

This is a focused reconfiguration of the current build. Preserve the existing Holloman branding, inspection workflow, findings, moisture assessment, services, internal costing, quote options, customer presentation, proposal generation, quote history, responsive styling, and reusable design patterns unless this prompt explicitly changes them.

Do not rebuild the application from scratch or unnecessarily redesign working screens.

# 1. Product direction and system ownership

Sales Brain will own and manage its own sales, lead, customer, inspection, quote, pricing, product, proposal, and agreement data.

Do not design around PestPac or assume PestPac API access.

Remove all PestPac wording, PestPac integration references, PestPac sync controls, PestPac statuses, and PestPac-specific fields from the project.

Customer records may optionally map to existing customer folders in Ops Brain using:

- Bill-To Number
- Location Number

These numbers identify the customer’s Bill-To and Location folders inside Ops Brain. They are not PestPac integrations.

Rename this area of the customer record to:

“Ops Brain Customer Folder Mapping”

Include:

- Bill-To Number
- Location Number
- Mapping status: Linked or Not Linked
- An action to find or link an Ops Brain customer folder
- An action to remove or change a folder mapping
- A clear distinction between the Sales Brain customer record and the linked Ops Brain folder

A customer or lead must be allowed to exist in Sales Brain without being mapped to Ops Brain.

Do not require Bill-To or Location numbers before starting an inspection, creating a quote, or saving a lead.

# 2. Remove inventory functionality completely

Sales Brain will not track inventory.

Remove all inventory-related functionality and references throughout the project, including:

- Inventory Import & Mapping
- Inventory quantities
- Stock levels
- On-hand quantities
- Low-stock warnings
- Inventory shortages
- Alternate stock sourcing
- Special-order inventory actions
- Warehouse selection
- Product pull lists
- Stock columns
- Inventory badges
- Inventory-based quote warnings
- Inventory-based approval requirements
- Inventory-related dashboard counts
- Inventory-related audit events
- Inventory data models and mock data

The Job Costing screen may still calculate estimated product cost using:

Product quantity required × catalog cost

This is a cost estimate only. It must not imply that Sales Brain knows whether products are currently in stock.

Rename “Material Plan” to “Estimated Product Usage.”

For each estimated product usage row, show only:

- Product
- Planned quantity
- Unit of measure
- Catalog cost
- Estimated extended cost

# 3. Remove approvals across the project

Remove the approval system and approval-threshold concepts throughout the entire application.

Remove:

- Approvals navigation tab
- Approval notification badge
- Approvals dashboard
- Approval Thresholds administration page
- Pending approval statuses
- Manager approval requirements
- Margin-based approval requirements
- Discount-based approval requirements
- Inventory-based approval requirements
- Approve and Reject actions
- “Needs Review” statuses
- Product approval statuses
- Approved product counts
- Pending product review counts
- Approval-related audit events
- Approval-related mock data and data-model fields

Pricing or margin information may still be shown internally, but it must be informational and must not prevent a user from saving, presenting, sending, or completing a quote.

Do not show any approval-related information in the customer presentation.

# 4. Product Catalog

Retain the Product Catalog and implement complete add, edit, view, and remove functionality.

The Product Catalog must be a centralized reusable source for services, costing, treatment plans, and customer proposals.

Each product must contain:

- Product Name
- Product Description
- Use-Case
- Cost
- Product Image
- Product Label document or link
- SDS document or link
- Warranty Information

Product Label and SDS should be stored as separate document fields so either one can be viewed or downloaded independently.

Products do not need approval statuses or approval workflows.

Create the following Product Catalog screens and states:

## Product Catalog list

Include:

- Search by product name, description, or use-case
- Product image thumbnail
- Product name
- Short description
- Use-case
- Cost
- Label availability
- SDS availability
- Add Product button
- View/Edit action
- Remove action

## Add/Edit Product

Include inputs for every required product field.

Provide:

- Image upload or image selection
- Label upload/link
- SDS upload/link
- Save
- Cancel
- Remove Product, when editing
- Remove confirmation dialog

## Product details

Show all product information in a clear layout with:

- Large product image
- Product description
- Use-case
- Internal product cost
- Warranty information
- View Label
- View SDS
- Edit Product

Product cost is internal-only and must never appear in customer presentation mode or customer-facing proposals.

Product description, use-case, image, Label/SDS links, and warranty information may be included in customer-facing treatment plans when appropriate.

# 5. Pricing Rules administration

Retain Pricing Rules and implement complete add, edit, and remove functionality.

Create a functional Pricing Rules administration experience that uses reusable rule cards and forms.

Each pricing rule should support:

- Stable Rule ID
- Rule Name
- Description
- Applicable Service Type
- Pricing Method
- Unit of Measure
- Base Price or Unit Price
- Optional minimum charge
- Optional recurring price
- Effective date
- End date, if applicable
- Active or Inactive status

Supported pricing methods should include:

- Fixed price
- Per square foot
- Per linear foot
- Per unit
- Per application
- Custom calculation

Pricing Rules must not contain:

- Approval thresholds
- Discount approval limits
- Margin approval requirements
- Inventory requirements

Create:

- Pricing Rules list
- Search and filtering
- Add Pricing Rule
- Edit Pricing Rule
- Remove Pricing Rule
- Remove confirmation
- Active/Inactive control
- Simple calculation preview using example measurements

When a pricing rule is changed, existing signed or previously sent quote versions must retain their original pricing snapshot. New and unsent quotes may use the current active pricing rules.

# 6. Proposal Templates administration

Retain Proposal Templates and implement complete add, edit, preview, and remove functionality.

Each proposal template should support:

- Stable Template ID
- Template Name
- Applicable Service Types
- Default or non-default status
- Proposal title
- Introductory text
- Executive summary format
- Included proposal sections
- Section ordering
- Treatment-plan language
- Product-information display settings
- Warranty section
- Agreement terms
- Signature section
- Proposal expiration period
- Footer/contact information

Create:

- Proposal Templates list
- Add Proposal Template
- Edit Proposal Template
- Live preview
- Reorder proposal sections
- Remove Template
- Remove confirmation

Use reusable data placeholders such as:

- Customer name
- Service address
- Inspection date
- Inspector name
- Findings
- Selected service option
- One-time price
- Recurring price
- Product information
- Warranty information
- Proposal expiration date

Templates must never expose internal product costs, labor costs, margin calculations, formulas, staff notes, or other internal information.

# 7. Open Leads list on the Home screen

Replace the limited “Action Needed” lead preview with a complete “Open Leads” list on the Home screen.

The Home screen must show every currently open lead.

Each lead row or card must display:

- Lead Name
- Service Type
- Date Added
- Most Recent Action / Last Touch Point
- Lead Temperature: Hot, Warm, or Cold
- Quoted or Un-Quoted
- Proposal Value, when quoted

Example service types include:

- Termites
- Moisture Remediation
- General Pest Control
- Bed Bugs
- Fleas
- German Roaches
- Bats
- Rodents
- Wildlife
- Fire Ants
- Mosquitoes
- Carpenter Bees
- Other

Example last-touch entries include:

- Quote sent 8/1/26
- Called lead, scheduled appointment for 8/20/26
- Inspection completed 8/4/26
- Follow-up email sent 8/7/26
- Left voicemail 8/8/26

On desktop, use a clean, scannable table.

On mobile, use compact cards without horizontal scrolling.

Include:

- Search by lead name, phone, email, address, or service type
- Filter by lead temperature
- Filter by service type
- Filter by Quoted or Un-Quoted
- Sort by Date Added
- Sort by Most Recent Action
- Sort by Proposal Value
- Add Lead button
- Open Lead details when a row or card is selected

Do not hide older open leads behind a small “See All” preview. The complete open-lead list belongs on the Home screen, although pagination or incremental loading may be used when the list becomes large.

# 8. Lead record and activity timeline

Create a Lead Details screen.

Each lead should have a stable Lead ID and include:

- Lead name
- Contact name, when different
- Phone
- Email
- Service address
- Service type
- Date added
- Lead source
- Lead temperature
- Quoted or Un-Quoted
- Current proposal value
- Ops Brain Bill-To Number mapping
- Ops Brain Location Number mapping
- Assigned user
- Notes
- Current lead status

Create a chronological activity timeline.

Allow users to manually add activities such as:

- Phone call
- Voicemail
- Email
- Text message
- Appointment scheduled
- Inspection scheduled
- Inspection completed
- Quote created
- Quote sent
- Agreement sent
- Customer follow-up
- General note

The newest timeline event becomes the lead’s “Most Recent Action / Last Touch Point” on the Home screen.

Include actions to:

- Edit Lead
- Change lead temperature
- Add activity
- Schedule appointment
- Start inspection
- Create or open quote
- Send follow-up
- Close lead
- Mark won
- Mark lost

When a quote is created from a lead:

- Keep the original Lead ID
- Link the new Quote ID to the lead
- Automatically change Quoted/Un-Quoted to Quoted
- Display the current proposal value
- Add a “Quote created” timeline event

Do not match or reconnect records using the customer’s name. Use stable IDs.

# 9. Future Gmail and HubSpot lead intake

Prepare the design and data structure for a future Gmail connection, but do not pretend that Gmail, HubSpot, or any outside service is currently connected.

Future inbound workflow:

HubSpot webform lead email received in Gmail  
→ email intake recognizes it as a HubSpot webform submission  
→ Sales Brain creates a new lead  
→ lead appears in Open Leads  
→ the original source and received date are retained

Add future-ready lead fields for:

- Lead source
- External source type
- External message ID
- Source received date
- Original source reference
- Import status

Use the external message ID for duplicate prevention so the same email cannot create the same lead twice.

In the prototype, include a clearly labeled mock example:

“Source: HubSpot Webform via Gmail”

Do not build Gmail authentication or claim the integration is live.

# 10. Future outbound email

Prepare the UI for users to eventually email the following directly from Sales Brain:

- Inspection reports
- Quotes
- Proposals
- Agreements
- Signed documents

Add a “Send to Customer” experience that includes:

- Customer email
- Subject
- Message
- Attachment selection
- Document preview
- Send confirmation
- Sending state
- Sent state
- Failed state
- Retry action

After sending, add an email event to the lead or customer activity timeline.

For now, this is a designed integration-ready workflow using prototype data. Do not claim that Gmail sending is currently connected.

# 11. Agreements and future DocuSign connection

Normal service agreements do not require external signature validation.

For normal agreements, retain a simple Sales Brain acceptance/signature experience.

Include these possible statuses:

- Not Sent
- Sent
- Viewed
- Accepted
- Declined
- Expired

Termite contracts that require validated signatures will eventually be sent through DocuSign.

For termite contracts:

- Show a future “Send with DocuSign” action
- Show “Awaiting Validated Signature” after sending
- Show “Validated and Signed” after completion
- Retain the DocuSign envelope/reference ID in the future-ready data model
- Attach the completed contract to the customer record and activity timeline

Do not build a fake DocuSign authentication connection or show termite contracts as validated unless they have the “Validated and Signed” state.

Do not require DocuSign for ordinary proposals or standard service agreements.

# 12. Quote and agreement lifecycle

Make the workflow explicit:

Lead  
→ Inspection Scheduled  
→ Inspection In Progress  
→ Inspection Complete  
→ Quote Draft  
→ Quote Sent  
→ Customer Viewed  
→ Accepted, Declined, or Expired  
→ Agreement Sent, when required  
→ Signed  
→ Ready for scheduling

Remove every approval step from this lifecycle.

A sent quote must retain a versioned snapshot of:

- Customer
- Location
- Inspection findings
- Selected services
- Product information
- Pricing
- Warranty language
- Proposal template
- Expiration date

Editing a sent or signed quote should create a new revision instead of silently changing the existing document.

# 13. Navigation and responsive behavior

Revise navigation after removing Approvals.

Recommended primary navigation:

- Home
- Active Quote
- Quotes
- Admin

The complete Open Leads list remains on Home.

Use:

- Bottom navigation on mobile
- A compact left navigation rail or desktop-appropriate navigation on larger screens

Do not stretch the mobile bottom navigation across a desktop screen.

Keep the application phone-first for technicians, but ensure administration, product catalog, pricing rules, proposal templates, quote history, and lead management are efficient on desktop.

# 14. Reusable component system

Create or retain reusable components for:

- App header
- Mobile bottom navigation
- Desktop navigation
- Summary metric card
- Lead table
- Lead mobile card
- Lead-temperature badge
- Quoted-status badge
- Activity timeline event
- Search input
- Filter control
- Customer card
- Form field
- Product card
- Product selector
- Product document link
- Pricing-rule card
- Proposal-template card
- Status badge
- Quote option card
- Confirmation dialog
- Empty state
- Loading state
- Error state
- Offline/sync state
- Save/Cancel action bar

Use shared components and variants rather than screen-specific copies.

# 15. Implementation-ready organization

Organize the generated app so it can be transitioned to Codex and integrated into Ops Brain without rebuilding the UI.

Use:

- Small feature-based components
- Clear screen components
- Centralized shared UI components
- Stable IDs for all persistent objects
- Defined data types/interfaces
- Centralized prototype/mock data
- Separate internal and customer-safe data models
- Separate calculation logic from visual components
- Separate document templates from quote records
- Separate integration adapters for future Ops Brain, Gmail, and DocuSign connections

Avoid placing the entire application in one large component.

Suggested feature areas:

- leads
- customers
- ops-brain-mapping
- inspections
- findings
- moisture
- products
- services
- pricing-rules
- quotes
- proposal-templates
- agreements
- documents
- activity-timeline
- administration
- integrations

Future integration placeholders should be clearly separated from functioning prototype features.

# 16. Required states

Add realistic states for:

- No open leads
- No search results
- New unquoted lead
- Quoted lead
- Lead with no recent activity
- Lead imported from HubSpot email
- Customer not linked to Ops Brain
- Customer linked to Ops Brain
- Mapping lookup failed
- Draft inspection
- Offline inspection
- Unsaved changes
- Save success
- Save failure
- Product catalog empty
- Missing product image
- Missing Label or SDS
- Pricing rule empty state
- Proposal template empty state
- Quote draft
- Quote sent
- Quote viewed
- Quote accepted
- Quote declined
- Quote expired
- Agreement sent
- Normal agreement accepted
- Termite contract awaiting DocuSign
- Termite contract validated and signed
- Email sending
- Email sent
- Email failed

# 17. Acceptance criteria

The update is complete only when:

1. No PestPac wording or PestPac integration remains.
2. Bill-To and Location numbers are presented only as Ops Brain folder mappings.
3. No inventory tracking, stock levels, shortage warnings, warehouse controls, or inventory import screens remain.
4. The Product Catalog supports add, edit, view, and remove.
5. Every product includes Product Name, Description, Use-Case, Cost, Image, Label, SDS, and Warranty Information.
6. Products have no approval state.
7. No approval navigation, approval screen, approval threshold, manager-approval requirement, or approval-based blocking remains.
8. Pricing Rules supports add, edit, remove, activate, deactivate, and calculation preview.
9. Proposal Templates supports add, edit, preview, reorder, and remove.
10. The Home screen contains the full Open Leads list with every requested field.
11. Lead details include a working activity timeline and most-recent-action behavior.
12. Creating a quote from a lead updates its quoted status and proposal value.
13. Gmail, HubSpot, and DocuSign are represented only as future integration-ready states.
14. Normal agreements do not require external validation.
15. Termite contracts have a distinct future DocuSign workflow.
16. Customer-facing screens never expose product costs, labor costs, margins, formulas, or staff notes.
17. Mobile screens do not horizontally overflow.
18. Desktop screens use a desktop-appropriate navigation and layout.
19. Existing inspection, findings, moisture, services, quote options, presentation, and document workflows continue to work.
20. The application is structured into reusable, implementation-ready components instead of a single monolithic file.