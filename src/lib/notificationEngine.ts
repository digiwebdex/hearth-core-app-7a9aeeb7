// ── Event-Based Notification Engine ──
// Triggers SMS and email notifications based on business events

import { triggerSmsAutomation, type SmsAutomationContext } from "./smsAutomation";
import { emailApi } from "./emailApi";
import { logAudit } from "./auditLog";

export type NotificationEventType =
  | "lead_assigned"
  | "quotation_sent"
  | "quotation_approved"
  | "booking_confirmed"
  | "payment_received"
  | "payment_overdue"
  | "subscription_expiring";

export type NotificationChannel = "sms" | "email";
export type DeliveryStatus = "pending" | "sent" | "failed" | "retrying";

export interface NotificationDelivery {
  id: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  recipient: string;
  recipientName: string;
  tenantId: string;
  tenantName: string;
  status: DeliveryStatus;
  message: string;
  attempts: number;
  maxAttempts: number;
  failureReason?: string;
  sentAt?: string;
  lastAttemptAt: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface NotificationEventConfig {
  type: NotificationEventType;
  label: string;
  description: string;
  channels: { sms: boolean; email: boolean };
  smsTemplateType?: string;
}

// Default event → channel mappings
export const EVENT_CONFIGS: NotificationEventConfig[] = [
  { type: "lead_assigned", label: "Lead Assigned", description: "When a new lead is assigned to a staff member", channels: { sms: true, email: true } },
  { type: "quotation_sent", label: "Quotation Sent", description: "When a quotation is sent to a client", channels: { sms: true, email: true } },
  { type: "quotation_approved", label: "Quotation Approved", description: "When a client approves a quotation", channels: { sms: true, email: true } },
  { type: "booking_confirmed", label: "Booking Confirmed", description: "When a booking is confirmed", channels: { sms: true, email: true }, smsTemplateType: "booking" },
  { type: "payment_received", label: "Payment Received", description: "When a payment is recorded", channels: { sms: true, email: true }, smsTemplateType: "payment" },
  { type: "payment_overdue", label: "Payment Overdue", description: "When a payment passes its due date", channels: { sms: true, email: true }, smsTemplateType: "reminder" },
  { type: "subscription_expiring", label: "Subscription Expiring", description: "When a tenant subscription is about to expire", channels: { sms: false, email: true } },
];

// In-memory delivery log (production: database)
let deliveryLog: NotificationDelivery[] = [];

function createDelivery(
  eventType: NotificationEventType,
  channel: NotificationChannel,
  recipient: string,
  recipientName: string,
  tenantId: string,
  tenantName: string,
  message: string,
  metadata?: Record<string, string>
): NotificationDelivery {
  const delivery: NotificationDelivery = {
    id: crypto.randomUUID(),
    eventType,
    channel,
    recipient,
    recipientName,
    tenantId,
    tenantName,
    status: "pending",
    message,
    attempts: 0,
    maxAttempts: 3,
    lastAttemptAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    metadata,
  };
  deliveryLog = [delivery, ...deliveryLog];
  return delivery;
}

function updateDelivery(id: string, update: Partial<NotificationDelivery>) {
  deliveryLog = deliveryLog.map((d) => (d.id === id ? { ...d, ...update } : d));
}

export interface NotificationContext {
  tenantId: string;
  tenantName: string;
  // Lead
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  leadDestination?: string;
  assignedStaff?: string;
  assignedStaffEmail?: string;
  // Quotation
  quotationId?: string;
  quotationTitle?: string;
  quotationAmount?: number;
  // Booking
  bookingId?: string;
  bookingType?: string;
  bookingDate?: string;
  // Payment
  paymentAmount?: number;
  paymentMethod?: string;
  invoiceId?: string;
  balance?: number;
  dueDate?: string;
  // Client
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  // Company
  company?: string;
}

/**
 * Trigger all configured channels for a given event.
 * Non-blocking: failures are logged, never thrown.
 */
export async function triggerNotification(
  eventType: NotificationEventType,
  ctx: NotificationContext
): Promise<NotificationDelivery[]> {
  const config = EVENT_CONFIGS.find((e) => e.type === eventType);
  if (!config) return [];

  const results: NotificationDelivery[] = [];

  // SMS channel
  if (config.channels.sms && ctx.clientPhone) {
    const smsMessage = buildSmsMessage(eventType, ctx);
    const delivery = createDelivery(eventType, "sms", ctx.clientPhone, ctx.clientName || "Customer", ctx.tenantId, ctx.tenantName, smsMessage);
    results.push(delivery);

    try {
      updateDelivery(delivery.id, { status: "pending", attempts: 1, lastAttemptAt: new Date().toISOString() });
      const smsCtx: SmsAutomationContext = {
        clientName: ctx.clientName,
        clientPhone: ctx.clientPhone,
        bookingId: ctx.bookingId,
        bookingType: ctx.bookingType,
        bookingDate: ctx.bookingDate,
        bookingAmount: ctx.quotationAmount,
        paymentAmount: ctx.paymentAmount,
        paymentMethod: ctx.paymentMethod,
        invoiceId: ctx.invoiceId,
        balance: ctx.balance,
        company: ctx.company || ctx.tenantName,
      };

      const templateType = config.smsTemplateType as any;
      if (templateType) {
        const result = await triggerSmsAutomation(templateType, smsCtx);
        if (result.sent) {
          updateDelivery(delivery.id, { status: "sent", sentAt: new Date().toISOString() });
        } else {
          updateDelivery(delivery.id, { status: "failed", failureReason: result.error || "SMS send failed" });
        }
      } else {
        // No template mapping — mark as sent (would be custom in production)
        updateDelivery(delivery.id, { status: "sent", sentAt: new Date().toISOString() });
      }
    } catch (err: any) {
      updateDelivery(delivery.id, { status: "failed", failureReason: err.message });
    }
  }

  // Email channel
  if (config.channels.email && (ctx.clientEmail || ctx.assignedStaffEmail)) {
    const emailRecipient = ctx.clientEmail || ctx.assignedStaffEmail || "";
    const emailMessage = buildEmailSubject(eventType, ctx);
    const delivery = createDelivery(eventType, "email", emailRecipient, ctx.clientName || ctx.assignedStaff || "User", ctx.tenantId, ctx.tenantName, emailMessage);
    results.push(delivery);

    try {
      updateDelivery(delivery.id, { status: "pending", attempts: 1, lastAttemptAt: new Date().toISOString() });
      // In production this calls the backend email endpoint
      // For demo we simulate success
      updateDelivery(delivery.id, { status: "sent", sentAt: new Date().toISOString() });
    } catch (err: any) {
      updateDelivery(delivery.id, { status: "failed", failureReason: err.message });
    }
  }

  // Audit log
  logAudit({
    actorId: "system",
    actorName: "Notification Engine",
    actorEmail: "system@travelagencyweb.com",
    actorRole: "system",
    tenantId: ctx.tenantId,
    tenantName: ctx.tenantName,
    module: eventType.startsWith("payment") ? "payment" : eventType.startsWith("booking") ? "booking" : eventType.startsWith("quotation") ? "quotation" : eventType.startsWith("lead") ? "lead" : "subscription",
    action: "created",
    targetType: "notification",
    targetLabel: `${config.label} → ${ctx.clientName || ctx.assignedStaff || "User"}`,
    metadata: { channels: results.map((r) => r.channel).join(","), eventType },
  });

  return results;
}

/**
 * Retry a failed delivery (up to maxAttempts).
 */
export async function retryDelivery(id: string): Promise<NotificationDelivery | null> {
  const delivery = deliveryLog.find((d) => d.id === id);
  if (!delivery || delivery.status === "sent") return delivery || null;
  if (delivery.attempts >= delivery.maxAttempts) {
    updateDelivery(id, { status: "failed", failureReason: "Max retry attempts reached" });
    return deliveryLog.find((d) => d.id === id) || null;
  }

  updateDelivery(id, { status: "retrying", attempts: delivery.attempts + 1, lastAttemptAt: new Date().toISOString() });

  // Simulate retry success (in production this would re-call the SMS/email provider)
  const success = Math.random() > 0.3;
  if (success) {
    updateDelivery(id, { status: "sent", sentAt: new Date().toISOString(), failureReason: undefined });
  } else {
    updateDelivery(id, { status: "failed", failureReason: "Retry failed — provider timeout" });
  }

  return deliveryLog.find((d) => d.id === id) || null;
}

export function getDeliveryLog(): NotificationDelivery[] {
  return deliveryLog;
}

export function getDeliveryStats() {
  return {
    total: deliveryLog.length,
    sent: deliveryLog.filter((d) => d.status === "sent").length,
    failed: deliveryLog.filter((d) => d.status === "failed").length,
    pending: deliveryLog.filter((d) => d.status === "pending" || d.status === "retrying").length,
    bySms: deliveryLog.filter((d) => d.channel === "sms").length,
    byEmail: deliveryLog.filter((d) => d.channel === "email").length,
  };
}

// ── Seed demo data ──
export function seedDeliveryLog() {
  if (deliveryLog.length > 0) return;
  const now = Date.now();
  deliveryLog = [
    { id: "nd1", eventType: "booking_confirmed", channel: "sms", recipient: "+8801712345678", recipientName: "Rahman Ali", tenantId: "t1", tenantName: "Acme Travel", status: "sent", message: "Dear Rahman Ali, your tour booking (BK-2026-012) is confirmed. Amount: 45,000 BDT.", attempts: 1, maxAttempts: 3, sentAt: new Date(now - 3600000).toISOString(), lastAttemptAt: new Date(now - 3600000).toISOString(), createdAt: new Date(now - 3600000).toISOString() },
    { id: "nd2", eventType: "booking_confirmed", channel: "email", recipient: "rahman@email.com", recipientName: "Rahman Ali", tenantId: "t1", tenantName: "Acme Travel", status: "sent", message: "Booking Confirmation — Cox's Bazar Beach Getaway", attempts: 1, maxAttempts: 3, sentAt: new Date(now - 3500000).toISOString(), lastAttemptAt: new Date(now - 3500000).toISOString(), createdAt: new Date(now - 3500000).toISOString() },
    { id: "nd3", eventType: "payment_received", channel: "sms", recipient: "+8801898765432", recipientName: "Fatima Begum", tenantId: "t1", tenantName: "Acme Travel", status: "sent", message: "Dear Fatima, we received ৳15,000 for Invoice #INV-2026-008.", attempts: 1, maxAttempts: 3, sentAt: new Date(now - 7200000).toISOString(), lastAttemptAt: new Date(now - 7200000).toISOString(), createdAt: new Date(now - 7200000).toISOString() },
    { id: "nd4", eventType: "quotation_sent", channel: "email", recipient: "jamal@email.com", recipientName: "Jamal Uddin", tenantId: "t1", tenantName: "Acme Travel", status: "sent", message: "Quotation QT-2026-015 — Maldives Luxury Package", attempts: 1, maxAttempts: 3, sentAt: new Date(now - 86400000).toISOString(), lastAttemptAt: new Date(now - 86400000).toISOString(), createdAt: new Date(now - 86400000).toISOString() },
    { id: "nd5", eventType: "payment_overdue", channel: "sms", recipient: "+8801555000111", recipientName: "Sakib Hasan", tenantId: "t1", tenantName: "Acme Travel", status: "failed", message: "Dear Sakib, ৳22,000 for Invoice #INV-2026-010 is overdue.", attempts: 3, maxAttempts: 3, failureReason: "Invalid phone number — carrier rejected", lastAttemptAt: new Date(now - 172800000).toISOString(), createdAt: new Date(now - 172800000).toISOString() },
    { id: "nd6", eventType: "payment_overdue", channel: "email", recipient: "sakib@email.com", recipientName: "Sakib Hasan", tenantId: "t1", tenantName: "Acme Travel", status: "sent", message: "Payment Reminder — ৳22,000 overdue for Bangkok Tour", attempts: 1, maxAttempts: 3, sentAt: new Date(now - 172800000).toISOString(), lastAttemptAt: new Date(now - 172800000).toISOString(), createdAt: new Date(now - 172800000).toISOString() },
    { id: "nd7", eventType: "lead_assigned", channel: "email", recipient: "karim@acme.com", recipientName: "Karim Ahmed", tenantId: "t1", tenantName: "Acme Travel", status: "sent", message: "New lead assigned: Arif Hossain — Dubai Trip Inquiry", attempts: 1, maxAttempts: 3, sentAt: new Date(now - 259200000).toISOString(), lastAttemptAt: new Date(now - 259200000).toISOString(), createdAt: new Date(now - 259200000).toISOString() },
    { id: "nd8", eventType: "quotation_approved", channel: "sms", recipient: "+8801612340000", recipientName: "Nusrat Jahan", tenantId: "t2", tenantName: "Globe Tours", status: "sent", message: "Dear Nusrat, your quotation QT-2026-020 for Turkey Tour has been approved!", attempts: 1, maxAttempts: 3, sentAt: new Date(now - 345600000).toISOString(), lastAttemptAt: new Date(now - 345600000).toISOString(), createdAt: new Date(now - 345600000).toISOString() },
    { id: "nd9", eventType: "subscription_expiring", channel: "email", recipient: "admin@globe.com", recipientName: "Globe Tours Admin", tenantId: "t2", tenantName: "Globe Tours", status: "failed", message: "Your Pro plan expires in 3 days — renew now!", attempts: 2, maxAttempts: 3, failureReason: "SMTP connection timeout", lastAttemptAt: new Date(now - 432000000).toISOString(), createdAt: new Date(now - 432000000).toISOString() },
  ];
}

// ── Message builders ──
function buildSmsMessage(eventType: NotificationEventType, ctx: NotificationContext): string {
  const name = ctx.clientName || "Customer";
  const company = ctx.company || ctx.tenantName;
  switch (eventType) {
    case "lead_assigned": return `New lead assigned to ${ctx.assignedStaff || "you"}: ${ctx.leadName} — ${ctx.leadDestination || "Travel Inquiry"}. - ${company}`;
    case "quotation_sent": return `Dear ${name}, your quotation ${ctx.quotationId || ""} (৳${ctx.quotationAmount?.toLocaleString() || "0"}) has been sent. - ${company}`;
    case "quotation_approved": return `Dear ${name}, your quotation ${ctx.quotationId || ""} has been approved! We'll proceed with booking. - ${company}`;
    case "booking_confirmed": return `Dear ${name}, your ${ctx.bookingType || "travel"} booking (${ctx.bookingId || ""}) is confirmed. - ${company}`;
    case "payment_received": return `Dear ${name}, we received ৳${ctx.paymentAmount?.toLocaleString() || "0"} for Invoice #${ctx.invoiceId || ""}. - ${company}`;
    case "payment_overdue": return `Dear ${name}, ৳${ctx.paymentAmount?.toLocaleString() || "0"} for Invoice #${ctx.invoiceId || ""} is overdue. Please pay by ${ctx.dueDate || "soon"}. - ${company}`;
    case "subscription_expiring": return `Your ${company} subscription is expiring soon. Please renew to avoid service interruption.`;
    default: return `Notification from ${company}`;
  }
}

function buildEmailSubject(eventType: NotificationEventType, ctx: NotificationContext): string {
  switch (eventType) {
    case "lead_assigned": return `New Lead Assigned: ${ctx.leadName || "Travel Inquiry"}`;
    case "quotation_sent": return `Quotation ${ctx.quotationId || ""} — ${ctx.quotationTitle || "Travel Package"}`;
    case "quotation_approved": return `Quotation Approved — ${ctx.quotationTitle || "Travel Package"}`;
    case "booking_confirmed": return `Booking Confirmed — ${ctx.bookingId || ""}`;
    case "payment_received": return `Payment Received — ৳${ctx.paymentAmount?.toLocaleString() || "0"}`;
    case "payment_overdue": return `Payment Overdue — Invoice #${ctx.invoiceId || ""}`;
    case "subscription_expiring": return `Your subscription is expiring soon`;
    default: return "Notification";
  }
}
