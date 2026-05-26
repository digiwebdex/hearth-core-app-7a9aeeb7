# Architecture

```
Visitor (any IP / country)
   │  HTTPS
   ▼
Coolify reverse proxy (Traefik) on VPS 187.77.144.38
   │
   ├── Host: travelagencyweb.com / www / app  ──► travelagencyweb-frontend (nginx:alpine, /usr/share/nginx/html)
   │
   └── Host: api.travelagencyweb.com          ──► travelagencyweb-api (node:20, Express + Prisma, :3027)
                                                       │
                                                       ├── Postgres ──► travelagencyweb-postgres (:5432, internal)
                                                       ├── Uploads  ──► /srv/travelagencyweb/data/uploads (bind)
                                                       └── Logs     ──► /srv/travelagencyweb/data/logs   (bind)
```

- No Lovable runtime dependency. No Supabase. No external DB or object storage.
- Frontend reads only `VITE_API_URL` at build time (baked into the bundle).
- Backend reads `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`, `LOG_DIR`, `PUBLIC_UPLOAD_URL`.
- DB and API container ports are never published to the public internet; only Traefik:443 is.

## Multi-tenancy
The API is multi-tenant. Each tenant is a row in `Tenant` with a slug and optional custom domain. Custom domains are resolved by `src/lib/domainResolver.ts` on the frontend and `routes/domains.js` on the backend. This is independent of the VPS infrastructure.
