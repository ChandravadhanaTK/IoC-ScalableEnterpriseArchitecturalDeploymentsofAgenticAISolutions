let latestResult = null;

const $ = (id) => document.getElementById(id);

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
  if (id === 'applications') loadApplications();
  if (id === 'monitoring') loadMonitoring();
}

document.querySelectorAll('[data-page]').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));

function chips(values) {
  return values.length ? values.map(v => `<span class="chip">${escapeHtml(v)}</span>`).join('') : '<span class="muted">None detected</span>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

$('runBtn').addEventListener('click', async () => {
  $('error').textContent = '';
  $('runBtn').disabled = true;
  $('pipelineState').textContent = 'PROCESSING';
  try {
    const response = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ resume:$('resume').value, jobDescription:$('job').value }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Pipeline failed');
    latestResult = data;
    $('pipelineState').textContent = data.state;
    $('results').classList.remove('hidden');
    $('score').textContent = `${data.match.score}%`;
    $('skillsCount').textContent = data.profile.skills.length;
    $('gapsCount').textContent = data.match.missingSkills.length;
    $('skills').innerHTML = chips(data.profile.skills);
    $('gaps').innerHTML = chips(data.match.missingSkills);
    $('summary').textContent = data.profile.profileSummary;
    $('matchExplanation').textContent = data.match.explanation;
    $('plan').innerHTML = data.preparationPlan.length ? data.preparationPlan.map(item => `<div class="plan-item"><strong>Week ${item.week}: ${escapeHtml(item.skill)}</strong><div>${item.topics.map(escapeHtml).join(' • ')}</div><ul>${item.tasks.map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul></div>`).join('') : '<p class="muted">No skill gap detected. You can still prepare using the job requirements.</p>';
  } catch (e) {
    $('error').textContent = e.message;
    $('pipelineState').textContent = 'FAILED';
  } finally { $('runBtn').disabled = false; }
});

$('approveBtn').addEventListener('click', async () => {
  if (!latestResult) return;
  const company = prompt('Company name:', 'Demo Company');
  if (!company) return;
  const role = prompt('Role:', 'Software Engineer');
  if (!role) return;
  const application = await fetch('/api/applications', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ company, role, matchScore:latestResult.match.score, missingSkills:latestResult.match.missingSkills }) }).then(r=>r.json());
  alert(`Application ${application.company} was created in SAVED state.`);
  showPage('applications');
});

async function loadApplications() {
  const data = await fetch('/api/applications').then(r=>r.json());
  $('appsBody').innerHTML = data.applications.length ? data.applications.map(app => `<tr><td>${escapeHtml(app.company)}</td><td>${escapeHtml(app.role)}</td><td>${app.matchScore}%</td><td><select class="status" onchange="updateStatus('${app.id}', this.value)">${['SAVED','APPLIED','OA','TECHNICAL','HR','OFFER','REJECTED'].map(s=>`<option ${s===app.status?'selected':''}>${s}</option>`).join('')}</select></td><td>${app.deadline || '—'}</td><td><input type="date" onchange="updateDeadline('${app.id}', this.value)" value="${app.deadline || ''}" /></td></tr>`).join('') : '<tr><td colspan="6" class="muted">No applications yet. Run the agent pipeline and approve a plan.</td></tr>';
  const rem = await fetch('/api/reminders').then(r=>r.json());
  $('reminders').innerHTML = rem.reminders.length ? rem.reminders.map(x=>`⚠ ${escapeHtml(x.message)}`).join('<br>') : 'No upcoming or overdue reminders.';
}

window.updateStatus = async (id, status) => { await fetch(`/api/applications/${id}`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})}); loadApplications(); };
window.updateDeadline = async (id, deadline) => { await fetch(`/api/applications/${id}`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({deadline})}); loadApplications(); };
$('refreshApps').addEventListener('click', loadApplications);

async function loadMonitoring() {
  const data = await fetch('/api/monitoring').then(r=>r.json());
  $('mRuns').textContent = data.health.totalRuns;
  $('mSuccess').textContent = `${data.health.successRate}%`;
  $('mApps').textContent = data.business.applications;
  $('mReminders').textContent = data.business.reminders;
  $('traces').innerHTML = data.traces.length ? data.traces.map(t => `<div class="trace"><div class="trace-head"><strong>${escapeHtml(t.status)}</strong><small>${escapeHtml(t.id)}</small></div><div class="muted">${t.steps.map(s=>escapeHtml(s.agent)).join(' → ') || 'No completed agent step'} · ${t.totalDurationMs} ms</div>${t.error ? `<div class="error">${escapeHtml(t.error)}</div>` : ''}</div>`).join('') : '<p class="muted">No agent executions yet.</p>';
}
$('refreshMonitor').addEventListener('click', loadMonitoring);
