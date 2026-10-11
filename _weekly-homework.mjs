// Weekly homework authorized by SOMATH on 2026-10-11. No historical backfill.
export const WEEKLY_VERSION = "weekly-checkin-20261011";
const ROOT="https://www.schoolofmath.us", DAY=86400000;
const prefix="checkin:weekly-delivery:";
const emailOK=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s||"");
const normalize=s=>String(s||"").trim().toLowerCase();
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(v=>v.toString(16).padStart(2,"0")).join("");
export const weeklyEnabled=env=>env.CHECKIN_AUTO_SEND==="true"&&env.CHECKIN_WEEKLY_HOMEWORK==="true";
export function teachingWeek(date) {
  const day=new Date(date+"T12:00:00Z");
  const start=new Date(day.getTime()-day.getUTCDay()*DAY).toISOString().slice(0,10);
  const number=15+Math.round((Date.parse(start)-Date.parse("2026-10-11"))/(7*DAY));
  return {number,start,end:new Date(Date.parse(start)+6*DAY).toISOString().slice(0,10)};
}
export function easternDate(now=new Date()) {
  return new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
}
const decode=s=>s.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ").trim();
export async function weeklyLesson(env,slug,date) {
  const week=teachingWeek(date), result={week,mode:"weekly",status:"waiting_lesson",title:"",url:"",note:""};
  if(week.number<1||week.number>48||!env.ASSETS||!/^[a-z0-9-]+$/.test(slug))return result;
  try {
    const course=await env.ASSETS.fetch(new Request(`${ROOT}/courses/${slug}.html`));
    if(!course.ok)return result;
    const rows=[...(await course.text()).matchAll(/<(?:li|div)\b[^>]*class="syllabus-row"[^>]*>([\s\S]*?)<\/(?:li|div)>/g)]
      .map(m=>m[1]).filter(r=>new RegExp('class="num">\\s*'+week.number+'\\s*</span>').test(r));
    if(rows.length!==1)return result;
    const links=[...rows[0].matchAll(/<a\b[^>]*href="(\/posts\/[a-z0-9-]+(?:\.html)?)"[^>]*>/g)];
    if(links.length!==1)return result;
    const path=links[0][1].replace(/\.html$/,"");
    const post=await env.ASSETS.fetch(new Request(ROOT+path+".html"));
    if(!post.ok)return result;
    const html=await post.text();
    // Prevent SPA fallbacks and unpublished/incorrect destinations from being emailed.
    const canonicalTag=(html.match(/<link\b[^>]*>/gi)||[]).find(t=>/\brel=["']canonical["']/i.test(t));
    const canonical=canonicalTag?.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const noindex=(html.match(/<meta\b[^>]*>/gi)||[]).some(t=>/\bname=["']robots["']/i.test(t)&&/noindex/i.test(t));
    if(canonical?.replace(/\.html$/,"")!==ROOT+path||noindex)return result;
    const title=decode((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||"").replace(/<[^>]*>/g,"").replace(/\s+/g," "));
    if(!title)return result;
    return {...result,status:"ready",title,url:ROOT+path,
      note:`Week ${week.number}: Review the lesson and complete its Homework Review and Homework sections. Try the questions before opening the answers.`};
  } catch {return result;}
}
async function list(env,p) {
  let cursor,rows=[];
  do {
    const page=await env.ENROLLMENTS.list({prefix:p,limit:1000,...(cursor?{cursor}:{})});
    for(const k of page.keys){const raw=await env.ENROLLMENTS.get(k.name);if(raw)rows.push({key:k.name,...JSON.parse(raw)});}
    cursor=page.list_complete?null:page.cursor;
  } while(cursor);
  return rows;
}
async function save(env,key,value) {
  const {key:ignored,...record}=value;
  await env.ENROLLMENTS.put(key,JSON.stringify(record));
}
export async function weeklyJobs(env,slug,date,attendance) {
  const week=teachingWeek(date),people=new Set(attendance.map(a=>a.personId));
  return (await list(env,`${prefix}${week.start}:${slug}:`))
    .filter(j=>people.has(j.personId)).map(j=>({...j,
      ...(week.start<teachingWeek(easternDate()).start&&!["sent","review"].includes(j.status)?{status:"review",reason:"week_ended"}:{}),
      studentId:attendance.find(a=>a.personId===j.personId)?.studentId||j.studentId}));
}
export async function sendWeeklyArrival(env,deps,cls,arrival,now=new Date(),resolved=null) {
  if(!weeklyEnabled(env)||!env.ENROLLMENTS||!arrival.present||arrival.homeworkVersion!==WEEKLY_VERSION)return {skipped:true};
  const week=teachingWeek(arrival.date);
  if(week.start!==teachingWeek(easternDate(now)).start)return {skipped:true};
  let lesson=resolved;
  const recipients=[{kind:"parent",email:normalize(arrival.parentEmail)}];
  if(emailOK(arrival.studentEmail)&&normalize(arrival.studentEmail)!==normalize(arrival.parentEmail))
    recipients.push({kind:"student",email:normalize(arrival.studentEmail)});
  const results=[];
  for(const r of recipients) {
    const key=`${prefix}${week.start}:${cls.slug}:${arrival.personId}:${r.kind}`;
    let job=JSON.parse(await env.ENROLLMENTS.get(key)||"null");
    if(job?.status==="sent"||job?.status==="review"){results.push(job.status);continue;}
    if(!job)job={date:arrival.date,classId:cls.id,course:cls.slug,week:week.number,weekStart:week.start,personId:arrival.personId,
      studentId:arrival.studentId,recipientKind:r.kind,to:r.email,status:"waiting_lesson",createdAt:now.toISOString()};
    if(job.to!==r.email||!emailOK(r.email)){
      job={...job,status:"review",reason:!emailOK(r.email)?"missing_email":"recipient_changed"};
      await save(env,key,job);results.push(job.status);continue;
    }
    if(job.firstAttempt&&now.getTime()-Date.parse(job.firstAttempt)>23*3600000) {
      await save(env,key,{...job,status:"review",reason:"delivery_attempt_expired"});results.push("review");continue;
    }
    if(!job.payload&&!lesson)lesson=await weeklyLesson(env,cls.slug,arrival.date);
    if(!job.payload&&lesson.status!=="ready"){
      await save(env,key,job);results.push("waiting_lesson");continue;
    }
    if(!env.RESEND_API_KEY){await save(env,key,{...job,status:"retry",reason:"sender_not_configured"});results.push("retry");continue;}
    if(!job.payload){
      job={...job,payload:deps.homeworkMessage(cls,lesson,{name:arrival.name,email:r.email},arrival.date),
        idempotencyKey:"weekly-homework-"+await hash(key)};
      job.payload.subject=`SOMATH homework: ${cls.title} | Week ${week.number}`;
    }
    job={...job,status:"pending",firstAttempt:job.firstAttempt||now.toISOString(),lastAttempt:now.toISOString()};
    await save(env,key,job);
    try {
      const result=await deps.sendEmail(env,{...job.payload,idempotencyKey:job.idempotencyKey});
      if(!result.ok||!result.data?.id)throw Error("send_failed");
      job={...job,status:"sent",messageId:result.data.id,sentAt:now.toISOString(),reason:""};
    } catch {job={...job,status:"retry",reason:"send_failed"};}
    await save(env,key,job);results.push(job.status);
  }
  return {week:week.number,status:results.every(s=>s==="sent")?"sent":results.includes("review")?"review":results.includes("retry")?"retry":"waiting_lesson"};
}
export async function runWeeklyHomework(env,deps,now=new Date()) {
  if(!weeklyEnabled(env)||!env.ENROLLMENTS)return {disabled:true};
  const date=easternDate(now),week=teachingWeek(date),summary={processed:0,failed:0};
  // Attendance markers are created only by new, eligible check-ins after activation.
  // Existing attendance is never marked or replayed on deployment.
  for(let t=Date.parse(week.start);t<=Date.parse(date);t+=DAY) {
    const d=new Date(t).toISOString().slice(0,10);
    for(const a of await list(env,`checkin:attendance:${d}:`)) {
      if(!a.present||a.homeworkVersion!==WEEKLY_VERSION)continue;
      const slug=a.classId.split("__")[0];
      if(!deps.titles[slug])continue;
      try {
        await sendWeeklyArrival(env,deps,{id:a.classId,slug,title:deps.titles[slug]},a,now);
        summary.processed++;
      } catch {summary.failed++;}
    }
  }
  return summary;
}
