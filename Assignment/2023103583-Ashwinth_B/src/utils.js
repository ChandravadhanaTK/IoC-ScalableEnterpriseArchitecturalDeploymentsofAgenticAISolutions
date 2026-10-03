import crypto from 'node:crypto';

export function id(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function now() {
  return new Date().toISOString();
}

export function cleanText(value, max = 20000) {
  return String(value ?? '').replace(/\0/g, '').trim().slice(0, max);
}

export function containsPromptInjection(text) {
  const patterns = [
    /ignore\s+(all|any|the|previous|prior)\s+instructions?/i,
    /system\s*:/i,
    /developer\s*:/i,
    /you\s+are\s+now/i,
    /reveal\s+(the\s+)?system\s+prompt/i,
    /disregard\s+(all|previous|prior)/i
  ];
  return patterns.some(pattern => pattern.test(text));
}

export function redactPII(text) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/(?:\+?91[-\s]?)?[6-9]\d{9}/g, '[PHONE]');
}

export function unique(values) {
  return [...new Set(values)];
}
