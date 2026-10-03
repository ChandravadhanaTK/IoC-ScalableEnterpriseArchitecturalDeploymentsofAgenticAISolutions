/** Returns YYYY-MM-DD for today, local time, no timezone shift. */
export function todayISO(): string {
  return dateToISO(new Date());
}

/** Returns YYYY-MM for the given date or today by default. */
export function currentMonth(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Returns YYYY-MM-DD without timezone shift from a Date object. */
export function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Given a YYYY-MM string, returns the previous month as YYYY-MM. */
export function previousMonth(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return currentMonth(date);
}

/** Returns an array of YYYY-MM strings for the last N months including current. */
export function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const tmp = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(currentMonth(tmp));
  }
  return months;
}

/** Parse a YYYY-MM-DD string into a local Date at midnight (no UTC shift). */
export function parseISODate(s: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(NaN);
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Checks if a YYYY-MM-DD date string falls within a YYYY-MM month. */
export function dateInMonth(dateStr: string, month: string): boolean {
  if (!dateStr || !month) return false;
  return dateStr.startsWith(month);
}

/** Map of relative day words to offset from today. */
export const DAY_OFFSETS: Record<string, number> = {
  today: 0,
  yesterday: -1,
  'day before yesterday': -2,
};

/** Convert a relative word to YYYY-MM-DD, or null if not recognized. */
export function relativeDayToISO(word: string): string | null {
  const key = word.toLowerCase().trim();
  if (key in DAY_OFFSETS) {
    const d = new Date();
    d.setDate(d.getDate() + DAY_OFFSETS[key]);
    return dateToISO(d);
  }
  return null;
}

/** Parse a date string that may be YYYY-MM-DD or a relative word. Returns YYYY-MM-DD or null. */
export function resolveDateInput(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  const rel = relativeDayToISO(trimmed);
  if (rel) return rel;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = parseISODate(trimmed);
    if (!isNaN(parsed.getTime())) return trimmed;
  }
  // Try Date.parse for formats like "2026-09-15" or "Sep 15 2026"
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return dateToISO(parsed);
  return null;
}

/** Parse a month string that may be YYYY-MM or a month name + year. Returns YYYY-MM or null. */
export function resolveMonthInput(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}\/\d{4}$/.test(trimmed)) {
    const [m, y] = trimmed.split('/');
    return `${y}-${m.padStart(2, '0')}`;
  }
  // Month name + optional year: "september 2026", "sep", "this month", "last month"
  if (trimmed === 'this month') return currentMonth();
  if (trimmed === 'last month') return previousMonth(currentMonth());

  const monthNames: Record<string, number> = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11,
  };

  // Extract month name and optional year
  const match = trimmed.match(/([a-z]{3,})/g);
  if (match) {
    for (const word of match) {
      const lower = word.toLowerCase();
      if (monthNames[lower] !== undefined) {
        let year = new Date().getFullYear();
        const yearMatch = trimmed.match(/\b(\d{4})\b/);
        if (yearMatch) year = Number(yearMatch[1]);
        return `${year}-${String(monthNames[lower] + 1).padStart(2, '0')}`;
      }
    }
  }
  return null;
}
