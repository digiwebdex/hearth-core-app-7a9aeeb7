---
name: Infrastructure & Payment Readiness
description: Payment gateway backends (SSLCommerz/bKash/COD), SMS/WhatsApp services, notification engine
type: feature
---

## Payment Gateway Backend
- **Unified router**: `/api/payments/initiate` dispatches to SSLCommerz, bKash, or COD
- **SSLCommerz**: `/api/payments/sslcommerz/` — initiate, success, fail, cancel, IPN callbacks
- **bKash**: `/api/payments/bkash/` — create, callback (with token grant + execute)
- **COD**: Instant confirmation via unified initiate endpoint
- **Shared service**: `paymentGateway.js` — handles invoice/booking/subscription updates, auto-creates Transaction, audit logs
- **Frontend**: `paymentGatewayApi.ts` already correctly points to `/payments/initiate`, `/payments/status/:id`, `/payments/callback/:gateway`

## Communication Services
- **SMS**: `smsService.js` — Twilio + BulkSMSBD + console fallback, with message templates
- **WhatsApp**: `whatsappService.js` — Twilio WhatsApp + Meta Cloud API + console fallback
- **Notification engine**: `notificationService.js` — event-based dispatch (booking_confirmed, payment_received, subscription_activated, etc.)

## Webhook/Callback URLs to Configure
- SSLCommerz IPN: `https://api.travelagencyweb.com/api/payments/sslcommerz/ipn`
- SSLCommerz Success: `https://api.travelagencyweb.com/api/payments/sslcommerz/success`
- SSLCommerz Fail: `https://api.travelagencyweb.com/api/payments/sslcommerz/fail`
- SSLCommerz Cancel: `https://api.travelagencyweb.com/api/payments/sslcommerz/cancel`
- bKash Callback: `https://api.travelagencyweb.com/api/payments/bkash/callback`

## Files Created
- backend/src/services/paymentGateway.js
- backend/src/routes/sslcommerz.js
- backend/src/routes/bkash.js
- backend/src/routes/payments.js
- backend/src/services/smsService.js
- backend/src/services/whatsappService.js
- backend/src/services/notificationService.js
