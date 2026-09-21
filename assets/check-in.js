(() => {
  "use strict";
  const config=window.CHECKIN_CONFIG||{};
  const endpoint=config.api||"/api/checkin";
  const app=document.querySelector("#app"),lock=document.querySelector("#lock");
  let token="",scope="",date="",classes=[],cls=null,selected=null,manager=null,screen="unlock",busy=false,queryVersion=0,timer,idle,sessionTimer,mode="kiosk",homeworkEnabled=false;
  const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dateLabel=d=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",timeZone:"UTC"});
  const timeLabel=t=>new Date(t).toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"});
  function notice(text,error=false){const n=document.querySelector("#notice");n.textContent=text;n.className=error?"error":"";n.style.display="block";clearTimeout(n.timer);n.timer=setTimeout(()=>n.style.display="none",6500);}
  function focus(){app.focus({preventScroll:true});window.scrollTo(0,0);}
  async function api(action,body={}) {
    const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},body:JSON.stringify({action,date,...body})});
    let data;try{data=await response.json();}catch{throw Error("Connection interrupted. Please try again.");}
    if(!response.ok){if(response.status===401&&action!=="unlock")reset();throw Error(data.error||"Please try again.");}
    return data;
  }
  function reset(){clearTimeout(timer);clearTimeout(idle);clearTimeout(sessionTimer);queryVersion++;token="";scope="";cls=null;selected=null;manager=null;classes=[];screen="unlock";lock.hidden=true;document.querySelector("#notice").style.display="none";render();}
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
        `<div class="class-grid">${classes.map(c=>`<button class="class-card" data-action="class" data-id="${e(c.id)}"><span class="time">${e(c.time)}</span><span class="title">${e(c.title)}</span>${c.closed?'<span class="class-note">Closed for this date</span>':""}<span class="arrow" aria-hidden="true">↗</span></button>`).join("")}</div>`+
        (!classes.length?'<div class="empty">No classes are available for this date. Please ask your teacher.</div>':"");
    }else if(screen==="search"){
      app.innerHTML=`<button class="quiet" data-action="back">← All classes</button>`+intro("Find your name",`${cls.title} · ${cls.time}`,"2 of 3 · Your name")+`<section class="panel search-panel"><label for="student-search">Type at least two letters of your name</label><input id="student-search" autocomplete="off" placeholder="Your first or last name" maxlength="120"><div id="results" aria-live="polite"><p class="helper">Your matching names will appear here.</p></div></section><p class="helper">Can’t find your name? Your teacher can add or correct it. Please don’t choose someone else’s name.</p>`;
    }else if(screen==="confirm"){
      app.innerHTML=`<button class="quiet" data-action="search-back">← Choose a different name</button><section class="panel confirm"><p class="eyebrow">3 of 3 · Confirm</p><h1>Is this you?</h1><p class="name">${e(selected.name)}</p><p>${e(cls.title)}<br><span class="muted">${e(dateLabel(date))} · ${e(cls.time)}</span></p><div class="actions"><button class="primary" data-action="confirm">Yes, check me in</button><button class="secondary" data-action="search-back">Not me</button></div></section>`;
    }else if(screen==="success"){
      app.innerHTML=`<section class="panel success"><div class="success-mark" aria-hidden="true">✓</div><p class="eyebrow">You’re all set</p><h1>${selected.already?"You’re already checked in.":"You’re checked in!"}</h1><p class="name">${e(selected.name)}</p><p>${e(cls.title)}<br><span class="muted">Arrival recorded at ${e(timeLabel(selected.at))}.</span></p><button class="primary" data-action="back">Next student</button><p class="helper">This screen clears automatically in 8 seconds.</p></section>`;
    }else if(screen==="manage")renderManager();
    focus();
  }
  function readRoster(){if(!manager)return;document.querySelectorAll(".roster-row").forEach(row=>{const s=manager.students[Number(row.dataset.index)];s.name=row.querySelector('[data-field="name"]').value;s.email=row.querySelector('[data-field="email"]').value;s.active=row.querySelector('[data-field="active"]').checked;});}
  function renderRoster(){
    document.querySelector("#roster-rows").innerHTML=manager.students.map((s,i)=>`<div class="roster-row" data-index="${i}"><div><label for="name-${i}">Student name</label><input id="name-${i}" data-field="name" value="${e(s.name)}" maxlength="120"></div><div><label for="email-${i}">Parent email</label><input id="email-${i}" data-field="email" type="email" value="${e(s.email)}" maxlength="180"></div><label class="check-label">Active<input data-field="active" type="checkbox" ${s.active!==false?"checked":""}></label></div>`).join("")||'<p class="empty">No saved roster yet. Review enrollment candidates or add students manually.</p>';
  }
  function renderManager(){
    const l=manager.lesson||{},active=manager.students.filter(s=>s.active!==false),present=manager.attendance.filter(a=>a.present&&active.some(s=>s.id===a.studentId));
    app.innerHTML=`<button class="quiet" data-action="back">← All classes</button>`+intro(cls.title,`${dateLabel(date)} · ${cls.time}`,"Teacher view")+
    `<div class="staff-layout"><section class="panel"><h2>Attendance <span class="muted">${present.length}/${active.length}</span></h2><p class="helper">Not checked in is not the same as confirmed absent. Use these controls to correct arrival records.</p><div>${active.map(s=>{const a=present.find(a=>a.studentId===s.id);const job=manager.jobs.find(j=>j.studentId===s.id);return `<div class="attendance-row"><div><strong>${e(s.name)}</strong><small>${a?"Present · "+e(timeLabel(a.at)):"Not checked in"}${!s.email?" · Parent email missing":""}${job?" · Homework: "+e(job.status):""}</small></div><button class="secondary" data-action="attendance" data-id="${e(s.id)}" data-present="${!a}">${a?"Undo arrival":"Mark present"}</button></div>`;}).join("")||'<p class="empty">Save a roster below to begin.</p>'}</div><div class="actions"><button class="secondary" data-action="refresh">Refresh</button><button class="secondary" data-action="export">Download attendance CSV</button></div></section>
    <section class="panel"><h2>Homework for this class</h2><form id="lesson-form"><label for="lesson-title">Assignment title</label><input id="lesson-title" name="title" value="${e(l.title)}" maxlength="120" placeholder="e.g. Factoring polynomials: W1–W5"><label for="lesson-url">Lesson or homework link</label><input id="lesson-url" name="url" type="url" value="${e(l.url)}" placeholder="https://www.schoolofmath.us/posts/…" maxlength="2000"><label for="lesson-note">Teacher instructions (optional)</label><textarea id="lesson-note" name="note" maxlength="1500" placeholder="Which questions to complete, what to bring next class…">${e(l.note)}</textarea><label class="check-label"><input type="checkbox" name="approved" ${l.approved?"checked":""}>Assignment is ready for automatic sending</label><label class="check-label"><input type="checkbox" name="closed" ${l.closed?"checked":""}>Class is cancelled / closed on this date</label><button class="primary wide" type="submit">Save assignment</button></form><p class="helper">${homeworkEnabled?"Sends to parents of active students marked present, 10–25 minutes after class. No assignment approval means no email.":"Sending is disabled pending activation. Saving this form will not send an email."} No automatic catch-up emails from previous dates.</p><details><summary>Parent email format</summary><div class="email-preview">Hello,<br><br>[Student] attended ${e(cls.title)} on ${e(date)}.<br><br>Today's homework: [Assignment title and link]<br>[Teacher instructions]<br><br>Please use the assigned link to review the lesson and complete the homework. Reply to this email if you have any questions.<br><br>Warmly,<br>The SOMATH Team<br>School of Math | 226 W 79th St, New York, NY 10024<br>(646) 668-6151</div></details></section>
    <section class="panel full"><h2>Weekly class roster</h2><p class="helper">This roster applies to this weekly class, not just today. Enrollment candidates are historical paid registration records, not proof of current attendance or active billing. Review names, parent emails, and pauses before saving. Private lessons and make-ups need staff placement.</p><div id="roster-rows"></div><div class="actions"><button class="secondary" data-action="import">Add enrollment candidates (${manager.candidates.length})</button><button class="secondary" data-action="add">Add a student</button><button class="primary" data-action="save-roster">Save reviewed roster</button></div></section></div>`;
    renderRoster();
  }
  async function loadClasses(){clearTimeout(timer);queryVersion++;cls=null;selected=null;manager=null;const d=await api("classes");date=d.date;classes=d.classes;homeworkEnabled=d.homeworkEnabled;screen="classes";render();}
  async function loadManager(){manager=await api("manage",{classId:cls.id});screen="manage";render();}
  app.addEventListener("submit",async ev=>{
    ev.preventDefault();if(busy)return;busy=true;const submit=ev.target.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
    try{
      const data=new FormData(ev.target);
      if(ev.target.id==="unlock-form"){
        const d=await api("unlock",{password:data.get("password"),scope:mode});
        ev.target.reset();document.querySelector("#notice").style.display="none";token=d.token;scope=d.scope;date=d.date;
        clearTimeout(sessionTimer);sessionTimer=setTimeout(reset,Math.max(0,d.expires*1000-Date.now()));await loadClasses();
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
      if(action==="pick"){selected={id:btn.dataset.id,name:btn.dataset.name};queryVersion++;screen="confirm";render();}
      if(action==="confirm"){const r=await api("checkin",{classId:cls.id,studentId:selected.id});selected={...selected,...r};screen="success";render();timer=setTimeout(()=>loadClasses().catch(err=>notice(err.message,true)),8000);}
      if(action==="refresh")await loadManager();
      if(action==="attendance"){await api("attendance",{classId:cls.id,studentId:btn.dataset.id,present:btn.dataset.present==="true"});await loadManager();}
      if(action==="add"){readRoster();manager.students.push({name:"",email:"",active:true});renderRoster();}
      if(action==="import"){readRoster();const ids=new Set(manager.students.map(s=>s.id));for(const s of manager.candidates)if(!ids.has(s.id))manager.students.push({...s,active:true});renderRoster();notice("Review candidates, then save the roster.");}
      if(action==="save-roster"){readRoster();await api("roster",{classId:cls.id,students:manager.students});notice("Reviewed roster saved.");await loadManager();}
      if(action==="export"){
        const cell=v=>'"'+String(v??"").replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
        const rows=[["Class date","Class","Student","Status","Arrival (New York)"],...manager.students.map(s=>{const a=manager.attendance.find(a=>a.studentId===s.id&&a.present);return[date,cls.title,s.name,a?"Present":"Not checked in",a?timeLabel(a.at):""];})];
        const url=URL.createObjectURL(new Blob([rows.map(r=>r.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`somath-attendance-${date}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    }catch(err){notice(err.message,true);}finally{busy=false;btn.disabled=false;}
  });
  app.addEventListener("change",async ev=>{if(ev.target.id==="class-date"){date=ev.target.value;try{await loadClasses();}catch(err){notice(err.message,true);}}});
  let debounce;
  app.addEventListener("input",ev=>{
    if(ev.target.id!=="student-search")return;
    clearTimeout(debounce);const version=++queryVersion,q=ev.target.value;
    if(q.trim().length<2){document.querySelector("#results").innerHTML='<p class="helper">Type at least two letters.</p>';return;}
    document.querySelector("#results").textContent="Looking for your name…";
    debounce=setTimeout(async()=>{
      try{
        const d=await api("search",{classId:cls.id,query:q});if(version!==queryVersion||screen!=="search")return;
        document.querySelector("#results").innerHTML=d.students.map(s=>`<button class="result" data-action="pick" data-id="${e(s.id)}" data-name="${e(s.name)}"><span>${e(s.name)}</span><span aria-hidden="true">→</span></button>`).join("")||'<p class="empty">No matching name in this class. Please ask your teacher to check the roster.</p>';
      }catch(err){if(version===queryVersion)notice(err.message,true);}
    },250);
  });
  lock.addEventListener("click",reset);
  ["pointerdown","keydown"].forEach(type=>document.addEventListener(type,()=>{clearTimeout(idle);if(scope==="kiosk"&&token)idle=setTimeout(()=>loadClasses().catch(()=>reset()),60000);}));
  if(config.demo){const banner=document.querySelector("#preview-banner");banner.hidden=false;banner.textContent="INTERACTIVE PREVIEW · Fictional students only · Password: demo · No emails are sent";}
  render();
})();
