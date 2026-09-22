// Private check-in and homework service. This module is excluded from static assets.
import { automaticRoster } from "./_checkin-memberships.mjs";
const TZ = "America/New_York";
const P = "checkin:";
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers:{
  "Content-Type":"application/json", "Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow",
  "X-Content-Type-Options":"nosniff"
}});
export function eastern(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now).map(p=>[p.type,p.value]));
  return {date:`${parts.year}-${parts.month}-${parts.day}`,minutes:Number(parts.hour)*60+Number(parts.minute)};
}
function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date+"T12:00:00Z")) && new Date(date+"T12:00:00Z").toISOString().slice(0,10)===date;
}
export function classesFor(date, deps) {
  const day = new Date(date+"T12:00:00Z").toLocaleDateString("en-US",{weekday:"long",timeZone:"UTC"});
  const rows=[];
  for (const [slug,slots] of Object.entries(deps.schedules)) for (const slot of slots) {
    if (slot.d!==day) continue;
    const halves=slot.t.split(/\s*[–—-]\s*/);
    const parse=(str,ampm)=>{const m=str.match(/(\d{1,2}):(\d{2})/);return (Number(m[1])%12+(ampm==="PM"?12:0))*60+Number(m[2]);};
    const endAM=(halves[1].match(/AM|PM/)||["PM"])[0];
    const startAM=(halves[0].match(/AM|PM/)||[endAM])[0];
    rows.push({id:slug+"__"+day,slug,day,title:deps.titles[slug]||slug,time:slot.t,start:parse(halves[0],startAM),end:parse(halves[1],endAM)});
  }
  return rows.sort((a,b)=>a.start-b.start);
}
async function get(env,key,fallback=null) {
  const raw=await env.ENROLLMENTS.get(P+key);
  return raw ? JSON.parse(raw) : fallback;
}
async function put(env,key,value) { await env.ENROLLMENTS.put(P+key,JSON.stringify(value)); }
async function list(env,prefix) {
  let cursor, rows=[];
  do {
    const page=await env.ENROLLMENTS.list({prefix:P+prefix,limit:1000,...(cursor?{cursor}:{})});
    for (const key of page.keys) {const raw=await env.ENROLLMENTS.get(key.name);if(raw) rows.push(JSON.parse(raw));}
    cursor=page.list_complete?null:page.cursor;
  } while(cursor);
  return rows;
}
async function hash(s) {return [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");}
const clean=(v,n=120)=>String(v||"").trim().slice(0,n);
const emailOK=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
function linkOK(s) {try {const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false;}}
async function roster(env,id) {return get(env,"roster:"+id,[]);}
async function candidates(env,cls,date,deps) {
  const rows=await deps.listEnrollments(env,5000), seen=new Set(), out=[];
  for(const r of rows) {
    if(r.status!=="paid" || r.course!==cls.slug || r.day!==cls.day || (r.startDate&&r.startDate>date) || !clean(r.studentName)) continue;
    const key=clean(r.studentName).toLowerCase()+"|"+clean(r.parentEmail).toLowerCase();
    if(seen.has(key)) continue;seen.add(key);
    out.push({id:(await hash(key)).slice(0,24),name:clean(r.studentName),email:clean(r.parentEmail,180).toLowerCase()});
  }
  return out;
}
export async function handleCheckin(request,env,deps,now=new Date()) {
  try {
    if(!env.ENROLLMENTS || !env.ADMIN_PASSWORD) return json({error:"Check-in is not configured. Please contact staff."},503);
    if(request.method!=="POST") return json({error:"Method not allowed."},405);
    const origin=request.headers.get("Origin");
    if(origin && origin!==new URL(request.url).origin) return json({error:"This request must come from the SOMATH check-in page."},403);
    if(Number(request.headers.get("Content-Length")||0)>65000) return json({error:"Request too large."},413);
    const text=await request.text();if(text.length>65000)return json({error:"Request too large."},413);
    let b;try{b=JSON.parse(text);}catch{return json({error:"Invalid request."},400);}
    const today=eastern(now), action=b.action;
    if(action==="unlock") {
      const ip=request.headers.get("CF-Connecting-IP")||"local";
      const key="auth:"+await hash(ip+Math.floor(now.getTime()/600000));
      const attempts=await get(env,key,0);
      if(attempts>=10) return json({error:"Too many attempts. Try again in ten minutes."},429);
      if((b.password||request.headers.get("x-admin-password"))!==env.ADMIN_PASSWORD) {
        await env.ENROLLMENTS.put(P+key,JSON.stringify(attempts+1),{expirationTtl:660});
        return json({error:"Incorrect staff password."},401);
      }
      const scope=b.scope==="staff"?"staff":"kiosk";
      const exp=Math.floor(now.getTime()/1000)+(scope==="staff"?1800:43200);
      const token=await deps.signToken({aud:"somath-checkin",scope,date:today.date,exp},env.ADMIN_PASSWORD);
      return json({token,scope,expires:exp,date:today.date,homeworkEnabled:env.CHECKIN_AUTO_SEND==="true"});
    }
    const bearer=(request.headers.get("Authorization")||"").replace(/^Bearer /,"");
    const session=await deps.verifyToken(bearer,env.ADMIN_PASSWORD);
    if(!session || session.aud!=="somath-checkin" || session.exp<=now.getTime()/1000 || !["staff","kiosk"].includes(session.scope) || (session.scope==="kiosk"&&session.date!==today.date)) return json({error:"Please ask staff to unlock this tablet again."},401);
    const staff=session.scope==="staff";
    const date=staff && b.date ? b.date : today.date;
    if(!validDate(date)) return json({error:"Invalid class date."},400);
    if(action==="calendar-sync") {
      if(!staff)return json({error:"Staff access required."},403);
      if(b.calendarId!=="hello@schoolofmath.us"||!Array.isArray(b.events)||b.events.length>300)return json({error:"Invalid SOMATH calendar snapshot."},400);
      await put(env,"calendar-snapshot",{fetchedAt:now.toISOString(),calendarId:b.calendarId,events:b.events});
      return json({ok:true});
    }
    const classes=classesFor(date,deps);
    if(action==="classes") {
      const decorated=[];
      for(const cls of classes) {
        const assignment=await get(env,`lesson:${date}:${cls.id}`,{});
        if(!staff && assignment.closed) continue;
        const arrivals=staff?await list(env,`attendance:${date}:${cls.id}:`):[];
        decorated.push({...cls,closed:!!assignment.closed,presentCount:arrivals.filter(a=>a.present).length});
      }
      return json({date,classes:decorated,homeworkEnabled:env.CHECKIN_AUTO_SEND==="true"});
    }
    const cls=classes.find(c=>c.id===b.classId);
    if(!cls) return json({error:"Class not scheduled for this date."},400);
    const lessonKey=`lesson:${date}:${cls.id}`;
    const lesson=await get(env,lessonKey,{});
    let membership;
    try { membership=await automaticRoster(env,cls,date,deps,now,b.action==="manage"&&b.refresh===true); }
    catch(err){
      if(action!=="manage")return json({error:err.message},503);
      membership={students:[],issues:[],sync:{error:err.message}};
    }
    const students=membership.students;
    if(action==="search") {
      if(lesson.closed) return json({error:"This class is closed for today."},409);
      const q=clean(b.query).toLocaleLowerCase();
      if(q.length<2) return json({students:[]});
      return json({students:students.filter(s=>s.name.toLocaleLowerCase().includes(q)).slice(0,12).map(s=>({id:s.id,name:s.name,canCheckIn:s.active!==false}))});
    }
    if(action==="checkin") {
      if(date!==today.date || lesson.closed) return json({error:"This class is not open for check-in."},409);
      const s=students.find(s=>s.id===b.studentId);
      if(!s) return json({error:"Name not found. Please ask your teacher."},404);
      if(!s.active) return json({error:"Please see the front desk.",frontDesk:true},409);
      const key=`attendance:${date}:${cls.id}:${s.id}`;
      const prior=await get(env,key);
      if(prior?.present) return json({ok:true,already:true,name:s.name,at:prior.at});
      const record={date,classId:cls.id,studentId:s.id,personId:s.personId,name:s.name,parentEmail:s.email,subscriptionId:s.subscriptionId,at:now.toISOString(),present:true};
      await put(env,key,record);
      return json({ok:true,already:false,name:s.name,at:record.at});
    }
    if(!staff) return json({error:"Staff access required."},403);
    if(action==="notes" || action==="add-note") {
      const old=await get(env,`attendance:${date}:${cls.id}:${b.studentId}`);
      const student=students.find(s=>s.id===b.studentId)||(old?{id:old.studentId,personId:old.personId,name:old.name}:null);
      if(!student?.personId)return json({error:"Student identity could not be verified for memos."},404);
      if(action==="add-note"){
        const body=clean(b.body,2000),author=clean(b.author,80);
        if(!body||!author)return json({error:"Enter your name and a memo."},400);
        const id=crypto.randomUUID();
        await put(env,`memo:${student.personId}:${id}`,{id,personId:student.personId,name:student.name,body,author,createdAt:now.toISOString(),classId:cls.id,classDate:date});
      }
      const notes=(await list(env,`memo:${student.personId}:`)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      return json({student:{id:student.id,name:student.name},notes});
    }
    if(action==="manage") {
      const attendance=await list(env,`attendance:${date}:${cls.id}:`);
      const jobs=await list(env,`delivery:${date}:${cls.id}:`);
      return json({students,attendance,lesson,jobs,sync:membership.sync,issues:membership.issues});
    }
    if(action==="roster") {
      if(!Array.isArray(b.students)||b.students.length>100) return json({error:"Invalid roster."},400);
      const normalized=[],seen=new Set();
      for(const s of b.students) {
        const member=students.find(m=>m.id===s.id);
        if(!member)return json({error:"Only Stripe-linked members can be changed here."},400);
        const {id,name,email}=member;
        if(seen.has(id))return json({error:"Duplicate student in roster."},400);seen.add(id);
        normalized.push({id,name,email,active:s.active!==false});
        await put(env,"member-override:"+id,{active:s.active!==false,updatedAt:now.toISOString()});
      }
      return json({ok:true,students:normalized});
    }
    if(action==="lesson") {
      const title=clean(b.title),url=clean(b.url,2000),note=clean(b.note,1500),approved=b.approved===true;
      if((url&&!linkOK(url)) || (approved&&(!title||!linkOK(url)))) return json({error:"Enter a lesson title and a complete https:// homework link."},400);
      const record={date,classId:cls.id,title,url,note,approved,closed:b.closed===true,updatedAt:now.toISOString()};
      await put(env,lessonKey,record);return json({ok:true,lesson:record});
    }
    if(action==="attendance") {
      const existing=await get(env,`attendance:${date}:${cls.id}:${b.studentId}`);
      const s=students.find(s=>s.id===b.studentId)|| (existing?{id:existing.studentId,personId:existing.personId,name:existing.name,email:existing.parentEmail,subscriptionId:existing.subscriptionId}:null);
      if(!s)return json({error:"Student not found."},404);
      if(b.present===true && students.some(m=>m.id===s.id&&!m.active) && date===today.date)return json({error:"Please resolve this student's membership or attendance hold before marking present."},409);
      const key=`attendance:${date}:${cls.id}:${s.id}`,prior=await get(env,key);
      await put(env,key,{date,classId:cls.id,studentId:s.id,personId:s.personId,name:s.name,parentEmail:s.email,subscriptionId:s.subscriptionId,at:prior?.at||now.toISOString(),present:b.present===true,correctedAt:now.toISOString()});
      return json({ok:true});
    }
    return json({error:"Unknown action."},400);
  } catch(e) {
    console.error("Check-in request failed",e?.name);
    return json({error:"Could not save or load. Please try again; ask staff if the problem continues."},500);
  }
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function homeworkMessage(cls,lesson,student,date) {
  return {to:student.email,replyTo:"hello@schoolofmath.us",subject:`SOMATH homework: ${cls.title} | ${date}`,
    html:`<p>Hello,</p><p>${esc(student.name)} attended ${esc(cls.title)} on ${esc(date)}.</p><p>Today's homework: <a href="${esc(lesson.url)}">${esc(lesson.title)}</a></p>${lesson.note?`<p>${esc(lesson.note).replace(/\n/g,"<br>")}</p>`:""}<p>Please use the assigned link to review the lesson and complete the homework. Reply to this email if you have any questions.</p><p>Warmly,<br>The SOMATH Team<br>School of Math | 226 W 79th St, New York, NY 10024<br>(646) 668-6151</p>`};
}
export async function runHomework(env,deps,now=new Date()) {
  if(env.CHECKIN_AUTO_SEND!=="true" || !env.ENROLLMENTS)return {sent:0,disabled:true};
  const today=eastern(now),lessons=await list(env,"lesson:"),result={sent:0,failed:0};
  for(const lesson of lessons) {
    // Only today's assignments: no surprise old homework blasts after activation/outage.
    if(lesson.date!==today.date || !lesson.approved || lesson.closed || !linkOK(lesson.url))continue;
    const cls=classesFor(lesson.date,deps).find(c=>c.id===lesson.classId);
    if(!cls||today.minutes<cls.end+10)continue;
    const students=(await automaticRoster(env,cls,lesson.date,deps,now)).students;
    for(const a of await list(env,`attendance:${lesson.date}:${cls.id}:`)) {
      if(!a.present)continue;
      const s=students.find(s=>s.id===a.studentId&&s.active!==false);
      if(!s||!emailOK(s.email))continue;
      const key=`delivery:${lesson.date}:${cls.id}:${s.id}`;
      let job=await get(env,key);
      if(job?.status==="sent"||job?.status==="review")continue;
      if(job && now.getTime()-Date.parse(job.firstAttempt)>23*3600000) {
        await put(env,key,{...job,status:"review"});continue;
      }
      if(!job) {
        job={date:lesson.date,classId:cls.id,studentId:s.id,firstAttempt:now.toISOString(),status:"pending",payload:homeworkMessage(cls,lesson,s,lesson.date),idempotencyKey:"homework-"+await hash(key)};
        await put(env,key,job);
      }
      try {
        const sent=await deps.sendEmail(env,{...job.payload,idempotencyKey:job.idempotencyKey});
        if(!sent.ok)throw new Error("delivery_failed");
        await put(env,key,{...job,status:"sent",sentAt:now.toISOString(),messageId:sent.data?.id||""});
        result.sent++;
      } catch {
        await put(env,key,{...job,status:"retry",lastAttempt:now.toISOString()});
        result.failed++;
      }
    }
  }
  return result;
}
