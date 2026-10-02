'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth-errors';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [resendError, setResendError] = useState('');

  const supabase = createClient();

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendStatus('idle');
    setResendError('');

    try {
      const emailRedirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        const mapped = mapAuthError(error.message);
        setResendError(mapped.message);
        setResendStatus('error');
      } else {
        setResendStatus('sent');
      }
    } catch (err) {
      const mapped = mapAuthError(err);
      setResendError(mapped.message);
      setResendStatus('error');
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="auth-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>

      <h2 className="auth-success-title">Check your inbox</h2>
      
      <p className="auth-success-text">
        We sent a verification link to{' '}
        <span className="auth-email-highlight">{email || 'your email address'}</span>.
        Click the link to verify your account and start claiming slots.
      </p>

      {resendStatus === 'sent' && (
        <div className="auth-alert auth-alert-success" style={{ textAlign: 'left', marginBottom: '16px' }}>
          <svg className="auth-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>A fresh verification link has been sent.</span>
        </div>
      )}

      {resendStatus === 'error' && (
        <div className="auth-alert auth-alert-error" style={{ textAlign: 'left', marginBottom: '16px' }}>
          <svg className="auth-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{resendError}</span>
        </div>
      )}

      {email && (
        <button
          type="button"
          className="auth-oauth-btn"
          onClick={handleResend}
          disabled={resending}
          style={{ marginBottom: '16px' }}
        >
          {resending ? (
            <>
              <span className="auth-spinner" />
              Resending verification email…
            </>
          ) : (
            'Resend Verification Email'
          )}
        </button>
      )}

      <div className="auth-footer" style={{ marginTop: '20px' }}>
        Back to{' '}
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="auth-spinner" style={{ margin: '40px auto', display: 'block' }} />}>
      <CheckEmailContent />
    </Suspense>
  );
}

