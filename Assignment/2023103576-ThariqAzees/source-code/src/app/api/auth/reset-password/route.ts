import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePasswordResetToken } from '@/lib/reset-tokens';
import { sendPasswordResetEmail, isSmtpConfigured } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || 'http://localhost:3000';
    const isDev = process.env.NODE_ENV !== 'production';

    const user = await db.users.findByEmail(cleanEmail);
    let debugResetUrl: string | undefined = undefined;

    if (user) {
      const rawToken = await generatePasswordResetToken(user.id, user.email);
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      // Dispatch HTML password reset email via Nodemailer
      await sendPasswordResetEmail(cleanEmail, resetUrl);

      if (isDev && !isSmtpConfigured) {
        debugResetUrl = resetUrl;
      }
    }

    // Return secure non-enumerating response
    return NextResponse.json({
      success: true,
      message: 'If the account exists, a password reset email has been sent.',
      debugResetUrl,
      isSmtpActive: isSmtpConfigured
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({
      success: true,
      message: 'If the account exists, a password reset email has been sent.'
    });
  }
}
