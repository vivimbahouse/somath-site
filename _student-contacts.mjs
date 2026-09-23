// Private student contact profiles. Never expose through public enrollment lookups.
const normalizeName=v=>String(v||"").trim().toLowerCase();
export const normalizeEmail=v=>String(v||"").trim().toLowerCase();
export const validStudentEmail=v=>!v||(v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
export async function studentPersonId(customerId,name) {
  if(!customerId||!normalizeName(name))return "";
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(customerId+"|"+normalizeName(name))))].map(x=>x.toString(16).padStart(2,"0")).join("").slice(0,24);
}
export async function readStudentContact(env,customerId,name) {
  const id=await studentPersonId(customerId,name);
  if(!id||!env.ENROLLMENTS)return null;
  const raw=await env.ENROLLMENTS.get("student-contact:"+id);
  return raw?JSON.parse(raw):null;
}
export async function saveStudentContact(env,{customerId,name,studentEmail,source="teacher",initializeOnly=false},now=new Date()) {
  const id=await studentPersonId(customerId,name);
  let email=normalizeEmail(studentEmail);
  if(!id||!validStudentEmail(email))throw Error("invalid_student_contact");
  const old=await readStudentContact(env,customerId,name);
  // Delayed checkout webhooks must not overwrite a teacher's newer edit or removal.
  if(initializeOnly&&old)email=old.studentEmail;
  const record=initializeOnly&&old?old:{personId:id,customerId,name,studentEmail:email,source,updatedAt:now.toISOString()};
  await env.ENROLLMENTS.put("student-contact:"+id,JSON.stringify(record));
  let cursor;
  do{
    const page=await env.ENROLLMENTS.list({prefix:"enroll:",limit:1000,...(cursor?{cursor}:{})});
    for(const key of page.keys){
      const raw=await env.ENROLLMENTS.get(key.name);if(!raw)continue;
      const rec=JSON.parse(raw);
      if(rec.stripeCustomerId!==customerId||normalizeName(rec.studentName)!==normalizeName(name))continue;
      await env.ENROLLMENTS.put(key.name,JSON.stringify({...rec,studentEmail:email,studentEmailUpdatedAt:record.updatedAt}));
    }
    cursor=page.list_complete?null:page.cursor;
  }while(cursor);
  return record;
}
export async function updateSubscriptionStudentEmail(env,subscriptionId,studentEmail) {
  if(!/^sub_[A-Za-z0-9]+$/.test(subscriptionId||"")||!env.STRIPE_SECRET_KEY)throw Error("subscription_contact_unavailable");
  const response=await fetch("https://api.stripe.com/v1/subscriptions/"+subscriptionId,{
    method:"POST",
    headers:{Authorization:"Bearer "+env.STRIPE_SECRET_KEY,"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({"metadata[student_email]":normalizeEmail(studentEmail)})
  });
  if(!response.ok)throw Error("subscription_contact_update_failed");
  await env.ENROLLMENTS.delete("checkin:stripe-memberships");
}
