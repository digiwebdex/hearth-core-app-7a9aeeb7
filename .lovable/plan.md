
## Phase 1: Verify P0-P2 Fixes

1. **Forgot password flow** — Check auth.js has forgot-password/reset-password routes, frontend pages exist, API lib has methods, Login has link
2. **Auto-transaction on invoice payment** — Check invoices.js POST /:id/payments creates Transaction record
3. **Accounts profitability** — Check accounts.js GET /profitability with date filters
4. **Audit logs** — Verify login/logout/invoice-create/invoice-payment/lead-conversion/subscription-approval all create auditLog entries
5. **Route wiring** — Check index.js mounts all routes, App.tsx has all page routes

## Phase 2: Missing Production Items

1. **Demo form backend** — New route `POST /api/demo-requests` to save demo form submissions to DB + send email notification
2. **Contact form backend** — New route `POST /api/contact` to save contact form submissions + send email notification  
3. **Schema** — Add DemoRequest and ContactSubmission models to Prisma
4. **SMTP email service** — Create `backend/src/services/emailService.js` using nodemailer, centralize all email sending
5. **Frontend wiring** — Connect Demo.tsx and ContactUs.tsx + SiteContact.tsx to real API endpoints
6. **Nodemailer** — Already in package.json or needs adding; ensure consistent usage across auth.js and new email service

## Files to change
- backend/prisma/schema.prisma (add DemoRequest, ContactSubmission)
- backend/src/services/emailService.js (new — centralized SMTP)
- backend/src/routes/contact.js (new)
- backend/src/routes/demo.js (new)
- backend/src/index.js (mount new routes)
- src/pages/marketing/Demo.tsx (connect to API)
- src/pages/marketing/ContactUs.tsx (connect to API)
- src/pages/site/SiteContact.tsx (connect to API)
- src/lib/api.ts or src/lib/publicApi.ts (add API methods)
- backend/src/routes/auth.js (refactor to use emailService)
