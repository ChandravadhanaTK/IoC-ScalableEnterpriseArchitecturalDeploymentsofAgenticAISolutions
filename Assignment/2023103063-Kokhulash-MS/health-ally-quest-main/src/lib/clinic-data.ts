export type Doctor = { id: string; name: string; specialty: string; location: string; telehealth: boolean };

export const DOCTORS: Doctor[] = [
  { id: "d1", name: "Dr. Amara Okafor", specialty: "Cardiology", location: "Heart Center, Bldg A", telehealth: true },
  { id: "d2", name: "Dr. Samuel Brooks", specialty: "Orthopedics", location: "Sports & Ortho, Bldg C", telehealth: false },
  { id: "d3", name: "Dr. Lena Fischer", specialty: "Orthopedics", location: "Urgent Ortho Walk-in", telehealth: false },
  { id: "d4", name: "Dr. Hiro Tanaka", specialty: "Pulmonology", location: "Respiratory Clinic, Bldg B", telehealth: true },
  { id: "d5", name: "Dr. Grace Whitfield", specialty: "Family Medicine", location: "Primary Care, Bldg D", telehealth: true },
  { id: "d6", name: "Dr. Omar Haddad", specialty: "Family Medicine", location: "Primary Care, Bldg D", telehealth: true },
  { id: "d7", name: "Dr. Sofia Ramirez", specialty: "Pediatrics", location: "Children's Clinic, Bldg E", telehealth: true },
  { id: "d8", name: "Dr. Ethan Cole", specialty: "Pediatrics", location: "Children's Clinic, Bldg E", telehealth: false },
];

const TIMES = ["08:30", "09:00", "09:45", "10:30", "11:15", "13:00", "13:45", "14:30", "15:15", "16:00"];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function slotsFor(doctorId: string, date: Date, urgent: boolean) {
  const key = doctorId + date.toDateString();
  const open = TIMES.filter((t, i) => (hash(key + t) + i) % 3 !== 0);
  return urgent ? open.slice(0, 6) : open;
}

export function nextDays(n: number) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < n) {
    if (d.getDay() !== 0) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const INSURERS = ["BlueShield PPO", "Aetna HMO", "UnitedHealthcare", "Medicare Part B", "Self-pay"];
