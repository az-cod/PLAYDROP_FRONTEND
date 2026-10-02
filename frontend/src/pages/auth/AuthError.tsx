'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error') || 'unknown';
  const message = searchParams.get('message');

  const errorDetails: Record<string, { title: string; description: string }> = {
    expired: {
      title: 'Verification Link Expired',
      description: 'This verification or password reset link has expired. Security links are valid for a limited time.',
    },
    invalid: {
      title: 'Invalid Link',
      description: 'This authentication link is malformed or has already been used.',
    },
    access_denied: {
      title: 'Access Denied',
      description: 'You did not authorize the sign-in request, or your account permissions were denied.',
    },
    unknown: {
      title: 'Authentication Error',
      description: message || 'An unexpected authentication error occurred while verifying your session.',
    },
  };

  const current = errorDetails[errorType] || errorDetails.unknown;

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="auth-success-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--auth-danger)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="auth-success-title">{current.title}</h2>
      <p className="auth-success-text">{current.description}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link href="/login" className="auth-submit" style={{ textDecoration: 'none', display: 'flex' }}>
          Back to Sign In
        </Link>
        <Link href="/forgot-password" className="auth-oauth-btn" style={{ textDecoration: 'none', display: 'flex' }}>
          Request New Reset Link
        </Link>
      </div>

      <div className="auth-footer" style={{ marginTop: '24px' }}>
        Need help? Contact support or{' '}
        <Link href="/signup">create a new account</Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="auth-spinner" style={{ margin: '40px auto', display: 'block' }} />}>
      <AuthErrorContent />
    </Suspense>
  );
}

