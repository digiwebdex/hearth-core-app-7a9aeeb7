## Subdomain Architecture + Minimal Customer/Supplier Portal

Set up reserved subdomains and build a minimal portal with magic-link login.

### 1. Subdomain routing (`src/lib/domainResolver.ts`)
- Add `RESERVED_SUBDOMAINS = ['app', 'portal', 'api', 'www', 'admin']`
- Extend `DomainResolution.type` with `"portal"` and `"app"`
- In `resolveHostname()`: if subdomain is `app` → main agency app; if `portal` → portal; reserved subdomains never treated as agency slug

### 2. Routing (`src/App.tsx`)
- Detect `portal.*` hostname → mount `<PortalApp />` (separate route tree)
- Detect `app.*` hostname → existing agency/admin routes
- Root domain → marketing site

### 3. Portal frontend (new files)
- `src/portal/PortalApp.tsx` — route tree
- `src/portal/pages/PortalLogin.tsx` — email input → request magic link
- `src/portal/pages/PortalVerify.tsx` — consumes `?token=...` → sets session
- `src/portal/pages/MyBookings.tsx` — customer bookings list
- `src/portal/pages/MyPurchaseOrders.tsx` — supplier POs list
- `src/portal/PortalLayout.tsx` — minimal nav (Bookings / POs / Logout)
- `src/lib/portalApi.ts` — calls to `/api/portal/*`

### 4. Backend (Node/Express + Prisma)
- `backend/src/routes/portal.js`:
  - `POST /portal/auth/request-link` — issue signed token, email it
  - `POST /portal/auth/verify` — exchange token for JWT (audience: `portal`)
  - `GET /portal/bookings` — bookings where `client.email = user.email`
  - `GET /portal/purchase-orders` — POs where `vendor.email = user.email`
- `backend/src/middleware/portalAuth.js` — verify portal JWT
- Reuse existing email service for magic link delivery

### 5. Infrastructure (docs only — no code change required immediately)
- DNS: A records for `app`, `portal`, `api` → VPS IP
- Nginx server blocks for each subdomain → same Vite build (frontend distinguishes by hostname); `api.*` → Node backend on port 4000
- `.env.example`: add `VITE_APP_DOMAIN=travelagencyweb.com`

### Technical notes
- Portal uses a **separate JWT audience** (`portal`) so portal tokens cannot access agency endpoints
- Client/Vendor lookup is by email match — no separate `portal_users` table needed initially
- Magic link token: signed JWT, 15-min expiry, single-use (track jti in memory or DB)
- Portal session JWT: 7-day expiry, stored in localStorage under `portal_token`

### Out of scope (future)
- Online payment from portal
- Document uploads from supplier
- Multi-agency portal accounts (currently one email = one agency context, picked from latest booking)
