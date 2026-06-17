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
  "little-newtons":               { title: "Little Newtons",                grade: "Grades K\u20132",   summerMins: 90,  fallMins: 90,  summerPerWeek: 2, fallPerWeek: 1 },
  "kid-einsteins-a":              { title: "Kid Einsteins A",               grade: "Grades 3\u20134",   summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "kid-einsteins-b":              { title: "Kid Einsteins B",               grade: "Grade 5",            summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "young-fermats-prealgebra":     { title: "Young Fermats \u2014 Pre-Algebra",      grade: "Grade 6",        summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "young-fermats-algebra-ignite": { title: "Young Fermats \u2014 Algebra Ignite",   grade: "Grades 7\u20138",summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "young-fermats-geometry":       { title: "Young Fermats \u2014 Geometry",         grade: "Grades 7\u20138",summerMins: 120, fallMins: 120, summerPerWeek: 2, fallPerWeek: 1 },
  "shsat-prep":                   { title: "SHSAT Prep",                    grade: "Grades 7\u20138",   summerMins: 120, fallMins: 120, summerPerWeek: 1, fallPerWeek: 1 },
  "sat-math":                     { title: "SAT Math",                      grade: "Grades 9\u201311",  summerMins: 120, fallMins: 120, summerPerWeek: 1, fallPerWeek: 1 },
  "pre-calculus":                 { title: "Pre-Calculus",                  grade: "Grades 10\u201312", summerMins: 120, fallMins: 120, summerPerWeek: 1, fallPerWeek: 1 }
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
  "young-fermats-algebra-ignite": { mins: 120, dayLabel: "Sundays",   time: "3:00\u20135:00 PM" }
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
  "young-fermats-geometry":       ["Tue", "Thu"]
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
    "shsat": "SHSAT Intensive · $989/mo",
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
        <p style="margin:0;line-height:1.55">SOMATH Membership: start any week, pause up to 4 weeks/year, cancel anytime with 15 days' notice. $30 off per sibling.</p>
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

var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/request-pdf") return handleRequestPdf(request, env);
    if (url.pathname === "/api/verify-pdf") return handleVerifyPdf(request, env);
    if (url.pathname === "/api/download-pdf") return handleDownloadPdf(request, env);
    if (url.pathname === "/api/student-evaluation") return handleStudentEvaluation(request, env);
    if (url.pathname === "/api/pre-enroll") return handlePreEnroll(request, env);
    if (url.pathname === "/api/membership-reservation") return handleMembershipReservation(request, env);
    const SCHEDULE_REDIRECTS = {
      "/summer-schedule": "/schedule",
      "/august-schedule": "/schedule",
      "/fall-schedule": "/schedule",
      "/weekends-schedule": "/schedule"
    };
    if (SCHEDULE_REDIRECTS[url.pathname]) {
      return Response.redirect(`https://www.schoolofmath.us${SCHEDULE_REDIRECTS[url.pathname]}`, 301);
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
    return env.ASSETS.fetch(request);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=_worker.js.map