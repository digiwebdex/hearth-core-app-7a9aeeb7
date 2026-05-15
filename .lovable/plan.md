
# Full Operation QA Plan — Atom-to-Atom Test

Goal: Systematically exercise every surface of the live app (https://app.travelagencyweb.com + portal + admin) against the VPS backend, log every issue, then fix in priority order.

## Approach

I'll drive the live preview/production with the browser automation tool, hit each route, perform real CRUD actions where safe, and capture: console errors, failing network requests (4xx/5xx), broken UI, missing data, and permission leaks. Findings go into the task tracker with severity (P0 blocker → P3 polish). Then I fix in batches.

## Test Matrix

### 1. Auth & Access Control
- Login (super admin, agency owner, agent, portal client, portal vendor)
- Register new tenant → onboarding flow
- Forgot password → reset password
- Role guards: agent hitting admin route, client hitting agency route
- Token refresh / session persistence on reload
- Logout clears state

### 2. Super Admin (`/admin/*`)
- Dashboard metrics load
- Tenants: list, view details, suspend/activate, impersonate
- Subscriptions: plan changes, trial extension, billing status
- Plans & Features: create/edit plan, toggle feature flags
- Domains: add custom domain, verification status
- Payments: gateway config, transaction list
- SMS templates & logs
- Audit log filtering
- Reports & global settings

### 3. Agency App (`/dashboard` + tenant routes)
- Dashboard widgets, date filters
- Leads: create → assign → convert to quotation
- Quotations: builder, PDF print, send to client, status changes
- Bookings: create from quotation, payment schedule, status flow
- Clients: CRUD, profile, ledger
- Vendors: CRUD, payables, payment record
- Invoices: generate, mark paid, receipt print
- Accounts: receivables, payables, expenses, cash/bank, profitability, ledger
- Hajj/Umrah module
- Tasks, Team, Agents, Roles, Organization
- Reports (sales, payment, vendor, staff, profitability, leads)
- Website customizer + public site preview
- Settings: SMTP, payment gateways, notifications, SMS

### 4. Client/Vendor Portal (`portal.travelagencyweb.com`)
- Portal login + email verify
- My Bookings list & detail
- My Purchase Orders (vendor)
- Payment links (bKash, SSLCommerz callback)

### 5. Public Marketing Site (`travelagencyweb.com`)
- Home, Pricing, Features, FAQ, Contact, Demo, Privacy, Terms
- Tenant subdomain sites (Site* pages) render correctly
- Contact form submits to backend
- Demo request flow

### 6. Cross-cutting
- Subdomain routing (app / portal / tenant slug)
- Subscription gating (trial expired, plan limits)
- Feature gates per plan
- Notification bell (admin + tenant)
- File uploads (logo, attachments) → backend `/uploads`
- Email sending (SMTP) — trigger one and check
- SMS sending — trigger one and check logs
- Mobile responsive spot-check at 375px

## Deliverable

After the sweep:
1. Categorized issue list (P0/P1/P2/P3) with route + repro + network/console evidence
2. Recommendation: fix P0/P1 now in this loop, queue P2/P3 for follow-up
3. After fixes: re-test the failing flows to confirm green

## Notes / Caveats

- I'll need a working super-admin login and at least one agency tenant login on the live system. If you want me to test against production data, please confirm — I'll only do read + safe-create actions (no deletes, no real payments) unless you say otherwise.
- Portal & payment-callback testing needs a real client account; I'll skip destructive payment flows.
- If browser automation is at capacity I'll fall back to direct API curl checks against `api.travelagencyweb.com`.

## Before I start, I need from you

1. **Test credentials** for: super admin, one agency owner, one portal client (email + password). Or create throwaway test accounts I can use.
2. **Scope confirmation**: production (`app.travelagencyweb.com`) or the Lovable preview? Production is more accurate but I'll be extra careful with destructive actions.
3. **Permission to create test data** (a fake lead, quotation, booking) — I'll clean up after, or leave them tagged "QA-TEST" for you to delete.

Reply with the creds + answers and I'll start the sweep immediately.
