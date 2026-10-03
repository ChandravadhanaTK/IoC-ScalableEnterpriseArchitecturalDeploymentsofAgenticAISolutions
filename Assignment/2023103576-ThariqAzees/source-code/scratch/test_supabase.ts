import fs from 'fs';
import path from 'path';

// Parse .env manually BEFORE importing modules
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const parts = trimmed.split('=');
        const key = parts[0].trim();
        let val = parts.slice(1).join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.error('Env parse error:', e);
}

async function runAudit() {
  // Dynamically import supabase module after process.env is set
  const { isSupabaseConfigured, supabase } = await import('../src/lib/supabase');
  const { verifySignedSessionToken, createSignedSessionToken } = await import('../src/lib/session');
  const { db } = await import('../src/lib/db');

  console.log('=== SUPABASE & AUTH E2E AUDIT ===');
  
  // 1. Credentials Detection
  console.log('1. Supabase Configured Status:', isSupabaseConfigured);

  // 2. Active Request to Supabase Project
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log('2. Supabase API Request Error:', error.message);
      } else {
        console.log('2. Supabase API Connection: SUCCESS (Session active:', Boolean(data.session), ')');
      }

      // Test Password Recovery Call to Supabase Project
      const testEmail = 'priya@dev.io';
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: 'http://localhost:3000/reset-password'
      });
      if (resetErr) {
        console.log('3. Supabase resetPasswordForEmail API Result: ERROR (', resetErr.message, ')');
      } else {
        console.log('3. Supabase resetPasswordForEmail API Result: SUCCESS - Accepted by Supabase Auth server');
      }

    } catch (err: any) {
      console.log('2. Supabase API Request Failed:', err.message);
    }
  } else {
    console.log('2. Supabase API Connection: SKIPPED (Unconfigured)');
  }

  // 4. Forged Session Cookie Rejection Test
  const forgedToken = 'user-admin-1:1700000000000:1800000000000:invalid_signature_here';
  const verifiedPayload = verifySignedSessionToken(forgedToken);
  console.log('4. Forged Cookie Verification Result:', verifiedPayload);

  // 5. Genuine Session Token Test
  const validToken = createSignedSessionToken('user-admin-1');
  const validPayload = verifySignedSessionToken(validToken);
  console.log('5. Valid HMAC Token Verification Result:', validPayload?.userId === 'user-admin-1' ? 'SUCCESS' : 'FAILED');

  // 6. User DB Mapping Check
  const adminUser = await db.users.findById('user-admin-1');
  console.log('6. DB Profile Mapping Check:', adminUser?.email, '-> Role:', adminUser?.role);
}

runAudit().catch(console.error);
