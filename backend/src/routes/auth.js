const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { authenticate, prisma, SECRET } = require("../middleware/auth");

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId, role: user.role }, SECRET, { expiresIn: "7d" });
    const { password: _, resetToken: _r, resetTokenExpiry: _e, ...safeUser } = user;

    // Audit log — login
    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: user.id, actorName: user.name, actorEmail: user.email, actorRole: user.role,
        tenantId: user.tenantId, tenantName: tenant?.name || null,
        module: "auth", action: "login",
        targetType: "user", targetId: user.id, targetLabel: user.email,
        ipAddress: req.headers["x-forwarded-for"]?.toString()?.split(",")[0] || req.ip || null,
      },
    }).catch(() => {});

    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register (creates tenant + user with 14-day Pro trial)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, tenantName } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);

    // 14-day Pro trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Generate slug from tenant name
    const rawSlug = (tenantName || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    let slug = rawSlug;
    let suffix = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${rawSlug}-${suffix++}`;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName || name + "'s Agency",
        slug,
        subscriptionPlan: "pro",
        subscriptionStatus: "trial",
        subscriptionExpiry: trialEnd,
      },
    });
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "tenant_owner", tenantId: tenant.id },
    });
    await prisma.tenant.update({ where: { id: tenant.id }, data: { ownerId: user.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id, actorName: name, actorEmail: email, actorRole: "tenant_owner",
        tenantId: tenant.id, tenantName: tenant.name,
        module: "auth", action: "created",
        targetType: "tenant", targetId: tenant.id, targetLabel: tenant.name,
        newValue: "pro (14-day trial)",
      },
    }).catch(() => {});

    const token = jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role }, SECRET, { expiresIn: "7d" });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, resetToken: _r, resetTokenExpiry: _e, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot Password — generates reset token
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send password reset email (SMTP or console fallback)
    const { sendPasswordReset } = require("../services/emailService");
    await sendPasswordReset(email, resetToken);

    res.json({ message: "If an account exists with that email, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password — validates token and updates password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });

    // Audit log
    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: user.id, actorName: user.name, actorEmail: user.email, actorRole: user.role,
        tenantId: user.tenantId, tenantName: tenant?.name || null,
        module: "auth", action: "password_reset",
        targetType: "user", targetId: user.id, targetLabel: user.email,
      },
    }).catch(() => {});

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout audit (optional — called by frontend)
router.post("/logout", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true, tenantId: true } });
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: user?.name || "", actorEmail: user?.email || "", actorRole: user?.role || "",
        tenantId: req.tenantId, tenantName: tenant?.name || null,
        module: "auth", action: "logout",
        targetType: "user", targetId: req.userId, targetLabel: user?.email || "",
        ipAddress: req.headers["x-forwarded-for"]?.toString()?.split(",")[0] || req.ip || null,
      },
    }).catch(() => {});
    res.json({ message: "Logged out" });
  } catch (err) {
    res.json({ message: "Logged out" });
  }
});

module.exports = router;
