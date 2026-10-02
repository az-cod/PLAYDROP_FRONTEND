'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError, evaluatePasswordStrength } from '@/lib/auth-errors';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();
  const strength = evaluatePasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const emailRedirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim() || email.split('@')[0],
          },
          emailRedirectTo,
        },
      });

      if (signUpError) {
        const mapped = mapAuthError(signUpError.message);
        setError(mapped.message);
        return;
      }

      if (data.session) {
        router.push('/');
        router.refresh();
      } else {
        router.push(`/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } catch (err) {
      const mapped = mapAuthError(err);
      setError(mapped.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
        },
      });

      if (oauthError) {
        const mapped = mapAuthError(oauthError.message);
        setError(mapped.message);
        setLoading(false);
      }
    } catch (err) {
      const mapped = mapAuthError(err);
      setError(mapped.message);
      setLoading(false);
    }
  }

  return (
    <>
      <div className="auth-card-header">
        <h2>Join PlayDrop</h2>
        <p>Create your account to join games and track your match reputation.</p>
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

      {/* Google OAuth */}
      <button
        type="button"
        className="auth-oauth-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
        </svg>
        Sign up with Google
      </button>

      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">or with email</span>
        <div className="auth-divider-line" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label className="auth-label" htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            className="auth-input"
            type="text"
            placeholder="Alex Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoComplete="name"
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="signup-email">Email address</label>
          <input
            id="signup-email"
            className="auth-input"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            required
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="signup-password">Password</label>
          <div className="auth-password-wrapper">
            <input
              id="signup-password"
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {password.length > 0 && (
            <div className="auth-strength-meter">
              <div className="auth-strength-bar">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`auth-strength-segment ${strength.score >= lvl ? 'active' : ''}`}
                    style={strength.score >= lvl ? { background: strength.color } : {}}
                  />
                ))}
              </div>
              <span className="auth-strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <span className="auth-spinner" />
              Creating account…
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <Link href="/login">Sign in</Link>
      </div>
    </>
  );
}
