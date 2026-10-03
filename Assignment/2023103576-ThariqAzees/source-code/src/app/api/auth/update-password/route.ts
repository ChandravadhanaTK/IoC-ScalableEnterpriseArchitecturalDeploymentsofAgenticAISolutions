import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { validatePasswordResetToken, consumePasswordResetToken } from '@/lib/reset-tokens';
import { setLocalUserPassword } from '@/lib/passwords';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Recovery token is missing or invalid.' }, { status: 400 });
    }

    const tokenRecord = await validatePasswordResetToken(token);
    if (!tokenRecord) {
      return NextResponse.json({ error: 'Recovery token is invalid, expired, or has already been used.' }, { status: 400 });
    }

    const user = await db.users.findById(tokenRecord.userId) || await db.users.findByEmail(tokenRecord.email);
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    // Invalidate token (atomic single-use enforcement)
    await consumePasswordResetToken(token);

    // Update local password store
    setLocalUserPassword(user.email, newPassword);

    // If Supabase Auth is active and Service Role key is configured, update Supabase Auth user password
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error: sbErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
        if (sbErr) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const sbUser = listData?.users?.find(u => u.email?.toLowerCase() === user.email.toLowerCase());
          if (sbUser) {
            await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { password: newPassword });
          }
        }
      } catch (err: any) {
        console.error('[Supabase Auth Server Update Password Exception]:', err?.message || err);
      }
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}
