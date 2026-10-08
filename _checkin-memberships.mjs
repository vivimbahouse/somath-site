import {readStudentContact,normalizeEmail} from "./_student-contacts.mjs";
// Stripe governs subscription eligibility. Explicit staff-approved, dated prepaid grants
// are a separate authority for offline students; generic "paid" enrollment rows are not.
// Calendar events enrich identity and expected arrivals, never subscription eligibility.
// No price-level course inference:
// SOMATH reuses one price across several Pre-Algebra programs.
const text=v=>String(v||"").trim();
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,"0")).join("");
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||"")&&!isNaN(new Date(value+"T12:00:00Z"))&&new Date(value+"T12:00:00Z").toISOString().slice(0,10)===value;
export async function prepaidRoster(env,cls,date,deps,allPrograms=false) {
  const students=[];let cursor;
  do {
    const page=await env.ENROLLMENTS.list({prefix:"checkin:prepaid-membership:",limit:1000,...(cursor?{cursor}:{})});
    for(const key of page.keys){
      const raw=await env.ENROLLMENTS.get(key.name);if(!raw)continue;
      const r=JSON.parse(raw);
      if(r.source!=="offline_prepaid"||!r.enrollmentId||!text(r.name)||!deps.titles[r.program]||
         !validDate(r.validFrom)||!validDate(r.validThrough)||r.validThrough<r.validFrom)continue;
      if(!allPrograms&&r.program!==cls.slug)continue;
      const identity="offline:"+r.enrollmentId;
      const id=(await digest(identity+"|"+r.program)).slice(0,24);
      const personId=(await digest(identity)).slice(0,24);
      const override=JSON.parse(await env.ENROLLMENTS.get("checkin:member-override:"+id)||"null");
      const reason=r.approved!==true?"prepaid_revoked":date<r.validFrom?"not_started":date>r.validThrough?"prepaid_expired":"eligible";
      students.push({id,personId,name:r.name,customerId:"",subscriptionId:"",enrollmentId:r.enrollmentId,
        email:normalizeEmail(r.email),studentEmail:normalizeEmail(r.studentEmail),
        active:reason==="eligible"&&override?.active!==false,eligible:reason==="eligible",held:override?.active===false,
        reason,status:reason==="eligible"?"paid through "+r.validThrough:reason,source:"Prepaid",
        validThrough:r.validThrough,usualDay:r.usualDay,
        expectedToday:reason==="eligible"&&r.program===cls.slug&&r.usualDay===cls.day,
        program:r.program,programTitle:deps.titles[r.program],makeup:r.program!==cls.slug});
    }
    cursor=page.list_complete?null:page.cursor;
  }while(cursor);
  return students;
}
function calendarRecord(event) {
  if(event.status==="cancelled")return null;
  const description=text(event.html_description||event.description).replace(/\\_/g,"_").replace(/<[^>]+>/g," ");
  const sub=description.match(/Stripe subscription:\s*(sub_[a-zA-Z0-9]+)/i)?.[1];
  const name=description.match(/Student:\s*([^·\n]+)/i)?.[1]?.trim();
  const program=text(event.program)||description.match(/Program:\s*([^·\n(]+)/i)?.[1]?.trim()||text(event.title||event.summary).replace(name||"","").replace(/^[\s—–-]+/,"");
  return sub&&name?{subscriptionId:sub,name,start:event.start?.dateTime||event.start,program,eventId:event.event_id||event.id}:null;
}
export function membershipEligibility(s,date,now=new Date()) {
  if(!["active","trialing"].includes(s.status))return s.status||"unknown";
  if(s.pause_collection || s.paused)return "paused";
  const m=s.metadata||{};
  if(m.pause_until && m.pause_until>date)return "paused";
  if(m.first_class_date && m.first_class_date>date)return "not_started";
  if(s.status==="trialing" && (!m.first_class_date || !s.trial_end || s.trial_end<=now.getTime()/1000))return "trial_needs_review";
  const end=s.current_period_end||Math.max(0,...(s.items?.data||[]).map(i=>Number(i.current_period_end)||0));
  if(s.status==="active"&&end && end<=now.getTime()/1000)return "expired";
  return "eligible";
}
export async function loadStripeMemberships(env,now=new Date(),force=false) {
  if(!env.STRIPE_SECRET_KEY)throw Error("Stripe membership connection is not activated.");
  const key="checkin:stripe-memberships";
  const raw=await env.ENROLLMENTS.get(key);
  const cached=raw?JSON.parse(raw):null;
  if(!force&&cached&&now.getTime()-Date.parse(cached.fetchedAt)<120000)return cached;
  let after,rows=[];
  for(let page=0;page<30;page++){
    const qs=new URLSearchParams({limit:"100",status:"all","expand[]":"data.customer",...(after?{starting_after:after}:{})});
    const response=await fetch("https://api.stripe.com/v1/subscriptions?"+qs,{headers:{Authorization:"Bearer "+env.STRIPE_SECRET_KEY}});
    if(!response.ok)throw Error("Could not verify current Stripe memberships. Please ask staff.");
    const data=await response.json();
    for(const s of data.data){
      rows.push({id:s.id,status:s.status,pause_collection:!!s.pause_collection,trial_end:s.trial_end,current_period_end:s.current_period_end,
        items:{data:(s.items?.data||[]).map(i=>({current_period_end:i.current_period_end}))},
        metadata:s.metadata||{},customer:{id:typeof s.customer==="string"?s.customer:s.customer?.id,email:s.customer?.email||""}});
    }
    if(!data.has_more){const result={subscriptions:rows,fetchedAt:now.toISOString()};await env.ENROLLMENTS.put(key,JSON.stringify(result),{expirationTtl:180});return result;}
    after=data.data.at(-1)?.id;if(!after)break;
  }
  throw Error("Subscription list incomplete. Staff review required.");
}
export async function automaticRoster(env,cls,date,deps,now=new Date(),force=false,allPrograms=false) {
  const source=deps.getMemberships?await deps.getMemberships(env,now,force):await loadStripeMemberships(env,now,force);
  const calendar=deps.getCalendar?await deps.getCalendar(env,date):JSON.parse(await env.ENROLLMENTS.get("checkin:calendar-snapshot")||"null");
  const calendarFresh=calendar && Math.abs(now.getTime()-Date.parse(calendar.fetchedAt))<24*3600000;
  const events=calendarFresh?(calendar.events||[]).map(calendarRecord).filter(Boolean):[];
  const students=[],issues=[];
  for(const s of source.subscriptions){
    const m=s.metadata||{},linked=events.filter(e=>e.subscriptionId===s.id);
    const holdUntil=calendar?.enrollmentHolds?.[s.customer?.id];
    const eligibility=holdUntil&&holdUntil>date?"enrollment_paused":membershipEligibility(s,date,now);
    if(eligibility!=="eligible")issues.push({subscriptionId:s.id,reason:eligibility});
    // Use metadata first; fall back only to unambiguous subscription-linked calendar identity.
    const names=[...new Set(linked.map(e=>e.name))];
    const name=text(m.student_name)||(names.length===1?names[0]:"");
    const normalized=v=>text(v).toLowerCase().replace(/[^a-z0-9]/g,"");
    const matchProgram=p=>{
      const direct=Object.keys(deps.titles).find(k=>normalized(k)===normalized(p)||normalized(deps.titles[k])===normalized(p));
      if(direct)return direct;
      // Preserve identity matching for calendar records using earlier display names.
      const legacy={
        yfprealgebra:"young-fermats-prealgebra",
        youngfermatsalgebrai:"young-fermats-algebra-ignite",
        youngfermatsalgebra1:"young-fermats-algebra-ignite",
        youngfermatsalgebraignite:"young-fermats-algebra-ignite",
        algebraignite:"young-fermats-algebra-ignite",
        algebrai:"young-fermats-algebra-ignite",
        youngfermatsalgebraii:"young-fermats-algebra-ii",
        youngfermatsalgebra2:"young-fermats-algebra-ii",
        algebraii:"young-fermats-algebra-ii",
        youngfermatsgeometry:"young-fermats-geometry",
        youngfermatsgeometrytrigonometry:"young-fermats-geometry",
        youngfermatsgeometryandtrigonometry:"young-fermats-geometry"
      };
      if(legacy[normalized(p)])return legacy[normalized(p)];
      return "";
    };
    const calendarPrograms=[...new Set(linked.map(e=>matchProgram(e.program)).filter(Boolean))];
    const slug=text(m.course_slug)||(calendarPrograms.length===1?calendarPrograms[0]:"");
    if(!name||!slug){issues.push({subscriptionId:s.id,reason:"student_or_program_missing"});continue;}
    if(!allPrograms&&slug!==cls.slug)continue;
    const id=(await digest((s.customer?.id||s.id)+"|"+slug+"|"+name.toLowerCase())).slice(0,24);
    const override=JSON.parse(await env.ENROLLMENTS.get("checkin:member-override:"+id)||"null");
    const expected=slug===cls.slug&&linked.some(e=>typeof e.start==="string" && new Date(e.start).toLocaleDateString("en-CA",{timeZone:"America/New_York"})===date);
    const personId=(await digest((s.customer?.id||s.id)+"|"+name.toLowerCase())).slice(0,24);
    const contact=await readStudentContact(env,s.customer?.id,name);
    const studentEmail=normalizeEmail(contact?contact.studentEmail:m.student_email);
    const member={id,personId,name,customerId:s.customer?.id||"",studentEmail,email:text(s.customer?.email||m.parent_email).toLowerCase(),active:eligibility==="eligible"&&override?.active!==false,held:override?.active===false,eligible:eligibility==="eligible",reason:eligibility,subscriptionId:s.id,
      status:s.status,usualDay:text(m.weekly_day),expectedToday:expected,source:"Stripe",program:slug,programTitle:deps.titles[slug]||slug,makeup:slug!==cls.slug};
    const duplicate=students.findIndex(a=>a.id===id);
    if(duplicate<0)students.push(member);
    else if(member.eligible&&!students[duplicate].eligible)students[duplicate]=member;
  }
  students.push(...await prepaidRoster(env,cls,date,deps,allPrograms));
  return {students:students.sort((a,b)=>Number(b.expectedToday)-Number(a.expectedToday)||a.name.localeCompare(b.name)),
    sync:{stripeAt:source.fetchedAt,calendarAt:calendarFresh?calendar.fetchedAt:null,calendarConnected:!!calendarFresh,demo:!!deps.demo},
    issues};
}
