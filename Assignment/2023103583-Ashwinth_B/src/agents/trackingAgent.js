import { addItem, readDb, updateItem } from '../store.js';
import { id, now } from '../utils.js';

export function createApplication({ company, role, matchScore, missingSkills }) {
  const application = {
    id: id('app'), company: company || 'Demo Company', role: role || 'Software Engineer',
    matchScore: Number(matchScore) || 0, missingSkills: missingSkills || [],
    status: 'SAVED', deadline: '', createdAt: now(), updatedAt: now()
  };
  return addItem('applications', application);
}

export function updateApplication(idValue, patch) {
  return updateItem('applications', idValue, { ...patch, updatedAt: now() });
}

export function getApplications() {
  const db = readDb();
  return db.applications.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getReminders() {
  const apps = getApplications();
  const today = new Date();
  const reminders = [];
  for (const app of apps) {
    if (!app.deadline || ['OFFER', 'REJECTED'].includes(app.status)) continue;
    const deadline = new Date(`${app.deadline}T23:59:59`);
    const days = Math.ceil((deadline - today) / 86400000);
    if (days < 0) reminders.push({ type: 'OVERDUE', applicationId: app.id, message: `${app.company} application is overdue.` });
    else if (days <= 3) reminders.push({ type: 'UPCOMING', applicationId: app.id, message: `${app.company} application deadline is in ${days} day(s).` });
  }
  return reminders;
}
