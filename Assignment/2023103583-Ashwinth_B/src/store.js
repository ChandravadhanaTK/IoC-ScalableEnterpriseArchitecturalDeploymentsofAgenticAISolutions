import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'db.json');

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ profiles: [], applications: [], traces: [], notifications: [] }, null, 2));
  }
}

export function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

export function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function addItem(collection, item) {
  const db = readDb();
  db[collection].push(item);
  writeDb(db);
  return item;
}

export function updateItem(collection, id, patch) {
  const db = readDb();
  const item = db[collection].find(x => x.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  writeDb(db);
  return item;
}
