/**
 * SSLCommerz Payment Gateway Route
 * Handles initiation, IPN, success/fail/cancel callbacks
 * 
 * Requires env vars:
 * - SSLCOMMERZ_STORE_ID
 * - SSLCOMMERZ_STORE_PASSWORD
 * - SSLCOMMERZ_SANDBOX (true/false)
 * - API_BASE_URL (for callback URLs)
 */
const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");
const { handlePaymentSuccess, auditPaymentEvent, getCallbackUrls } = require("../services/paymentGateway");

const STORE_ID = () => process.env.SSLCOMMERZ_STORE_ID || "";
const STORE_PASS = () => process.env.SSLCOMMERZ_STORE_PASSWORD || "";
const IS_SANDBOX = () => process.env.SSLCOMMERZ_SANDBOX !== "false";
const API_URL = () => IS_SANDBOX()
  ? "https://sandbox.sslcommerz.com"
  : "https://securepay.sslcommerz.com";

// POST /api/payments/sslcommerz/initiate — authenticated
router.post("/initiate", authenticate, async (req, res) => {
  try {
    const { invoiceId, paymentRequestId, amount, customerName, customerEmail, customerPhone } = req.body;

    if (!STORE_ID() || !STORE_PASS()) {
      return res.status(503).json({ message: "SSLCommerz not configured. Add SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD to .env" });
    }

    const tran_id = `SSL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const urls = getCallbackUrls("sslcommerz");

    const params = new URLSearchParams({
      store_id: STORE_ID(),
      store_passwd: STORE_PASS(),
      total_amount: String(amount),
      currency: "BDT",
      tran_id,
      success_url: urls.success,
      fail_url: urls.fail,
      cancel_url: urls.cancel,
      ipn_url: urls.ipn,
      cus_name: customerName || "Customer",
      cus_email: customerEmail || "customer@email.com",
      cus_phone: customerPhone || "01700000000",
      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      shipping_method: "NO",
      product_name: invoiceId ? `Invoice Payment` : "Subscription Payment",
      product_category: "Travel",
      product_profile: "general",
      value_a: invoiceId || "",
      value_b: paymentRequestId || "",
      value_c: req.tenantId || "",
      value_d: String(amount),
    });

    const response = await fetch(`${API_URL()}/gwprocess/v4`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await response.json();

    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      await auditPaymentEvent({
        action: "payment_initiated",
        gateway: "sslcommerz",
        transactionId: tran_id,
        amount,
        invoiceId,
        paymentRequestId,
        tenantId: req.tenantId,
        metadata: { sessionKey: data.sessionkey },
      });

      res.json({
        success: true,
        transactionId: tran_id,
        redirectUrl: data.GatewayPageURL,
        sessionKey: data.sessionkey,
      });
    } else {
      res.status(400).json({ success: false, message: data.failedreason || "SSLCommerz session creation failed" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/sslcommerz/success — SSLCommerz callback (form-encoded)
router.post("/success", async (req, res) => {
  try {
    const { tran_id, val_id, amount, status, value_a, value_b, value_c, value_d } = req.body;
    const invoiceId = value_a || null;
    const paymentRequestId = value_b || null;
    const tenantId = value_c || null;
    const paidAmount = parseFloat(value_d || amount);

    // Validate with SSLCommerz
    if (val_id && STORE_ID() && STORE_PASS()) {
      const valUrl = `${API_URL()}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${STORE_ID()}&store_passwd=${STORE_PASS()}&format=json`;
      const valRes = await fetch(valUrl).then(r => r.json()).catch(() => null);
      if (valRes && valRes.status !== "VALID" && valRes.status !== "VALIDATED") {
        await auditPaymentEvent({ action: "payment_validation_failed", gateway: "sslcommerz", transactionId: tran_id, amount: paidAmount, invoiceId, paymentRequestId, tenantId, metadata: { val_id, validationStatus: valRes?.status } });
        return res.redirect(`${process.env.FRONTEND_URL || "https://travelagencyweb.com"}/payment/callback?status=failed&tran_id=${tran_id}&gateway=sslcommerz`);
      }
    }

    // Process payment
    await handlePaymentSuccess({
      transactionId: tran_id,
      invoiceId,
      paymentRequestId,
      amount: paidAmount,
      method: "online",
      gateway: "sslcommerz",
      tenantId,
      metadata: { val_id },
    });

    await auditPaymentEvent({ action: "payment_success", gateway: "sslcommerz", transactionId: tran_id, amount: paidAmount, invoiceId, paymentRequestId, tenantId, metadata: { val_id, status } });

    res.redirect(`${process.env.FRONTEND_URL || "https://travelagencyweb.com"}/payment/callback?status=success&tran_id=${tran_id}&gateway=sslcommerz`);
  } catch (err) {
    console.error("[SSLCOMMERZ] Success callback error:", err.message);
    res.redirect(`${process.env.FRONTEND_URL || "https://travelagencyweb.com"}/payment/callback?status=failed&error=${encodeURIComponent(err.message)}`);
  }
});

// POST /api/payments/sslcommerz/fail
router.post("/fail", async (req, res) => {
  const { tran_id, value_a, value_b, value_c } = req.body;
  await auditPaymentEvent({ action: "payment_failed", gateway: "sslcommerz", transactionId: tran_id, amount: 0, invoiceId: value_a, paymentRequestId: value_b, tenantId: value_c, metadata: {} });
  res.redirect(`${process.env.FRONTEND_URL || "https://travelagencyweb.com"}/payment/callback?status=failed&tran_id=${tran_id}&gateway=sslcommerz`);
});

// POST /api/payments/sslcommerz/cancel
router.post("/cancel", async (req, res) => {
  const { tran_id, value_a, value_b, value_c } = req.body;
  await auditPaymentEvent({ action: "payment_cancelled", gateway: "sslcommerz", transactionId: tran_id, amount: 0, invoiceId: value_a, paymentRequestId: value_b, tenantId: value_c, metadata: {} });
  res.redirect(`${process.env.FRONTEND_URL || "https://travelagencyweb.com"}/payment/callback?status=cancelled&tran_id=${tran_id}&gateway=sslcommerz`);
});

// POST /api/payments/sslcommerz/ipn — server-to-server validation
router.post("/ipn", async (req, res) => {
  try {
    const { tran_id, val_id, status, amount, value_a, value_b, value_c, value_d } = req.body;

    if (status === "VALID" || status === "VALIDATED") {
      await handlePaymentSuccess({
        transactionId: tran_id,
        invoiceId: value_a || null,
        paymentRequestId: value_b || null,
        amount: parseFloat(value_d || amount),
        method: "online",
        gateway: "sslcommerz",
        tenantId: value_c || null,
        metadata: { val_id, source: "ipn" },
      });
      await auditPaymentEvent({ action: "ipn_validated", gateway: "sslcommerz", transactionId: tran_id, amount: parseFloat(amount), invoiceId: value_a, paymentRequestId: value_b, tenantId: value_c, metadata: { val_id, status } });
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[SSLCOMMERZ] IPN error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
