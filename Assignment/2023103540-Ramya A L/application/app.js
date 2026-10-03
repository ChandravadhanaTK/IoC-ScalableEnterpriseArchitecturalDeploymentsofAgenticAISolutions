const todayKey = new Date().toISOString().slice(0, 10);
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
document.querySelector("#today-date").textContent = dateFmt.format(new Date());

const seedTasks = [
  { id: "seed-1", title: "Review lecture notes for data structures", subject: "Computer Science", due: "today", done: false, priority: true, created: 1 },
  { id: "seed-2", title: "Finish problem set 4", subject: "Mathematics", due: "today", done: false, priority: true, created: 2 },
  { id: "seed-3", title: "Read chapter 6 and make summary cards", subject: "Biology", due: "tomorrow", done: false, priority: false, created: 3 },
  { id: "seed-4", title: "Draft introduction for lab report", subject: "Writing", due: "week", done: true, priority: false, created: 4 }
];
const savedTasks = localStorage.getItem("studypilot.tasks");
let tasks = savedTasks ? JSON.parse(savedTasks) : seedTasks;
let activeFilter = "all";
let focusMinutes = Number(localStorage.getItem("studypilot.focusMinutes") || 0);
let secondsLeft = 25 * 60;
let timerInterval = null;
let timerMode = "focus";
const taskList = document.querySelector("#task-list");
const dialog = document.querySelector("#task-dialog");
const toast = document.querySelector("#toast");
let toastTimer;

function safeText(text) { return String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function persist() { localStorage.setItem("studypilot.tasks", JSON.stringify(tasks)); }
function notify(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2700); }
function dueLabel(due) { return due === "today" ? "Due today" : due === "tomorrow" ? "Due tomorrow" : "Due this week"; }
function visibleTasks() {
  const query = document.querySelector("#task-search").value.trim().toLowerCase();
  return tasks.filter(task => {
    const filterMatch = activeFilter === "today" ? task.due === "today" && !task.done : activeFilter === "completed" ? task.done : true;
    return filterMatch && `${task.title} ${task.subject}`.toLowerCase().includes(query);
  }).sort((a, b) => Number(a.done) - Number(b.done) || Number(b.priority) - Number(a.priority) || a.created - b.created);
}
function render() {
  const filtered = visibleTasks();
  taskList.innerHTML = filtered.length ? filtered.map(task => `<div class="task-row ${task.done ? "is-done" : ""}" data-id="${safeText(task.id)}"><button class="check-task" data-action="complete" aria-label="${task.done ? "Mark incomplete" : "Mark complete"}" aria-pressed="${task.done}">${task.done ? "✓" : ""}</button><div class="task-main"><span class="task-name">${safeText(task.title)}</span><span class="task-meta"><span class="subject-tag">${safeText(task.subject)}</span><span class="due-tag ${task.due === "week" ? "later" : ""}">${dueLabel(task.due)}</span></span></div>${task.priority && !task.done ? '<span class="priority-mark" title="Priority">✦</span>' : ""}<button class="delete-task" data-action="delete" aria-label="Delete task">×</button></div>`).join("") : `<div class="empty">${tasks.length ? "No tasks match this view. Try another filter or search." : "Your plan is clear. Add a task to get started."}</div>`;
  const open = tasks.filter(task => !task.done).length;
  const dueToday = tasks.filter(task => !task.done && task.due === "today").length;
  const doneToday = tasks.filter(task => task.done && task.completedOn === todayKey).length;
  document.querySelector("#task-count").textContent = `${filtered.length} ${filtered.length === 1 ? "task" : "tasks"}`;
  document.querySelector("#today-count").textContent = dueToday;
  document.querySelector("#stat-total").textContent = open;
  document.querySelector("#stat-done").textContent = doneToday;
  document.querySelector("#focus-minutes").textContent = focusMinutes;
  document.querySelector("#hero-complete").textContent = tasks.filter(task => task.done).length;
  document.querySelector("#progress-message").textContent = doneToday ? "Look at you go — keep it up" : "Your next win is waiting";
  document.querySelectorAll(".nav-link,.filter-chip").forEach(el => el.classList.toggle("selected", el.classList.contains("nav-link") && el.dataset.filter === activeFilter));
  document.querySelectorAll(".filter-chip").forEach(el => el.classList.toggle("active", el.dataset.filter === activeFilter));
  document.querySelector("#list-title").textContent = activeFilter === "today" ? "Due today" : activeFilter === "completed" ? "Completed tasks" : "Your study plan";
  document.querySelector("#list-subtitle").textContent = activeFilter === "today" ? "Keep your focus on what’s next." : activeFilter === "completed" ? "Look at all the progress you’ve made." : "A few good next steps, all in one place.";
  const completed = tasks.filter(task => task.done).length;
  document.querySelectorAll("#week-dots i").forEach((dot, index) => dot.classList.toggle("active", index < Math.min(completed, 7)));
}
function openTaskDialog() { dialog.showModal(); document.querySelector("#task-name").focus(); }
function addTask(event) {
  event.preventDefault();
  const name = document.querySelector("#task-name").value.trim();
  if (!name) return;
  const subject = document.querySelector("#task-subject").value;
  const due = document.querySelector("#task-due").value;
  tasks.push({ id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: name, subject, due, done: false, priority: false, created: Date.now() });
  persist(); activeFilter = "all"; render(); dialog.close(); event.currentTarget.reset(); notify("Added to your study plan. You’ve got this!");
}
function setFilter(filter) { activeFilter = filter; document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("selected", button.dataset.filter === filter)); render(); }
document.querySelectorAll(".nav-link").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
document.querySelectorAll(".filter-chip").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
document.querySelector("#task-list").addEventListener("click", event => {
  const button = event.target.closest("[data-action]"); if (!button) return;
  const row = button.closest(".task-row"); const task = tasks.find(item => item.id === row.dataset.id); if (!task) return;
  if (button.dataset.action === "complete") { task.done = !task.done; task.completedOn = task.done ? todayKey : null; persist(); render(); notify(task.done ? "Task complete. Take a moment to enjoy that." : "Task moved back to your plan."); }
  if (button.dataset.action === "delete") { tasks = tasks.filter(item => item.id !== task.id); persist(); render(); notify("Task removed from your plan."); }
});
document.querySelector("#task-search").addEventListener("input", render);
document.querySelector("#add-task").addEventListener("click", openTaskDialog);
document.querySelector("#add-inline").addEventListener("click", openTaskDialog);
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#task-form").addEventListener("submit", addTask);
document.querySelector("#filter-button").addEventListener("click", () => document.querySelector("#filters").classList.toggle("show"));
document.querySelector("#menu-toggle").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));

function paintTimer() { const min = Math.floor(secondsLeft / 60).toString().padStart(2, "0"); const sec = (secondsLeft % 60).toString().padStart(2, "0"); document.querySelector("#timer-display").textContent = `${min}:${sec}`; document.title = `${min}:${sec} · StudyPilot`; }
function stopTimer() { clearInterval(timerInterval); timerInterval = null; document.querySelector("#timer-ring").classList.remove("running"); document.querySelector("#timer-toggle").textContent = "Resume focus"; }
function runTimer() {
  if (timerInterval) { stopTimer(); return; }
  document.querySelector("#timer-toggle").textContent = "Pause session"; document.querySelector("#timer-ring").classList.add("running");
  timerInterval = setInterval(() => {
    secondsLeft--; paintTimer();
    if (secondsLeft <= 0) {
      stopTimer();
      if (timerMode === "focus") { focusMinutes += 25; localStorage.setItem("studypilot.focusMinutes", focusMinutes); timerMode = "break"; secondsLeft = 5 * 60; document.querySelector("#timer-mode").textContent = "BREAK"; document.querySelector("#timer-toggle").textContent = "Start break"; notify("Focus session complete! Your 5-minute break is ready."); }
      else { timerMode = "focus"; secondsLeft = 25 * 60; document.querySelector("#timer-mode").textContent = "MINUTES"; document.querySelector("#timer-toggle").textContent = "Start focus"; notify("Break complete. Ready for another focus session?"); }
      document.querySelector("#focus-minutes").textContent = focusMinutes; paintTimer();
    }
  }, 1000);
}
document.querySelector("#timer-toggle").addEventListener("click", runTimer);
document.querySelector("#focus-start").addEventListener("click", () => { document.querySelector("#timer-card")?.scrollIntoView({ behavior: "smooth", block: "center" }); if (!timerInterval) runTimer(); });
document.querySelector("#tip-focus").addEventListener("click", () => { if (!timerInterval) runTimer(); document.querySelector(".timer-card").scrollIntoView({ behavior: "smooth", block: "center" }); });
document.querySelector("#timer-reset").addEventListener("click", () => { stopTimer(); timerMode = "focus"; secondsLeft = 25 * 60; document.querySelector("#timer-mode").textContent = "MINUTES"; document.querySelector("#timer-toggle").textContent = "Start focus"; paintTimer(); notify("Focus timer reset."); });
document.querySelector("#short-break").addEventListener("click", () => { stopTimer(); timerMode = "break"; secondsLeft = 5 * 60; document.querySelector("#timer-mode").textContent = "BREAK"; document.querySelector("#timer-toggle").textContent = "Start break"; paintTimer(); runTimer(); });
render(); paintTimer();
