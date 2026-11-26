const HASH = "07a541d47e12e19635491c73e9b294c6554ef5bd522ab189e85b4c0539605a5f";
const KEY = "staff-email-test:thanksgiving-2026-v1";
const response = (value,status=200) => Response.json(value,{status,headers:{"Cache-Control":"private, no-store"}});
export async function thanksgivingTest(request,env) {
  if (!env.ADMIN_PASSWORD || request.headers.get("x-admin-password")!==env.ADMIN_PASSWORD) return response({error:"unauthorized"},401);
  if (!["POST","GET"].includes(request.method)) return response({error:"method_not_allowed"},405);
  const receipt=await env.ENROLLMENTS.get(KEY);
  if(request.method==="GET" || receipt) return response({sent:!!receipt,id:receipt||undefined});
  if(Date.now()>Date.UTC(2026,10,28)) return response({error:"expired"},410);
  if(Number(request.headers.get("content-length")||0)!==238320) return response({error:"unexpected_size"},400);
  const bytes=await request.arrayBuffer();
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),x=>x.toString(16).padStart(2,"0")).join("");
  if(digest!==HASH) return response({error:"unapproved_message"},403);
  const body=JSON.parse(new TextDecoder().decode(bytes));
  const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":KEY},body:JSON.stringify({...body,from:"SOMATH <hello@schoolofmath.us>",reply_to:"hello@schoolofmath.us"})});
  if(!result.ok) return response({error:"provider_failure",status:result.status},502);
  const {id}=await result.json();
  if(!id) return response({error:"missing_receipt"},502);
  await env.ENROLLMENTS.put(KEY,id);
  return response({sent:true,id});
}
