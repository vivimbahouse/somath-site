(() => {
  "use strict";
  const config=window.CHECKIN_CONFIG||{};
  const endpoint=config.api||"/api/checkin";
  const app=document.querySelector("#app"),lock=document.querySelector("#lock");
  let token="",scope="",date="",classes=[],cls=null,selected=null,manager=null,memoStudent=null,memoAuthor="",screen="unlock",busy=false,queryVersion=0,timer,idle,sessionTimer,mode="kiosk",homeworkEnabled=false;
  const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dateLabel=d=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",timeZone:"UTC"});
  const timeLabel=t=>new Date(t).toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"});
  function notice(text,error=false){const n=document.querySelector("#notice");n.textContent=text;n.className=error?"error":"";n.style.display="block";clearTimeout(n.timer);n.timer=setTimeout(()=>n.style.display="none",6500);}
  function focus(){app.focus({preventScroll:true});window.scrollTo(0,0);}
  async function api(action,body={}) {
    const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},body:JSON.stringify({action,date,...body})});
    let data;try{data=await response.json();}catch{throw Error("Connection interrupted. Please try again.");}
    if(!response.ok){if(response.status===401&&action!=="unlock")reset();const err=Error(data.error||"Please try again.");err.frontDesk=data.frontDesk;throw err;}
    return data;
  }
  function reset(){clearTimeout(timer);clearTimeout(idle);clearTimeout(sessionTimer);queryVersion++;token="";scope="";cls=null;selected=null;manager=null;memoStudent=null;memoAuthor="";classes=[];screen="unlock";lock.hidden=true;document.querySelector("#notice").style.display="none";render();}
  function intro(title,description,step=""){return `<div class="intro"><div><p class="eyebrow">${date?e(dateLabel(date)):"Welcome to SOMATH"}</p><h1>${e(title)}</h1><p class="lede">${e(description)}</p></div>${step?`<span class="step">${e(step)}</span>`:""}</div>`;}
  function render() {
    lock.hidden=!token;
    if(screen==="unlock"){
      app.innerHTML=`<section class="panel unlock"><div class="seal">A good day for math.</div><h1>Welcome to SOMATH</h1><p class="muted">Staff, unlock this tablet to begin student check-in.</p><div class="chips"><button class="secondary ${mode==="kiosk"?"active":""}" data-action="mode" data-mode="kiosk">Student kiosk</button><button class="secondary ${mode==="staff"?"active":""}" data-action="mode" data-mode="staff">Teacher view</button></div><form id="unlock-form"><label for="password">Staff password</label><input id="password" name="password" type="password" autocomplete="off" required placeholder="${config.demo?"Preview password: demo":"SOMATH admin password"}"><button class="primary wide" type="submit">Unlock ${mode==="staff"?"teacher view":"tablet"}</button></form><p class="helper">Names and parent details are never available before staff unlocks this page. Refreshing locks the tablet again.</p></section>`;
      return;
    }
    if(screen==="classes"){
      app.innerHTML=intro(scope==="staff"?"Classroom desk":"Which class are you here for?",scope==="staff"?"Review the roster, take attendance, and choose today's homework link.":"Choose your class, find your name, and let us know you’re here.",scope==="staff"?"Staff access":"1 of 3 · Your class")+
        (scope==="staff"?`<div class="staff-heading"><p class="helper">Times are in New York time. Uses the weekly course schedule.</p><div><label for="class-date">Class date</label><input type="date" id="class-date" value="${e(date)}"></div></div><div class="status">${homeworkEnabled?"Automatic homework sending is enabled. Approved assignments send 10–25 minutes after class.":"Automatic email is not activated. You can prepare rosters, attendance, and assignments now."}</div>`:"")+
        `<div class="class-grid">${classes.map(c=>`<button class="class-card" data-action="class" data-id="${e(c.id)}"><span class="time">${e(c.time)}</span><span class="title">${e(c.title)}</span>${scope==="staff"?`<span class="attendance-count">${c.presentCount||0} checked in</span>`:""}${c.closed?'<span class="class-note">Closed for this date</span>':""}<span class="arrow" aria-hidden="true">↗</span></button>`).join("")}</div>`+
        (!classes.length?'<div class="empty">No classes are available for this date. Please ask your teacher.</div>':"");
    }else if(screen==="search"){
      app.innerHTML=`<button class="quiet" data-action="back">← All classes</button>`+intro("Find your name",`${cls.title} · ${cls.time}`,"2 of 3 · Your name")+`<section class="panel search-panel"><label for="student-search">Type at least two letters of your name</label><input id="student-search" autocomplete="off" placeholder="Your first or last name" maxlength="120"><div id="results" aria-live="polite"><p class="helper">Coming for a makeup in another class? You can still find your name here.</p></div></section><p class="helper">We search students across all programs and weekdays. Choose the class you are attending today. Can’t find your name? Ask your teacher to check your membership details. Please don’t choose someone else’s name.</p>`;
    }else if(screen==="confirm"){
      app.innerHTML=`<button class="quiet" data-action="search-back">← Choose a different name</button><section class="panel confirm"><p class="eyebrow">3 of 3 · Confirm</p><h1>Is this you?</h1><p class="name">${e(selected.name)}</p><p>${e(cls.title)}<br><span class="muted">${e(dateLabel(date))} · ${e(cls.time)}</span></p><div class="actions"><button class="primary" data-action="confirm">Yes, check me in</button><button class="secondary" data-action="search-back">Not me</button></div></section>`;
    }else if(screen==="frontdesk"){
      app.innerHTML=`<section class="panel success"><p class="eyebrow">A quick check with our team</p><h1>Please see the front desk</h1><p class="name">${e(selected?.name||"")}</p><p>Our team needs to check a detail before we can complete your check-in.</p><p class="muted">You have not been marked present yet.</p><button class="primary" data-action="back">Back to classes</button><p class="helper">This screen clears automatically in 12 seconds.</p></section>`;
    }else if(screen==="success"){
      app.innerHTML=`<section class="panel success"><div class="success-mark" aria-hidden="true">✓</div><p class="eyebrow">You’re all set</p><h1>${selected.already?"You’re already checked in.":"You’re checked in!"}</h1><p class="name">${e(selected.name)}</p><p>${e(cls.title)}<br><span class="muted">Arrival recorded at ${e(timeLabel(selected.at))}.</span></p><button class="primary" data-action="back">Next student</button><p class="helper">This screen clears automatically in 8 seconds.</p></section>`;
    }else if(screen==="manage")renderManager();
    focus();
  }
  function readRoster(){if(!manager)return;document.querySelectorAll(".roster-row").forEach(row=>{const s=manager.students[Number(row.dataset.index)];s.active=row.querySelector('[data-field="active"]').checked;});}
  function renderRoster(){
    document.querySelector("#roster-rows").innerHTML=manager.students.map((s,i)=>`<div class="roster-row" data-index="${i}"><div><strong>${e(s.name)}</strong><small class="muted">Stripe: ${e(s.status)}${s.usualDay?" · Usually "+e(s.usualDay):""}${s.expectedToday?" · On today's calendar":""}</small>${s.eligible?`<button class="quiet" data-action="attendance" data-id="${e(s.id)}" data-present="true" ${s.active?"":"disabled"}>Mark present for this class</button>`:`<span class="class-note">Front desk review: ${e(s.reason.replaceAll("_"," "))}</span>`}<button class="secondary memo-button" data-action="notes" data-id="${e(s.id)}">Student memos</button></div><div><span class="helper">Parent email</span><div class="parent-email">${e(s.email)||"Missing in Stripe"}</div></div><label class="check-label">No hold<input data-field="active" type="checkbox" ${!s.held?"checked":""}></label></div>`).join("")||'<p class="empty">No members found. Check Stripe student/program metadata.</p>';
  }
  function attendanceStudents(){
    const rows=manager.students.filter(s=>s.expectedToday||manager.attendance.some(a=>a.studentId===s.id));
    for(const a of manager.attendance)if(!rows.some(s=>s.id===a.studentId))rows.push({id:a.studentId,name:a.name,email:a.parentEmail,historical:true});
    return rows;
  }
  function renderManager(){
    const l=manager.lesson||{},active=attendanceStudents(),present=manager.attendance.filter(a=>a.present),sync=manager.sync||{};
    app.innerHTML=`<button class="quiet" data-action="back">← All classes</button>`+intro(cls.title,`${dateLabel(date)} · ${cls.time}`,"Teacher view")+
    `<div class="status">${sync.error?e(sync.error):`${sync.demo?"Preview sample sync":"Stripe verified"} · ${sync.stripeAt?e(timeLabel(sync.stripeAt)):"Not yet synced"}. ${sync.calendarConnected?"Calendar-linked expected arrivals shown.":"Calendar sync is not activated."} Student search includes all programs for makeup attendance.`}</div><div class="staff-layout"><section class="panel"><h2>Attendance <span class="muted">${present.length} present</span></h2><p class="helper">Arrivals are saved to this class and date, including students switching days. Calendar-expected students appear here too; no check-in does not automatically mean absent.</p><div>${active.map(s=>{const a=present.find(a=>a.studentId===s.id);const job=manager.jobs.find(j=>j.studentId===s.id);return `<div class="attendance-row"><div><strong>${e(s.name)}</strong><small>${a?"Present · "+e(timeLabel(a.at)):s.expectedToday?"Expected · Not checked in":"Arrival removed"}${s.historical?" · Historical record":""}${!s.email?" · Parent email missing":""}${job?" · Homework: "+e(job.status):""}</small></div><button class="secondary" data-action="attendance" data-id="${e(s.id)}" data-present="${!a}">${a?"Undo arrival":"Mark present"}</button></div>`;}).join("")||'<p class="empty">No arrivals or calendar-expected students for this class yet. Students switching days appear as soon as they check in.</p>'}</div><div class="actions"><button class="secondary" data-action="refresh">Refresh memberships & attendance</button><button class="secondary" data-action="export">Download attendance CSV</button></div></section>
    <section class="panel"><h2>Homework for this class</h2><form id="lesson-form"><label for="lesson-title">Assignment title</label><input id="lesson-title" name="title" value="${e(l.title)}" maxlength="120" placeholder="e.g. Factoring polynomials: W1–W5"><label for="lesson-url">Lesson or homework link</label><input id="lesson-url" name="url" type="url" value="${e(l.url)}" placeholder="https://www.schoolofmath.us/posts/…" maxlength="2000"><label for="lesson-note">Teacher instructions (optional)</label><textarea id="lesson-note" name="note" maxlength="1500" placeholder="Which questions to complete, what to bring next class…">${e(l.note)}</textarea><label class="check-label"><input type="checkbox" name="approved" ${l.approved?"checked":""}>Assignment is ready for automatic sending</label><label class="check-label"><input type="checkbox" name="closed" ${l.closed?"checked":""}>Class is cancelled / closed on this date</label><button class="primary wide" type="submit">Save assignment</button></form><p class="helper">${homeworkEnabled?"Sends to parents of active students marked present, 10–25 minutes after class. No assignment approval means no email.":"Sending is disabled pending activation. Saving this form will not send an email."} No automatic catch-up emails from previous dates.</p><details><summary>Parent email format</summary><div class="email-preview">Hello,<br><br>[Student] attended ${e(cls.title)} on ${e(date)}.<br><br>Today's homework: [Assignment title and link]<br>[Teacher instructions]<br><br>Please use the assigned link to review the lesson and complete the homework. Reply to this email if you have any questions.<br><br>Warmly,<br>The SOMATH Team<br>School of Math | 226 W 79th St, New York, NY 10024<br>(646) 668-6151</div></details></section>
    <section class="panel full"><h2>Class roster and makeup arrivals</h2><p class="helper">This roster shows enrolled students and any cross-course makeup arrivals. Kiosk name search includes all programs. Calendar records can supply missing student/program details and highlight expected arrivals. Calendar entries alone never override invalid billing status. Correct student names, program and parent emails in Stripe; use No hold only for a staff attendance hold. A hold does not change billing.</p><div id="roster-rows"></div><div class="actions"><button class="primary" data-action="save-roster">Save attendance holds</button></div><p class="helper">Cancelled, paused, unpaid, past-due, not-started, or ambiguous memberships are not automatically admitted. ${manager.issues?.length||0} membership records across the account need review or are ineligible.</p></section></div>`;
    renderRoster();
    document.querySelectorAll(".roster-row").forEach((row,i)=>{
      const s=manager.students[i];
      if(s.makeup)row.querySelector("strong").insertAdjacentHTML("afterend",`<small class="class-note">Makeup · Enrolled in ${e(s.programTitle)}</small>`);
    });
    app.insertAdjacentHTML("beforeend",'<section class="panel memos" id="student-memos" hidden></section>');
    document.querySelectorAll(".attendance-row").forEach((row,i)=>{
      const s=attendanceStudents()[i];
      const arrival=manager.attendance.find(a=>a.studentId===s.id);
      if(arrival?.makeup)row.querySelector("small").insertAdjacentHTML("beforeend",` · Makeup from ${e(arrival.enrolledProgramTitle||arrival.enrolledProgram)}`);
      row.querySelector("div").insertAdjacentHTML("beforeend",`<button class="quiet" data-action="notes" data-id="${e(s.id)}">Student memos</button>`);
    });
  }
  function renderMemos(data){
    memoStudent=data.student;
    const panel=document.querySelector("#student-memos");panel.hidden=false;
    panel.innerHTML=`<p class="eyebrow">Private staff notes</p><h2>${e(data.student.name)} · Student memos</h2><p class="helper">Saved with the student across class days. Notes are never shown in student check-in or included in homework emails. Keep entries factual and relevant to teaching.</p><form id="memo-form"><label for="memo-author">Your name</label><input id="memo-author" name="author" value="${e(memoAuthor)}" maxlength="80" autocomplete="off" required><label for="memo-body">New memo</label><textarea id="memo-body" name="body" maxlength="2000" placeholder="e.g. Practised fraction signs today; review with a number line next class." required></textarea><button type="submit" class="primary">Save student memo</button></form><label for="memo-search">Search previous memos</label><input id="memo-search" placeholder="Find a topic or teacher…" autocomplete="off"><div id="memo-list">${data.notes.map(n=>`<article class="memo-entry"><p class="helper">${e(n.author)} · ${e(new Date(n.createdAt).toLocaleString("en-US",{timeZone:"America/New_York",dateStyle:"medium",timeStyle:"short"}))} ET · Class date ${e(n.classDate)}</p><p class="memo-body">${e(n.body)}</p></article>`).join("")||'<p class="empty">No memos yet. Add the first one above.</p>'}</div><p id="memo-no-match" class="empty" hidden>No matching memos.</p>`;
    panel.scrollIntoView({block:"start",behavior:"instant"});
  }
  async function loadClasses(){clearTimeout(timer);queryVersion++;cls=null;selected=null;manager=null;const d=await api("classes");date=d.date;classes=d.classes;homeworkEnabled=d.homeworkEnabled;screen="classes";render();}
  async function loadManager(refresh=false){manager=await api("manage",{classId:cls.id,refresh});screen="manage";render();}
  app.addEventListener("submit",async ev=>{
    ev.preventDefault();if(busy)return;busy=true;const submit=ev.target.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
    try{
      const data=new FormData(ev.target);
      if(ev.target.id==="unlock-form"){
        const d=await api("unlock",{password:data.get("password"),scope:mode});
        ev.target.reset();document.querySelector("#notice").style.display="none";token=d.token;scope=d.scope;date=d.date;
        clearTimeout(sessionTimer);sessionTimer=setTimeout(reset,Math.max(0,d.expires*1000-Date.now()));await loadClasses();
      }else if(ev.target.id==="memo-form"){
        memoAuthor=String(data.get("author")||"").trim();
        const d=await api("add-note",{classId:cls.id,studentId:memoStudent.id,author:memoAuthor,body:data.get("body")});
        renderMemos(d);notice("Student memo saved.");
      }else if(ev.target.id==="lesson-form"){
        await api("lesson",{classId:cls.id,title:data.get("title"),url:data.get("url"),note:data.get("note"),approved:data.has("approved"),closed:data.has("closed")});
        notice("Assignment saved.");await loadManager();
      }
    }catch(err){notice(err.message,true);}finally{busy=false;if(submit)submit.disabled=false;}
  });
  app.addEventListener("click",async ev=>{
    const btn=ev.target.closest("[data-action]");if(!btn||busy)return;const action=btn.dataset.action;
    busy=true;btn.disabled=true;
    try {
      if(action==="mode"){mode=btn.dataset.mode;render();}
      if(action==="back")await loadClasses();
      if(action==="class"){cls=classes.find(c=>c.id===btn.dataset.id);if(scope==="staff")await loadManager();else{screen="search";render();}}
      if(action==="search-back"){queryVersion++;selected=null;screen="search";render();}
      if(action==="pick"){selected={id:btn.dataset.id,name:btn.dataset.name};queryVersion++;screen=btn.dataset.allowed==="false"?"frontdesk":"confirm";render();if(screen==="frontdesk")timer=setTimeout(()=>loadClasses().catch(()=>reset()),12000);}
      if(action==="confirm"){const r=await api("checkin",{classId:cls.id,studentId:selected.id});selected={...selected,...r};screen="success";render();timer=setTimeout(()=>loadClasses().catch(err=>notice(err.message,true)),8000);}
      if(action==="refresh")await loadManager(true);
      if(action==="notes")renderMemos(await api("notes",{classId:cls.id,studentId:btn.dataset.id}));
      if(action==="attendance"){await api("attendance",{classId:cls.id,studentId:btn.dataset.id,present:btn.dataset.present==="true"});await loadManager();}
      if(action==="save-roster"){readRoster();await api("roster",{classId:cls.id,students:manager.students});notice("Attendance holds saved.");await loadManager();}
      if(action==="export"){
        const cell=v=>'"'+String(v??"").replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
        const rows=[["Class date","Class","Student","Status","Arrival (New York)","Attendance type","Enrolled program"],...attendanceStudents().map(s=>{const a=manager.attendance.find(a=>a.studentId===s.id&&a.present);return[date,cls.title,s.name,a?"Present":"Not checked in",a?timeLabel(a.at):"",a?.makeup?"Makeup":a?"Regular":"",a?.enrolledProgramTitle||s.programTitle||""];})];
        const url=URL.createObjectURL(new Blob([rows.map(r=>r.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`somath-attendance-${date}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    }catch(err){if(err.frontDesk){screen="frontdesk";render();timer=setTimeout(()=>loadClasses().catch(()=>reset()),12000);}else notice(err.message,true);}finally{busy=false;btn.disabled=false;}
  });
  app.addEventListener("change",async ev=>{if(ev.target.id==="class-date"){date=ev.target.value;try{await loadClasses();}catch(err){notice(err.message,true);}}});
  let debounce;
  app.addEventListener("input",ev=>{
    if(ev.target.id==="memo-search"){
      const query=ev.target.value.trim().toLocaleLowerCase(),entries=[...document.querySelectorAll(".memo-entry")];
      entries.forEach(el=>el.hidden=!el.textContent.toLocaleLowerCase().includes(query));
      document.querySelector("#memo-no-match").hidden=!entries.length||entries.some(el=>!el.hidden);return;
    }
    if(ev.target.id!=="student-search")return;
    clearTimeout(debounce);const version=++queryVersion,q=ev.target.value;
    if(q.trim().length<2){document.querySelector("#results").innerHTML='<p class="helper">Type at least two letters.</p>';return;}
    document.querySelector("#results").textContent="Looking for your name…";
    debounce=setTimeout(async()=>{
      try{
        const d=await api("search",{classId:cls.id,query:q});if(version!==queryVersion||screen!=="search")return;
        document.querySelector("#results").innerHTML=d.students.map(s=>`<button class="result" data-action="pick" data-id="${e(s.id)}" data-name="${e(s.name)}" data-allowed="${s.canCheckIn}"><span>${e(s.name)}</span><span aria-hidden="true">→</span></button>`).join("")||'<p class="empty">No matching name found. Please see the front desk.</p>';
      }catch(err){if(version===queryVersion)notice(err.message,true);}
    },250);
  });
  lock.addEventListener("click",reset);
  ["pointerdown","keydown"].forEach(type=>document.addEventListener(type,()=>{clearTimeout(idle);if(scope==="kiosk"&&token)idle=setTimeout(()=>loadClasses().catch(()=>reset()),60000);}));
  if(config.demo){const banner=document.querySelector("#preview-banner");banner.hidden=false;banner.textContent="INTERACTIVE PREVIEW · Fictional students only · Password: demo · No emails are sent";}
  render();
})();
