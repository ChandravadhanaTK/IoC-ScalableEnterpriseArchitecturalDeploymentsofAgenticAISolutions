export const sessionMemory = new Map();

export function getStudentMemory(studentId) {
  if (!sessionMemory.has(studentId)) {
    sessionMemory.set(studentId, { lastSubject: null, lastRequirement: null, recentMessages: [] });
  }

  return sessionMemory.get(studentId);
}

export function updateStudentMemory(studentId, patch) {
  const memory = getStudentMemory(studentId);
  Object.assign(memory, patch);
  if (Array.isArray(memory.recentMessages)) {
    memory.recentMessages = memory.recentMessages.slice(-10);
  }
  return memory;
}
