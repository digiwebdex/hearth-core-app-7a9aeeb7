

## Production Verification Plan — Critical & High Priority

Based on codebase inspection, here are the findings and fixes needed.

---

### CRITICAL BLOCKERS

#### 1. OG Image Dimension Mismatch
- **Status: FAIL**
- **Finding**: `og-share-v2.png` is **1376x768** but `index.html` declares `og:image:width=1200` and `og:image:height=630`
- **Root cause**: Image was generated at wrong dimensions
- **Files to fix**: `public/images/og-share-v2.png` (regenerate at exactly 1200x630), verify `index.html` meta tags match
- **Impact**: Facebook/LinkedIn may crop or reject the image; Twitter may show incorrectly

#### 2. Old Brand References Still Present (4 files)
- **Status: FAIL**
- **Finding**: "Skyline" and "GLOBEX" still appear in:
  - `backend/src/services/notificationService.js` line 75: `"Skyline Travel"` in email subject
  - `src/components/SmtpSettings.tsx` line 100: placeholder `"Skyline Travel"`
  - `src/pages/admin/AdminSettings.tsx` line 324: placeholder `"GLOBEX Travel"`
  - `src/pages/admin/AdminSettings.tsx` line 584: placeholder `"GLOBEX"`
  - `src/pages/admin/AdminDomains.tsx` line 219: path `/var/www/skyline-frontend/dist`
- **Root cause**: Incomplete find-and-replace during branding pass
- **Files to fix**: All 4 files above

#### 3. Stale Asset: `public/images/og-image.jpg`
- **Status: FAIL**
- **Finding**: Old `og-image.jpg` exists in `public/images/` but is referenced nowhere — dead asset that could cause confusion
- **Fix**: Delete `public/images/og-image.jpg`

---

### HIGH PRIORITY CHECKS

#### 4. SEO Metadata Consistency
- **Status: PASS**
- `index.html`: canonical, og:url → `travelagencyweb.com` ✓
- `sitemap.xml`: all URLs → `travelagencyweb.com` ✓
- `robots.txt`: sitemap → `travelagencyweb.com` ✓
- JSON-LD: brand name, URL, offers all correct ✓

#### 5. MarketingLayout Dynamic Meta Tags
- **Status: PASS**
- `PUBLISHED_DOMAIN` set to `hearth-core-app.lovable.app` for OG image reachability ✓
- Dynamic updates for og:title, og:description, og:url, og:image, twitter:*, canonical ✓
- All 8 marketing pages pass title/description props ✓

#### 6. Social Crawler Reachability
- **Status: PASS (with caveat)**
- OG image URL points to `hearth-core-app.lovable.app` which is publicly reachable ✓
- **Caveat**: Once `travelagencyweb.com` DNS is live, update `PUBLISHED_DOMAIN` in MarketingLayout.tsx and all `index.html` image URLs

#### 7. Frontend Route Coverage
- **Status: PASS**
- All marketing pages (`/`, `/features`, `/pricing`, `/demo`, `/contact-us`, `/faq`, `/privacy`, `/terms`) routed in App.tsx ✓
- Auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`) routed ✓

---

### FIXES TO IMPLEMENT (3 items)

| # | Fix | Files |
|---|-----|-------|
| 1 | Regenerate `og-share-v2.png` at exactly 1200x630 | `public/images/og-share-v2.png` |
| 2 | Replace old brand placeholders in 4 files | `notificationService.js`, `SmtpSettings.tsx`, `AdminSettings.tsx`, `AdminDomains.tsx` |
| 3 | Delete stale `public/images/og-image.jpg` | Delete file |

### POST-FIX BROWSER TESTING

After fixes, manually verify:
1. Homepage loads with correct logo and brand name in navbar/footer
2. Share preview: publish app, paste URL into [Facebook Debugger](https://developers.facebook.com/tools/debug/) — confirm 1200x630 image renders
3. Navigate to `/pricing`, `/features`, `/faq` — confirm no old brand names visible
4. Check admin settings page — confirm placeholder text shows new brand

