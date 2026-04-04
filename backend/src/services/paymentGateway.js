/**
 * Payment Gateway Service — shared logic for SSLCommerz + bKash + COD
 * Handles payment initiation, validation, status updates, and linkage
 */
const { prisma } = require("../middleware/auth");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://travelagencyweb.com";

/**
 * After a successful payment, update invoice + booking + optionally subscription
 */
async function handlePaymentSuccess({ transactionId, invoiceId, paymentRequestId, amount, method, gateway, tenantId, metadata }) {
  const result = { invoiceUpdated: false, bookingUpdated: false, subscriptionUpdated: false };

  // 1. If linked to an invoice — record payment + update invoice/booking
  if (invoiceId) {
    try {
      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          bookingId: metadata?.bookingId || "",
          amount,
          method: gateway,
          transactionRef: transactionId,
          date: new Date().toISOString().slice(0, 10),
          notes: `Online payment via ${gateway}`,
          tenantId,
        },
      });

      const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
      if (inv) {
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        const newStatus = paid >= inv.totalAmount ? "paid" : paid > 0 ? "partial" : "unpaid";
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { paidAmount: paid, dueAmount: inv.totalAmount - paid, status: newStatus },
        });
        result.invoiceUpdated = true;

        // Update booking if linked
        if (inv.bookingId) {
          const bInvoices = await prisma.invoice.findMany({ where: { bookingId: inv.bookingId } });
          const bPaid = bInvoices.reduce((s, i) => s + i.paidAmount, 0);
          const bTotal = bInvoices.reduce((s, i) => s + i.totalAmount, 0);
          await prisma.booking.update({
            where: { id: inv.bookingId },
            data: { paidAmount: bPaid, dueAmount: bTotal - bPaid, paymentStatus: bPaid >= bTotal ? "paid" : bPaid > 0 ? "partial" : "unpaid" },
          });
          result.bookingUpdated = true;
        }

        // Auto-create Transaction record
        await prisma.transaction.create({
          data: {
            type: "income",
            category: "online_payment",
            description: `Online payment via ${gateway} for ${inv.invoiceNumber || invoiceId}`,
            amount,
            referenceId: payment.id,
            referenceType: "payment",
            invoiceId,
            bookingId: inv.bookingId || null,
            paymentMethod: gateway,
            status: "completed",
            date: new Date().toISOString().slice(0, 10),
            tenantId,
          },
        }).catch(e => console.error("Auto-transaction error:", e.message));
      }
    } catch (e) {
      console.error("[PAYMENT-GATEWAY] Invoice payment error:", e.message);
    }
  }

  // 2. If linked to a payment request (subscription payment)
  if (paymentRequestId) {
    try {
      const pr = await prisma.paymentRequest.findUnique({ where: { id: paymentRequestId } });
      if (pr && pr.status === "pending") {
        await prisma.paymentRequest.update({
          where: { id: paymentRequestId },
          data: { status: "approved", trxId: transactionId, processedAt: new Date() },
        });

        // Activate subscription
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + (pr.plan === "enterprise" ? 12 : pr.plan === "business" ? 6 : 1));
        await prisma.tenant.update({
          where: { id: pr.tenantId },
          data: {
            subscriptionPlan: pr.plan,
            subscriptionStatus: "active",
            subscriptionExpiry: expiry,
          },
        });
        result.subscriptionUpdated = true;
      }
    } catch (e) {
      console.error("[PAYMENT-GATEWAY] Subscription update error:", e.message);
    }
  }

  return result;
}

/**
 * Create audit log for payment gateway event
 */
async function auditPaymentEvent({ action, gateway, transactionId, amount, invoiceId, paymentRequestId, tenantId, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: "system",
        actorName: `${gateway} Gateway`,
        actorEmail: `${gateway}@gateway.system`,
        actorRole: "system",
        tenantId: tenantId || null,
        tenantName: null,
        module: "payment_gateway",
        action,
        targetType: invoiceId ? "invoice" : paymentRequestId ? "payment_request" : "payment",
        targetId: invoiceId || paymentRequestId || transactionId,
        targetLabel: transactionId,
        newValue: JSON.stringify({ gateway, amount, transactionId, ...metadata }),
      },
    });
  } catch (e) {
    console.error("[AUDIT] Payment gateway audit error:", e.message);
  }
}

/**
 * Get callback URLs for payment gateways
 */
function getCallbackUrls(gateway) {
  const apiBase = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}/api`;
  return {
    success: `${apiBase}/payments/${gateway}/success`,
    fail: `${apiBase}/payments/${gateway}/fail`,
    cancel: `${apiBase}/payments/${gateway}/cancel`,
    ipn: `${apiBase}/payments/${gateway}/ipn`,
    frontendCallback: `${FRONTEND_URL}/payment/callback`,
  };
}

module.exports = {
  handlePaymentSuccess,
  auditPaymentEvent,
  getCallbackUrls,
};
