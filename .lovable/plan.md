
## Phase 1: Verify Deployment Safety
Read and audit: emailService.js, cron.js, auth.js, invoices.js, accounts.js, contact.js, demo.js — confirm all production-safe.

## Phase 2: Payment Gateway Backend
1. **SSLCommerz route** (`backend/src/routes/sslcommerz.js`):
   - POST /initiate — creates session with SSLCommerz API, returns redirect URL
   - POST /success, /fail, /cancel — IPN callbacks
   - POST /ipn — server-to-server validation
   - Links payment to invoice or payment-request
   - Updates invoice/booking/subscription status
   - Audit logs all events

2. **bKash route** (`backend/src/routes/bkash.js`):
   - POST /create — creates bKash payment
   - POST /execute — executes after user approval
   - POST /callback — webhook handler
   - Same linkage and audit logging

3. **Payment gateway service** (`backend/src/services/paymentGateway.js`):
   - Abstraction layer for SSLCommerz + bKash
   - Shared validation, status mapping, invoice/subscription update logic

4. Mount routes in index.js, update frontend PaymentGatewayDialog to use real endpoints

## Phase 3: Communication Abstraction
1. **SMS service** (`backend/src/services/smsService.js`):
   - Provider abstraction (Twilio, local BD providers)
   - sendSms(to, message) with console fallback
   - Templates for booking confirmation, payment received, password reset OTP

2. **WhatsApp service** (`backend/src/services/whatsappService.js`):
   - Provider abstraction (Twilio WhatsApp, WhatsApp Business API)
   - sendWhatsApp(to, template, params) with console fallback

3. **Notification engine** (`backend/src/services/notificationService.js`):
   - Event-based: booking_confirmed, payment_received, subscription_activated, password_reset
   - Dispatches to email + SMS + WhatsApp based on config
   - Non-blocking, error-tolerant

## Files to create/modify
- backend/src/services/paymentGateway.js (new)
- backend/src/routes/sslcommerz.js (new)
- backend/src/routes/bkash.js (new)
- backend/src/services/smsService.js (new)
- backend/src/services/whatsappService.js (new)
- backend/src/services/notificationService.js (new)
- backend/src/index.js (mount new routes)
- src/lib/paymentGatewayApi.ts (update to real endpoints)
- backend/.env.example (add all new env vars)

## Env vars needed
- SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD, SSLCOMMERZ_SANDBOX (payment)
- BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_SANDBOX (payment)
- PAYMENT_SUCCESS_URL, PAYMENT_FAIL_URL, PAYMENT_CANCEL_URL, PAYMENT_IPN_URL (callbacks)
- SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID (SMS)
- WHATSAPP_PROVIDER, WHATSAPP_API_KEY, WHATSAPP_FROM_NUMBER (WhatsApp)
