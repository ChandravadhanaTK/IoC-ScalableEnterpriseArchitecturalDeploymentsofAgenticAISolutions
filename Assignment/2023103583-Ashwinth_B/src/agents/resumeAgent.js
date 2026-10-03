import { containsPromptInjection, redactPII, unique } from '../utils.js';

const SKILLS = [
  'C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'Express', 'HTML', 'CSS', 'Tailwind CSS', 'SQL', 'MongoDB', 'PostgreSQL',
  'Git', 'GitHub', 'Docker', 'AWS', 'Linux', 'DSA', 'Data Structures',
  'Algorithms', 'OOPS', 'Operating Systems', 'DBMS', 'Computer Networks',
  'System Design', 'Machine Learning', 'TensorFlow', 'PyTorch', 'NLP'
];

export function analyzeResume(input) {
  const text = redactPII(input);
  const injectionDetected = containsPromptInjection(text);
  const lower = text.toLowerCase();
  const skills = unique(SKILLS.filter(skill => skill === 'C' ? /(^|[^+#a-z])c([^a-z]|$)/i.test(text) : lower.includes(skill.toLowerCase())));

  const projects = [];
  for (const line of text.split(/\n+/)) {
    if (/project|developed|built|implemented/i.test(line) && line.trim().length > 15) {
      projects.push(line.trim().slice(0, 160));
    }
  }

  return {
    sanitizedText: text,
    injectionDetected,
    skills,
    projects: projects.slice(0, 5),
    profileSummary: `Detected ${skills.length} relevant skills from the submitted resume text.`
  };
}
