const generateDeadline = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

export const sampleUsers = [
  {
    _id: 'user-student-1',
    email: 'student@college.edu',
    passwordHash: '$2b$10$We55evMdto8QeFEc3SGFg./PPnKwfvIVSIiU.lp1G6WHWFGDzJeEG',
    role: 'student',
    studentId: 'CS2024001',
    name: 'Aisha Patel',
  },
  {
    _id: 'user-admin-1',
    email: 'admin@college.edu',
    passwordHash: '$2b$10$xoBehjolq1tKG9EKbtFfYOW2RFOo2hj.G8pMosTt.cmhbcWe4nnO2',
    role: 'admin',
    name: 'Admission Office',
  },
];

export const sampleStudents = [
  {
    _id: 'student-1',
    studentId: 'CS2024001',
    name: 'Aisha Patel',
    department: 'CSE',
    year: 3,
    semester: 5,
    cgpa: 8.7,
    email: 'student@college.edu',
    courses: ['OS', 'DBMS', 'CN', 'AI'],
    recentSemesterMarks: [
      { subject: 'OS', total: 97 },
      { subject: 'DBMS', total: 88 },
      { subject: 'CN', total: 75 },
      { subject: 'AI', total: 85 },
    ],
  },
];

export const sampleAttendance = [
  {
    _id: 'attendance-1',
    studentId: 'CS2024001',
    subjects: [
      { subject: 'OS', attended: 30, total: 45, percentage: 66.67 },
      { subject: 'DBMS', attended: 40, total: 45, percentage: 88.89 },
      { subject: 'CN', attended: 25, total: 35, percentage: 71.43 },
      { subject: 'AI', attended: 32, total: 38, percentage: 84.21 },
    ],
  },
];

export const sampleMarks = [
  {
    _id: 'marks-1',
    studentId: 'CS2024001',
    subjects: [
      {
        subject: 'OS',
        internal: 18,
        assignment: 9,
        lab: 20,
        midSem: 22,
        endSem: 28,
        total: 97,
        grade: 'A',
      },
      {
        subject: 'DBMS',
        internal: 16,
        assignment: 8,
        lab: 18,
        midSem: 21,
        endSem: 25,
        total: 88,
        grade: 'A',
      },
      {
        subject: 'CN',
        internal: 12,
        assignment: 7,
        lab: 17,
        midSem: 18,
        endSem: 21,
        total: 75,
        grade: 'B',
      },
      {
        subject: 'AI',
        internal: 14,
        assignment: 8,
        lab: 19,
        midSem: 20,
        endSem: 24,
        total: 85,
        grade: 'A',
      },
    ],
  },
];

export const sampleAssignments = [
  {
    _id: 'assignment-1',
    studentId: 'CS2024001',
    name: 'OS Quiz 2',
    subject: 'OS',
    deadline: generateDeadline(2),
    status: 'pending',
    description: 'Review scheduling algorithms and solve 10 concept questions.',
  },
  {
    _id: 'assignment-2',
    studentId: 'CS2024001',
    name: 'DBMS ER Design',
    subject: 'DBMS',
    deadline: generateDeadline(5),
    status: 'pending',
    description: 'Create a normalized ER diagram for a hospital database.',
  },
  {
    _id: 'assignment-3',
    studentId: 'CS2024001',
    name: 'AI Project Milestone',
    subject: 'AI',
    deadline: generateDeadline(9),
    status: 'pending',
    description: 'Prepare the model selection report and baseline evaluation.',
  },
];

export const sampleTimetable = [
  {
    _id: 'tt-1',
    studentId: 'CS2024001',
    day: 'Monday',
    classes: [
      { subject: 'OS', time: '09:00', room: 'CS-201' },
      { subject: 'DBMS', time: '11:30', room: 'LAB-2' },
    ],
  },
  {
    _id: 'tt-2',
    studentId: 'CS2024001',
    day: 'Tuesday',
    classes: [
      { subject: 'AI', time: '10:00', room: 'AI-LAB' },
    ],
  },
  {
    _id: 'tt-3',
    studentId: 'CS2024001',
    day: 'Wednesday',
    classes: [
      { subject: 'CN', time: '09:30', room: 'CS-305' },
    ],
  },
  {
    _id: 'tt-4',
    studentId: 'CS2024001',
    day: 'Thursday',
    classes: [
      { subject: 'OS', time: '08:30', room: 'CS-201' },
      { subject: 'DBMS', time: '12:00', room: 'DB-LAB' },
    ],
  },
  {
    _id: 'tt-5',
    studentId: 'CS2024001',
    day: 'Friday',
    classes: [
      { subject: 'AI', time: '10:30', room: 'AI-101' },
    ],
  },
];

export const sampleAcademicCalendar = [
  {
    _id: 'calendar-1',
    semesterStart: '2026-08-01',
    semesterEnd: '2026-12-20',
    internalExams: ['2026-09-18', '2026-10-30'],
    endSemesterExams: ['2026-12-10', '2026-12-17'],
    holidays: ['2026-08-15', '2026-10-02', '2026-11-14'],
    assignmentDeadlines: ['2026-10-05', '2026-10-09'],
    registrationDates: ['2026-07-25', '2026-07-30'],
  },
];

export const sampleDocuments = [
  {
    _id: 'doc-1',
    title: 'Academic Regulations 2026',
    section: 'Attendance Requirements',
    content: 'Students must maintain at least 75% attendance in each course to be eligible to appear for the semester examination. Students with attendance below 75% in any course may be barred from the end-semester exam unless approved by the academic council.',
  },
  {
    _id: 'doc-2',
    title: 'Examination Regulations',
    section: 'Minimum Criteria',
    content: 'A student is permitted to write the semester exam only if the attendance percentage in the course is 75% or above. Special cases require a documented approval process and an academic committee recommendation.',
  },
  {
    _id: 'doc-3',
    title: 'Student Handbook',
    section: 'Evaluation and Grading',
    content: 'The grade bands are A: 90 and above, B: 80 to 89, C: 70 to 79, D: 60 to 69, F: below 60. The cumulative grade point average is computed over all completed credit courses.',
  },
];
