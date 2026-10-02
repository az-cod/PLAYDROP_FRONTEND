'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth-errors';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : undefined;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo,
        },
      );

      if (resetError) {
        const mapped = mapAuthError(resetError.message);
        if (mapped.code === 'RATE_LIMITED' || mapped.code === 'NETWORK_ERROR') {
          setError(mapped.message);
          setLoading(false);
          return;
        }
      }

      router.push(`/check-reset-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      const mapped = mapAuthError(err);
      if (mapped.code === 'NETWORK_ERROR') {
        setError(mapped.message);
      } else {
        router.push(`/check-reset-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="auth-card-header">
        <h2>Reset password</h2>
        <p>Enter your email and we will send you a secure link to reset your password.</p>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error">
          <svg className="auth-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label className="auth-label" htmlFor="forgot-email">Email address</label>
          <input
            id="forgot-email"
            className="auth-input"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            required
            autoFocus
          />
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <span className="auth-spinner" />
              Sending reset link…
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <div className="auth-footer">
        Remember your password?{' '}
        <Link href="/login">Sign in</Link>
      </div>
    </>
  );
}
