'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPublishedGames, recordGamePlayApi } from '@/lib/api';
import {
  GamepadIcon,
  ZapIcon,
  PlayIcon,
  RocketIcon,
  SearchIcon,
  ActivityIcon,
} from '@/components/Icons';

const GENRES = [
  { id: 'ALL', label: 'All Games' },
  { id: 'CRICKET', label: 'Cricket' },
  { id: 'FOOTBALL', label: 'Football' },
  { id: 'BASKETBALL', label: 'Basketball' },
  { id: 'ARCADE', label: 'Arcade' },
  { id: 'CASUAL', label: 'Casual' },
  { id: 'MULTIPLAYER', label: 'Multiplayer' },
];

export default function GamesArcadePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayGame, setActivePlayGame] = useState<any | null>(null);

  useEffect(() => {
    async function loadGames() {
      setLoading(true);
      try {
        const fetched = await fetchPublishedGames(selectedGenre, searchQuery);
        setGames(fetched);
      } catch (err) {
        console.warn('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [selectedGenre, searchQuery]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'PLAYDROP_SCORE') {
        const score = Number(e.data.score) || 0;
        console.log('[PLAYDROP RUNTIME] Score recorded from sandboxed game:', score);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLaunchGame = (game: any) => {
    const gamesOrigin = process.env.NEXT_PUBLIC_GAMES_ORIGIN || 'https://games.playdrop.workers.dev';
    let bundleUrl = game.activeVersionId?.bundleUrl;
    if (game.r2Key) {
      bundleUrl = `${gamesOrigin}/${game.r2Key.replace(/^games\//, '')}`;
    }
    setActivePlayGame({ ...game, resolvedBundleUrl: bundleUrl });
    recordGamePlayApi(game.id || game._id);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #06070A)',
      color: 'var(--text, #F5F7F6)',
      fontFamily: 'var(--font-body, Inter, sans-serif)',
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid var(--border, #1E2230)',
        background: 'var(--surface, #0F1117)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{
            color: 'var(--primary, #7C3AED)',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            Back to Matches
          </Link>
          <div style={{ width: '1px', height: '18px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GamepadIcon size={18} className="text-violet-400" />
            <span style={{
              fontFamily: 'var(--font-display, Space Grotesk, sans-serif)',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}>
              PlayDrop Arcade
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/creator"
            style={{
              background: 'var(--elevated, #161922)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RocketIcon size={14} className="text-violet-400" />
            <span>Creator Studio</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 8px',
          }}>
            Community Cloud Games
          </h1>
          <p style={{ color: 'var(--text-secondary, #8B92A5)', fontSize: '15px', margin: 0 }}>
            Play sandboxed web games created by PlayDrop hosts and sports game creators.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            flex: '1 1 500px',
          }}>
            {GENRES.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenre(g.id)}
                style={{
                  background: selectedGenre === g.id ? 'var(--primary-soft, rgba(124, 58, 237, 0.15))' : 'var(--surface, #0F1117)',
                  color: selectedGenre === g.id ? 'var(--primary, #7C3AED)' : 'var(--text-secondary, #8B92A5)',
                  border: `1px solid ${selectedGenre === g.id ? 'var(--primary, #7C3AED)' : 'var(--border, #1E2230)'}`,
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div style={{ flex: '1 1 240px', maxWidth: '320px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search games or tags…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--surface, #0F1117)',
                border: '1px solid var(--border, #1E2230)',
                borderRadius: '10px',
                color: 'var(--text)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <div className="auth-spinner" style={{ width: '28px', height: '28px', margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontSize: '14px' }}>Loading games…</p>
          </div>
        ) : games.length === 0 ? (
          <div style={{
            background: 'var(--surface, #0F1117)',
            border: '1px dashed var(--border, #1E2230)',
            borderRadius: '16px',
            padding: '54px 24px',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <GamepadIcon size={40} className="text-zinc-500" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>No games found in this genre</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px' }}>
              Be the first to build and publish a game here.
            </p>
            <Link
              href="/creator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--primary, #7C3AED)',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              <RocketIcon size={15} />
              <span>Publish in Creator Studio</span>
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {games.map(game => (
              <div
                key={game._id || game.id}
                style={{
                  background: 'var(--surface, #0F1117)',
                  border: '1px solid var(--border, #1E2230)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                <div style={{
                  height: '140px',
                  background: 'linear-gradient(135deg, var(--elevated, #161922), var(--surface, #0F1117))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <GamepadIcon size={36} className="text-violet-400 opacity-80" />

                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: 'var(--text)',
                    backdropFilter: 'blur(4px)',
                  }}>
                    v{game.currentVersion || '1.0.0'}
                  </span>
                </div>

                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                      {game.title}
                    </h3>
                  </div>

                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary, #8B92A5)',
                    lineHeight: 1.5,
                    margin: '0 0 16px',
                    flex: 1,
                  }}>
                    {game.description || 'Interactive sports experience on PlayDrop.'}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border, #1E2230)',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: 'var(--text-muted, #4B5267)',
                  }}>
                    <span>By {game.creatorId?.name || game.creatorHandle || 'Creator'}</span>
                    <span>{game.playsCount || game.playCount || 0} plays</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaunchGame(game)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--primary, #7C3AED)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <PlayIcon size={14} />
                    <span>Play Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {activePlayGame && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'var(--surface, #0F1117)',
            borderBottom: '1px solid var(--border, #1E2230)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>{activePlayGame.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                v{activePlayGame.currentVersion || '1.0.0'}
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(124, 58, 237, 0.12)',
                color: 'var(--primary)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
              }}>
                Sandboxed Runtime
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActivePlayGame(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative', background: '#000' }}>
            {(activePlayGame.resolvedBundleUrl || activePlayGame.activeVersionId?.bundleUrl) ? (
              <iframe
                src={activePlayGame.resolvedBundleUrl || activePlayGame.activeVersionId?.bundleUrl}
                title={activePlayGame.title}
                sandbox="allow-scripts"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'var(--text-secondary)',
              }}>
                <ZapIcon size={40} className="text-violet-400 mb-4" />
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>
                  Interactive Simulator Ready
                </h3>
                <p style={{ maxWidth: '440px', textAlign: 'center', fontSize: '14px', lineHeight: 1.6 }}>
                  This game is configured for the PlayDrop Client Runtime SDK.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
