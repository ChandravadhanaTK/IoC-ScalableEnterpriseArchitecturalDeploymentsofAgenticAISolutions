'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowRight, AlertCircle, CheckCircle, RefreshCw, ArrowLeft, Mail, Info } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const [isSmtpActive, setIsSmtpActive] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDebugUrl(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok && data.success) {
        setMessage(data.message);
        setIsSmtpActive(Boolean(data.isSmtpActive));
        if (data.debugResetUrl) {
          setDebugUrl(data.debugResetUrl);
        }
      } else {
        setError(data.error || 'Failed to submit password reset request.');
      }
    } catch (err) {
      setSubmitting(false);
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        <Link href="/login" className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Reset your password</h2>
          <p className="text-xs text-slate-400">Enter your registered email to receive a password recovery link</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Confirmation */}
        {message ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Request Submitted</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{message}</p>
            </div>

            {!isSmtpActive && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl text-[11px] space-y-1">
                <div className="flex items-center space-x-1 font-semibold text-amber-400">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>SMTP Delivery Inactive</span>
                </div>
                <p className="text-slate-400 leading-normal">
                  Nodemailer SMTP variables (<code className="text-amber-300">SMTP_HOST</code>, <code className="text-amber-300">SMTP_USER</code>, <code className="text-amber-300">SMTP_PASSWORD</code>) are unconfigured in <code className="text-amber-300">.env</code>.
                </p>
              </div>
            )}

            {/* Local dev debug helper when SMTP credentials are not yet added to .env */}
            {debugUrl && (
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs space-y-1.5">
                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block">Dev Recovery Shortcut (Local Mode)</span>
                <Link href={debugUrl} className="text-indigo-300 hover:underline break-all block font-mono text-[11px]">
                  {debugUrl}
                </Link>
              </div>
            )}

            <Link
              href="/login"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center transition-colors"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Registered Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@dev.io"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Send Recovery Email</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
