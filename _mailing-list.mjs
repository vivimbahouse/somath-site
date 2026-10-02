// Private contact registry only. No email sending or subscription enrollment.
const PREFIX = "mailing-contact:v1:";
const SUPPRESS = "mailing-suppressed:v1:";
const clean = value => String(value || "").trim();
const normalized = value => clean(value).toLowerCase();
const valid = email => email.length <= 254 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email);
async function hash(email) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email))))
    .map(v=>v.toString(16).padStart(2,"0")).join("");
}
const reply = (data,status=200) => new Response(JSON.stringify(data), {status, headers:{
  "Content-Type":"application/json","Cache-Control":"private, no-store",
  "X-Robots-Tag":"noindex, nofollow","X-Content-Type-Options":"nosniff"
}});
export async function mailingContactSuppressed(env, email) {
  return !!(await env.ENROLLMENTS.get(SUPPRESS+await hash(normalized(email))));
}
export async function saveMailingContact(env, input, source="evaluation") {
  const email=normalized(input.email);
  if (!valid(email)) throw new Error("invalid_email");
  if (email === "hello@schoolofmath.us" || /@(example\.(com|net|org|invalid)|[^@]+\.invalid)$/.test(email)) return null;
  if (!env.ENROLLMENTS) throw new Error("contact_storage_unavailable");
  const id=await hash(email), key=PREFIX+id;
  const raw=await env.ENROLLMENTS.get(key);
  const prior=raw ? JSON.parse(raw) : {};
  const now=new Date().toISOString();
  // Only contact metadata, never student names, grades, scores or evaluation answers.
  const row={
    ...prior, email,
    name:prior.name || clean(input.name).slice(0,100),
    first_seen:prior.first_seen || now,
    last_seen:now,
    sources:[...new Set([...(prior.sources || []),source])],
    newsletter_opt_in_recorded:prior.newsletter_opt_in_recorded === true,
    review_status:prior.review_status || (source==="user_curated_import" ? "user_curated" : "needs_review")
  };
  await env.ENROLLMENTS.put(key,JSON.stringify(row));
  return {...row, suppressed:!!(await env.ENROLLMENTS.get(SUPPRESS+id))};
}
export async function handleMailingList(request, env) {
  if (!env.ADMIN_PASSWORD || request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD)
    return reply({error:"unauthorized"},401);
  if (!env.ENROLLMENTS) return reply({error:"storage_unavailable"},503);
  try {
    if (request.method==="GET") {
      const url=new URL(request.url);
      const cursor=url.searchParams.get("cursor") || undefined;
      const page=await env.ENROLLMENTS.list({prefix:PREFIX,limit:200,...(cursor?{cursor}:{})});
      const contacts=[];
      for(const key of page.keys){
        const raw=await env.ENROLLMENTS.get(key.name);
        if (!raw) continue;
        const row=JSON.parse(raw);
        row.suppressed=!!(await env.ENROLLMENTS.get(SUPPRESS+key.name.slice(PREFIX.length)));
        contacts.push(row);
      }
      return reply({ok:true,version:1,automatic_capture:true,automatic_sending:false,
        contacts,count:contacts.length,next_cursor:page.list_complete?null:page.cursor});
    }
    if(request.method!=="POST") return reply({error:"method_not_allowed"},405);
    const raw=await request.text();
    if(raw.length>100000) return reply({error:"body_too_large"},413);
    let body; try {body=JSON.parse(raw);} catch{return reply({error:"invalid_json"},400);}
    if(body?.action==="import"){
      if(!Array.isArray(body.contacts) || body.contacts.length>100 ||
        body.contacts.some(c=>!c || !valid(normalized(c.email)))) return reply({error:"invalid_contacts"},400);
      let saved=0;
      for(const c of body.contacts) if(await saveMailingContact(env,c,"user_curated_import")) saved++;
      return reply({ok:true,saved,automatic_sending:false});
    }
    if(body?.action==="suppress"){
      const email=normalized(body.email);
      if(!valid(email)) return reply({error:"invalid_email"},400);
      await env.ENROLLMENTS.put(SUPPRESS+await hash(email),JSON.stringify({
        at:new Date().toISOString(),reason:clean(body.reason || "unsubscribe").slice(0,200)
      }));
      return reply({ok:true,suppressed:true});
    }
    return reply({error:"unsupported_action"},400);
  } catch {
    return reply({error:"mailing_list_operation_failed"},502);
  }
}
