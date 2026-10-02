'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { registerApi, loginApi, resetPasswordApi, requestMagicLinkApi } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [magicUserData, setMagicUserData] = useState<{ user: any; token: string } | null>(null);
  const [magicCountdown, setMagicCountdown] = useState<number | null>(null);

  const resetState = (newMode: 'signin' | 'signup' | 'magic' | 'forgot') => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    setMagicUserData(null);
    setMagicCountdown(null);
  };

  const completeLogin = (user: any, token?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('playdrop_auth_user', JSON.stringify(user));
      if (token) localStorage.setItem('playdrop_token', token);
    }
    onSuccess(user);
    onClose();
  };

  useEffect(() => {
    if (magicCountdown === null) return;
    if (magicCountdown <= 0) {
      if (magicUserData) {
        completeLogin(magicUserData.user, magicUserData.token);
      }
      return;
    }
    const timer = setTimeout(() => {
      setMagicCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [magicCountdown, magicUserData]);

  if (!isOpen) return null;

  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'magic') {
        const magicRes = await requestMagicLinkApi(email);
        setMagicUserData({ user: magicRes.user, token: magicRes.token });
        setSuccessMsg(`Magic login link generated for ${email}!`);
        setMagicCountdown(3);

        supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        }).catch(() => {});

      } else if (mode === 'forgot') {
        if (!password || password.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }

        const resetRes = await resetPasswordApi(email, password);
        if (resetRes?.user) {
          completeLogin(resetRes.user, resetRes.token);
          return;
        }
        throw new Error('Password reset failed. Please try again.');

      } else if (mode === 'signup') {
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        let supabaseSuccess = false;
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name || email.split('@')[0] },
              emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
            },
          });
          if (!error && data.session && data.user) {
            supabaseSuccess = true;
            completeLogin(data.user, data.session.access_token);
            return;
          }
        } catch {
        }

        if (!supabaseSuccess) {
          const backendRes = await registerApi(email, password, name || email.split('@')[0]);
          if (backendRes?.user) {
            completeLogin(backendRes.user, backendRes.token);
            return;
          }
        }
      } else {
        let supabaseSuccess = false;
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!error && data.user) {
            supabaseSuccess = true;
            completeLogin(data.user, data.session?.access_token);
            return;
          }
        } catch {
        }

        if (!supabaseSuccess) {
          const backendRes = await loginApi(email, password);
          if (backendRes?.user) {
            completeLogin(backendRes.user, backendRes.token);
            return;
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
              {mode === 'signin'
                ? 'Sign In to PlayDrop'
                : mode === 'signup'
                ? 'Join PlayDrop'
                : mode === 'magic'
                ? 'Magic Link Login'
                : 'Reset Password'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', margin: '4px 0 0' }}>
              {mode === 'forgot'
                ? 'Enter your email and new password to instantly update your credentials.'
                : 'Find games, claim slots, and protect your reliability score.'}
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--danger, #EF4444)',
            color: '#F87171',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(124, 58, 237, 0.12)',
            border: '1px solid var(--primary, #7C3AED)',
            color: '#C4B5FD',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            <p style={{ margin: 0, fontWeight: 600 }}>{successMsg}</p>
            {magicUserData && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                  Supabase free-tier SMTP may delay external emails. Click below for instant sign in:
                </p>
                <button
                  type="button"
                  onClick={() => completeLogin(magicUserData.user, magicUserData.token)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  Instant 1-Click Sign In {magicCountdown !== null && magicCountdown > 0 ? `(${magicCountdown}s)` : ''}
                </button>
              </div>
            )}
          </div>
        )}
        {(mode === 'signin' || mode === 'signup') && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--surface-elevated, #1D2522)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '16px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Continue with Google
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '16px 0',
              color: 'var(--text-muted)',
              fontSize: '11px',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
          </>
        )}

        {/* Email form */}
        <form onSubmit={handleEmailAuth}>
          {mode === 'signup' && (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Alex Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          {mode !== 'magic' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontSize: '13px', margin: 0 }}>
                  {mode === 'forgot' ? 'New Password' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => resetState('forgot')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                className="form-input"
                type="password"
                placeholder={mode === 'forgot' ? 'Enter new password (min 6 chars)' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '4px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              background: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'Processing...'
              : mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account & Start Playing'
              : mode === 'forgot'
              ? 'Reset Password & Sign In'
              : 'Send Magic Link / Instant Login'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => resetState('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign Up
              </button>
              •
              <button
                type="button"
                onClick={() => resetState('magic')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Magic Link
              </button>
            </>
          ) : mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => resetState('signin')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign In
              </button>
              •
              <button
                type="button"
                onClick={() => resetState('magic')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Magic Link
              </button>
            </>
          ) : mode === 'forgot' ? (
            <>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => resetState('signin')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Back to Sign In
              </button>
            </>
          ) : (
            <>
              Remember password?{' '}
              <button
                type="button"
                onClick={() => resetState('signin')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Back to Sign In
              </button>
              •
              <button
                type="button"
                onClick={() => resetState('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
