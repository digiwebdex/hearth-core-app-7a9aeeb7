/**
 * WhatsApp Service — provider abstraction with console fallback
 * Supports: Twilio WhatsApp, WhatsApp Business Cloud API
 *
 * Env vars:
 * - WHATSAPP_PROVIDER (twilio | meta | console)
 * - WHATSAPP_FROM_NUMBER (Twilio WhatsApp number, e.g. whatsapp:+14155238886)
 * - META_WHATSAPP_TOKEN (Meta Cloud API token)
 * - META_WHATSAPP_PHONE_ID (Meta phone number ID)
 */

const WHATSAPP_PROVIDER = () => process.env.WHATSAPP_PROVIDER || "console";

/**
 * Send a WhatsApp message. Falls back to console.log if provider not configured.
 * @param {{ to: string, message: string, templateName?: string, templateParams?: string[] }} opts
 */
async function sendWhatsApp({ to, message, templateName, templateParams }) {
  const provider = WHATSAPP_PROVIDER();

  if (provider === "twilio") {
    return sendViaTwilioWhatsApp(to, message);
  }

  if (provider === "meta") {
    return sendViaMetaWhatsApp(to, message, templateName, templateParams);
  }

  // Console fallback
  console.log(`[WHATSAPP-LOG] To: ${to} | Message: ${message}`);
  return { success: true, provider: "console", messageId: `WA-LOG-${Date.now()}` };
}

async function sendViaTwilioWhatsApp(to, message) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.WHATSAPP_FROM_NUMBER || "whatsapp:+14155238886";

    if (!accountSid || !authToken) {
      console.log(`[WHATSAPP-LOG] Twilio not configured. To: ${to} | Message: ${message}`);
      return { success: false, provider: "twilio", error: "Twilio credentials not configured" };
    }

    const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: whatsappTo, From: from, Body: message }),
    });
    const data = await res.json();

    if (data.sid) {
      return { success: true, provider: "twilio-whatsapp", messageId: data.sid };
    }
    return { success: false, provider: "twilio-whatsapp", error: data.message || "Failed" };
  } catch (err) {
    return { success: false, provider: "twilio-whatsapp", error: err.message };
  }
}

async function sendViaMetaWhatsApp(to, message, templateName, templateParams) {
  try {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      console.log(`[WHATSAPP-LOG] Meta WhatsApp not configured. To: ${to} | Message: ${message}`);
      return { success: false, provider: "meta", error: "META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_ID required" };
    }

    const cleanNumber = to.replace(/[^0-9]/g, "");

    // If template-based message
    const body = templateName
      ? {
          messaging_product: "whatsapp",
          to: cleanNumber,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: templateParams ? [{ type: "body", parameters: templateParams.map(p => ({ type: "text", text: p })) }] : [],
          },
        }
      : {
          messaging_product: "whatsapp",
          to: cleanNumber,
          type: "text",
          text: { body: message },
        };

    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.messages?.[0]?.id) {
      return { success: true, provider: "meta-whatsapp", messageId: data.messages[0].id };
    }
    return { success: false, provider: "meta-whatsapp", error: data.error?.message || "Failed" };
  } catch (err) {
    return { success: false, provider: "meta-whatsapp", error: err.message };
  }
}

module.exports = { sendWhatsApp };
