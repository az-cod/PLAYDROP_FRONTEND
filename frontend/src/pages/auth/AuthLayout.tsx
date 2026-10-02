import Link from 'next/link';

/**
 * AuthShell — split-panel layout for all auth pages.
 * Left: Brand panel with gradient mesh, tagline, feature bullets.
 * Right: Form panel (rendered as {children}).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      {/* ── Brand Panel ────────────────────────────────── */}
      <div className="auth-brand">
        <div className="auth-brand-grid" />
        <div className="auth-brand-content">
          <Link href="/" className="auth-brand-logo" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" />
              <path d="M16 6 L16 16 L22 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="16" r="3" fill="currentColor" />
            </svg>
            <span>PlayDrop</span>
          </Link>
          <h1>
            Find Your Game.<br />
            <span className="auth-gradient-text">Fill the Slot.</span>
          </h1>
          <p>
            Real-time sports matchmaking. Join pickup games near you,
            build your reputation, and never miss a match again.
          </p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-dot" />
              Live games
            </div>
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-dot" />
              Real-time slots
            </div>
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-dot" />
              Reputation scores
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Panel ─────────────────────────────────── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
}
