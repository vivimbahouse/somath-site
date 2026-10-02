import { html, text } from "./_email-test-template.mjs";

// A fixed-message, single-recipient test. Not a bulk-mailing endpoint.
const REVISION = "parent-guide-2026-10-01-v4";
const RECEIPT_KEY = "staff-email-test:" + REVISION;
const RECIPIENT_HASH = "ebb4e69e6d16e440112c68abdb23d65cdc120d06865c1158bae6554557f06859";
const SUBJECT = "[TEST v4] Right answer. But do they understand it?";
const IMAGES = [
  { path: "/assets/email/parent-guide/header-v4.png", filename: "somath-header.png", content_type: "image/png", content_id: "somath-logo" },
  { path: "/assets/email/parent-guide/hero.jpg", filename: "somath-parent-guide.jpg", content_type: "image/jpeg", content_id: "somath-hero" },
];
function reply(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type": "application/json", "Cache-Control": "no-store, private",
    "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff",
  }});
}
async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))))
    .map(v => v.toString(16).padStart(2, "0")).join("");
}
function base64(bytes) {
  let raw = "";
  for (let i = 0; i < bytes.length; i += 8192) raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(raw);
}
export async function handleEmailTest(request, env) {
  if (!env.ADMIN_PASSWORD || request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD)
    return reply({ error: "unauthorized" }, 401);
  if (!["GET", "POST"].includes(request.method)) return reply({ error: "method_not_allowed" }, 405);
  if (!env.RESEND_API_KEY || !env.ENROLLMENTS || !env.ASSETS)
    return reply({ error: "test_sender_not_configured" }, 503);
  try {
    const rawReceipt = await env.ENROLLMENTS.get(RECEIPT_KEY);
    const receipt = rawReceipt ? JSON.parse(rawReceipt) : null;
    if (request.method === "GET") {
      if (!receipt) return reply({ ok: true, revision: REVISION, sent: false });
      const res = await fetch("https://api.resend.com/emails/" + encodeURIComponent(receipt.id), {
        headers: { Authorization: "Bearer " + env.RESEND_API_KEY },
      });
      if (!res.ok) return reply({ ok: true, sent: true, ...receipt, delivery_status: "unavailable" });
      const email = await res.json();
      return reply({
        ok: true, sent: true, ...receipt, delivery_status: email.last_event || "unknown",
        embedded_logo: /src=["']cid:somath-logo["']/.test(email.html || ""),
        embedded_hero: /src=["']cid:somath-hero["']/.test(email.html || ""),
      });
    }
    if (Number(request.headers.get("content-length") || 0) > 1024) return reply({ error: "body_too_large" }, 413);
    const raw = await request.text();
    if (raw.length > 1024) return reply({ error: "body_too_large" }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return reply({ error: "invalid_json" }, 400); }
    if (!body || Object.keys(body).some(k => !["action", "to", "confirmation"].includes(k)))
      return reply({ error: "unexpected_fields" }, 400);
    const recipient = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";
    if (body.action !== "send" || body.confirmation !== REVISION || await digest(recipient) !== RECIPIENT_HASH)
      return reply({ error: "test_scope_not_authorized" }, 403);
    if (receipt) return reply({ ok: true, already_sent: true, ...receipt });
    const attachments = [];
    for (const image of IMAGES) {
      const asset = await env.ASSETS.fetch(new Request("https://www.schoolofmath.us" + image.path));
      if (!asset.ok || !(asset.headers.get("content-type") || "").startsWith(image.content_type))
        return reply({ error: "image_unavailable" }, 502);
      const bytes = new Uint8Array(await asset.arrayBuffer());
      if (!bytes.length || bytes.length > 1024 * 1024) return reply({ error: "invalid_image_size" }, 502);
      attachments.push({
        filename: image.filename, content_type: image.content_type,
        content_id: image.content_id, content: base64(bytes),
      });
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json",
        "Idempotency-Key": "somath-test-" + REVISION,
      },
      body: JSON.stringify({
        from: "SOMATH <hello@schoolofmath.us>", to: [recipient],
        reply_to: "hello@schoolofmath.us", subject: SUBJECT, html, text, attachments,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.id) return reply({ error: "test_send_failed", provider_status: res.status }, 502);
    const stored = { id: data.id, sent_at: new Date().toISOString(), revision: REVISION };
    try { await env.ENROLLMENTS.put(RECEIPT_KEY, JSON.stringify(stored)); }
    catch { return reply({ ok: true, sent: true, ...stored, warning: "receipt_not_saved_do_not_retry" }); }
    return reply({ ok: true, sent: true, embedded_images: attachments.length, ...stored });
  } catch {
    return reply({ error: "test_operation_failed_check_status_before_retry" }, 502);
  }
}
