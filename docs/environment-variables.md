# Environment Variables

Single source of truth: `/srv/travelagencyweb/app/.env` (used by `docker compose`). Coolify also has its own UI env editor — keep both in sync if you use Coolify resources.

## Required
| Name | Where | Example |
|---|---|---|
| `POSTGRES_DB` | compose | `travelagencyweb_db` |
| `POSTGRES_USER` | compose | `travelagencyweb_user` |
| `POSTGRES_PASSWORD` | compose, api | strong random |
| `JWT_SECRET` | api | 64-char random |
| `CORS_ORIGIN` | api | `https://travelagencyweb.com,https://www.travelagencyweb.com,https://app.travelagencyweb.com,https://portal.travelagencyweb.com` |
| `VITE_API_URL` | frontend build-arg | `https://api.travelagencyweb.com` |

## Optional but recommended
| Name | Purpose |
|---|---|
| `CRON_SECRET` | Protects `/api/cron/*` |
| `SMTP_*` | Outbound email (notifications, magic links) |
| `ADMIN_NOTIFICATION_EMAIL` | Demo/contact form alerts |
| `PUBLIC_UPLOAD_URL` | Absolute URL prefix for uploaded files |
| `FRONTEND_URL`, `API_BASE_URL`, `PORTAL_URL` | Used inside emails and payment callbacks |

## Payment gateways (only if used)
- `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX`
- `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_SANDBOX`

## SMS / WhatsApp (only if used)
- `SMS_PROVIDER`, `TWILIO_*`, `SMS_API_KEY`, `SMS_SENDER_ID`
- `WHATSAPP_PROVIDER`, `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_ID`

**Never commit `.env`.** `backend/.gitignore` and `.dockerignore` already exclude it.
