const router = require("express").Router();
const { prisma } = require("../middleware/auth");
const { sendContactConfirmation, sendContactNotification } = require("../services/emailService");

// Public — no auth required
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message, tenantSlug } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    const submission = await prisma.contactSubmission.create({
      data: { name, email, phone: phone || null, subject: subject || null, message, tenantSlug: tenantSlug || null },
    });

    // Send confirmation + admin notification (non-blocking)
    sendContactConfirmation({ name, email, subject }).catch(() => {});
    sendContactNotification({ name, email, phone, subject, message, tenantSlug }).catch(() => {});

    res.status(201).json({ success: true, id: submission.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
