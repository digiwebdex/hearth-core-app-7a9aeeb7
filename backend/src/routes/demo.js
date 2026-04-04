const router = require("express").Router();
const { prisma } = require("../middleware/auth");
const { sendDemoRequestConfirmation, sendDemoRequestNotification } = require("../services/emailService");

// Public — no auth required
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, company, teamSize, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const demo = await prisma.demoRequest.create({
      data: { name, email, phone: phone || null, company: company || null, teamSize: teamSize || null, message: message || null },
    });

    // Send confirmation + admin notification (non-blocking)
    sendDemoRequestConfirmation({ name, email, company, teamSize }).catch(() => {});
    sendDemoRequestNotification({ name, email, phone, company, teamSize, message }).catch(() => {});

    res.status(201).json({ success: true, id: demo.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
