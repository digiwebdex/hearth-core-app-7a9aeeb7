/**
 * Public tenant API — no auth required.
 * Used by tenant marketing sites, custom-domain landing pages,
 * and the website customizer's public preview.
 */
const router = require("express").Router();
const { prisma } = require("../middleware/auth");

// Strip protocol, www., trailing slash, lowercase.
function normalizeDomain(d) {
  return String(d || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

// Map a Tenant DB row to the public-safe shape the frontend expects.
function publicTenant(t) {
  if (!t) return null;
  let socialLinks;
  try {
    socialLinks = t.notes && t.notes.startsWith("{") ? JSON.parse(t.notes)?.socialLinks : undefined;
  } catch { socialLinks = undefined; }
  return {
    id: t.id,
    name: t.name,
    slug: t.slug || t.id,
    logo: undefined,
    description: undefined,
    phone: t.phone || undefined,
    email: undefined,
    address: [t.address, t.city, t.country].filter(Boolean).join(", ") || undefined,
    website: t.website || undefined,
    socialLinks,
  };
}

function publicPackage(p) {
  let highlights = [];
  if (p.highlights) {
    try { highlights = JSON.parse(p.highlights); }
    catch { highlights = String(p.highlights).split("\n").map(s => s.trim()).filter(Boolean); }
  }
  return {
    id: p.id,
    name: p.name,
    description: p.notes || "",
    price: p.packagePrice || 0,
    duration: p.duration || "",
    image: undefined,
    type: p.type || "umrah",
    highlights,
  };
}

// ── GET /api/public/:slug — tenant by slug ──
router.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    if (!slug) return res.status(400).json({ message: "Slug required" });
    const tenant = await prisma.tenant.findFirst({ where: { slug } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(publicTenant(tenant));
  } catch (e) {
    console.error("public/:slug error", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/public/:slug/packages — tenant packages by slug ──
router.get("/:slug/packages", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    const tenant = await prisma.tenant.findFirst({ where: { slug }, select: { id: true } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    const packages = await prisma.hajjPackage.findMany({
      where: { tenantId: tenant.id, status: { not: "archived" } },
      orderBy: { createdAt: "desc" },
    });
    res.json(packages.map(publicPackage));
  } catch (e) {
    console.error("public/:slug/packages error", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/public/domain/:domain — tenant by custom domain ──
router.get("/domain/:domain", async (req, res) => {
  try {
    const domain = normalizeDomain(req.params.domain);
    if (!domain) return res.status(400).json({ message: "Domain required" });
    const td = await prisma.tenantDomain.findFirst({
      where: { domain, status: "active" },
      include: { tenant: true },
    });
    // Fallback: any status (so unverified domains still preview)
    const record = td || await prisma.tenantDomain.findFirst({
      where: { domain },
      include: { tenant: true },
    });
    if (!record?.tenant) return res.status(404).json({ message: "Domain not found" });
    res.json(publicTenant(record.tenant));
  } catch (e) {
    console.error("public/domain/:domain error", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/public/domain/:domain/packages — packages by custom domain ──
router.get("/domain/:domain/packages", async (req, res) => {
  try {
    const domain = normalizeDomain(req.params.domain);
    const td = await prisma.tenantDomain.findFirst({
      where: { domain },
      select: { tenantId: true },
    });
    if (!td) return res.status(404).json({ message: "Domain not found" });
    const packages = await prisma.hajjPackage.findMany({
      where: { tenantId: td.tenantId, status: { not: "archived" } },
      orderBy: { createdAt: "desc" },
    });
    res.json(packages.map(publicPackage));
  } catch (e) {
    console.error("public/domain/:domain/packages error", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
