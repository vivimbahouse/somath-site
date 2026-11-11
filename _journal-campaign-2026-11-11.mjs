import {mailingContactSuppressed} from "./_mailing-list.mjs";
// One explicitly approved campaign, fixed content and fixed audience fingerprint.
// No public email list, arbitrary HTML, recurring send or automatic future send.
const CAMPAIGN="journal-best-activity-2026-11-11";
const PREFIX="mailing-campaign:"+CAMPAIGN+":";
const AUDIENCE_HASH="08188cd453964bcffd9e5c5853e6dac5fde7f9b58d6bf868cf7cc884a4910cb9";
export const html="<div lang=\"en\" style=\"margin:0;padding:0;background-color:#f5f0e6;color:#1a2820;-webkit-text-size-adjust:100%;\">\n<div style=\"display:none;font-size:1px;color:#f5f0e6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;\">A data-backed guide to the after-school choice that matters most.</div>\n<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"background-color:#f5f0e6;\">\n<tr><td align=\"center\" style=\"padding:16px 8px;\">\n<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"width:100%;max-width:600px;background-color:#fbf7ee;color:#1a2820;\">\n<tr><td align=\"center\" bgcolor=\"#f5f0e6\" style=\"padding:0;background-color:#f5f0e6;color:#1f3d2e;\">\n<img src=\"cid:somath-logo\" width=\"600\" alt=\"School of Math. Old-School Math Classes. Infinite Aura.\" border=\"0\" style=\"display:block;width:100%;max-width:600px;height:auto;margin:0;\">\n</td></tr>\n<tr><td><a href=\"https://www.schoolofmath.us/posts/best-activity-for-college-admissions-scholarships-math-vs-sports\" style=\"text-decoration:none;\"><img src=\"cid:somath-hero\" width=\"600\" alt=\"A stronger future starts with a challenge: math enrichment and competitions at School of Math\" border=\"0\" style=\"display:block;width:100%;max-width:600px;height:auto;\"></a></td></tr>\n<tr><td style=\"padding:28px 24px 32px;color:#1a2820;\">\n<p style=\"margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;letter-spacing:2px;color:#44524a;font-weight:bold;\">FROM THE SOMATH JOURNAL</p>\n<h1 style=\"margin:0 0 25px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:38px;font-weight:normal;color:#1f3d2e;\">Math, sports, chess, or camp? Which one helps most with college?</h1>\n<p style=\"margin:0 0 17px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;\">Hi families,</p>\n<p style=\"margin:0 0 17px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;\">Every fall, families around us face the same decision: which activities fill those precious after-school hours? And more and more, parents ask us the bigger question: <strong>“What is the best activity my child can do for college and scholarships?”</strong></p>\n<p style=\"margin:0 0 17px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;\">I wrote a full guide to answer it. In it, I compare math enrichment with baseball, swimming, chess, music and summer camp, asking three simple questions of each: Is the outcome measurable? Is the path predictable? And does it lead to the things colleges and scholarship committees actually read?</p>\n<p style=\"margin:0 0 17px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;\">You’ll find the research, a look at where scholarship money really comes from, a decision flowchart to use before you sign up for the next season of anything, and a grade-by-grade plan.</p>\n<p style=\"margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;\">No single activity guarantees admission, but some paths are far easier to plan and measure than others.</p>\n<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:0 0 28px;\"><tr><td bgcolor=\"#e3c98c\" style=\"background-color:#e3c98c;border-radius:4px;text-align:center;mso-padding-alt:15px 26px;\"><a href=\"https://www.schoolofmath.us/posts/best-activity-for-college-admissions-scholarships-math-vs-sports\" style=\"display:inline-block;padding:15px 26px;background-color:#e3c98c;border:1px solid #c89a3a;border-radius:4px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:bold;color:#1f3d2e;text-decoration:none;\">Read the Parent Guide</a></td></tr></table>\n<p style=\"margin:0 0 23px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;\">Which activities is your family weighing this year? Hit reply and tell us.</p>\n<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;\">Warmly,<br><strong>Vivianne</strong><br>School of Math | SOMATH</p>\n</td></tr>\n<tr><td style=\"padding:23px 24px;border-top:1px solid #d6cdb6;background-color:#ece5d4;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#44524a;\">\n<strong style=\"color:#1f3d2e;\">School of Math | SOMATH</strong><br>\n226 W 79th St, New York, NY 10024<br>\n<a href=\"tel:+16466686151\" style=\"color:#44524a;text-decoration:underline;\">(646) 668-6151</a>\n<p style=\"margin:12px 0 0;font-size:11px;line-height:17px;\">You’re receiving this message as a SOMATH family or evaluation contact. To stop receiving SOMATH newsletters, reply “unsubscribe.”</p>\n</td></tr>\n</table>\n</td></tr></table>\n</div>\n";
export const text="A data-backed guide to the after-school choice that matters most.\n\nSOMATH\nOld-School Math Classes. Infinite Aura.\nFROM THE SOMATH JOURNAL\n\nMath, sports, chess, or camp? Which one helps most with college?\n\nHi families,\n\nEvery fall, families around us face the same decision: which activities fill those precious after-school hours? And more and more, parents ask us the bigger question: “What is the best activity my child can do for college and scholarships?”\n\nI wrote a full guide to answer it. In it, I compare math enrichment with baseball, swimming, chess, music and summer camp, asking three simple questions of each: Is the outcome measurable? Is the path predictable? And does it lead to the things colleges and scholarship committees actually read?\n\nYou’ll find the research, a look at where scholarship money really comes from, a decision flowchart to use before you sign up for the next season of anything, and a grade-by-grade plan.\n\nNo single activity guarantees admission, but some paths are far easier to plan and measure than others.\n\nRead the Parent Guide:\nhttps://www.schoolofmath.us/posts/best-activity-for-college-admissions-scholarships-math-vs-sports\n\nWhich activities is your family weighing this year? Hit reply and tell us.\n\nWarmly,\nVivianne\nSchool of Math | SOMATH\n\n226 W 79th St, New York, NY 10024\n(646) 668-6151\n\nYou’re receiving this message as a SOMATH family or evaluation contact. To stop receiving SOMATH newsletters, reply “unsubscribe.”\n";
const images=[
  {path:"/assets/email/parent-guide/header-v4.png",filename:"somath-header.png",content_type:"image/png",content_id:"somath-logo"},
  {path:"/assets/email/journal-2026-11-11/hero.jpg",filename:"somath-journal-best-activity.jpg",content_type:"image/jpeg",content_id:"somath-hero"}
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
export async function handleJournalCampaign20261111(request,env){
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
      if(recipients.length!==52 || await digest(recipients.join("\n"))!==AUDIENCE_HASH)
        return reply({error:"audience_not_authorized"},403);
      if(!manifest)await env.ENROLLMENTS.put(PREFIX+"audience",JSON.stringify({
        recipients,approved_at:"2026-11-11T14:00:00-05:00",created_at:new Date().toISOString()
      }));
      return reply({ok:true,staged:true,count:52});
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
      subject:"Why math beats sports, chess, and camp",html,text,attachments,
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
