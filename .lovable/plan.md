
# Full Branding Update Plan

## Brand Mapping
| Old | New |
|---|---|
| Globex Connect | Travel Agency Website & Software Solution |
| GLOBEX CONNECT | TRAVEL AGENCY WEB |
| GLOBEX | TAWSS |
| Skyline Travel | Travel Agency Website & Software Solution |
| Skyline | TAWSS |
| globexconnect.com | travelagencyweb.com |
| support@globexconnect.com | support@travelagencyweb.com |
| noreply@globexconnect.com | noreply@travelagencyweb.com |
| noreply@travelagencyweb.com | noreply@travelagencyweb.com (keep) |
| info@skylinetravel.com | info@travelagencyweb.com |
| DigiWebDex | Travel Agency Website & Software Solution |
| skyline-backend | tawss-backend |
| Skyline API | TAWSS API |
| Tagline | Complete Travel Agency Website & Software Solution |

## Logo Asset
- Copy uploaded `Logo.png` → `src/assets/logo.png` + `public/images/logo.png`
- Generate favicon from logo
- Replace Globe icon usage with actual logo image in nav/headers

## Files to Update (27 files)

### 1. HTML & SEO (1 file)
- `index.html` — title, meta, OG tags, Twitter cards, JSON-LD, canonical URL, favicon

### 2. Marketing Pages (7 files)
- `src/pages/Index.tsx` — hero, testimonials, FAQ, CTA, dialog, meta
- `src/pages/marketing/Terms.tsx` — all Globex/DigiWebDex refs
- `src/pages/marketing/Privacy.tsx` — all Globex/DigiWebDex refs
- `src/pages/marketing/ContactUs.tsx` — email
- `src/pages/marketing/Demo.tsx` — if brand mentioned
- `src/pages/marketing/FAQ.tsx` — if brand mentioned
- `src/pages/marketing/Features.tsx` — if brand mentioned
- `src/pages/marketing/Pricing.tsx` — if brand mentioned

### 3. Layouts (2 files)
- `src/components/MarketingLayout.tsx` — nav brand, footer, canonical URL, contact email
- `src/components/PublicLayout.tsx` — if brand hardcoded

### 4. Admin & App (4 files)
- `src/pages/admin/AdminSettings.tsx` — default emails, domain, brand
- `src/pages/admin/AdminDomains.tsx` — nginx template path
- `src/components/AdminSidebar.tsx` — brand name
- `src/components/AppSidebar.tsx` — brand name

### 5. SEO Files (2 files)
- `public/sitemap.xml` — all domain refs
- `public/robots.txt` — sitemap URL

### 6. Backend (7 files)
- `backend/src/services/emailService.js` — all Skyline refs, from email
- `backend/src/services/smsService.js` — Skyline refs
- `backend/src/index.js` — console log brand
- `backend/package.json` — name
- `backend/.env.example` — from email, from name
- `backend/prisma/seed.js` — admin tenant name, demo email
- `backend/src/routes/email.js` — default from name

### 7. Frontend Lib/Context (3 files)
- `src/contexts/WebsiteContext.tsx` — demo tenant data
- `src/lib/auditLog.ts` — seed email
- `src/lib/notificationEngine.ts` — system email

### 8. Other (2 files)
- `src/pages/site/SitePricing.tsx` — GLOBEX brand
- `.env.example` — domain comments
- `src/components/SmtpSettings.tsx` — placeholder email
- `src/pages/QuotationPrint.tsx` — agency name placeholder

### 9. Logo integration
- `src/components/MarketingLayout.tsx` — replace Globe icon with logo image
- `src/components/AdminSidebar.tsx` — add logo
- `src/components/AppSidebar.tsx` — add logo

## NOT Changed (preserve)
- Business logic, routes, API paths
- Payment gateway callbacks (use FRONTEND_URL env var already)
- Database schema
- Component structure

## Env vars user must update on VPS
- `SMTP_FROM_NAME=Travel Agency Website & Software Solution`
- `SMTP_FROM=noreply@travelagencyweb.com`
- `FRONTEND_URL=https://travelagencyweb.com`
- `ADMIN_NOTIFICATION_EMAIL=support@travelagencyweb.com`
