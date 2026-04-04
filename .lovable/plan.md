## Social Preview Verification — Findings & Fixes

### Issues Found

| # | Issue | Severity |
|---|-------|----------|
| 1 | **OG image is 1024×1024 JPEG** but `og:image:width/height` says 1200×630 — dimension mismatch | High |
| 2 | **Filename not versioned** — social platforms cache aggressively; old square image may persist | Medium |
| 3 | **JSON-LD logo** uses `travelagencyweb.com/images/logo.png` but OG images use `hearth-core-app.lovable.app` — inconsistent reachability | Low |
| 4 | **SPA limitation** — social crawlers only see static `index.html` meta tags, not JS-rendered per-page metadata from MarketingLayout. Subpage shares (e.g. `/pricing`) will show homepage OG data | Known limitation |

### What's Already Correct ✅
- `og:url` and `canonical` → `travelagencyweb.com` ✅
- `og:title`, `og:description`, `twitter:title`, `twitter:description` → correct ✅
- `twitter:card` = `summary_large_image` ✅
- `sitemap.xml` and `robots.txt` → `travelagencyweb.com` ✅
- All 8 marketing pages pass title/description to MarketingLayout ✅
- No old brand domain references remain ✅

### Fixes to Apply

1. **Regenerate OG image** at exactly 1200×630 as `og-share-v2.png`
2. **Update all references** in `index.html` and `MarketingLayout.tsx` to use `og-share-v2.png`
3. **Update JSON-LD logo** to use `hearth-core-app.lovable.app` for reachability (until custom domain is live)
4. **Delete old `og-share.png`** to avoid confusion

### Files Changed
- `public/images/og-share-v2.png` (new)
- `public/images/og-share.png` (deleted)
- `index.html`
- `src/components/MarketingLayout.tsx`

### SPA Note (no code fix)
Social crawlers (Facebook, Twitter, LinkedIn, WhatsApp) fetch HTML server-side and do NOT execute JavaScript. So MarketingLayout's dynamic meta updates only help in-browser (e.g., Google SPA rendering). For per-page social previews, you'd need SSR or pre-rendering — out of scope for now. The homepage metadata will apply to all shared URLs, which is acceptable.
