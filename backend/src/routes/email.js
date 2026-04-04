const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");
const { sendBookingConfirmation, sendInvoiceEmail, testSmtpConnection } = require("../services/emailService");

router.use(authenticate);

// Get SMTP config (stored in env — returns current state)
router.get("/config", async (req, res) => {
  res.json({
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: "", // never return password
    fromName: process.env.SMTP_FROM_NAME || "Skyline Travel",
    fromEmail: process.env.SMTP_FROM || "noreply@travelagencyweb.com",
  });
});

// Test SMTP connection
router.post("/test", async (req, res) => {
  try {
    const { to } = req.body;
    if (!process.env.SMTP_HOST) {
      return res.json({ success: false, message: "SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to backend .env" });
    }
    const result = await testSmtpConnection({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    });
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Send booking confirmation email
router.post("/send/booking-confirmation", async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId: req.tenantId },
      include: { client: true },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!booking.client?.email) return res.status(400).json({ message: "Client has no email" });

    await sendBookingConfirmation(booking, booking.client.email);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send invoice email
router.post("/send/invoice", async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: req.tenantId },
      include: { client: true },
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    const clientEmail = invoice.client?.email || invoice.clientName;
    if (!clientEmail || !clientEmail.includes("@")) {
      return res.status(400).json({ message: "No valid client email" });
    }

    await sendInvoiceEmail(invoice, clientEmail);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
