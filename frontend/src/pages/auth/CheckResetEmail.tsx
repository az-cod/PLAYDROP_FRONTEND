'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckResetEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="auth-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h2 className="auth-success-title">Password reset email sent</h2>
      
      <p className="auth-success-text">
        If an account exists for{' '}
        <span className="auth-email-highlight">{email || 'your email'}</span>,
        you will receive an email containing a link to reset your password shortly.
      </p>

      <div className="auth-alert auth-alert-info" style={{ textAlign: 'left', marginBottom: '24px' }}>
        <svg className="auth-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          Be sure to check your spam or promotions folder if the email does not appear in a few minutes.
        </span>
      </div>

      <Link href="/login" className="auth-submit" style={{ textDecoration: 'none', display: 'flex' }}>
        Return to Sign In
      </Link>
    </div>
  );
}

export default function CheckResetEmailPage() {
  return (
    <Suspense fallback={<div className="auth-spinner" style={{ margin: '40px auto', display: 'block' }} />}>
      <CheckResetEmailContent />
    </Suspense>
  );
}

