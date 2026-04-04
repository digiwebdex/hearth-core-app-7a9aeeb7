---
name: Production Readiness Pass
description: Post-P2 verification, demo/contact backends, centralized SMTP, nodemailer added
type: feature
---

## Phase 1: P0-P2 Verification (all confirmed connected)
- ✅ Forgot password: auth.js → emailService.js → ForgotPassword.tsx/ResetPassword.tsx → api.ts
- ✅ Auto-transaction on invoice payment: invoices.js creates Transaction record
- ✅ Profitability endpoint: GET /accounts/profitability with date filters
- ✅ Audit logs: login, logout, invoice create/payment, lead conversion, subscription approval
- ✅ All routes mounted in index.js, all pages in App.tsx

## Phase 2: New Production Items
1. **Demo form backend**: POST /api/demo-requests (public, no auth) → saves DemoRequest + sends confirmation email
2. **Contact form backend**: POST /api/contact (public, no auth) → saves ContactSubmission + sends confirmation email
3. **Centralized email service**: `backend/src/services/emailService.js` — all email sending via nodemailer with console fallback
4. **nodemailer added**: backend/package.json dependency
5. **Email routes**: GET/POST /api/email/* for SMTP config, test, booking/invoice email sending
6. **Frontend connected**: Demo.tsx, ContactUs.tsx, SiteContact.tsx all call real publicApi endpoints

## Schema Changes
- Added DemoRequest model (name, email, phone, company, teamSize, message, status)
- Added ContactSubmission model (name, email, phone, subject, message, tenantSlug, status)

## Still Needs External Infrastructure
- **SMTP**: Add SMTP_HOST, SMTP_USER, SMTP_PASS to backend .env for real emails
- **Payment Gateway**: SSLCommerz/bKash — frontend PaymentGatewayDialog.tsx exists, backend needs real gateway integration
- **SMS/WhatsApp**: smsApi.ts, smsAutomation.ts, smsTemplateApi.ts exist on frontend — backend SMS provider not integrated
- **ADMIN_NOTIFICATION_EMAIL**: Set in .env to receive demo/contact alerts

## VPS Deploy Steps
1. `cd backend && npm install` (adds nodemailer)
2. `npx prisma db push` (adds DemoRequest + ContactSubmission tables)
3. Add env vars to .env (SMTP_*, ADMIN_NOTIFICATION_EMAIL, FRONTEND_URL)
4. `pm2 restart skyline-api`
