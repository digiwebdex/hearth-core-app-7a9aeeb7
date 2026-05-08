---
name: Subdomain architecture & portal
description: Reserved subdomains (app/portal/api), portal app uses separate JWT audience, mounted via main.tsx hostname check
type: feature
---
**Subdomains** (VITE_APP_DOMAIN=travelagencyweb.com):
- `travelagencyweb.com` — marketing
- `app.*` — agency staff + super admin (main App.tsx)
- `portal.*` — customer/supplier portal (src/portal/PortalApp.tsx)
- `api.*` — Express backend
- `{slug}.*` — agency public website

**Reserved subdomains** in `src/lib/domainResolver.ts`: `RESERVED_SUBDOMAINS = ['app','portal','api','www','admin']` — never treated as agency slug.

**Portal mounting**: `src/main.tsx` checks `isPortalHost()` and renders `PortalApp` instead of `App`. Each has its own `BrowserRouter`.

**Portal auth**: Magic-link via `POST /api/portal/auth/request-link` → email with 15-min JWT (audience `portal-magic`) → `POST /api/portal/auth/verify` returns 7-day session JWT (audience `portal`). Token stored in `localStorage.portal_token` (separate namespace from agency `token`).

**Identity**: email-based. `customer` role if Client.email matches, `supplier` if Vendor.email matches. Both possible.

**Endpoints**: `GET /api/portal/bookings` (customer), `GET /api/portal/purchase-orders` (supplier, returns VendorBills). Middleware: `backend/src/middleware/portalAuth.js` enforces `audience: portal`.

**Nginx**: `app.*`, `portal.*`, and `{slug}.*` all serve the same Vite build; frontend distinguishes by hostname. `api.*` proxies to Node on :4000.
