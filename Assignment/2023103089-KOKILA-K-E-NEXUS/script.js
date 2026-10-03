const state = {
  tasks: [
    { id:1, name:'Complete AI integration', priority:'high', due:'2026-04-20', done:false },
    { id:2, name:'Review project proposal', priority:'medium', due:'2026-04-22', done:true },
    { id:3, name:'Update documentation', priority:'low', due:'2026-04-25', done:false },
  ],
  notes: [
    { id:1, title:'Meeting Notes', content:'Discussed Q3 roadmap and agent architecture decisions.', date:'Apr 1' },
    { id:2, title:'AI Research', content:'Gemini 1.5 Pro supports 1M token context window — ideal for knowledge retrieval.', date:'Apr 2' },
    { id:3, title:'Design Thoughts', content:'Glassmorphism + neon accents work well for futuristic SaaS dashboards.', date:'Apr 3' },
    { id:4, title:'Project Ideas', content:'Multi-agent system with specialized agents per domain seems most scalable.', date:'Apr 4' },
  ],
  knowledge: [
    { id:1, title:'Gemini API Setup', content:'Use google-generativeai Python SDK. Set GOOGLE_API_KEY env variable before initializing.', tags:['gemini','api','setup'] },
    { id:2, title:'FastAPI Best Practices', content:'Use async endpoints, Pydantic models for validation, and dependency injection for shared services.', tags:['fastapi','python','backend'] },
  ],
  events: [
    { id:1, title:'Team Standup', date:'2026-04-07', time:'10:00 AM' },
    { id:2, title:'Product Demo', date:'2026-04-09', time:'2:00 PM' },
  ],
};

const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove', e => {
  mx=e.clientX; my=e.clientY;
  cursor.style.left=(mx-6)+'px'; cursor.style.top=(my-6)+'px';
});
(function animRing(){
  rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12;
  cursorRing.style.left=(rx-20)+'px'; cursorRing.style.top=(ry-20)+'px';
  requestAnimationFrame(animRing);
})();

(function(){
  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0,0,5);
  scene.add(new THREE.AmbientLight(0x001133,2));
  const l1=new THREE.PointLight(0x00d4ff,4,20); l1.position.set(3,3,3); scene.add(l1);
  const l2=new THREE.PointLight(0x7c3aed,3,20); l2.position.set(-3,-2,2); scene.add(l2);
  const l3=new THREE.PointLight(0x00ff9d,2,15); l3.position.set(0,4,-2); scene.add(l3);
  const sphere=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,4),new THREE.MeshPhongMaterial({color:0x001a33,emissive:0x001133,shininess:100,transparent:true,opacity:0.9}));
  scene.add(sphere);
  const wSphere=new THREE.Mesh(new THREE.IcosahedronGeometry(1.22,2),new THREE.MeshBasicMaterial({color:0x00d4ff,wireframe:true,transparent:true,opacity:0.12}));
  scene.add(wSphere);
  const ring1=new THREE.Mesh(new THREE.TorusGeometry(2.2,0.015,8,120),new THREE.MeshBasicMaterial({color:0x00d4ff,transparent:true,opacity:0.3}));
  ring1.rotation.x=Math.PI/4; scene.add(ring1);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.8,0.01,8,100),new THREE.MeshBasicMaterial({color:0xa855f7,transparent:true,opacity:0.25}));
  ring2.rotation.x=-Math.PI/3; ring2.rotation.y=Math.PI/6; scene.add(ring2);
  const nodes=[];
  const nodeGeo=new THREE.SphereGeometry(0.04,8,8);
  for(let i=0;i<30;i++){
    const theta=Math.random()*Math.PI*2, phi=Math.random()*Math.PI, r=2.5+Math.random()*1.5;
    const n=new THREE.Mesh(nodeGeo,new THREE.MeshBasicMaterial({color:i%3===0?0x00d4ff:i%3===1?0xa855f7:0x00ff9d,transparent:true,opacity:0.7}));
    n.position.set(r*Math.sin(phi)*Math.cos(theta),r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi));
    n._theta=theta; n._phi=phi; n._r=r; n._speed=0.001+Math.random()*0.002;
    scene.add(n); nodes.push(n);
  }
  const lineMat=new THREE.LineBasicMaterial({color:0x00d4ff,transparent:true,opacity:0.06});
  for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++)
    if(nodes[i].position.distanceTo(nodes[j].position)<2)
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([nodes[i].position.clone(),nodes[j].position.clone()]),lineMat));
  let mouse={x:0,y:0};
  document.addEventListener('mousemove',e=>{mouse.x=(e.clientX/window.innerWidth-.5)*2;mouse.y=-(e.clientY/window.innerHeight-.5)*2;});
  window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
  let t=0;
  (function animate(){
    requestAnimationFrame(animate); t+=0.008;
    sphere.rotation.y=t*.3; sphere.rotation.x=t*.1;
    wSphere.rotation.y=-t*.2; wSphere.rotation.z=t*.15;
    ring1.rotation.z=t*.4; ring2.rotation.y=t*.3;
    l1.position.x=Math.sin(t)*4; l1.position.z=Math.cos(t)*4;
    l2.position.x=Math.sin(t+2)*3; l2.position.y=Math.cos(t+2)*3;
    nodes.forEach(n=>{n._theta+=n._speed;n.position.x=n._r*Math.sin(n._phi)*Math.cos(n._theta);n.position.z=n._r*Math.sin(n._phi)*Math.sin(n._theta);});
    camera.position.x+=(mouse.x*.8-camera.position.x)*.04;
    camera.position.y+=(mouse.y*.6-camera.position.y)*.04;
    camera.lookAt(0,0,0); renderer.render(scene,camera);
  })();
})();

const features = [
  { icon:'🤖', color:'rgba(0,212,255,0.15)', title:'Task Agent', desc:'Intelligent task creation, prioritization, and tracking. Never miss a deadline with AI-powered reminders.', tag:'POST /add-task' },
  { icon:'📝', color:'rgba(124,58,237,0.15)', title:'Notes Agent', desc:'Capture, organize, and retrieve notes with semantic search. Your second brain, powered by AI.', tag:'POST /add-note' },
  { icon:'📅', color:'rgba(0,255,157,0.15)', title:'Calendar Agent', desc:'Smart scheduling that understands context. Book meetings with natural language commands.', tag:'POST /add-event' },
  { icon:'🧠', color:'rgba(255,107,53,0.15)', title:'Knowledge Agent', desc:'Build a queryable knowledge base from any information. Retrieve insights in seconds.', tag:'POST /add-knowledge' },
  { icon:'🌦️', color:'rgba(255,215,0,0.15)', title:'Weather Agent', desc:'Real-time weather data integrated directly into your productivity workflow.', tag:'GET /weather' },
  { icon:'⚡', color:'rgba(255,45,120,0.15)', title:'Router Agent', desc:'Master coordinator that understands intent and routes commands to the right specialist agent.', tag:'POST /ai-command' },
];
const fg = document.getElementById('features-grid');
features.forEach((f,i)=>{
  const el=document.createElement('div'); el.className='feature-card'; el.style.animationDelay=(i*.1)+'s';
  el.innerHTML=`<div class="feature-icon" style="background:${f.color}">${f.icon}</div><div class="feature-title">${f.title}</div><div class="feature-desc">${f.desc}</div><div class="feature-tag">${f.tag}</div>`;
  fg.appendChild(el);
});

[{name:'Task Agent',color:'#00d4ff'},{name:'Notes Agent',color:'#a855f7'},{name:'Calendar Agent',color:'#00ff9d'},
 {name:'Knowledge Agent',color:'#ff6b35'},{name:'Weather Agent',color:'#ffd700'},{name:'Router Agent',color:'#ff2d78'}]
.forEach(p=>{
  const el=document.createElement('div'); el.className='agent-pill';
  el.innerHTML=`<span class="agent-pill-dot" style="background:${p.color}"></span>${p.name}`;
  document.getElementById('agent-pills').appendChild(el);
});

function animateCounter(el,target,suffix=''){
  let v=0; const step=target/60;
  const iv=setInterval(()=>{ v=Math.min(v+step,target); el.textContent=Math.floor(v)+suffix; if(v>=target)clearInterval(iv); },25);
}
new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      animateCounter(document.getElementById('sv1'),state.tasks.length+1200,'+');
      animateCounter(document.getElementById('sv2'),state.notes.length+840,'+');
      animateCounter(document.getElementById('sv3'),state.events.length+600,'+');
      animateCounter(document.getElementById('sv4'),state.knowledge.length+300,'+');
    }
  });
},{threshold:0.3}).observe(document.getElementById('stats'));

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');

function addMessage(role, text){
  const msg=document.createElement('div'); msg.className=`msg ${role}`;
  msg.innerHTML=`<div class="msg-avatar">${role==='ai'?'🤖':'👤'}</div><div class="msg-bubble">${text}</div>`;
  chatMessages.appendChild(msg); chatMessages.scrollTop=chatMessages.scrollHeight;
}
function showTyping(){
  const t=document.createElement('div'); t.className='msg ai'; t.id='typing';
  t.innerHTML=`<div class="msg-avatar">🤖</div><div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  chatMessages.appendChild(t); chatMessages.scrollTop=chatMessages.scrollHeight; return t;
}

function processCommandLocal(cmd){
  const c=cmd.toLowerCase().trim();
  if(c.startsWith('add task ')){
    const name=cmd.slice(9);
    state.tasks.unshift({id:Date.now(),name,priority:'medium',due:'',done:false});
    renderTasks(); updateDashboard();
    return `✅ Task added: "${name}" — ${state.tasks.filter(t=>!t.done).length} active tasks.`;
  }
  if(c.startsWith('add note ')){
    const content=cmd.slice(9);
    state.notes.unshift({id:Date.now(),title:'Quick Note',content,date:new Date().toLocaleDateString('en',{month:'short',day:'numeric'})});
    renderNotes(); updateDashboard();
    return `📝 Note saved: "${content.slice(0,50)}..."`;
  }
  if(c.startsWith('schedule ')||c.startsWith('add event ')){
    const title=c.startsWith('schedule ')?cmd.slice(9):cmd.slice(10);
    state.events.push({id:Date.now(),title,date:'2026-04-10',time:'3:00 PM'});
    updateDashboard();
    return `📅 Event scheduled: "${title}"`;
  }
  if(c.includes('show tasks')||c.includes('list tasks')){
    const active=state.tasks.filter(t=>!t.done);
    return `📋 ${active.length} active tasks:\n${active.map((t,i)=>`${i+1}. ${t.name}`).join('\n')||'None yet.'}`;
  }
  if(c.includes('weather')) return `🌦️ 24°C, Partly Cloudy. Humidity 68%, Wind 12 km/h.`;
  if(c.includes('help')) return `🤖 Commands:\n• add task [name]\n• add note [text]\n• schedule [event]\n• show tasks\n• weather`;
  return `🤖 Try: "add task [name]", "add note [text]", "schedule [event]", "weather", "show tasks"`;
}

async function sendChat(){
  const text=chatInput.value.trim(); if(!text) return;
  addMessage('user',text); chatInput.value='';
  const typing=showTyping();
  try {
    const res=await fetch('/ai-command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:text})});
    typing.remove();
    if(res.ok){ const data=await res.json(); addMessage('ai',data.response); if(data.data) refreshState(); }
    else { addMessage('ai',processCommandLocal(text)); }
  } catch(e) { typing.remove(); addMessage('ai',processCommandLocal(text)); }
}

async function refreshState(){
  try {
    const [t,n,ev,k]=await Promise.all([
      fetch('/tasks').then(r=>r.json()),fetch('/notes').then(r=>r.json()),
      fetch('/events').then(r=>r.json()),fetch('/knowledge').then(r=>r.json()),
    ]);
    if(t.tasks) state.tasks=t.tasks;
    if(n.notes) state.notes=n.notes;
    if(ev.events) state.events=ev.events;
    if(k.knowledge) state.knowledge=k.knowledge;
    renderTasks(); renderNotes(); renderKnowledge(); updateDashboard();
  } catch(e){}
}

document.getElementById('chat-send').addEventListener('click',sendChat);
chatInput.addEventListener('keypress',e=>{ if(e.key==='Enter') sendChat(); });

[{role:'ai',text:'Hello! I\'m NEXUS, your multi-agent AI assistant. 6 specialized agents are ready.',delay:0},
 {role:'user',text:'add task review project proposal',delay:800},
 {role:'ai',text:`✅ Task added: "Review project proposal" — Medium priority. ${state.tasks.length} total tasks.`,delay:1600}]
.forEach(m=>setTimeout(()=>addMessage(m.role,m.text),m.delay));

function buildDashboard(){
  const grid=document.getElementById('dashboard-grid'); grid.innerHTML='';
  const active=state.tasks.filter(t=>!t.done).length;
  const tc=document.createElement('div'); tc.className='dash-card featured';
  tc.innerHTML=`<div class="dash-card-label"><span>TASKS OVERVIEW</span><span style="color:var(--green)">● LIVE</span></div>
    <div class="dash-stat cyan">${active}</div>
    <div style="color:var(--text2);font-size:13px;margin:8px 0 20px;">Active of ${state.tasks.length} total</div>
    <div class="task-list">${state.tasks.slice(0,5).map(t=>`
      <div class="task-item">
        <div class="task-check ${t.done?'done':'pending'}">${t.done?'✓':''}</div>
        <span style="font-size:13px;${t.done?'text-decoration:line-through;color:var(--text3)':''}">${t.name}</span>
        <span class="task-pri ${t.priority==='high'?'pri-high':t.priority==='medium'?'pri-med':'pri-low'}">${t.priority.toUpperCase()}</span>
      </div>`).join('')}</div>`; grid.appendChild(tc);
  const nc=document.createElement('div'); nc.className='dash-card';
  nc.innerHTML=`<div class="dash-card-label">NOTES STORED</div><div class="dash-stat purple">${state.notes.length}</div>
    <div style="color:var(--text2);font-size:13px;margin-top:8px;">Notes in base</div>
    <div class="mini-chart">${[60,45,80,55,90,70,85].map(h=>`<div class="bar" style="height:${h}%"></div>`).join('')}</div>`; grid.appendChild(nc);
  const ec=document.createElement('div'); ec.className='dash-card';
  ec.innerHTML=`<div class="dash-card-label">CALENDAR</div><div class="dash-stat green">${state.events.length}</div>
    <div style="color:var(--text2);font-size:13px;margin-top:8px;">Upcoming events</div>
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">${state.events.map(ev=>`<div style="font-size:12px;color:var(--text2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:var(--font-mono);">📅 ${ev.title}</div>`).join('')}</div>`; grid.appendChild(ec);
  const wc=document.createElement('div'); wc.className='dash-card';
  wc.innerHTML=`<div class="dash-card-label">WEATHER</div>
    <div class="weather-widget"><div class="weather-main"><div class="weather-icon">⛅</div><div><div class="weather-temp">24°C</div><div style="color:var(--text2);font-size:13px;">Partly Cloudy</div></div></div>
    <div class="weather-details"><span>💧 68%</span><span>💨 12 km/h</span><span>👁 10 km</span></div></div>`; grid.appendChild(wc);
  const kc=document.createElement('div'); kc.className='dash-card';
  kc.innerHTML=`<div class="dash-card-label">KNOWLEDGE BASE</div>
    <div class="dash-stat" style="background:linear-gradient(135deg,var(--orange),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${state.knowledge.length}</div>
    <div style="color:var(--text2);font-size:13px;margin-top:8px;">Items stored</div>
    <div style="margin-top:16px;">${state.knowledge.slice(0,2).map(k=>`<div style="font-size:12px;color:var(--text3);margin-bottom:8px;font-family:var(--font-mono);">📚 ${k.title}</div>`).join('')}</div>`; grid.appendChild(kc);
}
function updateDashboard(){ buildDashboard(); }
buildDashboard();

function renderTasks(){
  const list=document.getElementById('tasks-list');
  document.getElementById('task-count').textContent=state.tasks.length;
  if(!state.tasks.length){ list.innerHTML=`<div class="empty-state"><div class="empty-icon">📋</div>No tasks yet.</div>`; return; }
  list.innerHTML=state.tasks.map(t=>`
    <div class="task-card ${t.done?'done-card':''}" id="tc-${t.id}">
      <div class="task-check ${t.done?'done':'pending'}" onclick="toggleTask(${t.id})">${t.done?'✓':''}</div>
      <div class="task-body"><div class="task-name">${t.name}</div><div class="task-meta">${t.due?'Due: '+t.due:''} ${t.due&&t.priority?'·':''} ${t.priority?t.priority.toUpperCase():''}</div></div>
      <span class="task-pri ${t.priority==='high'?'pri-high':t.priority==='medium'?'pri-med':'pri-low'}">${t.priority.toUpperCase()}</span>
      <button class="task-del" onclick="deleteTask(${t.id})">✕</button>
    </div>`).join('');
}
async function addTask(){
  const name=document.getElementById('task-name').value.trim();
  if(!name){ showToast('⚠️','Please enter a task name'); return; }
  const priority=document.getElementById('task-priority').value;
  const due=document.getElementById('task-due').value;
  try {
    const res=await fetch('/add-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,priority,due})});
    if(res.ok){ const data=await res.json(); state.tasks.unshift(data.task); }
    else throw new Error();
  } catch(e){ state.tasks.unshift({id:Date.now(),name,priority,due,done:false}); }
  document.getElementById('task-name').value='';
  renderTasks(); updateDashboard(); showToast('✅',`Task "${name}" added!`);
}
function toggleTask(id){ const t=state.tasks.find(t=>t.id===id); if(t){t.done=!t.done;renderTasks();updateDashboard();} }
function deleteTask(id){ state.tasks=state.tasks.filter(t=>t.id!==id); renderTasks(); updateDashboard(); showToast('🗑️','Task deleted'); }
renderTasks();

function renderNotes(){
  const grid=document.getElementById('notes-grid');
  if(!state.notes.length){ grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📝</div>No notes yet.</div>`; return; }
  grid.innerHTML=state.notes.map(n=>`
    <div class="note-card">
      <button class="card-del-btn" onclick="deleteNote(${n.id})">✕</button>
      <div class="note-title">${n.title}</div>
      <div class="note-content">${n.content}</div>
      <div class="note-date">${n.date}</div>
    </div>`).join('');
}

async function deleteNote(id){
  state.notes = state.notes.filter(n => n.id !== id);
  renderNotes(); updateDashboard();
  try { await fetch(`/notes/${id}`, {method:'DELETE'}); } catch(e){}
  showToast('🗑️','Note deleted');
}
async function addNote(){
  const title=document.getElementById('note-title').value.trim();
  const content=document.getElementById('note-content').value.trim();
  if(!content){ showToast('⚠️','Please enter note content'); return; }
  try {
    const res=await fetch('/add-note',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title||'Quick Note',content})});
    if(res.ok){ const data=await res.json(); state.notes.unshift(data.note); }
    else throw new Error();
  } catch(e){ state.notes.unshift({id:Date.now(),title:title||'Quick Note',content,date:new Date().toLocaleDateString('en',{month:'short',day:'numeric'})}); }
  document.getElementById('note-title').value=''; document.getElementById('note-content').value='';
  renderNotes(); updateDashboard(); showToast('📝','Note saved!');
}
renderNotes();

function renderKnowledge(){
  const list=document.getElementById('kb-list');
  if(!state.knowledge.length){ list.innerHTML=`<div class="empty-state"><div class="empty-icon">🧠</div>Knowledge base empty.</div>`; return; }
  list.innerHTML=state.knowledge.map(k=>`
    <div class="kb-item">
      <button class="card-del-btn" onclick="deleteKnowledge(${k.id})">✕</button>
      <div class="kb-title">${k.title}</div>
      <div class="kb-content">${k.content}</div>
      <div class="kb-tags">${k.tags.map(tag=>`<span class="kb-tag">${tag}</span>`).join('')}</div>
    </div>`).join('');
}

async function deleteKnowledge(id){
  state.knowledge = state.knowledge.filter(k => k.id !== id);
  renderKnowledge(); updateDashboard();
  try { await fetch(`/knowledge/${id}`, {method:'DELETE'}); } catch(e){}
  showToast('🗑️','Knowledge item deleted');
}
async function addKnowledge(){
  const title=document.getElementById('kb-title').value.trim();
  const content=document.getElementById('kb-content').value.trim();
  const tags=document.getElementById('kb-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  if(!title||!content){ showToast('⚠️','Fill in topic and knowledge'); return; }
  try {
    const res=await fetch('/add-knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,content,tags})});
    if(res.ok){ const data=await res.json(); state.knowledge.unshift(data.item); }
    else throw new Error();
  } catch(e){ state.knowledge.unshift({id:Date.now(),title,content,tags}); }
  document.getElementById('kb-title').value=''; document.getElementById('kb-content').value=''; document.getElementById('kb-tags').value='';
  renderKnowledge(); updateDashboard(); showToast('🧠','Knowledge stored!');
}
renderKnowledge();

function showToast(icon,msg){
  const ex=document.querySelector('.toast'); if(ex) ex.remove();
  const t=document.createElement('div'); t.className='toast';
  t.innerHTML=`<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .4s'; t.style.opacity='0'; setTimeout(()=>t.remove(),400); },3000);
}

document.querySelectorAll('.feature-card,.step,.dash-card').forEach(el=>{
  el.style.opacity='0';
  new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.style.animation='fadeUp .7s ease forwards'; });
  },{threshold:0.1}).observe(el);
});

for(let i=0;i<15;i++){
  const p=document.createElement('div'); p.className='particle';
  const size=2+Math.random()*4;
  p.style.cssText=`width:${size}px;height:${size}px;left:${Math.random()*100}vw;animation-duration:${8+Math.random()*12}s;animation-delay:${Math.random()*8}s;`;
  document.body.appendChild(p);
}

const users = JSON.parse(localStorage.getItem('nexus_users') || '[]');

function saveUsers() { localStorage.setItem('nexus_users', JSON.stringify(users)); }

function openModal(type) {
  document.getElementById('auth-modal').classList.add('open');
  switchModal(type);
}
function closeModal() {
  document.getElementById('auth-modal').classList.remove('open');
  clearAllErrors();
}
function closeModalOutside(e) {
  if (e.target.id === 'auth-modal') closeModal();
}
function switchModal(type) {
  document.getElementById('modal-signin').style.display = type === 'signin' ? 'block' : 'none';
  document.getElementById('modal-signup').style.display = type === 'signup' ? 'block' : 'none';
  clearAllErrors();
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErr(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
  const input = el && el.previousElementSibling;
  if (input) input.classList.remove('error');
}
function clearAllErrors() {
  ['signin-email-err','signin-pass-err','signin-form-err',
   'signup-name-err','signup-email-err','signup-pass-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  document.querySelectorAll('.input-field').forEach(el => el.classList.remove('error'));
}
function markError(inputId, errId, msg) {
  const input = document.getElementById(inputId);
  if (input) input.classList.add('error');
  showErr(errId, msg);
}

const VALID_TLDS = new Set([
  'com','net','org','edu','gov','io','co','in','uk','us','ca','au','de','fr',
  'jp','cn','br','mx','ru','it','es','nl','se','no','dk','fi','pl','pt','be',
  'ch','at','nz','sg','hk','ae','sa','za','ng','ke','gh','pk','bd','lk','np',
  'info','biz','app','dev','ai','tech','online','store','shop','site','web',
  'me','tv','cc','xyz','pro','inc','ltd','llc','club','live','news','media',
  'email','mail','cloud','digital','agency','studio','design','blog','page'
]);

const KNOWN_PROVIDERS = new Set([
  'gmail.com','yahoo.com','outlook.com','hotmail.com','live.com','icloud.com',
  'me.com','mac.com','protonmail.com','proton.me','zoho.com','aol.com',
  'yandex.com','yandex.ru','mail.com','gmx.com','gmx.net','fastmail.com',
  'tutanota.com','hey.com','pm.me','rediffmail.com','yahoo.in','yahoo.co.in',
  'yahoo.co.uk','yahoo.co.jp','outlook.in','hotmail.co.uk','hotmail.in',
  'msn.com','windowslive.com','live.in','live.co.uk','googlemail.com'
]);

function isValidEmail(email) {
  if (!email || /\s/.test(email)) return false;
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) return false;
  const [local, domain] = email.split('@');
  if (!local || local.length < 1) return false;
  if (!domain || !domain.includes('.')) return false;
  const parts = domain.split('.');
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1].toLowerCase();
  if (!tld || tld.length < 2) return false;
  if (!VALID_TLDS.has(tld)) return false;
  if (!KNOWN_PROVIDERS.has(domain.toLowerCase())) return false;
  if (!/^[a-zA-Z0-9._%+\-]+$/.test(local)) return false;
  return true;
}

function getEmailError(email) {
  if (!email) return 'Email is required.';
  if (/\s/.test(email)) return 'Email cannot contain spaces.';
  if (!email.includes('@')) return 'Missing "@" — e.g. name@gmail.com';
  const atCount = (email.match(/@/g) || []).length;
  if (atCount > 1) return 'Email can only have one "@".';
  const [local, domain] = email.split('@');
  if (!local) return 'Missing username before "@".';
  if (!domain) return 'Missing domain — e.g. gmail.com';
  if (!domain.includes('.')) return 'Domain must have a "." — e.g. gmail.com';
  const parts = domain.split('.');
  const tld = parts[parts.length - 1].toLowerCase();
  if (!tld || tld.length < 2) return 'Invalid domain extension.';
  if (!VALID_TLDS.has(tld)) return `".${tld}" is not a recognised domain extension.`;
  if (!KNOWN_PROVIDERS.has(domain.toLowerCase())) return `"${domain}" is not a recognised email provider. Use gmail.com, yahoo.com, outlook.com etc.`;
  if (!/^[a-zA-Z0-9._%+\-]+$/.test(local)) return 'Email contains invalid characters.';
  return 'Invalid email format — e.g. name@gmail.com';
}

function handleSignIn() {
  clearAllErrors();
  const email = document.getElementById('signin-email').value.trim();
  const pass  = document.getElementById('signin-password').value;
  let valid = true;

  if (!email) {
    markError('signin-email', 'signin-email-err', 'Email is required.');
    valid = false;
  } else if (!isValidEmail(email)) {
    markError('signin-email', 'signin-email-err', getEmailError(email));
    valid = false;
  }
  if (!pass) {
    markError('signin-password', 'signin-pass-err', 'Password is required.');
    valid = false;
  } else if (pass.length < 6) {
    markError('signin-password', 'signin-pass-err', 'Password must be at least 6 characters.');
    valid = false;
  }
  if (!valid) return;

  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) {
    markError('signin-email', 'signin-email-err', 'No account found with this email. Sign up first.');
    return;
  }
  if (user.password !== pass) {
    markError('signin-password', 'signin-pass-err', 'Incorrect password. Try again.');
    return;
  }
  closeModal();
  setLoggedInUser(user);
  showToast('✅', `Welcome back, ${user.name}!`);
}

function handleSignUp() {
  clearAllErrors();
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-password').value;
  let valid = true;

  if (!name) {
    markError('signup-name', 'signup-name-err', 'Full name is required.');
    valid = false;
  }
  if (!email) {
    markError('signup-email', 'signup-email-err', 'Email is required.');
    valid = false;
  } else if (!isValidEmail(email)) {
    markError('signup-email', 'signup-email-err', getEmailError(email));
    valid = false;
  } else if (users.find(u => u.email === email.toLowerCase())) {
    markError('signup-email', 'signup-email-err', 'An account with this email already exists.');
    valid = false;
  }
  if (!pass) {
    markError('signup-password', 'signup-pass-err', 'Password is required.');
    valid = false;
  } else if (pass.length < 6) {
    markError('signup-password', 'signup-pass-err', 'Password must be at least 6 characters.');
    valid = false;
  }
  if (!valid) return;

  const newUser = { name, email: email.toLowerCase(), password: pass };
  users.push(newUser);
  saveUsers();
  closeModal();
  setLoggedInUser(newUser);
  showToast('🚀', `Account created! Welcome, ${name}!`);
}

function setLoggedInUser(user) {
  document.getElementById('nav-auth-btn').style.display = 'none';
  const navUser = document.getElementById('nav-user');
  navUser.style.display = 'flex';
  document.getElementById('nav-avatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('nav-username').textContent = user.name.split(' ')[0];
}

function handleLogout() {
  document.getElementById('nav-auth-btn').style.display = '';
  document.getElementById('nav-user').style.display = 'none';
  showToast('👋', 'Signed out successfully.');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
