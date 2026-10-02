'use client';

import React from 'react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: any;
  userLocation: { lat: number; lng: number; name: string; isLive: boolean } | null;
  isLocating: boolean;
  locationError: string;
  onRequestLiveGps: () => void;
  onSelectHub: (hub: { name: string; lat: number; lng: number }) => void;
  onRequireAuth: () => void;
}

export const POPULAR_HUBS = [
  { name: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245, desc: '4th Block Turf Arena & Play Area' },
  { name: 'Indiranagar, Bengaluru', lat: 12.9719, lng: 77.6412, desc: '100 Feet Road Football Arena' },
  { name: 'HSR Layout, Bengaluru', lat: 12.9116, lng: 77.6389, desc: 'Sector 2 Sports Ground' },
  { name: 'BTM Layout, Bengaluru', lat: 12.9166, lng: 77.6101, desc: '2nd Stage Basketball & Futsal' },
  { name: 'Sarjapur, Bengaluru', lat: 12.9081, lng: 77.6833, desc: 'Decathlon Play Arena Sarjapur' },
  { name: 'Jayanagar, Bengaluru', lat: 12.9304, lng: 77.5838, desc: 'National College Ground' },
];

export default function LocationModal({
  isOpen,
  onClose,
  authUser,
  userLocation,
  isLocating,
  locationError,
  onRequestLiveGps,
  onSelectHub,
  onRequireAuth,
}: LocationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(6, 7, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--surface, #0F1117)',
          border: '1px solid var(--border, #1E2230)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
              Matchmaking Location
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Choose your area to discover games and verified turf venues
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--elevated, #161922)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Section 1: Live GPS */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Live Device Location
          </div>

          {!authUser ? (
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(124, 58, 237, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C4B5FD',
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    Live GPS Protected
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Live GPS location is only accessed when you sign in. Sign in to enable automatic turf distance tracking and venue check-in.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="join-btn"
                onClick={() => {
                  onClose();
                  onRequireAuth();
                }}
                style={{ height: '38px', fontSize: '13px' }}
              >
                Sign In to Enable Live GPS
              </button>
            </div>
          ) : (
            <div
              style={{
                background: userLocation?.isLive ? 'rgba(124, 58, 237, 0.10)' : 'var(--elevated, #161922)',
                border: userLocation?.isLive ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: userLocation?.isLive ? '#8B5CF6' : 'var(--text-muted)',
                    boxShadow: userLocation?.isLive ? '0 0 10px #8B5CF6' : 'none',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    {userLocation?.isLive ? userLocation.name : 'GPS Location Inactive'}
                  </span>
                </div>
                {userLocation?.isLive && (
                  <span style={{
                    fontSize: '11px',
                    color: '#C4B5FD',
                    background: 'rgba(124, 58, 237, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 600,
                  }}>
                    LIVE
                  </span>
                )}
              </div>

              {locationError && (
                <div style={{
                  fontSize: '12px',
                  color: '#F87171',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '12px',
                }}>
                  {locationError}
                </div>
              )}

              <button
                type="button"
                className="join-btn"
                onClick={onRequestLiveGps}
                disabled={isLocating}
                style={{
                  height: '38px',
                  fontSize: '13px',
                  opacity: isLocating ? 0.7 : 1,
                  cursor: isLocating ? 'not-allowed' : 'pointer',
                }}
              >
                {isLocating ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16" />
                    </svg>
                    <span>Acquiring Device GPS...</span>
                  </>
                ) : userLocation?.isLive ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M23 4v6h-6" />
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>
                    <span>Refresh Live GPS</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                    <span>Use My Current Device GPS</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Popular Hubs */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Popular Sports Hubs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
            {POPULAR_HUBS.map((hub) => {
              const isSelected = !userLocation?.isLive && userLocation?.name === hub.name;
              return (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => onSelectHub(hub)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--primary-soft, rgba(124, 58, 237, 0.15))' : 'var(--elevated, #161922)',
                    border: isSelected ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#C4B5FD' : 'var(--text)' }}>
                      {hub.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {hub.desc}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: isSelected ? '#C4B5FD' : 'var(--text-muted)' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
