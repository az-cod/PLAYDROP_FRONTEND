/**
 * Maps raw Supabase Auth errors to controlled, user-friendly messages.
 * Never expose raw error strings to the UI.
 */

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'USER_ALREADY_EXISTS'
  | 'RATE_LIMITED'
  | 'WEAK_PASSWORD'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_ALREADY_USED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

interface AuthError {
  code: AuthErrorCode;
  message: string;
}

const ERROR_MAP: Record<string, AuthError> = {
  'Invalid login credentials': {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password.',
  },
  'Email not confirmed': {
    code: 'EMAIL_NOT_CONFIRMED',
    message: 'Please verify your email before signing in.',
  },
  'User already registered': {
    code: 'USER_ALREADY_EXISTS',
    message: 'An account with this email already exists.',
  },
  'Email rate limit exceeded': {
    code: 'RATE_LIMITED',
    message: 'Too many attempts. Please wait a moment.',
  },
  'For security purposes, you can only request this after': {
    code: 'RATE_LIMITED',
    message: 'Please wait before requesting another email.',
  },
  'Password should be at least 6 characters': {
    code: 'WEAK_PASSWORD',
    message: 'Password must be at least 6 characters.',
  },
  'Token has expired or is invalid': {
    code: 'TOKEN_EXPIRED',
    message: 'This link has expired. Please request a new one.',
  },
  'Email link is invalid or has expired': {
    code: 'TOKEN_EXPIRED',
    message: 'This verification link has expired.',
  },
  'otp_expired': {
    code: 'TOKEN_EXPIRED',
    message: 'This link has expired. Please request a new one.',
  },
};

export function mapAuthError(error: unknown): AuthError {
  if (!error) {
    return { code: 'UNKNOWN', message: 'Something went wrong. Please try again.' };
  }

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : (error as any)?.message || '';

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError')
  ) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Connection failed. Please check your internet.',
    };
  }

  for (const [pattern, mapped] of Object.entries(ERROR_MAP)) {
    if (message.includes(pattern)) {
      return mapped;
    }
  }

  return { code: 'UNKNOWN', message: 'Something went wrong. Please try again.' };
}

/**
 * Password strength evaluator.
 * Returns a score from 0-4 and descriptive label.
 */
export function evaluatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  checks: { label: string; met: boolean }[];
} {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.met).length;

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: 'Too weak', color: '#EF4444' },
    1: { label: 'Weak', color: '#EF4444' },
    2: { label: 'Fair', color: '#F59E0B' },
    3: { label: 'Good', color: '#3B82F6' },
    4: { label: 'Strong', color: '#22C55E' },
    5: { label: 'Very strong', color: '#22C55E' },
  };

  return { score, ...labels[score], checks };
}
