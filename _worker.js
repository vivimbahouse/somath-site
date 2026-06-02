var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js
var PDF_REGISTRY = {
  // slug -> { secure_path, public_name, display_name }
  "shsat-2024-25-official": {
    secure_path: "/_secure/10b7c1cb154563d7caf17c7155427861/SHSAT-2024_25-Official.pdf",
    public_name: "SHSAT-2024-25-Official.pdf",
    display_name: "SHSAT 2024\u201325 Official Test (PDF)"
  },
  "ny-1st-grade-math-parent-guide": {
    secure_path: "/_secure/48862e0f2a1f5bba04a2bd1000956930/NY-1st-Grade-Math-Parent-Guide.pdf",
    public_name: "NY-1st-Grade-Math-Parent-Guide.pdf",
    display_name: "New York 1st Grade Math Parent Guide (PDF)"
  },
  "ny-2nd-grade-math-parent-guide": {
    secure_path: "/_secure/616ff524ccac2e203acfe18ee2c4d6ac/NY-2nd-Grade-Math-Parent-Guide.pdf",
    public_name: "NY-2nd-Grade-Math-Parent-Guide.pdf",
    display_name: "New York 2nd Grade Math Parent Guide (PDF)"
  },
  "ny-3rd-grade-math-parent-guide": {
    secure_path: "/_secure/5c1be44202d88d4e41742cec01dd860c/NY-3rd-Grade-Math-Parent-Guide.pdf",
    public_name: "NY-3rd-Grade-Math-Parent-Guide.pdf",
    display_name: "New York 3rd Grade Math Parent Guide (PDF)"
  },
  "ny-4th-grade-math-parent-guide": {
    secure_path: "/_secure/67db29d6085b41334fd179e32e6ed0dc/NY-4th-Grade-Math-Parent-Guide.pdf",
    public_name: "NY-4th-Grade-Math-Parent-Guide.pdf",
    display_name: "New York 4th Grade Math Parent Guide (PDF)"
  },
  "ny-5th-grade-math-parent-guide": {
    secure_path: "/_secure/2205a6bb0550234a3a790f501e7fc969/NY-5th-Grade-Math-Parent-Guide.pdf",
    public_name: "NY-5th-Grade-Math-Parent-Guide.pdf",
    display_name: "New York 5th Grade Math Parent Guide (PDF)"
  },
  "ny-6th-grade-math-parent-guide": {
    secure_path: "/_secure/9713895e1593577d6282349d01420f2b/NY-6th-Grade-Math-Parent-Guide.pdf",
    public_name: "NY-6th-Grade-Math-Parent-Guide.pdf",
    display_name: "New York 6th Grade Math Parent Guide (PDF)"
  },
  "ny-7th-grade-math-parent-guide": {
    secure_path: "/_secure/7ef3e705aec047f6dc0decfc0beab4a2/NY-7th-Grade-Math-Parent-Guide.pdf",
    public_name: "NY-7th-Grade-Math-Parent-Guide.pdf",
    display_name: "New York 7th Grade Math Parent Guide (PDF)"
  },
  "ny-8th-grade-math-parent-guide": {
    secure_path: "/_secure/ce41c1f5fe79d6306f417e040198f18f/NY-8th-Grade-Math-Parent-Guide.pdf",
    public_name: "NY-8th-Grade-Math-Parent-Guide.pdf",
    display_name: "New York 8th Grade Math Parent Guide (PDF)"
  }
};
var enc = new TextEncoder();
var dec = new TextDecoder();
function base64urlEncode(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64urlEncode, "base64urlEncode");
function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}
__name(base64urlDecode, "base64urlDecode");
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(hmacKey, "hmacKey");
async function signToken(payload, secret) {
  const body = base64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return body + "." + base64urlEncode(sig);
}
__name(signToken, "signToken");
async function verifyToken(token, secret) {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(sig),
      enc.encode(body)
    );
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(base64urlDecode(body)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken, "verifyToken");
async function sendResendEmail(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return { ok: false, error: "email_not_configured" };
  }
  const from = env.RESEND_FROM || "SOMATH <hello@schoolofmath.us>";
  const body = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (replyTo) body.reply_to = replyTo;
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Resend failed", resp.status, text);
    return { ok: false, error: "resend_failed", status: resp.status, detail: text };
  }
  return { ok: true, data: await resp.json() };
}
__name(sendResendEmail, "sendResendEmail");
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonResponse, "jsonResponse");
function isValidEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 200;
}
__name(isValidEmail, "isValidEmail");
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(escapeHtml, "escapeHtml");
async function handleRequestPdf(request, env) {
  if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }
  const name = String(body.name || "").trim().slice(0, 100);
  const email = String(body.email || "").trim().toLowerCase();
  const pdfSlug = String(body.pdf || "").trim();
  const sourceSlug = String(body.slug || "").trim().slice(0, 200);
  if (!name) return jsonResponse({ error: "missing_name" }, 400);
  if (!isValidEmail(email)) return jsonResponse({ error: "invalid_email" }, 400);
  if (!PDF_REGISTRY[pdfSlug]) return jsonResponse({ error: "unknown_pdf" }, 400);
  if (body.website) return jsonResponse({ ok: true, downloadUrl: "/" });
  const secret = env.PDF_SIGNING_SECRET;
  if (!secret) {
    console.error("PDF_SIGNING_SECRET not set");
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }
  const now = Math.floor(Date.now() / 1e3);
  const token = await signToken(
    {
      n: name,
      e: email,
      p: pdfSlug,
      s: sourceSlug,
      iat: now,
      exp: now + 60 * 60 * 24 * 7
      // 7 days
    },
    secret
  );
  if (env.RESEND_API_KEY) {
    const pdfInfo = PDF_REGISTRY[pdfSlug];
    const notifyTo = env.NOTIFY_EMAIL || "hello@schoolofmath.us";
    const emailResult = await sendResendEmail(env, {
      to: notifyTo,
      subject: `New PDF lead: ${pdfInfo.display_name} \u2014 ${name}`,
      replyTo: email,
      html: `<p>New lead downloaded <strong>${escapeHtml(pdfInfo.display_name)}</strong>.</p>
<ul>
<li><strong>Name:</strong> ${escapeHtml(name)}</li>
<li><strong>Email:</strong> ${escapeHtml(email)}</li>
<li><strong>Source page:</strong> ${escapeHtml(sourceSlug || "(unknown)")}</li>
<li><strong>Time:</strong> ${(/* @__PURE__ */ new Date()).toISOString()}</li>
</ul>`
    }).catch((e) => ({ ok: false, error: "exception", detail: String(e) }));
    console.log("Email send result:", JSON.stringify(emailResult));
  } else {
    console.log(JSON.stringify({
      event: "pdf_lead",
      name,
      email,
      pdf: pdfSlug,
      source: sourceSlug,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    }));
  }
  const downloadUrl = `/api/download-pdf?token=${encodeURIComponent(token)}`;
  return jsonResponse({ ok: true, downloadUrl });
}
__name(handleRequestPdf, "handleRequestPdf");
async function handleVerifyPdf(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response("Missing token", { status: 400 });
  return Response.redirect(
    `${url.origin}/api/download-pdf?token=${encodeURIComponent(token)}`,
    302
  );
}
__name(handleVerifyPdf, "handleVerifyPdf");
async function handleDownloadPdf(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response("Missing token", { status: 400 });
  const secret = env.PDF_SIGNING_SECRET;
  if (!secret) return new Response("Server misconfigured", { status: 500 });
  const payload = await verifyToken(token, secret);
  if (!payload) return new Response("Invalid or expired token", { status: 403 });
  const pdfInfo = PDF_REGISTRY[payload.p];
  if (!pdfInfo) return new Response("Unknown PDF", { status: 404 });
  const assetUrl = new URL(pdfInfo.secure_path, url.origin);
  const assetResp = await env.ASSETS.fetch(new Request(assetUrl.toString()));
  if (!assetResp.ok) return new Response("PDF not found", { status: 404 });
  const headers = new Headers(assetResp.headers);
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${pdfInfo.public_name}"`
  );
  headers.set("Cache-Control", "private, no-store");
  return new Response(assetResp.body, { status: 200, headers });
}
__name(handleDownloadPdf, "handleDownloadPdf");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/request-pdf") return handleRequestPdf(request, env);
    if (url.pathname === "/api/verify-pdf") return handleVerifyPdf(request, env);
    if (url.pathname === "/api/download-pdf") return handleDownloadPdf(request, env);
    if (url.pathname.startsWith("/_secure/")) {
      return new Response("Not found", { status: 404 });
    }
    const REMOVED_POSTS = /* @__PURE__ */ new Set([
      "/posts/math-enrichment-vs-tutoring-which-does-your-child-actually-need"
    ]);
    if (REMOVED_POSTS.has(url.pathname)) {
      return new Response(
        `<!doctype html><html><head><meta charset="utf-8"><title>Post removed | School of Math</title><meta name="robots" content="noindex"></head><body style="font-family:system-ui;max-width:560px;margin:80px auto;padding:0 20px;color:#0a3a5f"><h1>This post has been removed.</h1><p>The article you're looking for is no longer available. Visit our <a href="/blog" style="color:#d4a548">blog index</a> or our <a href="/" style="color:#d4a548">home page</a>.</p></body></html>`,
        { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=_worker.js.map