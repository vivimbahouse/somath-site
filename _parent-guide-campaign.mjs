import {html as testHtml,text as testText} from "./_email-test-template.mjs";
import {mailingContactSuppressed} from "./_mailing-list.mjs";
// One explicitly approved campaign, fixed content and fixed audience fingerprint.
// No public email list, arbitrary HTML, recurring send or automatic future send.
const CAMPAIGN="parent-guide-2026-10-01";
const PREFIX="mailing-campaign:"+CAMPAIGN+":";
const AUDIENCE_HASH="b0ddfab14ad9083ff3ba06554d496134f913c1cf2cb5c12936f5b9ad042547be";
const footer="You’re receiving this message as a SOMATH family or evaluation contact. To stop receiving SOMATH newsletters, reply “unsubscribe.”";
const oldFooter="Test preview only. Not sent to the mailing list.";
export const html=testHtml.replace(oldFooter,footer);
export const text=testText.replace(oldFooter,footer);
const images=[
  {path:"/assets/email/parent-guide/header-v4.png",filename:"somath-header.png",content_type:"image/png",content_id:"somath-logo"},
  {path:"/assets/email/parent-guide/hero.jpg",filename:"somath-parent-guide.jpg",content_type:"image/jpeg",content_id:"somath-hero"}
];
const normalize=value=>String(value||"").trim().toLowerCase();
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  "Content-Type":"application/json","Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"
}});
async function digest(value){
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))))
    .map(v=>v.toString(16).padStart(2,"0")).join("");
}
function base64(bytes){
  let raw=""; for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(raw);
}
export async function handleParentGuideCampaign(request,env){
  if(!env.ADMIN_PASSWORD || request.headers.get("x-admin-password")!==env.ADMIN_PASSWORD)
    return reply({error:"unauthorized"},401);
  if(!env.ENROLLMENTS || !env.RESEND_API_KEY || !env.ASSETS) return reply({error:"not_configured"},503);
  try {
    const manifestRaw=await env.ENROLLMENTS.get(PREFIX+"audience");
    const manifest=manifestRaw?JSON.parse(manifestRaw):null;
    if(request.method==="GET"){
      const receipts=[];
      if(manifest)for(const email of manifest.recipients){
        const raw=await env.ENROLLMENTS.get(PREFIX+"receipt:"+await digest(email));
        if(raw)receipts.push(JSON.parse(raw));
      }
      return reply({ok:true,campaign:CAMPAIGN,staged:!!manifest,count:manifest?.recipients.length||0,receipts});
    }
    if(request.method!=="POST") return reply({error:"method_not_allowed"},405);
    const raw=await request.text();
    if(raw.length>20000)return reply({error:"body_too_large"},413);
    let body;try{body=JSON.parse(raw);}catch{return reply({error:"invalid_json"},400);}
    if(body?.action==="stage"){
      if(!Array.isArray(body.recipients))return reply({error:"invalid_recipients"},400);
      const recipients=[...new Set(body.recipients.map(normalize))].sort();
      if(recipients.length!==48 || await digest(recipients.join("\n"))!==AUDIENCE_HASH)
        return reply({error:"audience_not_authorized"},403);
      if(!manifest)await env.ENROLLMENTS.put(PREFIX+"audience",JSON.stringify({
        recipients,approved_at:"2026-10-01T20:46:00-04:00",created_at:new Date().toISOString()
      }));
      return reply({ok:true,staged:true,count:48});
    }
    if(body?.action!=="send_one" || body.confirmation!==CAMPAIGN || !manifest)
      return reply({error:"send_not_authorized"},403);
    const email=normalize(body.email);
    if(!manifest.recipients.includes(email))return reply({error:"recipient_not_authorized"},403);
    const id=await digest(email),key=PREFIX+"receipt:"+id;
    const existing=await env.ENROLLMENTS.get(key);
    if(existing)return reply({ok:true,already_processed:true,...JSON.parse(existing)});
    if(await mailingContactSuppressed(env,email)){
      const receipt={email,status:"suppressed",at:new Date().toISOString()};
      await env.ENROLLMENTS.put(key,JSON.stringify(receipt));
      return reply({ok:true,...receipt});
    }
    const attachments=[];
    for(const image of images){
      const asset=await env.ASSETS.fetch(new Request("https://www.schoolofmath.us"+image.path));
      if(!asset.ok || !(asset.headers.get("content-type")||"").startsWith(image.content_type))
        return reply({error:"image_unavailable"},502);
      const bytes=new Uint8Array(await asset.arrayBuffer());
      if(!bytes.length || bytes.length>1048576)return reply({error:"invalid_image_size"},502);
      const {path,...meta}=image;
      attachments.push({...meta,content:base64(bytes)});
    }
    const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
      Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json",
      "Idempotency-Key":CAMPAIGN+"-"+id
    },body:JSON.stringify({
      from:"SOMATH <hello@schoolofmath.us>",to:[email],reply_to:"hello@schoolofmath.us",
      subject:"Right answer. But do they understand it?",html,text,attachments,
      headers:{"List-Unsubscribe":"<mailto:hello@schoolofmath.us?subject=Unsubscribe>"}
    })});
    const result=await res.json();
    if(!res.ok || !result.id)return reply({error:"provider_rejected",provider_status:res.status,code:result.name||"unknown"},502);
    const receipt={email,status:"accepted",id:result.id,at:new Date().toISOString()};
    try{await env.ENROLLMENTS.put(key,JSON.stringify(receipt));}
    catch{return reply({ok:true,...receipt,warning:"receipt_not_saved_stop_campaign"});}
    return reply({ok:true,...receipt});
  }catch{return reply({error:"campaign_operation_failed_check_status_before_retry"},502);}
}
