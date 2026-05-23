// Telegram notification service
// Requires env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
// 1) Create a bot via @BotFather → get the token
// 2) Message the bot once from your Telegram account
// 3) Visit https://api.telegram.org/bot<TOKEN>/getUpdates → grab chat.id

function esc(s) {
  return String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

async function sendTelegramMessage(text, opts = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = opts.chatId || process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    console.log("[telegram] skipped — TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID not configured");
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      console.error("[telegram] send failed:", data);
      return { ok: false, error: data };
    }
    return { ok: true };
  } catch (err) {
    console.error("[telegram] error:", err.message);
    return { ok: false, error: err.message };
  }
}

async function notifyNewSignup({ name, email, tenantName, userId }) {
  const appUrl = process.env.APP_URL || "https://app.travelagencyweb.com";
  const text =
    `🆕 <b>New Signup — Awaiting Approval</b>\n\n` +
    `👤 <b>Name:</b> ${esc(name)}\n` +
    `📧 <b>Email:</b> ${esc(email)}\n` +
    `🏢 <b>Agency:</b> ${esc(tenantName || "-")}\n` +
    `🆔 <b>User ID:</b> <code>${esc(userId)}</code>\n\n` +
    `👉 Review & approve: ${appUrl}/admin/pending-users`;
  return sendTelegramMessage(text);
}

async function notifyUserApproved({ name, email }) {
  return sendTelegramMessage(
    `✅ <b>User Approved</b>\n👤 ${esc(name)}\n📧 ${esc(email)}`
  );
}

module.exports = { sendTelegramMessage, notifyNewSignup, notifyUserApproved };
