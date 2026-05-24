const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { authenticate, requirePermission, checkPlanLimit, prisma } = require("../middleware/auth");

const upload = multer({ dest: process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads") });
router.use(authenticate);

router.get("/", requirePermission("bookings", "view"), async (req, res) => {
  try { res.json(await prisma.booking.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id", requirePermission("bookings", "view"), async (req, res) => {
  try {
    const b = await prisma.booking.findFirst({ where: { id: req.params.id, tenantId: req.tenantId }, include: { segments: true, travelers: true, checklist: true } });
    if (!b) return res.status(404).json({ message: "Not found" });
    res.json(b);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/", requirePermission("bookings", "create"), checkPlanLimit("bookings"), async (req, res) => {
  try {
    const data = { ...req.body, tenantId: req.tenantId };
    if (!data.agentId) {
      data.agentId = null;
    } else {
      const agent = await prisma.agent.findFirst({ where: { id: data.agentId, tenantId: req.tenantId }, select: { id: true } });
      if (!agent) data.agentId = null;
    }

    const booking = await prisma.booking.create({ data });
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: user?.name || "", actorEmail: user?.email || "", actorRole: user?.role || "",
        tenantId: req.tenantId, tenantName: tenant?.name || null,
        module: "booking", action: "created",
        targetType: "booking", targetId: booking.id, targetLabel: booking.clientName || booking.destination || booking.id,
      },
    }).catch(() => {});
    res.status(201).json(booking);
  }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id", requirePermission("bookings", "edit"), async (req, res) => {
  try {
    const data = { ...req.body };
    if ("agentId" in data) {
      if (!data.agentId) {
        data.agentId = null;
      } else {
        const agent = await prisma.agent.findFirst({ where: { id: data.agentId, tenantId: req.tenantId }, select: { id: true } });
        if (!agent) data.agentId = null;
      }
    }

    await prisma.booking.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data });
    res.json(await prisma.booking.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id", requirePermission("bookings", "delete"), async (req, res) => {
  try { await prisma.booking.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id/status", requirePermission("bookings", "edit"), async (req, res) => {
  try {
    const old = await prisma.booking.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    await prisma.booking.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status: req.body.status } });
    await prisma.bookingTimelineEvent.create({ data: { bookingId: req.params.id, type: "status_change", content: `Status: ${old.status} → ${req.body.status}`, oldStatus: old.status, newStatus: req.body.status, createdBy: req.userId } });
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: user?.name || "", actorEmail: user?.email || "", actorRole: user?.role || "",
        tenantId: req.tenantId, tenantName: tenant?.name || null,
        module: "booking", action: "status_changed",
        targetType: "booking", targetId: req.params.id, targetLabel: old?.clientName || old?.destination || req.params.id,
        oldValue: old?.status, newValue: req.body.status,
      },
    }).catch(() => {});
    res.json(await prisma.booking.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Segments
router.get("/:id/segments", requirePermission("bookings", "view"), async (req, res) => {
  try { res.json(await prisma.bookingSegment.findMany({ where: { bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/segments", requirePermission("bookings", "create"), async (req, res) => {
  try { res.status(201).json(await prisma.bookingSegment.create({ data: { ...req.body, bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id/segments/:segId", requirePermission("bookings", "delete"), async (req, res) => {
  try { await prisma.bookingSegment.delete({ where: { id: req.params.segId } }); res.json({ success: true }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Travelers
router.get("/:id/travelers", requirePermission("bookings", "view"), async (req, res) => {
  try { res.json(await prisma.bookingTraveler.findMany({ where: { bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/travelers", requirePermission("bookings", "create"), async (req, res) => {
  try { res.status(201).json(await prisma.bookingTraveler.create({ data: { ...req.body, bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id/travelers/:tId", requirePermission("bookings", "delete"), async (req, res) => {
  try { await prisma.bookingTraveler.delete({ where: { id: req.params.tId } }); res.json({ success: true }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Checklist
router.get("/:id/checklist", requirePermission("bookings", "view"), async (req, res) => {
  try { res.json(await prisma.bookingChecklistItem.findMany({ where: { bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/checklist", requirePermission("bookings", "create"), async (req, res) => {
  try { res.status(201).json(await prisma.bookingChecklistItem.create({ data: { ...req.body, bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id/checklist/:itemId", requirePermission("bookings", "edit"), async (req, res) => {
  try {
    const data = { done: req.body.done };
    if (req.body.done) { data.doneAt = new Date(); data.doneBy = req.userId; }
    await prisma.bookingChecklistItem.update({ where: { id: req.params.itemId }, data });
    res.json(await prisma.bookingChecklistItem.findUnique({ where: { id: req.params.itemId } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Timeline
router.get("/:id/timeline", requirePermission("bookings", "view"), async (req, res) => {
  try { res.json(await prisma.bookingTimelineEvent.findMany({ where: { bookingId: req.params.id }, orderBy: { createdAt: "desc" } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/timeline", requirePermission("bookings", "create"), async (req, res) => {
  try { res.status(201).json(await prisma.bookingTimelineEvent.create({ data: { ...req.body, bookingId: req.params.id, createdBy: req.userId } })); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Documents
router.get("/:id/documents", requirePermission("bookings", "view"), async (req, res) => {
  try { res.json(await prisma.bookingDocument.findMany({ where: { bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/documents", requirePermission("bookings", "create"), upload.single("file"), async (req, res) => {
  try {
    const doc = await prisma.bookingDocument.create({ data: { bookingId: req.params.id, name: req.file.originalname, type: req.file.mimetype, url: `/uploads/${req.file.filename}`, uploadedBy: req.userId } });
    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id/documents/:docId", requirePermission("bookings", "delete"), async (req, res) => {
  try { await prisma.bookingDocument.delete({ where: { id: req.params.docId } }); res.json({ success: true }); } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
