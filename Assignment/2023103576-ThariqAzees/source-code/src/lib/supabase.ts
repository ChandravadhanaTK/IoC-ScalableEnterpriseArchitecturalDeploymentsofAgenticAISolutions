import { createClient } from '@supabase/supabase-js';

const rawUrls = [
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_URL
];

const urlPlaceholders = new Set(['https://your-supabase-project.supabase.co', 'your-url', '']);

const supabaseUrl = (
  rawUrls.map(u => (u || '').trim()).find(u => u && !urlPlaceholders.has(u)) || ''
);

const rawKeys = [
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  process.env.SUPABASE_ANON_KEY
];

const keyPlaceholders = new Set(['your-anon-key', 'your-publishable-key', 'your-key', '']);

const supabaseKey = (
  rawKeys.map(k => (k || '').trim()).find(k => k && !keyPlaceholders.has(k)) || ''
);

const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const isServiceRoleValid = Boolean(
  serviceRoleKey &&
  serviceRoleKey.length > 10 &&
  !keyPlaceholders.has(serviceRoleKey)
);

const isValidUrl = Boolean(
  supabaseUrl &&
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
);

const isValidKey = Boolean(
  supabaseKey &&
  supabaseKey.length > 10
);

export const isSupabaseConfigured = isValidUrl && isValidKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const supabaseAdmin = (isValidUrl && isServiceRoleValid)
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

