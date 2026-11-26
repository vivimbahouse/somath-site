import {mailingContactSuppressed} from "./_mailing-list.mjs";
const fingerprint="f96ae68b3a11c8534ce1a15a8b9c87666e30a5fb12d02aa4f26a56976c996e14";
const key="mailing-campaign:thanksgiving-2026:v1:";
const reply=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,"0")).join("");
export async function thanksgivingMailing(request,env){
  if(!env.ADMIN_PASSWORD||request.headers.get("x-admin-password")!==env.ADMIN_PASSWORD)return reply({error:"unauthorized"},401);
  const store=env.ENROLLMENTS, action=new URL(request.url).searchParams.get("action");
  if(request.method==="GET"){
    const manifest=await store.get(key+"approved","json");
    const receipts=[];
    if(manifest)for(let i=0;i<manifest.recipients.length;i++){
      const receipt=await store.get(key+"receipt:"+i,"json"); if(receipt)receipts.push(receipt);
    }
    return reply({staged:!!manifest,count:manifest?.recipients.length||0,receipts});
  }
  if(request.method!=="POST"||Date.now()>Date.UTC(2026,10,28))return reply({error:"closed"},403);
  if(action==="stage"){
    const raw=await request.text();
    if(raw.length>300000||await hash(raw)!==fingerprint)return reply({error:"unapproved"},403);
    if(!await store.get(key+"approved"))await store.put(key+"approved",raw);
    return reply({staged:true,count:56});
  }
  if(action!=="send_one")return reply({error:"unknown_action"},400);
  const {index}=await request.json();
  if(!Number.isInteger(index)||index<0||index>=56)return reply({error:"invalid_index"},400);
  const manifest=await store.get(key+"approved","json");
  if(!manifest)return reply({error:"not_staged"},409);
  const receiptKey=key+"receipt:"+index, prior=await store.get(receiptKey,"json");
  if(prior)return reply({...prior,already_processed:true});
  const email=manifest.recipients[index];
  let receipt={email,index,status:"suppressed"};
  if(!await mailingContactSuppressed(env,email)){
    const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
      Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"somath-thanksgiving-2026-v1-"+index
    },body:JSON.stringify({...manifest.message,from:"SOMATH <hello@schoolofmath.us>",reply_to:"hello@schoolofmath.us",to:[email],
      headers:{"List-Unsubscribe":"<mailto:hello@schoolofmath.us?subject=Unsubscribe>"}})});
    const data=await result.json();
    if(!result.ok||!data.id)return reply({error:"provider_rejected",provider_status:result.status},502);
    receipt={email,index,status:"accepted",id:data.id};
  }
  await store.put(receiptKey,JSON.stringify(receipt));
  return reply(receipt);
}
