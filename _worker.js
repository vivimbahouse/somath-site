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
async function handleStudentEvaluation(request, env) {
  if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "invalid_body" }, 400); }
  const grade = String(body.grade || "").trim().slice(0, 40);
  const studentName = String(body.studentName || "").trim().slice(0, 80);
  const parentEmail = String(body.parentEmail || "").trim().toLowerCase();
  const totalCorrect = Number(body.totalCorrect);
  const totalQuestions = Number(body.totalQuestions);
  const overallPercent = Number(body.overallPercent);
  const performanceBand = String(body.performanceBand || "").slice(0, 120);
  const performanceSummary = String(body.performanceSummary || "").slice(0, 2000);
  const strands = Array.isArray(body.strands) ? body.strands.slice(0, 12) : [];
  const strengths = Array.isArray(body.strengths) ? body.strengths.slice(0, 12) : [];
  const developing = Array.isArray(body.developing) ? body.developing.slice(0, 12) : [];
  const weaknesses = Array.isArray(body.weaknesses) ? body.weaknesses.slice(0, 12) : [];
  const answers = Array.isArray(body.answers) ? body.answers.slice(0, 40) : [];
  const missed = Array.isArray(body.missed) ? body.missed.slice(0, 30) : [];
  const timing = body.timing && typeof body.timing === "object" ? body.timing : {};
  const timingTotalSec = Number(timing.totalSec);
  const timingAvgSec = Number(timing.avgSec);
  const timingSuggestedSec = Number(timing.suggestedSec);
  const timingBand = String(timing.band || "").slice(0, 80);
  const timingNote = String(timing.note || "").slice(0, 400);
  if (!studentName) return jsonResponse({ error: "missing_name" }, 400);
  if (!isValidEmail(parentEmail)) return jsonResponse({ error: "invalid_email" }, 400);
  if (!Number.isFinite(totalCorrect) || !Number.isFinite(totalQuestions)) return jsonResponse({ error: "invalid_score" }, 400);

  const strandRows = strands.map(function(s) {
    const commentary = s.commentary ? `<div style="color:#555;font-size:13px;margin-top:4px;">${escapeHtml(String(s.commentary))}</div>` : "";
    return `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;vertical-align:top;"><strong>${escapeHtml(s.name)}</strong>${commentary}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">${escapeHtml(String(s.correct))}/${escapeHtml(String(s.total))}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">${escapeHtml(String(s.percent))}%</td></tr>`;
  }).join("");

  const missedRows = missed.map(function(m) {
    return `<li style="margin-bottom:8px;"><strong>${escapeHtml(m.strand || "")}</strong> &mdash; ${escapeHtml(m.question || "")}<br/><span style="color:#a23;">Chose:</span> <em>${escapeHtml(m.chosen || "(no answer)")}</em> &middot; <span style="color:#1f3d2e;">Correct:</span> <strong>${escapeHtml(m.correct || "")}</strong></li>`;
  }).join("");

  function fmtTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "&mdash;";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }
  const pacingBlock = (timingBand || Number.isFinite(timingTotalSec)) ? `<h3 style="color:#c89a3a;">Pacing</h3>
<div style="background:#fff;border:1px solid #e5e0d4;padding:14px 18px;border-radius:6px;">
<p style="margin:0 0 6px;font-weight:600;">${escapeHtml(timingBand || "")}</p>
${timingNote ? `<p style="margin:0 0 10px;">${escapeHtml(timingNote)}</p>` : ""}
<p style="margin:0;color:#555;font-size:14px;">Total time: <strong>${fmtTime(timingTotalSec)}</strong>${Number.isFinite(timingAvgSec) ? ` &middot; Avg per question: <strong>${timingAvgSec}s</strong>` : ""}${Number.isFinite(timingSuggestedSec) ? ` &middot; Suggested: <strong>${fmtTime(timingSuggestedSec)}</strong>` : ""}</p>
</div>` : "";

  const answerRows = answers.map(function(a, i) {
    const icon = a.isCorrect ? "\u2705" : "\u274C";
    return `<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top;">${i+1}. <strong>${escapeHtml(a.strand || "")}</strong><br/><span style="color:#555;">${escapeHtml(a.question || "")}</span></td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top;">${icon} Chose: <em>${escapeHtml(a.chosen || "(no answer)")}</em><br/>Correct: <strong>${escapeHtml(a.correct || "")}</strong></td></tr>`;
  }).join("");

  const listHtml = function(arr) { return arr.length ? `<ul>${arr.map(function(x){return `<li>${escapeHtml(x)}</li>`;}).join("")}</ul>` : "<p style=\"color:#888;\">(none)</p>"; };

  const gradeLabel = grade || "Math";
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;color:#1f3d2e;max-width:680px;">
<h2 style="color:#1f3d2e;border-bottom:2px solid #c89a3a;padding-bottom:8px;">${escapeHtml(gradeLabel)} Math Diagnostic \u2014 ${escapeHtml(studentName)}</h2>
<p><strong>Parent email:</strong> <a href="mailto:${escapeHtml(parentEmail)}">${escapeHtml(parentEmail)}</a><br/>
<strong>Grade:</strong> ${escapeHtml(gradeLabel)}<br/>
<strong>Submitted:</strong> ${new Date().toISOString()}<br/>
<strong>Source:</strong> /student-evaluation</p>
<h3 style="color:#c89a3a;">Overall</h3>
<p style="font-size:18px;"><strong>${totalCorrect} / ${totalQuestions}</strong> correct &middot; <strong>${overallPercent}%</strong></p>
${pacingBlock}
<h3 style="color:#c89a3a;">By strand</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;"><thead><tr><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #1f3d2e;">Strand</th><th style="text-align:right;padding:6px 10px;border-bottom:2px solid #1f3d2e;">Score</th><th style="text-align:right;padding:6px 10px;border-bottom:2px solid #1f3d2e;">%</th></tr></thead><tbody>${strandRows}</tbody></table>
<h3 style="color:#c89a3a;">Strengths</h3>${listHtml(strengths)}
<h3 style="color:#c89a3a;">Developing</h3>${listHtml(developing)}
<h3 style="color:#c89a3a;">Weaknesses (priority for tutoring)</h3>${listHtml(weaknesses)}
<h3 style="color:#c89a3a;">Performance summary</h3>
<div style="background:#f5f0e6;border-left:4px solid #c89a3a;padding:14px 18px;border-radius:6px;"><p style="margin:0 0 8px;font-weight:600;">${escapeHtml(performanceBand)}</p><p style="margin:0;">${escapeHtml(performanceSummary)}</p></div>
<h3 style="color:#c89a3a;">Full answer detail</h3>
<table style="border-collapse:collapse;width:100%;font-size:13px;"><tbody>${answerRows}</tbody></table>
<p style="color:#888;font-size:12px;margin-top:24px;">Sent automatically by schoolofmath.us</p>
</div>`;

  const notifyTo = env.NOTIFY_EMAIL || "hello@schoolofmath.us";
  const internalSubject = `Student diagnostic (${gradeLabel}): ${studentName} \u2014 ${overallPercent}% (${totalCorrect}/${totalQuestions})`;
  const parentSubject = `${studentName}'s ${gradeLabel} Math Diagnostic Report \u2014 School of Math`;

  // Parent-facing version: warm intro, no "full answer detail" table at the bottom
  const parentIntro = `<p style="margin:0 0 14px;">Hi there,</p>
<p style="margin:0 0 14px;">Thank you for using the free School of Math diagnostic for ${escapeHtml(studentName)}. Below is the full report \u2014 overall score, per-strand breakdown, and a written performance summary based on the New York State Common Core standards for ${escapeHtml(gradeLabel)}.</p>
<p style="margin:0 0 14px;">If you'd like one of our teachers to walk through this report with you in person, you can book a free 60-minute evaluation at <a href="https://www.schoolofmath.us/evaluation">schoolofmath.us/evaluation</a> or reply to this email and we'll set it up.</p>
<p style="margin:0 0 18px;">\u2014 The School of Math team<br/>226 W 79th St, Upper West Side, NYC<br/>(646) 668-6151</p>`;

  const parentHtml = `<div style="font-family:system-ui,-apple-system,sans-serif;color:#1f3d2e;max-width:680px;">${parentIntro}<hr style="border:none;border-top:1px solid #e5e0d4;margin:14px 0 18px;"/>
<h2 style="color:#1f3d2e;border-bottom:2px solid #c89a3a;padding-bottom:8px;">${escapeHtml(gradeLabel)} Math Diagnostic \u2014 ${escapeHtml(studentName)}</h2>
<p><strong>Grade:</strong> ${escapeHtml(gradeLabel)}<br/>
<strong>Submitted:</strong> ${new Date().toISOString().slice(0,10)}</p>
<h3 style="color:#c89a3a;">Overall</h3>
<p style="font-size:18px;"><strong>${totalCorrect} / ${totalQuestions}</strong> correct &middot; <strong>${overallPercent}%</strong></p>
${pacingBlock}
<h3 style="color:#c89a3a;">By strand</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;"><thead><tr><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #1f3d2e;">Strand</th><th style="text-align:right;padding:6px 10px;border-bottom:2px solid #1f3d2e;">Score</th><th style="text-align:right;padding:6px 10px;border-bottom:2px solid #1f3d2e;">%</th></tr></thead><tbody>${strandRows}</tbody></table>
<h3 style="color:#c89a3a;">Strengths</h3>${listHtml(strengths)}
<h3 style="color:#c89a3a;">Developing</h3>${listHtml(developing)}
<h3 style="color:#c89a3a;">Areas to focus on</h3>${listHtml(weaknesses)}
<h3 style="color:#c89a3a;">Performance summary</h3>
<div style="background:#f5f0e6;border-left:4px solid #c89a3a;padding:14px 18px;border-radius:6px;"><p style="margin:0 0 8px;font-weight:600;">${escapeHtml(performanceBand)}</p><p style="margin:0;">${escapeHtml(performanceSummary)}</p></div>
${missedRows ? `<h3 style="color:#c89a3a;">Questions to revisit</h3><ul style="padding-left:20px;">${missedRows}</ul>` : ""}
<p style="margin-top:22px;"><a href="https://www.schoolofmath.us/evaluation" style="display:inline-block;background:#1f3d2e;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Book a Free 60-Minute Evaluation</a></p>
<p style="color:#888;font-size:12px;margin-top:24px;">School of Math \u2014 226 W 79th St, New York, NY 10024 \u2014 hello@schoolofmath.us</p>
</div>`;

  if (env.RESEND_API_KEY) {
    // Send TWO emails: one to the school (internal, with full answer detail), one to the parent (clean, no answer dump).
    const schoolPromise = sendResendEmail(env, { to: notifyTo, subject: internalSubject, html, replyTo: parentEmail })
      .catch(function(e){ return { ok: false, error: "exception", detail: String(e) }; });
    const parentPromise = sendResendEmail(env, { to: parentEmail, subject: parentSubject, html: parentHtml, replyTo: notifyTo })
      .catch(function(e){ return { ok: false, error: "exception", detail: String(e) }; });
    const [schoolResult, parentResult] = await Promise.all([schoolPromise, parentPromise]);
    console.log("Student evaluation emails:", JSON.stringify({ school: schoolResult, parent: parentResult }));
    // If the school copy fails, report that as a hard error (their lead-capture matters more); parent failure is soft.
    if (!schoolResult.ok) return jsonResponse({ ok: false, error: schoolResult.error || "email_failed" }, 502);
    return jsonResponse({ ok: true, parentDelivered: !!parentResult.ok });
  }
  console.log(JSON.stringify({ event: "student_evaluation", grade, studentName, parentEmail, overallPercent, totalCorrect, totalQuestions }));
  return jsonResponse({ ok: true, note: "logged_only" });
}
__name(handleStudentEvaluation, "handleStudentEvaluation");

// ---- Pre-enroll (Stripe Checkout) ----
var PRE_ENROLL_COURSES = {
  "little-newtons":               { title: "Little Newtons",                grade: "Grades 1\u20132",   summerMins: 90,  fallMins: 90,  summerPerWeek: 2, fallPerWeek: 1 },
  "kid-einsteins-a":              { title: "Kid Einsteins A",               grade: "Grades 3\u20134",   summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "kid-einsteins-b":              { title: "Kid Einsteins B",               grade: "Grades 4\u20135",     summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "young-fermats-prealgebra":     { title: "Young Fermats \u2014 Pre-Algebra",      grade: "Grade 6",        summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "young-fermats-algebra-ignite": { title: "Young Fermats \u2014 Algebra Ignite",   grade: "Grades 7\u20138",summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "young-fermats-geometry":       { title: "Young Fermats \u2014 Geometry and Trigonometry",         grade: "Grades 7\u20138",summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "young-fermats-algebra-ii":     { title: "Young Fermats \u2014 Algebra II",       grade: "Grades 9\u201311",summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "shsat-prep":                   { title: "SHSAT Prep",                    grade: "Grades 7\u20138",   summerMins: 120, fallMins: 120, summerPerWeek: 1, fallPerWeek: 1 },
  "sat-math":                     { title: "SAT Math",                      grade: "Grades 9\u201311",  summerMins: 120, fallMins: 120, summerPerWeek: 1, fallPerWeek: 1 },
  "pre-calculus":                 { title: "AP Pre-Calculus",               grade: "Grades 10\u201312", summerMins: 120, fallMins: 120, summerPerWeek: 1, fallPerWeek: 1 },
  "ap-calculus":                  { title: "AP Calculus AB/BC",             grade: "Grades 11\u201312", summerMins: 120, fallMins: 120, summerPerWeek: 1, fallPerWeek: 1 },
  "ap-statistics":                { title: "AP Statistics",                 grade: "Grades 10\u201312", summerMins: 120, fallMins: 120, summerPerWeek: 1, fallPerWeek: 1 }
};
var PRE_ENROLL_TERMS = {
  july:     { label: "July 2026",     dateRange: "June 29 \u2013 August 1, 2026",      weeks: 5 },
  august:   { label: "August 2026",   dateRange: "August 3 \u2013 September 4, 2026",  weeks: 5 },
  fall:     { label: "Fall 2026",     dateRange: "August 31 \u2013 December 20, 2026", weeks: 16 },
  weekends: { label: "Weekends 2026", dateRange: "June 20 \u2013 October 4, 2026",      weeks: 16 }
};
// Weekends offers a subset of courses with course-specific minutes and a fixed weekday label.
var WEEKENDS_OFFERINGS = {
  // dayLabel is the FIXED label for single-day courses; null when course offers a choice (see WEEKENDS_DAY_CHOICES).
  "little-newtons":               { mins: 90,  dayLabel: null,        time: "10:00\u201311:30 AM" },
  "kid-einsteins-a":              { mins: 120, dayLabel: "Saturdays", time: "9:00\u201311:00 AM" },
  "kid-einsteins-b":              { mins: 120, dayLabel: "Saturdays", time: "11:00 AM\u20131:00 PM" },
  "young-fermats-prealgebra":     { mins: 120, dayLabel: "Saturdays", time: "3:00\u20135:00 PM" },
  "young-fermats-algebra-ignite": { mins: 120, dayLabel: "Sundays",   time: "3:00\u20135:00 PM" },
  "young-fermats-algebra-ii":     { mins: 120, dayLabel: "Tuesdays",  time: "5:30\u20137:30 PM" }
};
var WEEKENDS_DAY_CHOICES = {
  "little-newtons": ["Sat", "Sun"]
};
// Fall day choices per course (key omitted = no choice / single day).
var FALL_DAY_CHOICES = {
  "little-newtons":               ["Mon", "Wed"],
  "kid-einsteins-a":              ["Tue", "Wed"],
  "kid-einsteins-b":              ["Mon", "Wed"],
  "young-fermats-prealgebra":     ["Tue", "Thu"],
  "young-fermats-algebra-ignite": ["Mon", "Wed"],
  "young-fermats-geometry":       ["Tue", "Thu"],
  "young-fermats-algebra-ii":     ["Tue"]
};
var DAY_LABEL = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
function computeTuitionCents(courseId, termId) {
  const c = PRE_ENROLL_COURSES[courseId];
  const t = PRE_ENROLL_TERMS[termId];
  if (!c || !t) return null;
  let mins, perWeek;
  if (termId === "weekends") {
    const w = WEEKENDS_OFFERINGS[courseId];
    if (!w) return null;
    mins = w.mins;
    perWeek = 1;
  } else if (termId === "fall") {
    mins = c.fallMins;
    perWeek = c.fallPerWeek;
  } else {
    mins = c.summerMins;
    perWeek = c.summerPerWeek;
  }
  const hours = (mins * perWeek * t.weeks) / 60;
  return Math.round(hours * 60) * 100; // $60/hr, in cents
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
async function handlePreEnroll(request, env) {
  if (request.method !== "POST") return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ ok: false, error: "invalid_json" }, 400); }
  const { term, course, day, student_name, student_grade, parent_name, parent_phone, parent_email, agree_terms, agree_balance } = body || {};

  if (!PRE_ENROLL_TERMS[term]) return jsonResponse({ ok: false, error: "invalid_term" }, 400);
  if (!PRE_ENROLL_COURSES[course]) return jsonResponse({ ok: false, error: "invalid_course" }, 400);
  // Weekends term: validate the course is actually offered on weekends.
  if (term === "weekends" && !WEEKENDS_OFFERINGS[course]) {
    return jsonResponse({ ok: false, error: "course_not_offered_on_weekends" }, 400);
  }
  // Day-of-week validation: Fall and Weekends courses may offer two day options.
  let dayChoices = null;
  if (term === "fall") dayChoices = FALL_DAY_CHOICES[course] || null;
  else if (term === "weekends") dayChoices = WEEKENDS_DAY_CHOICES[course] || null;
  if (dayChoices && (!day || !dayChoices.includes(day))) {
    return jsonResponse({ ok: false, error: "invalid_day" }, 400);
  }
  if (!student_name || !student_grade) return jsonResponse({ ok: false, error: "missing_student" }, 400);
  if (!parent_name || !parent_phone) return jsonResponse({ ok: false, error: "missing_parent" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parent_email || "")) return jsonResponse({ ok: false, error: "invalid_email" }, 400);
  if (!agree_terms || !agree_balance) return jsonResponse({ ok: false, error: "terms_not_accepted" }, 400);

  if (!env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY not set");
    return jsonResponse({ ok: false, error: "stripe_not_configured" }, 500);
  }

  const c = PRE_ENROLL_COURSES[course];
  const t = PRE_ENROLL_TERMS[term];
  const tuitionCents = computeTuitionCents(course, term);
  const depositCents = 30000; // $300
  const feeCents = 1350;      // 4.5% of $300
  const totalCents = depositCents + feeCents; // $313.50

  const origin = new URL(request.url).origin;
  const successUrl = origin + "/pre-enroll-success?session_id={CHECKOUT_SESSION_ID}";
  const cancelUrl = origin + "/pre-enroll?course=" + encodeURIComponent(course) + "&term=" + encodeURIComponent(term);

  // Day label for receipts: if a day was chosen, use it. Otherwise fall back to the course's fixed dayLabel.
  let dayLabel = "";
  if (dayChoices && day) dayLabel = DAY_LABEL[day] + "s";
  else if (term === "weekends") dayLabel = (WEEKENDS_OFFERINGS[course] && WEEKENDS_OFFERINGS[course].dayLabel) || "";
  const productName = "Pre-Enroll Deposit \u2014 " + c.title + " (" + t.label + (dayLabel ? ", " + dayLabel : "") + ")";
  const productDesc = "Spot-reservation deposit. $300 credited toward total tuition ($" + (tuitionCents/100).toLocaleString() + "). Balance due 2 days before course begins.";

  // Build x-www-form-urlencoded body for Stripe API (Workers can't use JSON for Stripe)
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("customer_email", parent_email);
  params.append("payment_method_types[]", "card");
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][unit_amount]", String(depositCents));
  params.append("line_items[0][price_data][product_data][name]", productName);
  params.append("line_items[0][price_data][product_data][description]", productDesc);
  params.append("line_items[1][quantity]", "1");
  params.append("line_items[1][price_data][currency]", "usd");
  params.append("line_items[1][price_data][unit_amount]", String(feeCents));
  params.append("line_items[1][price_data][product_data][name]", "Processing fee (4.5%)");
  params.append("line_items[1][price_data][product_data][description]", "Non-refundable card-processing fee.");
  // Metadata so the success email + webhook can read it
  params.append("metadata[course_id]", course);
  params.append("metadata[course_title]", c.title);
  params.append("metadata[term_id]", term);
  params.append("metadata[term_label]", t.label);
  params.append("metadata[term_dates]", t.dateRange);
  params.append("metadata[student_name]", student_name);
  params.append("metadata[student_grade]", String(student_grade));
  params.append("metadata[parent_name]", parent_name);
  params.append("metadata[parent_phone]", parent_phone);
  params.append("metadata[parent_email]", parent_email);
  if (dayLabel) {
    params.append("metadata[weekly_day]", dayLabel);
  }
  if (term === "weekends" && WEEKENDS_OFFERINGS[course]) {
    params.append("metadata[weekend_time]", WEEKENDS_OFFERINGS[course].time);
  }
  params.append("metadata[tuition_total_cents]", String(tuitionCents));
  params.append("metadata[balance_due_cents]", String(tuitionCents - depositCents));
  // Stripe automatic receipt
  params.append("payment_intent_data[receipt_email]", parent_email);
  params.append("payment_intent_data[description]", productName);

  let session;
  try {
    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error("Stripe checkout session creation failed", resp.status, JSON.stringify(data));
      return jsonResponse({ ok: false, error: "stripe_error", detail: data.error && data.error.message }, 502);
    }
    session = data;
  } catch (e) {
    console.error("Stripe call exception", String(e));
    return jsonResponse({ ok: false, error: "stripe_exception" }, 502);
  }

  // Fire-and-forget staff notification (do not block redirect)
  const notifyTo = env.NOTIFY_EMAIL || "hello@schoolofmath.us";
  if (env.RESEND_API_KEY) {
    const balance = (tuitionCents - depositCents) / 100;
    const html =
      "<div style=\"font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f3d2e;max-width:560px\">" +
      "<h2 style=\"color:#1f3d2e;margin:0 0 8px\">New pre-enroll started</h2>" +
      "<p style=\"color:#6b7a72;margin:0 0 16px;font-size:13px\">Stripe Checkout Session: " + esc(session.id) + " \u2014 awaiting payment confirmation.</p>" +
      "<table style=\"border-collapse:collapse;font-size:14px\">" +
      "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7a72\">Course</td><td><b>" + esc(c.title) + "</b> (" + esc(c.grade) + ")</td></tr>" +
      "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7a72\">Term</td><td>" + esc(t.label) + " \u2014 " + esc(t.dateRange) + "</td></tr>" +
      (dayLabel ? "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7a72\">Weekly day</td><td><b>" + esc(dayLabel) + "</b></td></tr>" : "") +
      "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7a72\">Student</td><td>" + esc(student_name) + " (Grade " + esc(student_grade) + ")</td></tr>" +
      "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7a72\">Parent</td><td>" + esc(parent_name) + " \u2014 " + esc(parent_phone) + " \u2014 " + esc(parent_email) + "</td></tr>" +
      "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7a72\">Total tuition</td><td>$" + (tuitionCents/100).toLocaleString() + "</td></tr>" +
      "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7a72\">Balance after deposit</td><td>$" + balance.toLocaleString() + " (due 2 days before start)</td></tr>" +
      "</table>" +
      "<p style=\"font-size:12px;color:#6b7a72;margin-top:18px\">Stripe will email a confirmation once payment completes. Watch the Stripe dashboard for the live charge.</p>" +
      "</div>";
    sendResendEmail(env, {
      to: notifyTo,
      subject: "Pre-enroll started \u2014 " + c.title + " \u2014 " + student_name,
      html: html,
      replyTo: parent_email
    }).catch((e) => console.error("Staff notify failed", String(e)));
  }

  return jsonResponse({ ok: true, checkout_url: session.url, session_id: session.id });
}
__name(handlePreEnroll, "handlePreEnroll");

async function handleMembershipReservation(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }
  const parentName = String(body.parentName || "").trim().slice(0, 120);
  const parentEmail = String(body.parentEmail || "").trim().slice(0, 200);
  const parentPhone = String(body.parentPhone || "").trim().slice(0, 40);
  const studentName = String(body.studentName || "").trim().slice(0, 120);
  const grade = String(body.grade || "").trim().slice(0, 40);
  const tier = String(body.tier || "").trim().slice(0, 60);
  const startWhen = String(body.startWhen || "").trim().slice(0, 60);
  const message = String(body.message || "").trim().slice(0, 2000);
  const referrer = String(body.referrer || "").trim().slice(0, 300);

  if (!parentName || !isValidEmail(parentEmail) || !tier) {
    return jsonResponse({ ok: false, error: "missing_required" }, 400);
  }

  const tierLabels = {
    "little-newtons": "Little Newtons (K–2) · $369/mo",
    "core-1x": "Core 1×/week · $489/mo",
    "core-2x": "Core 2×/week · $929/mo",
    "shsat": "SHSAT Prep · $587/mo",
    "ap-honors": "AP / Honors · $529/mo",
    "unsure": "Not sure yet — recommend a tier"
  };
  const tierLabel = tierLabels[tier] || tier;

  const internalSubject = `New membership reservation — ${parentName} — ${tierLabel}`;
  const internalHtml = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a2820">
      <h2 style="color:#1f3d2e;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;margin:0 0 18px">New membership reservation</h2>
      <p style="margin:0 0 8px;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:1.5px">Source: /membership reservation form</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:10px 0;border-bottom:1px solid #e6dfd0;color:#666;width:140px">Parent</td><td style="padding:10px 0;border-bottom:1px solid #e6dfd0"><strong>${escapeHtml(parentName)}</strong></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #e6dfd0;color:#666">Email</td><td style="padding:10px 0;border-bottom:1px solid #e6dfd0"><a href="mailto:${escapeHtml(parentEmail)}" style="color:#1f3d2e">${escapeHtml(parentEmail)}</a></td></tr>
        ${parentPhone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e6dfd0;color:#666">Phone</td><td style="padding:10px 0;border-bottom:1px solid #e6dfd0"><a href="tel:${escapeHtml(parentPhone)}" style="color:#1f3d2e">${escapeHtml(parentPhone)}</a></td></tr>` : ""}
        ${studentName ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e6dfd0;color:#666">Student</td><td style="padding:10px 0;border-bottom:1px solid #e6dfd0">${escapeHtml(studentName)}</td></tr>` : ""}
        ${grade ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e6dfd0;color:#666">Grade</td><td style="padding:10px 0;border-bottom:1px solid #e6dfd0">${escapeHtml(grade)}</td></tr>` : ""}
        <tr><td style="padding:10px 0;border-bottom:1px solid #e6dfd0;color:#666">Tier</td><td style="padding:10px 0;border-bottom:1px solid #e6dfd0"><strong style="color:#c89a3a">${escapeHtml(tierLabel)}</strong></td></tr>
        ${startWhen ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e6dfd0;color:#666">Wants to start</td><td style="padding:10px 0;border-bottom:1px solid #e6dfd0">${escapeHtml(startWhen)}</td></tr>` : ""}
      </table>
      ${message ? `<div style="background:#f5f0e6;border-left:4px solid #c89a3a;padding:14px 18px;border-radius:4px;margin:16px 0"><p style="margin:0 0 6px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1.5px">Note from parent</p><p style="margin:0;line-height:1.55">${escapeHtml(message).replace(/\n/g, "<br/>")}</p></div>` : ""}
      <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e6dfd0">
        <p style="margin:0 0 12px;color:#666;font-size:13px"><strong>Next step:</strong> Reply within 24 hours to schedule the free 60-min evaluation and set up monthly Stripe billing manually in Dashboard.</p>
        <p style="margin:0;color:#999;font-size:12px">Referrer: ${escapeHtml(referrer || "(direct)")}<br/>Submitted: ${new Date().toISOString()}</p>
      </div>
    </div>
  `;

  const parentSubject = "Got it — we'll be in touch about your SOMATH Membership";
  const parentHtml = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a2820">
      <h2 style="color:#1f3d2e;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;margin:0 0 18px">Hi ${escapeHtml(parentName.split(" ")[0] || parentName)},</h2>
      <p style="line-height:1.6;font-size:16px;margin:0 0 14px">Thanks for reserving your spot for <strong>${escapeHtml(tierLabel)}</strong>. We've got your details and a SOMATH lead instructor will reach out within 24 hours to:</p>
      <ul style="line-height:1.7;font-size:16px;padding-left:22px;margin:0 0 20px">
        <li>Schedule the free 60-minute placement evaluation</li>
        <li>Confirm the right cohort and start week for ${escapeHtml(studentName || "your child")}</li>
        <li>Set up your monthly subscription (you'll get a Stripe checkout link by email)</li>
      </ul>
      <div style="background:#f5f0e6;border-left:4px solid #c89a3a;padding:16px 20px;border-radius:4px;margin:18px 0">
        <p style="margin:0 0 6px;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:1.5px">A quick reminder</p>
        <p style="margin:0;line-height:1.55">SOMATH Membership: start any week, pause up to 4 weeks/year, cancel with 15 days' notice. $30 off per sibling.</p>
      </div>
      <p style="line-height:1.6;font-size:16px;margin:18px 0 14px">Want to talk sooner? Call us at <a href="tel:+16466686151" style="color:#1f3d2e">(646) 668-6151</a> or just hit reply.</p>
      <p style="line-height:1.6;font-size:16px;margin:18px 0 0">Talk soon,<br/><strong>Vivianne &amp; the SOMATH team</strong><br/><span style="color:#666;font-size:14px">226 W 79th St · Upper West Side, NYC</span></p>
    </div>
  `;

  let internalResult = { ok: false, error: "email_not_configured" };
  let parentResult = { ok: false, error: "email_not_configured" };
  if (env.RESEND_API_KEY) {
    const notifyTo = env.NOTIFY_TO || "hello@schoolofmath.us";
    const [a, b] = await Promise.all([
      sendResendEmail(env, { to: notifyTo, subject: internalSubject, html: internalHtml, replyTo: parentEmail }),
      sendResendEmail(env, { to: parentEmail, subject: parentSubject, html: parentHtml, replyTo: notifyTo })
    ]);
    internalResult = a;
    parentResult = b;
  }

  console.log(JSON.stringify({ event: "membership_reservation", parentName, parentEmail, tier, grade, startWhen, internalOk: internalResult.ok, parentOk: parentResult.ok }));
  return jsonResponse({ ok: true, message: "Reservation received" });
}
__name(handleMembershipReservation, "handleMembershipReservation");

var EVAL_COURSES = {
  "little-newtons-a": "Little Newtons A",
  "little-newtons-b": "Little Newtons B",
  "kid-einsteins-a": "Kid Einsteins A",
  "kid-einsteins-b": "Kid Einsteins B",
  "young-fermats-prealgebra": "Young Fermats \u2014 Pre-Algebra",
  "young-fermats-algebra-ignite": "Young Fermats \u2014 Algebra Ignite",
  "young-fermats-geometry": "Young Fermats \u2014 Geometry and Trigonometry",
  "young-fermats-algebra-ii": "Young Fermats \u2014 Algebra II",
  "shsat-prep": "SHSAT Prep",
  "sat-math": "SAT Math",
  "pre-calculus": "AP Pre-Calculus",
  "ap-calculus": "AP Calculus AB/BC",
  "ap-statistics": "AP Statistics"
};

var COURSE_SCHEDULES = {
  "little-newtons-a":              [{d:"Wednesday",t:"3:30 \u2013 5:00 PM"},{d:"Sunday",t:"10:00 \u2013 11:30 AM"}],
  "little-newtons-b":              [{d:"Thursday",t:"3:30 \u2013 5:00 PM"},{d:"Saturday",t:"10:00 \u2013 11:30 AM"}],
  "kid-einsteins-a":               [{d:"Monday",t:"3:30 \u2013 5:30 PM"},{d:"Saturday",t:"11:30 AM \u2013 1:30 PM"}],
  "kid-einsteins-b":               [{d:"Tuesday",t:"3:30 \u2013 5:30 PM"},{d:"Sunday",t:"11:30 AM \u2013 1:30 PM"}],
  "young-fermats-prealgebra":      [{d:"Tuesday",t:"5:30 \u2013 7:30 PM"},{d:"Thursday",t:"5:00 \u2013 7:00 PM"},{d:"Saturday",t:"2:00 \u2013 4:00 PM"}],
  "young-fermats-algebra-ignite":  [{d:"Monday",t:"5:30 \u2013 7:30 PM"},{d:"Wednesday",t:"5:00 \u2013 7:00 PM"},{d:"Sunday",t:"2:00 \u2013 4:00 PM"}],
  "young-fermats-geometry":        [{d:"Monday",t:"7:30 \u2013 9:30 PM"}],
  "young-fermats-algebra-ii":      [{d:"Tuesday",t:"7:30 \u2013 9:30 PM"}],
  "shsat-prep":                    [{d:"Wednesday",t:"7:00 \u2013 9:00 PM"}],
  "sat-math":                      [{d:"Thursday",t:"7:00 \u2013 9:00 PM"}],
  "pre-calculus":                  [{d:"Friday",t:"7:00 \u2013 9:00 PM"}],
  "ap-calculus":                   [{d:"Saturday",t:"4:00 \u2013 6:00 PM"}],
  "ap-statistics":                 [{d:"Sunday",t:"4:00 \u2013 6:00 PM"}]
};
function buildEvalEmail({ parentName, studentName, courseSlug, courseName, notes, senderName }) {
  const monthlyPrice = COURSE_MONTHLY_USD[courseSlug] || 489;
  const sessionMinutes = (PRE_ENROLL_COURSES[courseSlug] && PRE_ENROLL_COURSES[courseSlug].fallMins) || 120;
  const priceLine = `Monthly Membership \u2014 $${monthlyPrice}/month flat for our Core plan (1 class per week, ${sessionMinutes} min per class). Start any week.`;
  const parentGreet = parentName ? parentName : "there";
  const courseUrl = `https://www.schoolofmath.us/courses/${courseSlug}`;
  const subject = `${studentName} \u2014 your SOMATH evaluation results and recommended course`;
  const notesParagraph = notes ? notes : "";
  const schedule = COURSE_SCHEDULES[courseSlug] || [];

  const textLines = [
    `Hi ${parentGreet},`,
    "",
    `Thank you for bringing ${studentName} in for the free evaluation. It was a real pleasure spending time with them, and we now have a clear picture of where they are and what comes next.`,
    "",
    `Our recommendation: ${courseName}`,
    "",
    `Everything you need is on the course page \u2014 full description, 24-class syllabus, and the enrollment form where you can pick your day of the week, pick ${studentName}'s start date, and reserve the spot:`,
    "",
    courseUrl,
    "",
    `Scroll to "Reserve your spot in ${courseName}" at the bottom of the page \u2014 the whole thing takes about 2 minutes.`,
    ""
  ];
  if (schedule.length) {
    textLines.push(
      `Days and times available for ${courseName}:`,
      ""
    );
    for (const s of schedule) {
      textLines.push(`  \u2022 ${s.d} \u2014 ${s.t}`);
    }
    textLines.push("", `Pick whichever slot works best for ${studentName} on the enrollment card.`, "");
  }
  if (notesParagraph) {
    textLines.push(notesParagraph, "");
  }
  textLines.push(
    "A quick summary of what to expect:",
    "",
    "\u2022 " + priceLine,
    "\u2022 $99 one-time registration charged today; monthly tuition begins one day before " + studentName + "'s first class.",
    "\u2022 Small cohorts (4\u20136 students), same instructor every week, same room.",
    "\u2022 In person at 226 W 79th St, 1st Floor, Upper West Side.",
    "\u2022 24-class rolling syllabus \u2014 " + studentName + " can join at any class and continue without losing the thread.",
    "\u2022 Up to 4 weeks of free pause per year, one free make-up per month, sibling discount of $30/month off per additional child.",
    "\u2022 Cancel anytime with 15 days' notice. No long-term contract.",
    "",
    "What to do next:",
    "",
    "1. Open the course page above.",
    "2. Scroll to the enrollment card, pick your day and start date, fill in your and " + studentName + "'s info.",
    "3. Click \"Reserve My Spot\" and complete the $99 registration checkout.",
    "4. We'll confirm " + studentName + "'s first class within 24 hours.",
    "",
    "If you'd rather talk it through first, just reply to this email or call us at (646) 668-6151.",
    "",
    `We're excited to have ${studentName} join us.`,
    "",
    "Warmly,",
    "",
    senderName,
    "School of Math | SOMATH",
    "226 W 79th St, 1st Floor, New York, NY 10024",
    "(646) 668-6151",
    "https://www.schoolofmath.us"
  );
  const text = textLines.join("\n");

  const e = escapeHtml;
  const linkStyle = "color:#1f3d2e;text-decoration:underline";
  const h = [
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.55;color:#1b1b1b;max-width:620px">`,
    `<p>Hi ${e(parentGreet)},</p>`,
    `<p>Thank you for bringing ${e(studentName)} in for the free evaluation. It was a real pleasure spending time with them, and we now have a clear picture of where they are and what comes next.</p>`,
    `<p><strong>Our recommendation:</strong> ${e(courseName)}</p>`,
    `<p>Everything you need is on the course page \u2014 full description, 24-class syllabus, and the enrollment form where you can <strong>pick your day of the week, pick ${e(studentName)}'s start date, and reserve the spot</strong>:</p>`,
    `<p><a href="${courseUrl}" style="${linkStyle}"><strong>${courseUrl}</strong></a></p>`,
    `<p>Scroll to \u201CReserve your spot in ${e(courseName)}\u201D at the bottom of the page \u2014 the whole thing takes about 2 minutes.</p>`
  ];
  if (schedule.length) {
    h.push(`<p><strong>Days and times available for ${e(courseName)}:</strong></p>`);
    h.push(`<ul style="padding-left:20px;margin:0 0 12px">`);
    for (const s of schedule) {
      h.push(`<li>${e(s.d)} \u2014 ${e(s.t)}</li>`);
    }
    h.push(`</ul>`);
    h.push(`<p>Pick whichever slot works best for ${e(studentName)} on the enrollment card.</p>`);
  }
  if (notesParagraph) {
    h.push(`<p>${e(notesParagraph).replace(/\n/g, "<br>")}</p>`);
  }
  h.push(
    `<p><strong>A quick summary of what to expect:</strong></p>`,
    `<ul style="padding-left:20px">`,
    `<li><strong>Monthly Membership</strong> \u2014 $${monthlyPrice}/month flat for our Core plan (1 class per week, ${sessionMinutes} min per class). Start any week.</li>`,
    `<li><strong>$99 one-time registration</strong> charged today; monthly tuition begins one day before ${e(studentName)}'s first class.</li>`,
    `<li>Small cohorts (4\u20136 students), same instructor every week, same room.</li>`,
    `<li>In person at 226 W 79th St, 1st Floor, Upper West Side.</li>`,
    `<li>24-class rolling syllabus \u2014 ${e(studentName)} can join at any class and continue without losing the thread.</li>`,
    `<li>Up to 4 weeks of free pause per year, one free make-up per month, sibling discount of $30/month off per additional child.</li>`,
    `<li>Cancel anytime with 15 days' notice. No long-term contract.</li>`,
    `</ul>`,
    `<p><strong>What to do next:</strong></p>`,
    `<ol style="padding-left:20px">`,
    `<li>Open the course page above.</li>`,
    `<li>Scroll to the enrollment card, pick your day and start date, fill in your and ${e(studentName)}'s info.</li>`,
    `<li>Click \u201CReserve My Spot\u201D and complete the $99 registration checkout.</li>`,
    `<li>We'll confirm ${e(studentName)}'s first class within 24 hours.</li>`,
    `</ol>`,
    `<p>If you'd rather talk it through first, just reply to this email or call us at <a href="tel:+16466686151" style="${linkStyle}">(646) 668-6151</a>.</p>`,
    `<p>We're excited to have ${e(studentName)} join us.</p>`,
    `<p>Warmly,<br>${e(senderName)}<br>School of Math | SOMATH<br>226 W 79th St, 1st Floor, New York, NY 10024<br>(646) 668-6151<br><a href="https://www.schoolofmath.us" style="${linkStyle}">schoolofmath.us</a></p>`,
    `</div>`
  );
  const html = h.join("");
  return { subject, text, html };
}
__name(buildEvalEmail, "buildEvalEmail");

async function handleSendEvalEmail(request, env) {
  if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  const adminPw = request.headers.get("x-admin-password") || "";
  if (!env.ADMIN_PASSWORD || adminPw !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "invalid_body" }, 400); }
  const parentEmail = String(body.parent_email || "").trim().toLowerCase();
  const parentName = String(body.parent_name || "").trim().slice(0, 80);
  const studentName = String(body.student_name || "").trim().slice(0, 80);
  const courseSlug = String(body.course_slug || "").trim();
  const notes = String(body.notes || "").trim().slice(0, 2000);
  const senderName = String(body.sender_name || "Vivianne").trim().slice(0, 80) || "Vivianne";
  const testMode = !!body.test_mode;
  if (!isValidEmail(parentEmail)) return jsonResponse({ error: "invalid_parent_email" }, 400);
  if (!studentName) return jsonResponse({ error: "missing_student_name" }, 400);
  if (!EVAL_COURSES[courseSlug]) return jsonResponse({ error: "unknown_course" }, 400);
  const courseName = EVAL_COURSES[courseSlug];
  const email = buildEvalEmail({ parentName, studentName, courseSlug, courseName, notes, senderName });
  const deliveredTo = testMode ? "hello@schoolofmath.us" : parentEmail;
  const replyTo = "hello@schoolofmath.us";
  const url = new URL(request.url);
  if (url.searchParams.get("preview") === "1") {
    return jsonResponse({ ok: true, to: deliveredTo, subject: email.subject, text: email.text });
  }
  const subject = testMode ? `[TEST] ${email.subject}` : email.subject;
  const sendResult = await sendResendEmail(env, {
    to: deliveredTo,
    subject,
    html: email.html,
    replyTo
  }).catch((e) => ({ ok: false, error: "exception", detail: String(e) }));
  if (!sendResult.ok) {
    console.error("send-eval-email failed", JSON.stringify(sendResult));
    return jsonResponse({ error: "send_failed", detail: sendResult.error || "unknown" }, 502);
  }
  console.log(JSON.stringify({ event: "eval_email_sent", parentEmail: deliveredTo, studentName, courseSlug, testMode }));
  return jsonResponse({ ok: true, delivered_to: deliveredTo, subject });
}
__name(handleSendEvalEmail, "handleSendEvalEmail");

// ---- Enrollment intent notification ----
var COURSE_TITLES = {
  "little-newtons-a": "Little Newtons A",
  "little-newtons-b": "Little Newtons B",
  "kid-einsteins-a": "Kid Einsteins A",
  "kid-einsteins-b": "Kid Einsteins B",
  "young-fermats-prealgebra": "Young Fermats \u2014 Pre-Algebra",
  "young-fermats-algebra-ignite": "Young Fermats \u2014 Algebra Ignite",
  "young-fermats-geometry": "Young Fermats \u2014 Geometry and Trigonometry",
  "young-fermats-algebra-ii": "Young Fermats \u2014 Algebra II",
  "shsat-prep": "SHSAT Prep",
  "sat-math": "SAT Math",
  "pre-calculus": "AP Pre-Calculus",
  "ap-calculus": "AP Calculus AB/BC",
  "ap-statistics": "AP Statistics"
};

// Stripe LIVE recurring Price IDs (acct_1TheUMIWmENPPZJB) — created 2026-06-27.
// Each course slug maps to the monthly recurring Price the parent subscribes to.
// Bundled Checkout adds $99 enrollment as a one-time invoice item on top.
var COURSE_PRICES = {
  "little-newtons-a":              "price_1Tn2YLIWmENPPZJBgIFNu6pX", // LN $369/mo
  "little-newtons-b":              "price_1Tn2YLIWmENPPZJBgIFNu6pX", // LN $369/mo
  "kid-einsteins-a":               "price_1Tn2YLIWmENPPZJBnwNpCKaY", // KE $489/mo
  "kid-einsteins-b":               "price_1Tn2YLIWmENPPZJBnwNpCKaY", // KE $489/mo
  "young-fermats-prealgebra":      "price_1Tn2YKIWmENPPZJBHAvRXGzp", // YF $489/mo
  "young-fermats-algebra-ignite":  "price_1Tn2YKIWmENPPZJBHAvRXGzp", // YF $489/mo
  "young-fermats-geometry":        "price_1Tn2YKIWmENPPZJBHAvRXGzp", // YF $489/mo
  "young-fermats-algebra-ii":      "price_1Tn2YKIWmENPPZJBHAvRXGzp", // YF $489/mo (reuses same YF price)
  "shsat-prep":                    "price_1Tn2YLIWmENPPZJBkwL9CRip", // SHSAT $587/mo
  "sat-math":                      "price_1Tn2YLIWmENPPZJBHl5dbt30", // SAT $640/mo
  "pre-calculus":                  "price_1Tn2YMIWmENPPZJBwQKPTMim", // AP $800/mo
  "ap-calculus":                   "price_1Tn2YMIWmENPPZJBwQKPTMim", // AP $800/mo
  "ap-statistics":                 "price_1Tn2YMIWmENPPZJBwQKPTMim"  // AP $800/mo
};
var COURSE_MONTHLY_USD = {
  "little-newtons-a": 369, "little-newtons-b": 369,
  "kid-einsteins-a": 489, "kid-einsteins-b": 489,
  "young-fermats-prealgebra": 489, "young-fermats-algebra-ignite": 489, "young-fermats-geometry": 489, "young-fermats-algebra-ii": 489,
  "shsat-prep": 587, "sat-math": 640,
  "pre-calculus": 800, "ap-calculus": 800, "ap-statistics": 800
};
function escHtml(s) { return String(s || "").replace(/[&<>"']/g, function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];}); }
function fmtLongDate(yyyyMmDd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return yyyyMmDd;
  var parts = yyyyMmDd.split("-");
  var d = new Date(Date.UTC(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10)));
  return d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:"UTC" });
}
// ---- Enrollment KV helpers ----
function randId(n) {
  var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  var out = "";
  var arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  for (var i = 0; i < n; i++) out += chars[arr[i] % chars.length];
  return out;
}
function enrollKey(iso, id) { return "enroll:" + iso + ":" + id; }
function refKey(ref) { return "ref:" + ref; }
async function kvPutEnrollment(env, rec) {
  if (!env.ENROLLMENTS) return null;
  var iso = rec.createdAt || new Date().toISOString();
  var id  = rec.id || randId(8);
  rec.id = id;
  rec.createdAt = iso;
  var key = enrollKey(iso, id);
  await env.ENROLLMENTS.put(key, JSON.stringify(rec));
  if (rec.ref) {
    await env.ENROLLMENTS.put(refKey(rec.ref), key);
  }
  return { key: key, id: id };
}
async function kvGetByRef(env, ref) {
  if (!env.ENROLLMENTS || !ref) return null;
  var key = await env.ENROLLMENTS.get(refKey(ref));
  if (!key) return null;
  var raw = await env.ENROLLMENTS.get(key);
  if (!raw) return null;
  try { return { key: key, rec: JSON.parse(raw) }; } catch (e) { return null; }
}
async function kvUpdate(env, key, patch) {
  if (!env.ENROLLMENTS) return;
  var raw = await env.ENROLLMENTS.get(key);
  if (!raw) return;
  var rec;
  try { rec = JSON.parse(raw); } catch (e) { return; }
  for (var k in patch) { if (Object.prototype.hasOwnProperty.call(patch, k)) rec[k] = patch[k]; }
  rec.updatedAt = new Date().toISOString();
  await env.ENROLLMENTS.put(key, JSON.stringify(rec));
}

async function handleEnrollIntent(request, env) {
  if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  var body;
  try {
    var raw = await request.text();
    body = raw ? JSON.parse(raw) : {};
  } catch (e) {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  var course = String(body.course || "").slice(0, 80);
  var day    = String(body.day    || "").slice(0, 16);
  var date   = String(body.startDate || "").slice(0, 16);
  var parentName  = String(body.parentName  || "").slice(0, 120);
  var parentEmail = String(body.parentEmail || "").slice(0, 160);
  var studentName = String(body.studentName || "").slice(0, 120);
  if (!course || !day || !date) return jsonResponse({ error: "missing_fields" }, 400);
  var title = COURSE_TITLES[course] || course;
  var ref = course + "__" + day + "__" + date;

  // Compute billing start = startDate - 1 day (UTC math, then format)
  var billingFmt = "";
  var trialEndUnix = 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    var p = date.split("-");
    var d = new Date(Date.UTC(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10)));
    d.setUTCDate(d.getUTCDate() - 1);
    billingFmt = d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:"UTC" });
    // Trial ends at noon UTC the day before first class (so first charge hits that morning ET)
    trialEndUnix = Math.floor(d.getTime() / 1000) + (12 * 60 * 60);
  }
  var startFmt = fmtLongDate(date);

  // ---- Build the BUNDLED Stripe Checkout Session ----
  // Subscription mode + $99 enrollment as a one-time invoice item + dynamic trial_end
  var checkoutUrl = "";
  var checkoutSessionId = "";
  if (env.STRIPE_SECRET_KEY && COURSE_PRICES[course] && trialEndUnix > 0) {
    var origin = new URL(request.url).origin;
    var successUrl = origin + "/enrollment/thank-you?session_id={CHECKOUT_SESSION_ID}";
    var cancelUrl  = origin + "/courses/" + course + ".html";
    var monthlyUsd = COURSE_MONTHLY_USD[course] || 0;

    var sp = new URLSearchParams();
    sp.append("mode", "subscription");
    sp.append("success_url", successUrl);
    sp.append("cancel_url", cancelUrl);
    if (parentEmail) sp.append("customer_email", parentEmail);
    sp.append("client_reference_id", ref);
    sp.append("payment_method_types[]", "card");
    sp.append("billing_address_collection", "required");
    sp.append("phone_number_collection[enabled]", "true");
    // Line item 0 — the recurring monthly tuition
    sp.append("line_items[0][price]", COURSE_PRICES[course]);
    sp.append("line_items[0][quantity]", "1");
    // Subscription trial — ends the day before first class
    sp.append("subscription_data[trial_end]", String(trialEndUnix));
    sp.append("subscription_data[trial_settings][end_behavior][missing_payment_method]", "cancel");
    sp.append("subscription_data[description]", title + " \u2014 monthly tuition");
    // Subscription metadata — powers the renewal automation
    sp.append("subscription_data[metadata][course_slug]", course);
    sp.append("subscription_data[metadata][course_title]", title);
    sp.append("subscription_data[metadata][weekly_day]", day);
    sp.append("subscription_data[metadata][first_class_date]", date);
    sp.append("subscription_data[metadata][monthly_usd]", String(monthlyUsd));
    sp.append("subscription_data[metadata][source]", "bundled_checkout_v1");
    if (studentName) sp.append("subscription_data[metadata][student_name]", studentName);
    if (parentName)  sp.append("subscription_data[metadata][parent_name]", parentName);
    // Top-level Checkout Session metadata (mirrors above for webhook convenience)
    sp.append("metadata[course_slug]", course);
    sp.append("metadata[course_title]", title);
    sp.append("metadata[weekly_day]", day);
    sp.append("metadata[first_class_date]", date);
    sp.append("metadata[ref]", ref);
    sp.append("metadata[flow]", "bundled_checkout_v1");
    if (studentName) sp.append("metadata[student_name]", studentName);
    if (parentName)  sp.append("metadata[parent_name]", parentName);
    // Add the one-time $99 enrollment invoice item on the FIRST invoice (today).
    // Stripe Checkout's `subscription_data` cannot accept add_invoice_items directly,
    // so we add it as a `line_items` entry with one-time price_data — Checkout will charge it today.
    sp.append("line_items[1][quantity]", "1");
    sp.append("line_items[1][price_data][currency]", "usd");
    sp.append("line_items[1][price_data][unit_amount]", "9900");
    sp.append("line_items[1][price_data][product_data][name]", "SOMATH enrollment fee");
    sp.append("line_items[1][price_data][product_data][description]", "One-time enrollment fee \u2014 secures your spot in " + title + ".");

    try {
      var resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: sp.toString()
      });
      var data = await resp.json();
      if (resp.ok) {
        checkoutUrl = data.url || "";
        checkoutSessionId = data.id || "";
      } else {
        console.error("Bundled Checkout creation failed", resp.status, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Bundled Checkout exception", String(e));
    }
  }

  // Stash useful request context
  var ua = request.headers.get("user-agent") || "";
  var referer = request.headers.get("referer") || "";
  var ip = request.headers.get("cf-connecting-ip") || "";

  // Persist enrollment intent to KV
  try {
    var existing = await kvGetByRef(env, ref);
    if (existing) {
      // Update existing intent record (parent may have re-clicked Continue with updated info)
      await kvUpdate(env, existing.key, {
        parentName: parentName || existing.rec.parentName,
        parentEmail: parentEmail || existing.rec.parentEmail,
        studentName: studentName || existing.rec.studentName,
        stripeSessionId: checkoutSessionId || existing.rec.stripeSessionId || "",
        ip: ip, referer: referer, userAgent: ua
      });
    } else {
      await kvPutEnrollment(env, {
        status: "intent",
        ref: ref,
        course: course, courseTitle: title, day: day, startDate: date,
        parentName: parentName, parentEmail: parentEmail, studentName: studentName,
        amountUsd: null, stripeCustomerId: "", stripeSessionId: checkoutSessionId || "", paymentIntent: "",
        ip: ip, referer: referer, userAgent: ua
      });
    }
  } catch (e) {
    console.error("KV write (intent) failed:", String(e));
  }

  var who = (parentName || parentEmail || studentName) ? (parentName || parentEmail) : "someone";
  var subject = "Enrollment intent: " + (studentName || parentName || "parent") + " \u00b7 " + title + " \u00b7 " + day;
  var html =
    "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#1f3d2e;max-width:560px;\">" +
      "<h2 style=\"color:#1f3d2e;margin:0 0 12px;\">New enrollment selection</h2>" +
      "<p style=\"margin:0 0 16px;color:#3a3a30;\"><strong>" + escHtml(who) + "</strong> just hit \u201cReserve My Spot.\u201d Stripe should send a $99 confirmation shortly with the matching client_reference_id.</p>" +
      "<table style=\"border-collapse:collapse;width:100%;font-size:15px;\">" +
        "<tr><td style=\"padding:8px 12px;background:#f5f0e6;font-weight:700;width:170px;\">Parent / guardian</td><td style=\"padding:8px 12px;background:#f5f0e6;\">" + escHtml(parentName || "\u2014") + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;font-weight:700;\">Parent email</td><td style=\"padding:8px 12px;\">" + (parentEmail ? "<a href=\"mailto:" + escHtml(parentEmail) + "\" style=\"color:#1f3d2e;\">" + escHtml(parentEmail) + "</a>" : "\u2014") + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;background:#f5f0e6;font-weight:700;\">Student</td><td style=\"padding:8px 12px;background:#f5f0e6;\">" + escHtml(studentName || "\u2014") + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;font-weight:700;\">Course</td><td style=\"padding:8px 12px;\">" + escHtml(title) + " <span style=\"color:#6b6657;\">(" + escHtml(course) + ")</span></td></tr>" +
        "<tr><td style=\"padding:8px 12px;background:#f5f0e6;font-weight:700;\">Weekly day</td><td style=\"padding:8px 12px;background:#f5f0e6;\">" + escHtml(day) + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;font-weight:700;\">Start date (first class)</td><td style=\"padding:8px 12px;\">" + escHtml(startFmt) + " <span style=\"color:#6b6657;\">(" + escHtml(date) + ")</span></td></tr>" +
        "<tr><td style=\"padding:8px 12px;background:#f5f0e6;font-weight:700;\">Monthly tuition begins</td><td style=\"padding:8px 12px;background:#f5f0e6;\">" + escHtml(billingFmt) + " <span style=\"color:#6b6657;\">(one day before first class)</span></td></tr>" +
      "</table>" +
      "<p style=\"margin:18px 0 6px;font-size:13px;color:#6b6657;\"><em>Stripe client_reference_id = <code>" + escHtml(course) + "__" + escHtml(day) + "__" + escHtml(date) + "</code>. A second \u201cPayment confirmed\u201d email will arrive once the $99 clears.</em></p>" +
      "<p style=\"margin:0;font-size:11px;color:#9a9588;\">IP: " + escHtml(ip) + " \u00b7 Referer: " + escHtml(referer) + "</p>" +
    "</div>";

  // Fire-and-forget staff notification (don't block the redirect)
  sendResendEmail(env, {
    to: "hello@schoolofmath.us",
    subject: subject,
    html: html,
    replyTo: "hello@schoolofmath.us"
  }).catch(function(e){ console.error("enroll-intent email failed", String(e)); });

  if (!checkoutUrl) {
    // Stripe call failed or course not in catalog — surface a clear error so the frontend doesn't redirect to a broken link
    return jsonResponse({ ok: false, error: "checkout_unavailable" }, 502);
  }
  return jsonResponse({ ok: true, checkout_url: checkoutUrl, session_id: checkoutSessionId });
}
__name(handleEnrollIntent, "handleEnrollIntent");

// ---- Order summary (read-only, called by /enrollment/thank-you) ----
// Public endpoint, but accepts only a cs_live_* / cs_test_* session_id. Returns a
// trimmed, non-sensitive summary of the just-completed Checkout Session so the
// thank-you page can render a personalized confirmation. Never exposes card
// details, full customer record, or anything beyond what the parent already saw
// on the Checkout page.
async function handleOrderSummary(request, env) {
  if (request.method !== "GET") return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  var url = new URL(request.url);
  var sessionId = String(url.searchParams.get("session_id") || "").trim();
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) {
    return jsonResponse({ ok: false, error: "invalid_session_id" }, 400);
  }
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({ ok: false, error: "stripe_not_configured" }, 500);
  }
  try {
    var resp = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId) + "?expand[]=line_items&expand[]=subscription", {
      headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY }
    });
    var s = await resp.json();
    if (!resp.ok) {
      console.error("order-summary stripe fetch failed", resp.status, JSON.stringify(s));
      return jsonResponse({ ok: false, error: "stripe_error" }, 502);
    }
    var md = s.metadata || {};
    var subMd = (s.subscription && s.subscription.metadata) || {};
    // Compute first monthly charge date from trial_end on the subscription
    var firstChargeIso = "";
    var firstChargeUnix = 0;
    if (s.subscription && s.subscription.trial_end) {
      firstChargeUnix = s.subscription.trial_end;
      firstChargeIso = new Date(firstChargeUnix * 1000).toISOString();
    }
    var summary = {
      ok: true,
      session_id: s.id,
      payment_status: s.payment_status || "",
      amount_total_usd: (s.amount_total != null) ? s.amount_total / 100 : null,
      currency: s.currency || "usd",
      customer_email: (s.customer_details && s.customer_details.email) || s.customer_email || "",
      customer_name: (s.customer_details && s.customer_details.name) || "",
      course_slug: md.course_slug || subMd.course_slug || "",
      course_title: md.course_title || subMd.course_title || "",
      weekly_day: md.weekly_day || subMd.weekly_day || "",
      first_class_date: md.first_class_date || subMd.first_class_date || "",
      student_name: md.student_name || subMd.student_name || "",
      parent_name: md.parent_name || subMd.parent_name || "",
      monthly_usd: subMd.monthly_usd ? parseInt(subMd.monthly_usd, 10) : null,
      first_charge_iso: firstChargeIso,
      subscription_id: (s.subscription && s.subscription.id) || "",
      subscription_status: (s.subscription && s.subscription.status) || ""
    };
    var headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
    return new Response(JSON.stringify(summary), { status: 200, headers: headers });
  } catch (e) {
    console.error("order-summary exception", String(e));
    return jsonResponse({ ok: false, error: "order_summary_exception" }, 502);
  }
}
__name(handleOrderSummary, "handleOrderSummary");

// ---- Stripe webhook (verified payment confirmation) ----
function hexToBuf(hex) {
  var len = hex.length / 2;
  var u8 = new Uint8Array(len);
  for (var i = 0; i < len; i++) u8[i] = parseInt(hex.substr(i*2, 2), 16);
  return u8.buffer;
}
function bufToHex(buf) {
  var u8 = new Uint8Array(buf);
  var s = "";
  for (var i = 0; i < u8.length; i++) {
    var h = u8[i].toString(16);
    if (h.length < 2) h = "0" + h;
    s += h;
  }
  return s;
}
function timingSafeEqualHex(aHex, bHex) {
  if (aHex.length !== bHex.length) return false;
  var diff = 0;
  for (var i = 0; i < aHex.length; i++) diff |= aHex.charCodeAt(i) ^ bHex.charCodeAt(i);
  return diff === 0;
}
async function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  var parts = sigHeader.split(",");
  var ts = "";
  var sigs = [];
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split("=");
    if (kv[0] === "t") ts = kv[1];
    else if (kv[0] === "v1") sigs.push(kv[1]);
  }
  if (!ts || sigs.length === 0) return false;
  // Reject events older than 5 minutes
  var nowSec = Math.floor(Date.now()/1000);
  if (Math.abs(nowSec - parseInt(ts,10)) > 300) return false;
  var enc = new TextEncoder();
  var key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  var payload = ts + "." + rawBody;
  var mac = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  var computed = bufToHex(mac);
  for (var j = 0; j < sigs.length; j++) {
    if (timingSafeEqualHex(computed, sigs[j])) return true;
  }
  return false;
}
__name(verifyStripeSignature, "verifyStripeSignature");
function parseRef(ref) {
  // course__day__YYYY-MM-DD
  if (!ref) return { course: "", day: "", date: "" };
  var p = String(ref).split("__");
  return { course: p[0] || "", day: p[1] || "", date: p[2] || "" };
}
async function handleStripeWebhook(request, env) {
  if (request.method !== "POST") return new Response("method not allowed", { status: 405 });
  var raw = await request.text();
  var sig = request.headers.get("stripe-signature");
  var secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) { console.error("STRIPE_WEBHOOK_SECRET missing"); return new Response("webhook not configured", { status: 500 }); }
  var ok = await verifyStripeSignature(raw, sig, secret);
  if (!ok) { console.error("Stripe webhook signature invalid"); return new Response("invalid signature", { status: 400 }); }
  var event;
  try { event = JSON.parse(raw); } catch (e) { return new Response("bad json", { status: 400 }); }
  if (event.type !== "checkout.session.completed") {
    return new Response("ignored", { status: 200 });
  }
  var s = event.data && event.data.object || {};
  var refStr = s.client_reference_id || "";
  var ref = parseRef(refStr);
  var title = COURSE_TITLES[ref.course] || ref.course || "\u2014";
  var custDetails = s.customer_details || {};
  var name  = custDetails.name  || "";
  var email = custDetails.email || s.customer_email || "";
  var phone = custDetails.phone || "";
  var amount = (s.amount_total != null) ? ("$" + (s.amount_total/100).toFixed(2) + " " + String(s.currency || "usd").toUpperCase()) : "\u2014";
  var amountUsd = (s.amount_total != null) ? (s.amount_total/100) : null;
  var customerId = s.customer || "";
  var pi = s.payment_intent || "";
  var sessionId = s.id || "";

  // Persist paid record to KV (update existing intent if matched by ref, else insert)
  try {
    var paidPatch = {
      status: "paid",
      paidAt: new Date().toISOString(),
      parentName: name || "",
      parentEmail: email || "",
      parentPhone: phone || "",
      amountUsd: amountUsd,
      stripeCustomerId: customerId,
      stripeSessionId: sessionId,
      paymentIntent: pi
    };
    var matched = refStr ? await kvGetByRef(env, refStr) : null;
    if (matched) {
      await kvUpdate(env, matched.key, paidPatch);
    } else {
      paidPatch.ref = refStr;
      paidPatch.course = ref.course; paidPatch.courseTitle = title;
      paidPatch.day = ref.day; paidPatch.startDate = ref.date;
      paidPatch.studentName = paidPatch.studentName || "";
      await kvPutEnrollment(env, paidPatch);
    }
  } catch (e) {
    console.error("KV write (paid) failed:", String(e));
  }
  var startFmt = fmtLongDate(ref.date);
  var billingFmt = "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(ref.date)) {
    var p = ref.date.split("-");
    var d = new Date(Date.UTC(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10)));
    d.setUTCDate(d.getUTCDate() - 1);
    billingFmt = d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:"UTC" });
  }
  var dashLink = customerId ? ("https://dashboard.stripe.com/customers/" + customerId) : "";
  var subject = "\u2705 Payment confirmed: " + (name || email || "parent") + " \u00b7 " + title;
  var html =
    "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#1f3d2e;max-width:580px;\">" +
      "<h2 style=\"color:#1f3d2e;margin:0 0 12px;\">\u2705 $99 enrollment payment confirmed</h2>" +
      "<p style=\"margin:0 0 16px;color:#3a3a30;\">Stripe just confirmed a successful $99 enrollment payment. Set up the monthly subscription on this customer when you confirm the start date.</p>" +
      "<table style=\"border-collapse:collapse;width:100%;font-size:15px;\">" +
        "<tr><td style=\"padding:8px 12px;background:#f5f0e6;font-weight:700;width:170px;\">Parent name</td><td style=\"padding:8px 12px;background:#f5f0e6;\">" + escHtml(name || "\u2014") + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;font-weight:700;\">Parent email</td><td style=\"padding:8px 12px;\">" + (email ? "<a href=\"mailto:" + escHtml(email) + "\" style=\"color:#1f3d2e;\">" + escHtml(email) + "</a>" : "\u2014") + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;background:#f5f0e6;font-weight:700;\">Parent phone</td><td style=\"padding:8px 12px;background:#f5f0e6;\">" + (phone ? "<a href=\"tel:" + escHtml(phone) + "\" style=\"color:#1f3d2e;\">" + escHtml(phone) + "</a>" : "\u2014") + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;font-weight:700;\">Amount paid</td><td style=\"padding:8px 12px;\">" + escHtml(amount) + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;background:#f5f0e6;font-weight:700;\">Course</td><td style=\"padding:8px 12px;background:#f5f0e6;\">" + escHtml(title) + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;font-weight:700;\">Weekly day</td><td style=\"padding:8px 12px;\">" + escHtml(ref.day || "\u2014") + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;background:#f5f0e6;font-weight:700;\">Start date</td><td style=\"padding:8px 12px;background:#f5f0e6;\">" + escHtml(startFmt || "\u2014") + "</td></tr>" +
        "<tr><td style=\"padding:8px 12px;font-weight:700;\">Monthly tuition begins</td><td style=\"padding:8px 12px;\">" + escHtml(billingFmt || "\u2014") + " <span style=\"color:#6b6657;\">(one day before first class)</span></td></tr>" +
      "</table>" +
      (dashLink ? "<p style=\"margin:18px 0 0;\"><a href=\"" + escHtml(dashLink) + "\" style=\"background:#1f3d2e;color:#c89a3a;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:700;display:inline-block;\">Open customer in Stripe \u2192</a></p>" : "") +
      "<p style=\"margin:18px 0 6px;font-size:13px;color:#6b6657;\"><em>Customer ID: <code>" + escHtml(customerId) + "</code> \u00b7 PaymentIntent: <code>" + escHtml(pi) + "</code></em></p>" +
    "</div>";
  var result = await sendResendEmail(env, {
    to: "hello@schoolofmath.us",
    subject: subject,
    html: html,
    replyTo: email || "hello@schoolofmath.us"
  });
  if (!result.ok) console.error("webhook email send failed", result);
  return new Response("ok", { status: 200 });
}
__name(handleStripeWebhook, "handleStripeWebhook");

// ---- Enrollments list (admin) ----
async function kvListEnrollments(env, limit) {
  if (!env.ENROLLMENTS) return [];
  var results = [];
  var cursor = undefined;
  var pageLimit = 1000;
  var hardCap = limit || 5000;
  while (results.length < hardCap) {
    var opts = { prefix: "enroll:", limit: pageLimit };
    if (cursor) opts.cursor = cursor;
    var page = await env.ENROLLMENTS.list(opts);
    for (var i = 0; i < page.keys.length; i++) {
      var raw = await env.ENROLLMENTS.get(page.keys[i].name);
      if (!raw) continue;
      try { results.push(JSON.parse(raw)); } catch (e) {}
    }
    if (page.list_complete || !page.cursor) break;
    cursor = page.cursor;
  }
  // Sort newest first
  results.sort(function(a,b){ return (b.createdAt||"").localeCompare(a.createdAt||""); });
  return results;
}
function csvEscape(v) {
  if (v == null) return "";
  var s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function enrollmentsToCsv(rows) {
  var headers = [
    "Created (ET)", "Status", "Course", "Day", "Start Date",
    "Parent Name", "Parent Email", "Parent Phone", "Student Name",
    "Amount USD", "Stripe Customer ID", "Stripe Session ID", "Payment Intent", "Paid At (ET)", "Ref"
  ];
  var lines = [headers.map(csvEscape).join(",")];
  function fmtET(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      return d.toLocaleString("en-US", { timeZone: "America/New_York", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false });
    } catch (e) { return iso; }
  }
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    lines.push([
      fmtET(r.createdAt),
      r.status || "",
      r.courseTitle || r.course || "",
      r.day || "",
      r.startDate || "",
      r.parentName || "",
      r.parentEmail || "",
      r.parentPhone || "",
      r.studentName || "",
      r.amountUsd != null ? r.amountUsd.toFixed(2) : "",
      r.stripeCustomerId || "",
      r.stripeSessionId || "",
      r.paymentIntent || "",
      fmtET(r.paidAt),
      r.ref || ""
    ].map(csvEscape).join(","));
  }
  return lines.join("\n");
}
async function handleEnrollmentsApi(request, env) {
  // Authentication: x-admin-password header OR ?pw= query (for download links)
  var url = new URL(request.url);
  var headerPw = request.headers.get("x-admin-password") || "";
  var queryPw  = url.searchParams.get("pw") || "";
  var pw = headerPw || queryPw;
  if (!env.ADMIN_PASSWORD || pw !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  // POST = manual insert (admin-only backfill)
  if (request.method === "POST") {
    var body;
    try { body = await request.json(); } catch (e) { return jsonResponse({ error: "bad_json" }, 400); }
    if (!body || typeof body !== "object") return jsonResponse({ error: "bad_body" }, 400);
    var now = new Date().toISOString();
    var status = body.status === "intent" ? "intent" : "paid";
    var rec = {
      id: body.id || randId(),
      createdAt: body.createdAt || now,
      updatedAt: now,
      status: status,
      ref: body.ref || "",
      course: body.course || "",
      courseTitle: body.courseTitle || "",
      day: body.day || "",
      startDate: body.startDate || "",
      parentName: body.parentName || "",
      parentEmail: body.parentEmail || "",
      parentPhone: body.parentPhone || "",
      studentName: body.studentName || "",
      amountUsd: body.amountUsd != null ? Number(body.amountUsd) : null,
      stripeCustomerId: body.stripeCustomerId || "",
      stripeSessionId: body.stripeSessionId || "",
      paymentIntent: body.paymentIntent || "",
      paidAt: body.paidAt || (status === "paid" ? now : ""),
      ip: "",
      referer: "admin-manual",
      userAgent: "admin-manual",
      notes: body.notes || ""
    };
    await kvPutEnrollment(env, rec);
    return jsonResponse({ ok: true, record: rec }, 200);
  }

  var rows = await kvListEnrollments(env, 5000);
  if (url.searchParams.get("format") === "csv") {
    var csv = enrollmentsToCsv(rows);
    var stamp = new Date().toISOString().slice(0,10);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="somath-enrollments-' + stamp + '.csv"',
        "X-Robots-Tag": "noindex,nofollow"
      }
    });
  }
  return new Response(JSON.stringify({ ok: true, count: rows.length, enrollments: rows, rows: rows }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex,nofollow"
    }
  });
}
__name(handleEnrollmentsApi, "handleEnrollmentsApi");

var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Canonical host: www.schoolofmath.us. 301 apex -> www.
    if (url.hostname === "schoolofmath.us") {
      const target = new URL(request.url);
      target.hostname = "www.schoolofmath.us";
      return Response.redirect(target.toString(), 301);
    }
    // Serve our own robots.txt (bypass Cloudflare managed robots injection).
    // Single consolidated file: one User-agent: * group with all disallows,
    // AI bots each in their own group, sitemap at the end.
    if (url.pathname === "/robots.txt") {
      const robots = [
        "User-agent: *",
        "Disallow: /_admin/",
        "Disallow: /_secure/",
        "Disallow: /api/",
        "Allow: /",
        "",
        "User-agent: Amazonbot",
        "Disallow: /",
        "",
        "User-agent: Applebot-Extended",
        "Disallow: /",
        "",
        "User-agent: Bytespider",
        "Disallow: /",
        "",
        "User-agent: CCBot",
        "Disallow: /",
        "",
        "User-agent: ClaudeBot",
        "Disallow: /",
        "",
        "User-agent: Google-Extended",
        "Disallow: /",
        "",
        "User-agent: GPTBot",
        "Disallow: /",
        "",
        "User-agent: meta-externalagent",
        "Disallow: /",
        "",
        "Sitemap: https://www.schoolofmath.us/sitemap.xml",
        ""
      ].join("\n");
      return new Response(robots, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600",
          "x-robots-source": "worker"
        }
      });
    }
    // Strip .html suffix with a 301 (SEO — Google's auto-strip 307 does not pass link equity as strongly).
    if (url.pathname.endsWith(".html") && !url.pathname.startsWith("/api/")) {
      const target = new URL(request.url);
      target.pathname = url.pathname.slice(0, -5); // remove '.html'
      if (target.pathname === "/index") target.pathname = "/";
      return Response.redirect(target.toString(), 301);
    }
    if (url.pathname === "/api/request-pdf") return handleRequestPdf(request, env);
    if (url.pathname === "/api/verify-pdf") return handleVerifyPdf(request, env);
    if (url.pathname === "/api/download-pdf") return handleDownloadPdf(request, env);
    if (url.pathname === "/api/student-evaluation") return handleStudentEvaluation(request, env);
    if (url.pathname === "/api/pre-enroll") return handlePreEnroll(request, env);
    if (url.pathname === "/api/membership-reservation") return handleMembershipReservation(request, env);
    if (url.pathname === "/api/send-eval-email") return handleSendEvalEmail(request, env);
    if (url.pathname === "/api/enroll-intent") return handleEnrollIntent(request, env);
    if (url.pathname === "/api/order-summary") return handleOrderSummary(request, env);
    if (url.pathname === "/api/stripe-webhook") return handleStripeWebhook(request, env);
    if (url.pathname === "/api/enrollments") return handleEnrollmentsApi(request, env);
    if (url.pathname.startsWith("/_admin/")) {
      const adminResp = await env.ASSETS.fetch(request);
      const headers = new Headers(adminResp.headers);
      headers.set("X-Robots-Tag", "noindex,nofollow,noarchive");
      headers.set("Cache-Control", "no-store");
      return new Response(adminResp.body, { status: adminResp.status, statusText: adminResp.statusText, headers });
    }
    const SCHEDULE_REDIRECTS = {
      "/summer-schedule": "/schedule",
      "/august-schedule": "/schedule",
      "/fall-schedule": "/schedule",
      "/weekends-schedule": "/schedule"
    };
    if (SCHEDULE_REDIRECTS[url.pathname]) {
      return Response.redirect(`https://www.schoolofmath.us${SCHEDULE_REDIRECTS[url.pathname]}`, 301);
    }
    // Duplicate blog post slugs -> clean canonical slug (SEO consolidation)
    const POST_REDIRECTS = {
      "/posts/mastering-advanced-quantitative-concepts-a-strategic-guide-1": "/posts/mastering-advanced-quantitative-concepts-a-strategic-guide",
      "/posts/why-mathematical-thinking-matters-for-your-child-s-future-1": "/posts/why-mathematical-thinking-matters-for-your-child-s-future",
      "/posts/why-mathematical-thinking-matters-for-your-childs-future": "/posts/why-mathematical-thinking-matters-for-your-child-s-future",
      "/posts/ap-calc-ab-or-bc-which-should-my-child-take": "/posts/ap-calculus-ab-vs-bc-which-should-my-child-take",
      "/posts/shsat-explained-nyc": "/posts/shsat-prep-nyc-expert-guide-2026",
      "/posts/shsat-prep-when-to-start": "/posts/shsat-prep-timeline-upper-west-side",
      "/posts/precalc-diagnostic-stewart-problems-1-10-uws": "/posts/precalc-diagnostic-expand-and-simplify-stewart-problem-3"
    };
    if (POST_REDIRECTS[url.pathname]) {
      return Response.redirect(`https://www.schoolofmath.us${POST_REDIRECTS[url.pathname]}`, 301);
    }
    // Legacy Wix /service-page/* URLs -> current course pages (or /courses fallback)
    if (url.pathname.startsWith("/service-page/")) {
      const slug = url.pathname.slice("/service-page/".length).toLowerCase();
      const SERVICE_PAGE_MAP = {
        "young-fermats-algebra-i-a-13-y-o-1": "/courses/young-fermats-algebra-ignite",
        "young-fermats-algebra-i-a-13-y-o": "/courses/young-fermats-algebra-ignite",
        "young-fermats-algebra-i": "/courses/young-fermats-algebra-ignite",
        "young-fermats-algebra-ii": "/courses/young-fermats-algebra-ii",
        "young-fermats-geometry": "/courses/young-fermats-geometry",
        "young-fermats-prealgebra": "/courses/young-fermats-prealgebra",
        "kid-einsteins-a": "/courses/kid-einsteins-a",
        "kid-einsteins-b": "/courses/kid-einsteins-b",
        "little-newtons-a": "/courses/little-newtons-a",
        "little-newtons-b": "/courses/little-newtons-b",
        "shsat-prep": "/courses/shsat-prep",
        "sat-math": "/courses/sat-math",
        "ap-calculus": "/courses/ap-calculus",
        "ap-statistics": "/courses/ap-statistics",
        "pre-calculus": "/courses/pre-calculus"
      };
      // Exact match first; fall back to fuzzy prefix match (Wix appends age/suffixes like -11-13-y-o-1)
      let target = SERVICE_PAGE_MAP[slug];
      if (!target) {
        const keysByLen = Object.keys(SERVICE_PAGE_MAP).sort((a, b) => b.length - a.length);
        for (const key of keysByLen) {
          if (slug.startsWith(key + "-") || slug === key) {
            target = SERVICE_PAGE_MAP[key];
            break;
          }
        }
      }
      if (!target) target = "/courses";
      return Response.redirect(`https://www.schoolofmath.us${target}`, 301);
    }
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
    const assetResp = await env.ASSETS.fetch(request);
    // Long-cache immutable static assets — HTML stays short-cache
    const IMMUTABLE_RE = /\.(css|js|jpg|jpeg|png|webp|svg|woff2|woff|mp4|ico|gif|avif|ttf|otf)$/i;
    if (IMMUTABLE_RE.test(url.pathname)) {
      const headers = new Headers(assetResp.headers);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return new Response(assetResp.body, { status: assetResp.status, statusText: assetResp.statusText, headers });
    }
    return assetResp;
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=_worker.js.map