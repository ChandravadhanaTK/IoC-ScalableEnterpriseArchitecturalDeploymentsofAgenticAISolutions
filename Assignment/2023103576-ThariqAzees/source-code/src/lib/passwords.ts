export const DEMO_PASSWORD = 'Password123!';

// In-memory password store for local development mode
const localPasswordStore: Record<string, string> = {
  'admin@skillbridge.ai': DEMO_PASSWORD,
  'alex@techventures.io': DEMO_PASSWORD,
  'elena@growthpulse.com': DEMO_PASSWORD,
  'david@cyberguard.sec': DEMO_PASSWORD,
  'marcus@synthai.tech': DEMO_PASSWORD,
  'priya@dev.io': DEMO_PASSWORD,
  'devon@aiml.ai': DEMO_PASSWORD,
  'sophia@design.co': DEMO_PASSWORD,
  'liam@sec.net': DEMO_PASSWORD,
  'aisha@data.org': DEMO_PASSWORD,
  'lucas@frontend.dev': DEMO_PASSWORD,
  'hannah@content.pro': DEMO_PASSWORD,
  'kenji@cloud.io': DEMO_PASSWORD,
  'chloe@growth.agency': DEMO_PASSWORD,
  'omar@mobile.app': DEMO_PASSWORD,
  'zoe@blockchain.eth': DEMO_PASSWORD,
};

export function getLocalUserPassword(email: string): string {
  return localPasswordStore[email.toLowerCase()] || DEMO_PASSWORD;
}

export function setLocalUserPassword(email: string, newPass: string): void {
  localPasswordStore[email.toLowerCase()] = newPass;
}
