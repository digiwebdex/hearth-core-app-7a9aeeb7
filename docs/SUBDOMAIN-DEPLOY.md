# Subdomain Deployment Guide

Adds `app.travelagencyweb.com` (agency staff + super admin) and
`portal.travelagencyweb.com` (customer / supplier portal) without
touching the existing Nginx server blocks.

The existing config already matches `*.travelagencyweb.com`, so both
subdomains are served by the same Vite build. The frontend
(`src/main.tsx` + `src/lib/domainResolver.ts`) decides which app to
mount based on `window.location.hostname`.

---

## 1. DNS (Hostinger / Cloudflare / wherever your DNS lives)

Add two A records pointing at your VPS IP:

```
Type   Name     Value
A      app      <YOUR_VPS_IP>
A      portal   <YOUR_VPS_IP>
```

`api.travelagencyweb.com` should already exist. If not, add it the
same way.

Wait 2–10 minutes for propagation, then verify:

```bash
dig +short app.travelagencyweb.com
dig +short portal.travelagencyweb.com
```

Both should return your VPS IP.

---

## 2. SSL certificate (Let's Encrypt / Certbot)

Extend your existing certificate to cover the new hostnames:

```bash
sudo certbot --nginx \
  -d travelagencyweb.com \
  -d www.travelagencyweb.com \
  -d app.travelagencyweb.com \
  -d portal.travelagencyweb.com \
  -d api.travelagencyweb.com
```

Certbot edits the existing Nginx server blocks in place — no manual
config changes required.

If you use a wildcard cert (`*.travelagencyweb.com`), nothing to do.

---

## 3. Backend `.env` updates

On the VPS, edit `/var/www/skyline-backend/.env`:

```
CORS_ORIGIN=https://travelagencyweb.com,https://www.travelagencyweb.com,https://app.travelagencyweb.com,https://portal.travelagencyweb.com
PORTAL_URL=https://portal.travelagencyweb.com
```

Then restart the API:

```bash
pm2 restart skyline-backend
```

---

## 4. Frontend build env

Make sure `VITE_APP_DOMAIN=travelagencyweb.com` is set when the frontend
is built (already in `.env.example`). Rebuild and deploy as usual via
`deploy.sh` / GitHub Actions.

---

## 5. Smoke test

| URL                                       | Expected                              |
|-------------------------------------------|---------------------------------------|
| `https://travelagencyweb.com`             | Marketing site                        |
| `https://app.travelagencyweb.com/login`   | Agency staff login                    |
| `https://portal.travelagencyweb.com/login`| Magic-link portal login               |
| `https://api.travelagencyweb.com/api/health` | `{ "status": "ok" }`               |
| `https://noapara-visa.travelagencyweb.com`| Agency public website (existing)      |

To test the portal end-to-end:

1. In the agency app, open a Client and confirm it has a real email.
2. Visit `https://portal.travelagencyweb.com/login`, enter that email.
3. Check the inbox (or backend logs if SMTP is not configured) for the
   magic link, click it, and you should land on **My Bookings**.
4. Repeat with a Vendor email to see **Purchase Orders**.

---

## Troubleshooting

- **`portal.*` shows the agency app instead of the portal**
  → `VITE_APP_DOMAIN` was not set at build time, so `isPortalHost()`
  returns false. Rebuild with the env var set.

- **CORS error from portal calling API**
  → `portal.travelagencyweb.com` missing from `CORS_ORIGIN`. Restart
  PM2 after editing.

- **Magic-link email never arrives**
  → SMTP not configured. The link is logged to the backend console:
  `pm2 logs skyline-backend | grep EMAIL-LOG`.

- **"No portal access for this email"**
  → No Client or Vendor row in the database has that email. Portal
  identity is purely email-based.
