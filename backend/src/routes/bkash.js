/**
 * bKash Payment Gateway Route
 * Handles token grant, payment creation, execution, and callbacks
 *
 * Requires env vars:
 * - BKASH_APP_KEY
 * - BKASH_APP_SECRET
 * - BKASH_USERNAME
 * - BKASH_PASSWORD
 * - BKASH_SANDBOX (true/false)
 * - API_BASE_URL (for callback URLs)
 */
const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");
const { handlePaymentSuccess, auditPaymentEvent, getCallbackUrls } = require("../services/paymentGateway");

const BKASH_APP_KEY = () => process.env.BKASH_APP_KEY || "";
const BKASH_APP_SECRET = () => process.env.BKASH_APP_SECRET || "";
const BKASH_USERNAME = () => process.env.BKASH_USERNAME || "";
const BKASH_PASSWORD = () => process.env.BKASH_PASSWORD || "";
const IS_SANDBOX = () => process.env.BKASH_SANDBOX !== "false";
const API_URL = () => IS_SANDBOX()
  ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout"
  : "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout";

// In-memory token cache (production should use Redis)
let tokenCache = { token: null, refreshToken: null, expiresAt: 0 };

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(`${API_URL()}/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username: BKASH_USERNAME(),
      password: BKASH_PASSWORD(),
    },
    body: JSON.stringify({ app_key: BKASH_APP_KEY(), app_secret: BKASH_APP_SECRET() }),
  });
  const data = await res.json();

  if (data.id_token) {
    tokenCache = {
      token: data.id_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000 - 60000, // refresh 1 min early
    };
    return data.id_token;
  }
  throw new Error(data.msg || "bKash token grant failed");
}

function bkashHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: token,
    "X-APP-Key": BKASH_APP_KEY(),
  };
}

// POST /api/payments/bkash/create — authenticated
router.post("/create", authenticate, async (req, res) => {
  try {
    const { invoiceId, paymentRequestId, amount, customerPhone } = req.body;

    if (!BKASH_APP_KEY() || !BKASH_APP_SECRET()) {
      return res.status(503).json({ message: "bKash not configured. Add BKASH_APP_KEY and BKASH_APP_SECRET to .env" });
    }

    const token = await getToken();
    const urls = getCallbackUrls("bkash");
    const paymentID = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const bkashRes = await fetch(`${API_URL()}/create`, {
      method: "POST",
      headers: bkashHeaders(token),
      body: JSON.stringify({
        mode: "0011", // URL-based checkout
        payerReference: customerPhone || " ",
        callbackURL: urls.success,
        amount: String(amount),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: invoiceId || paymentRequestId || paymentID,
      }),
    });
    const data = await bkashRes.json();

    if (data.bkashURL) {
      // Store payment context for callback
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AuditLog" (id, "actorId", "actorName", "actorEmail", "actorRole", module, action, "targetType", "targetId", "targetLabel", "newValue", "createdAt")
         VALUES (gen_random_uuid(), 'system', 'bKash Gateway', 'bkash@gateway.system', 'system', 'payment_gateway', 'bkash_created', 'payment', $1, $2, $3, NOW())`,
        data.paymentID || paymentID,
        `bkash-${invoiceId || paymentRequestId || "direct"}`,
        JSON.stringify({ invoiceId, paymentRequestId, tenantId: req.tenantId, amount }),
      ).catch(() => {});

      res.json({
        success: true,
        transactionId: data.paymentID || paymentID,
        redirectUrl: data.bkashURL,
        paymentID: data.paymentID,
      });
    } else {
      res.status(400).json({ success: false, message: data.statusMessage || "bKash payment creation failed" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/bkash/callback — bKash redirects here after user approval
router.get("/callback", async (req, res) => {
  try {
    const { paymentID, status } = req.query;
    const FRONTEND = process.env.FRONTEND_URL || "https://travelagencyweb.com";

    if (status === "success" && paymentID) {
      // Execute the payment
      const token = await getToken();
      const execRes = await fetch(`${API_URL()}/execute`, {
        method: "POST",
        headers: bkashHeaders(token),
        body: JSON.stringify({ paymentID }),
      });
      const execData = await execRes.json();

      if (execData.transactionStatus === "Completed") {
        // Look up stored context from audit log
        const contextLog = await prisma.auditLog.findFirst({
          where: { module: "payment_gateway", action: "bkash_created", targetId: paymentID },
          orderBy: { createdAt: "desc" },
        });
        const context = contextLog?.newValue ? JSON.parse(contextLog.newValue) : {};

        await handlePaymentSuccess({
          transactionId: execData.trxID || paymentID,
          invoiceId: context.invoiceId || null,
          paymentRequestId: context.paymentRequestId || null,
          amount: parseFloat(execData.amount || "0"),
          method: "online",
          gateway: "bkash",
          tenantId: context.tenantId || null,
          metadata: { paymentID, trxID: execData.trxID },
        });

        await auditPaymentEvent({
          action: "payment_success",
          gateway: "bkash",
          transactionId: execData.trxID || paymentID,
          amount: parseFloat(execData.amount || "0"),
          invoiceId: context.invoiceId,
          paymentRequestId: context.paymentRequestId,
          tenantId: context.tenantId,
          metadata: { paymentID, transactionStatus: execData.transactionStatus },
        });

        return res.redirect(`${FRONTEND}/payment/callback?status=success&tran_id=${execData.trxID || paymentID}&gateway=bkash`);
      } else {
        await auditPaymentEvent({ action: "payment_execution_failed", gateway: "bkash", transactionId: paymentID, amount: 0, metadata: { transactionStatus: execData.transactionStatus, statusMessage: execData.statusMessage } });
        return res.redirect(`${FRONTEND}/payment/callback?status=failed&tran_id=${paymentID}&gateway=bkash`);
      }
    }

    // User cancelled or failed
    await auditPaymentEvent({ action: `payment_${status || "unknown"}`, gateway: "bkash", transactionId: paymentID || "", amount: 0, metadata: { status } });
    res.redirect(`${FRONTEND}/payment/callback?status=${status === "cancel" ? "cancelled" : "failed"}&tran_id=${paymentID || ""}&gateway=bkash`);
  } catch (err) {
    console.error("[BKASH] Callback error:", err.message);
    res.redirect(`${process.env.FRONTEND_URL || "https://travelagencyweb.com"}/payment/callback?status=failed&error=${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
