const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { authenticate, requireSuperAdmin, prisma } = require("../middleware/auth");

router.use(authenticate);
router.use(requireSuperAdmin);

// Create tenant manually (super admin)
router.post("/tenants", async (req, res) => {
  try {
    const {
      tenantName, ownerName, ownerEmail, ownerPassword,
      ownerPhone, ownerWhatsapp,
      companyPhone, companyWhatsapp, companyAddress, companyCity, companyCountry, companyWebsite, companyNotes,
      subscriptionPlan = "basic",
      subscriptionStatus = "active",
      subscriptionMonths = 1,
    } = req.body;

    if (!tenantName || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ message: "tenantName, ownerName, ownerEmail and ownerPassword are required" });
    }

    const exists = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const rawSlug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    let slug = rawSlug || "tenant";
    let suffix = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${rawSlug}-${suffix++}`;
    }

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(subscriptionMonths || 1));

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName, slug,
        phone: companyPhone || null,
        whatsapp: companyWhatsapp || null,
        address: companyAddress || null,
        city: companyCity || null,
        country: companyCountry || null,
        website: companyWebsite || null,
        notes: companyNotes || null,
        subscriptionPlan, subscriptionStatus,
        subscriptionExpiry: expiry,
      },
    });

    const hashed = await bcrypt.hash(ownerPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: ownerName, email: ownerEmail, password: hashed, role: "tenant_owner",
        phone: ownerPhone || null, whatsapp: ownerWhatsapp || null,
        tenantId: tenant.id,
      },
    });
    await prisma.tenant.update({ where: { id: tenant.id }, data: { ownerId: user.id } });

    const actor = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: actor?.name || "", actorEmail: actor?.email || "", actorRole: actor?.role || "",
        tenantId: tenant.id, tenantName: tenant.name,
        module: "admin", action: "tenant_created",
        targetType: "tenant", targetId: tenant.id, targetLabel: tenant.name,
        newValue: JSON.stringify({ plan: subscriptionPlan, status: subscriptionStatus, months: subscriptionMonths }),
      },
    }).catch(() => {});

    res.json({ tenant, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// All tenants
router.get("/tenants", async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, bookings: true } },
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      },
    });
    res.json(tenants);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get("/tenants/:id", async (req, res) => {
  try {
    const t = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        _count: { select: { users: true, bookings: true, clients: true, invoices: true } },
      },
    });
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Only allow safe fields for admin tenant update
const ADMIN_ALLOWED_TENANT_FIELDS = [
  "name", "subscriptionPlan", "subscriptionStatus", "subscriptionExpiry",
];

router.patch("/tenants/:id", async (req, res) => {
  try {
    const data = {};
    for (const key of ADMIN_ALLOWED_TENANT_FIELDS) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    res.json(await prisma.tenant.update({ where: { id: req.params.id }, data }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const [tenants, users, bookings, revenue] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);
    res.json({
      totalTenants: tenants,
      totalUsers: users,
      totalBookings: bookings,
      totalRevenue: revenue._sum.amount || 0,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Payment requests
router.get("/payment-requests", async (req, res) => {
  try {
    res.json(await prisma.paymentRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { name: true } } },
    }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch("/payment-requests/:id", async (req, res) => {
  try {
    const { status, reviewerComment } = req.body;
    const updateData = { status };
    if (reviewerComment !== undefined) updateData.reviewerComment = reviewerComment;
    if (status === "approved" || status === "rejected") {
      updateData.processedAt = new Date();
    }

    const pr = await prisma.paymentRequest.update({ where: { id: req.params.id }, data: updateData });

    // If approved, activate the tenant's subscription
    if (status === "approved") {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (pr.plan === "enterprise" ? 12 : pr.plan === "business" ? 12 : pr.plan === "pro" ? 6 : 1));
      await prisma.tenant.update({
        where: { id: pr.tenantId },
        data: {
          subscriptionPlan: pr.plan,
          subscriptionStatus: "active",
          subscriptionExpiry: endDate,
        },
      });
    }

    // Audit log — subscription approval/rejection
    const actor = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    const tenant = await prisma.tenant.findUnique({ where: { id: pr.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: actor?.name || "", actorEmail: actor?.email || "", actorRole: actor?.role || "",
        tenantId: pr.tenantId, tenantName: tenant?.name || null,
        module: "subscription", action: status === "approved" ? "payment_approved" : "payment_rejected",
        targetType: "paymentRequest", targetId: pr.id, targetLabel: `${pr.plan} - ${pr.amount}`,
        newValue: JSON.stringify({ status, plan: pr.plan, amount: pr.amount, reviewerComment }),
      },
    }).catch(() => {});

    res.json(pr);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
