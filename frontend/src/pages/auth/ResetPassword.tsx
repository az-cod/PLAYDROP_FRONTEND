'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError, evaluatePasswordStrength } from '@/lib/auth-errors';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createClient();
  const strength = evaluatePasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        const mapped = mapAuthError(updateError.message);
        setError(mapped.message);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err) {
      const mapped = mapAuthError(err);
      setError(mapped.message);
    } finally {
      setLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div className="auth-success-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--auth-success)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="auth-success-title">Password updated!</h2>
        <p className="auth-success-text">
          Your password has been successfully updated. Redirecting you to PlayDrop now…
        </p>
        <Link href="/" className="auth-submit" style={{ textDecoration: 'none', display: 'flex' }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="auth-card-header">
        <h2>Set new password</h2>
        <p>Choose a strong, secure password for your PlayDrop account.</p>
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
          <label className="auth-label" htmlFor="reset-new-password">New Password</label>
          <div className="auth-password-wrapper">
            <input
              id="reset-new-password"
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
              autoFocus
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="auth-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--auth-text-muted)' }}>
                  Min 6 characters
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="reset-confirm-password">Confirm Password</label>
          <input
            id="reset-confirm-password"
            className="auth-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <span className="auth-spinner" />
              Updating password…
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>

      <div className="auth-footer">
        Back to{' '}
        <Link href="/login">Sign in</Link>
      </div>
    </>
  );
}
