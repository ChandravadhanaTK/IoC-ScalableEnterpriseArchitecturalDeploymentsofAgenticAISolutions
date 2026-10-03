import { unique } from '../utils.js';

const SKILLS = [
  'C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'Express', 'HTML', 'CSS', 'Tailwind CSS', 'SQL', 'MongoDB', 'PostgreSQL',
  'Git', 'GitHub', 'Docker', 'AWS', 'Linux', 'DSA', 'Data Structures',
  'Algorithms', 'OOPS', 'Operating Systems', 'DBMS', 'Computer Networks',
  'System Design', 'Machine Learning', 'TensorFlow', 'PyTorch', 'NLP'
];

export function matchJob(profileSkills, jobDescription) {
  const raw = String(jobDescription);
  const lower = raw.toLowerCase();
  const required = unique(SKILLS.filter(skill => skill === 'C' ? /(^|[^+#a-z])c([^a-z]|$)/i.test(raw) : lower.includes(skill.toLowerCase())));
  const matched = required.filter(skill => profileSkills.some(x => x.toLowerCase() === skill.toLowerCase()));
  const missing = required.filter(skill => !matched.includes(skill));
  const score = required.length ? Math.round((matched.length / required.length) * 100) : 0;

  return {
    requiredSkills: required,
    matchedSkills: matched,
    missingSkills: missing,
    score,
    explanation: required.length
      ? `${matched.length} of ${required.length} detected job skills are present in the candidate profile.`
      : 'No known skills were detected in the job description. Add explicit technical requirements for a meaningful match.'
  };
}
