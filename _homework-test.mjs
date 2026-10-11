import { homeworkMessage } from "./_checkin.mjs";

// Approved single-recipient diagnostic, isolated from lessons and attendance.
const REVISION = "homework-test-2026-10-11-v1";
const KEY = "staff-homework-test:" + REVISION;
const RECIPIENT_HASH = "ebb4e69e6d16e440112c68abdb23d65cdc120d06865c1158bae6554557f06859";
const EXPIRES = Date.parse("2026-10-12T04:00:00Z");
const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: {"Content-Type":"application/json","Cache-Control":"no-store, private",
    "X-Robots-Tag":"noindex, nofollow","X-Content-Type-Options":"nosniff"},
});
async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))))
    .map(v=>v.toString(16).padStart(2,"0")).join("");
}
export async function handleHomeworkTest(request, env, deps, now = new Date()) {
  if (!env.ADMIN_PASSWORD || request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD)
    return reply({error:"unauthorized"},401);
  if (!["GET","POST"].includes(request.method)) return reply({error:"method_not_allowed"},405);
  if (!env.RESEND_API_KEY || !env.ENROLLMENTS) return reply({error:"sender_not_configured"},503);
  try {
    const raw = await env.ENROLLMENTS.get(KEY);
    const receipt = raw ? JSON.parse(raw) : null;
    if (request.method === "GET") {
      if (!receipt?.id) return reply({ok:true,revision:REVISION,sent:false,attempted:!!receipt});
      const response = await fetch("https://api.resend.com/emails/"+encodeURIComponent(receipt.id), {
        headers:{Authorization:"Bearer "+env.RESEND_API_KEY},
      });
      const email = response.ok ? await response.json() : null;
      return reply({ok:true,sent:true,revision:REVISION,id:receipt.id,sent_at:receipt.sent_at,
        delivery_status:email?.last_event || "unavailable"});
    }
    if (now.getTime() >= EXPIRES) return reply({error:"test_authorization_expired"},410);
    if (Number(request.headers.get("content-length") || 0)>1024)
      return reply({error:"body_too_large"},413);
    const text=await request.text();
    if(text.length>1024)return reply({error:"body_too_large"},413);
    let body;
    try {body=JSON.parse(text);} catch {return reply({error:"invalid_json"},400);}
    if(!body || typeof body!=="object" || Array.isArray(body) ||
      Object.keys(body).some(k=>!["action","to","confirmation"].includes(k)))
      return reply({error:"unexpected_fields"},400);
    const to=typeof body.to==="string"?body.to.trim().toLowerCase():"";
    if(body.action!=="send" || body.confirmation!==REVISION || await digest(to)!==RECIPIENT_HASH)
      return reply({error:"test_scope_not_authorized"},403);
    if(receipt)return reply({ok:true,already_attempted:true,sent:!!receipt.id,id:receipt.id||null});
    const payload=homeworkMessage({title:"Kid Einsteins"}, {
      title:"Kid Einsteins Class 15: Two-Step Word Problems",
      url:"https://www.schoolofmath.us/posts/kid-einsteins-class-15-two-step-word-problems-four-operations",
      note:"This is a delivery test for Vivianne only. No student attendance has been recorded.",
    }, {name:"Test Student",email:to}, "2026-10-11");
    payload.subject="[TEST] "+payload.subject;
    // Save intent before sending. An ambiguous result must be reviewed, not retried.
    await env.ENROLLMENTS.put(KEY,JSON.stringify({attempted_at:now.toISOString(),revision:REVISION}));
    const result=await deps.sendEmail(env,{...payload,idempotencyKey:REVISION});
    if(!result.ok || !result.data?.id)return reply({error:"send_failed_review_before_retry"},502);
    const stored={id:result.data.id,sent_at:now.toISOString(),revision:REVISION};
    try {await env.ENROLLMENTS.put(KEY,JSON.stringify(stored));}
    catch {return reply({ok:true,sent:true,...stored,warning:"receipt_not_saved_do_not_retry"});}
    return reply({ok:true,sent:true,...stored});
  } catch {return reply({error:"test_failed_review_before_retry"},502);}
}
