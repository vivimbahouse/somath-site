// Stripe is the eligibility authority. Calendar events enrich identity and expected arrivals,
// but never make an inactive subscription eligible. No price-level course inference:
// SOMATH reuses one price across several Young Fermats programs.
const text=v=>String(v||"").trim();
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,"0")).join("");
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
export async function automaticRoster(env,cls,date,deps,now=new Date(),force=false) {
  const source=deps.getMemberships?await deps.getMemberships(env,now,force):await loadStripeMemberships(env,now,force);
  const calendar=deps.getCalendar?await deps.getCalendar(env,date):JSON.parse(await env.ENROLLMENTS.get("checkin:calendar-snapshot")||"null");
  const calendarFresh=calendar && Math.abs(now.getTime()-Date.parse(calendar.fetchedAt))<24*3600000;
  const events=calendarFresh?(calendar.events||[]).map(calendarRecord).filter(Boolean):[];
  const students=[],issues=[];
  for(const s of source.subscriptions){
    const m=s.metadata||{},linked=events.filter(e=>e.subscriptionId===s.id);
    const eligibility=membershipEligibility(s,date,now);
    if(eligibility!=="eligible")issues.push({subscriptionId:s.id,reason:eligibility});
    // Use metadata first; fall back only to unambiguous subscription-linked calendar identity.
    const names=[...new Set(linked.map(e=>e.name))];
    const name=text(m.student_name)||(names.length===1?names[0]:"");
    const normalized=v=>text(v).toLowerCase().replace(/[^a-z0-9]/g,"");
    const matchProgram=p=>{
      const direct=Object.keys(deps.titles).find(k=>normalized(k)===normalized(p)||normalized(deps.titles[k])===normalized(p));
      if(direct)return direct;
      if(normalized(p)==="youngfermatsalgebrai")return "young-fermats-algebra-ignite";
      return "";
    };
    const calendarPrograms=[...new Set(linked.map(e=>matchProgram(e.program)).filter(Boolean))];
    const slug=text(m.course_slug)||(calendarPrograms.length===1?calendarPrograms[0]:"");
    if(!name||!slug){issues.push({subscriptionId:s.id,reason:"student_or_program_missing"});continue;}
    if(slug!==cls.slug)continue;
    const id=(await digest((s.customer?.id||s.id)+"|"+slug+"|"+name.toLowerCase())).slice(0,24);
    const override=JSON.parse(await env.ENROLLMENTS.get("checkin:member-override:"+id)||"null");
    const expected=linked.some(e=>typeof e.start==="string" && new Date(e.start).toLocaleDateString("en-CA",{timeZone:"America/New_York"})===date);
    const personId=(await digest((s.customer?.id||s.id)+"|"+name.toLowerCase())).slice(0,24);
    const member={id,personId,name,email:text(s.customer?.email||m.parent_email).toLowerCase(),active:eligibility==="eligible"&&override?.active!==false,held:override?.active===false,eligible:eligibility==="eligible",reason:eligibility,subscriptionId:s.id,
      status:s.status,usualDay:text(m.weekly_day),expectedToday:expected,source:"Stripe",program:slug};
    const duplicate=students.findIndex(a=>a.id===id);
    if(duplicate<0)students.push(member);
    else if(member.eligible&&!students[duplicate].eligible)students[duplicate]=member;
  }
  return {students:students.sort((a,b)=>Number(b.expectedToday)-Number(a.expectedToday)||a.name.localeCompare(b.name)),
    sync:{stripeAt:source.fetchedAt,calendarAt:calendarFresh?calendar.fetchedAt:null,calendarConnected:!!calendarFresh,demo:!!deps.demo},
    issues};
}
