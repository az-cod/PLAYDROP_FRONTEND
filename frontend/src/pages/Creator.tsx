'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  fetchMyProfile,
  upgradeToCreatorApi,
  fetchMyQuota,
  fetchMyPublishedGames,
  publishGameVersionApi,
  requestGameGenerationApi,
  requestGamePatchApi,
  fetchJobStatusApi,
  checkApiHealth,
} from '@/lib/api';
import {
  ZapIcon,
  SparklesIcon,
  RocketIcon,
  GamepadIcon,
  EditIcon,
  PlayIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
} from '@/components/Icons';

export default function CreatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [apiWakingUp, setApiWakingUp] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('runner');
  const [title, setTitle] = useState('');
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [previewGame, setPreviewGame] = useState<any | null>(null);
  const [patchInstruction, setPatchInstruction] = useState('');
  const [patching, setPatching] = useState(false);
  const [myGames, setMyGames] = useState<any[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          router.push('/login?redirect=/creator');
          return;
        }
        setSessionToken(token);

        const health = await checkApiHealth();
        if (!health.online) {
          setApiWakingUp(true);
          const interval = setInterval(async () => {
            const h = await checkApiHealth();
            if (h.online) {
              setApiWakingUp(false);
              clearInterval(interval);
            }
          }, 3000);
        }

        const [prof, q, games] = await Promise.all([
          fetchMyProfile(token),
          fetchMyQuota(token),
          fetchMyPublishedGames(token),
        ]);

        setProfile(prof);
        setQuota(q);
        setMyGames(games);
      } catch (err: any) {
        setFeedback({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, supabase]);

  const handleUpgrade = async () => {
    if (!sessionToken) return;
    setUpgrading(true);
    try {
      const updated = await upgradeToCreatorApi(sessionToken);
      setProfile(updated);
      setFeedback({ message: 'Creator status unlocked.', type: 'success' });
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setUpgrading(false);
    }
  };

  const handleGenerateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !sessionToken) return;

    setGenerating(true);
    setFeedback(null);
    setPreviewGame(null);

    try {
      const res = await requestGameGenerationApi(prompt, genre, title || undefined, sessionToken);
      const jobId = res.jobId;

      setActiveJob({ id: jobId, status: 'queued' });

      const poll = setInterval(async () => {
        try {
          const status = await fetchJobStatusApi(jobId);
          setActiveJob(status);

          if (status.status === 'done') {
            clearInterval(poll);
            setGenerating(false);
            setPreviewGame(status.result);
            setFeedback({ message: 'Game generated and ready for preview.', type: 'success' });

            const updatedGames = await fetchMyPublishedGames(sessionToken);
            setMyGames(updatedGames);

            const q = await fetchMyQuota(sessionToken);
            setQuota(q);
          } else if (status.status === 'failed') {
            clearInterval(poll);
            setGenerating(false);
            setFeedback({ message: status.lastError || 'Generation failed.', type: 'error' });
            const q = await fetchMyQuota(sessionToken);
            setQuota(q);
          }
        } catch {
          clearInterval(poll);
          setGenerating(false);
        }
      }, 2000);
    } catch (err: any) {
      setGenerating(false);
      setFeedback({ message: err.message, type: 'error' });
    }
  };

  const handlePatchGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patchInstruction.trim() || !previewGame?.gameId || !sessionToken) return;

    setPatching(true);
    setFeedback(null);

    try {
      const res = await requestGamePatchApi(
        previewGame.gameId,
        previewGame.versionId,
        patchInstruction,
        sessionToken
      );

      const jobId = res.jobId;
      setActiveJob({ id: jobId, status: 'queued' });

      const poll = setInterval(async () => {
        try {
          const status = await fetchJobStatusApi(jobId);
          setActiveJob(status);

          if (status.status === 'done') {
            clearInterval(poll);
            setPatching(false);
            setPreviewGame(status.result);
            setPatchInstruction('');
            setFeedback({ message: 'Game patch applied.', type: 'success' });
            const q = await fetchMyQuota(sessionToken);
            setQuota(q);
          } else if (status.status === 'failed') {
            clearInterval(poll);
            setPatching(false);
            setFeedback({ message: status.lastError || 'Patching failed.', type: 'error' });
          }
        } catch {
          clearInterval(poll);
          setPatching(false);
        }
      }, 2000);
    } catch (err: any) {
      setPatching(false);
      setFeedback({ message: err.message, type: 'error' });
    }
  };

  const handlePublish = async (gameId: string) => {
    if (!sessionToken) return;
    setPublishingId(gameId);
    try {
      await publishGameVersionApi(gameId, undefined, sessionToken);
      setFeedback({ message: 'Game published to Community Arcade.', type: 'success' });
      const games = await fetchMyPublishedGames(sessionToken);
      setMyGames(games);
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setPublishingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#06070A', color: '#F5F7F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8B92A5', fontSize: '14px' }}>Loading Creator Studio...</p>
      </div>
    );
  }

  const isCreator = profile?.role === 'CREATOR' || profile?.role === 'ADMIN';

  return (
    <div style={{ minHeight: '100vh', background: '#06070A', color: '#F5F7F6', fontFamily: 'sans-serif' }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid #1E2230',
        background: '#0F1117',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/games" style={{ color: '#7C3AED', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            Back to Arcade
          </Link>
          <div style={{ width: '1px', height: '18px', background: '#1E2230' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ZapIcon size={18} className="text-violet-400" />
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              PlayDrop Creator Studio
            </span>
          </div>
        </div>

        {quota && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
            <span style={{ color: quota.generationsRemaining > 0 ? '#7C3AED' : '#EF4444' }}>
              {quota.generationsRemaining}/{quota.generationsLimit} gens left
            </span>
            <span style={{ color: '#8B92A5' }}>
              {quota.editsRemaining}/{quota.editsLimit} edits left
            </span>
          </div>
        )}
      </header>

      {apiWakingUp && (
        <div style={{
          background: 'linear-gradient(90deg, #1E1635, #120F24)',
          borderBottom: '1px solid #7C3AED',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '13px',
          color: '#C4B5FD',
        }}>
          <span>Render Free API is waking up from idle (~30-60s). Requests will buffer smoothly.</span>
        </div>
      )}

      {feedback && (
        <div style={{
          padding: '12px 24px',
          background: feedback.type === 'success' ? '#20163A' : '#3B1717',
          borderBottom: `1px solid ${feedback.type === 'success' ? '#7C3AED' : '#EF4444'}`,
          fontSize: '14px',
          textAlign: 'center',
        }}>
          {feedback.message}
        </div>
      )}

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 24px' }}>
        {!isCreator ? (
          <div style={{
            background: '#0F1117',
            border: '1px solid #1E2230',
            borderRadius: '16px',
            padding: '48px 32px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '40px auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <RocketIcon size={48} className="text-violet-400" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
              Unlock Game Creation
            </h2>
            <p style={{ color: '#8B92A5', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              Join the PlayDrop Creator program with 1 click. Create, customize, and publish retro arcade games powered by zero-cost AI agents.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              style={{
                background: '#7C3AED',
                color: '#fff',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              {upgrading ? 'Upgrading…' : 'Become a Creator (Free)'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: previewGame ? '1fr 1fr' : '1fr', gap: '32px' }}>
            <div>
              <div style={{ background: '#0F1117', border: '1px solid #1E2230', borderRadius: '16px', padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px' }}>
                  <SparklesIcon size={20} className="text-cyan-400" />
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                    AI Spec-to-Template Generator
                  </h2>
                </div>
                <p style={{ color: '#8B92A5', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
                  Powered by Groq and Gemini Flash zero-cost token budgets. Synthesizes a deterministic spec rendered directly to an HTML5 Canvas game.
                </p>

                <form onSubmit={handleGenerateGame}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#8B92A5', marginBottom: '6px' }}>
                      PROMPT
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Cyberpunk endless runner with neon coins and plasma traps..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#06070A',
                        border: '1px solid #1E2230',
                        borderRadius: '8px',
                        color: '#F5F7F6',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#8B92A5', marginBottom: '6px' }}>
                        GENRE TEMPLATE
                      </label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#06070A',
                          border: '1px solid #1E2230',
                          borderRadius: '8px',
                          color: '#F5F7F6',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      >
                        <option value="runner">Endless Runner</option>
                        <option value="shooter">Space Shooter</option>
                        <option value="clicker">Clicker Tycoon</option>
                        <option value="puzzle">Grid Puzzle</option>
                        <option value="quiz">Trivia Challenge</option>
                        <option value="platformer">2D Platformer</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#8B92A5', marginBottom: '6px' }}>
                        TITLE (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        placeholder="My Awesome Game"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#06070A',
                          border: '1px solid #1E2230',
                          borderRadius: '8px',
                          color: '#F5F7F6',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={generating || (quota && quota.generationsRemaining <= 0)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: quota && quota.generationsRemaining <= 0 ? '#1E2230' : '#7C3AED',
                      color: quota && quota.generationsRemaining <= 0 ? '#8B92A5' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: quota && quota.generationsRemaining <= 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {generating
                      ? 'Synthesizing Game in Queue…'
                      : quota && quota.generationsRemaining <= 0
                      ? 'Daily Capacity Reached (Resets 00:00 UTC)'
                      : 'Generate Game'}
                  </button>
                </form>

                {activeJob && (
                  <div style={{
                    marginTop: '20px',
                    padding: '14px',
                    background: '#161922',
                    borderRadius: '8px',
                    border: '1px solid #1E2230',
                    fontSize: '13px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700 }}>Job Status:</span>
                      <span style={{ color: activeJob.status === 'done' ? '#7C3AED' : '#C4B5FD', textTransform: 'uppercase', fontWeight: 800 }}>
                        {activeJob.status}
                      </span>
                    </div>
                    <p style={{ color: '#8B92A5', fontSize: '12px', margin: 0 }}>
                      {activeJob.status === 'queued' && 'Waiting for worker process slot…'}
                      {activeJob.status === 'running' && 'Synthesizing JSON spec, running safety checks & rendering HTML bundle…'}
                      {activeJob.status === 'done' && 'Bundle verified and saved to Cloudflare R2.'}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                  My Games ({myGames.length})
                </h3>
                {myGames.length === 0 ? (
                  <p style={{ color: '#8B92A5', fontSize: '13px' }}>No games created yet. Generate your first one above.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {myGames.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          background: '#0F1117',
                          border: '1px solid #1E2230',
                          padding: '16px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>{g.title}</h4>
                          <span style={{ fontSize: '12px', color: g.status === 'published' ? '#7C3AED' : '#EAB308' }}>
                            {g.status} | {g.playCount || 0} plays
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {g.status !== 'published' && (
                            <button
                              onClick={() => handlePublish(g.id)}
                              disabled={publishingId === g.id}
                              style={{
                                background: '#7C3AED',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {publishingId === g.id ? 'Publishing…' : 'Publish'}
                            </button>
                          )}
                          <Link
                            href="/games"
                            style={{
                              background: '#161922',
                              border: '1px solid #1E2230',
                              color: '#F5F7F6',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              textDecoration: 'none',
                            }}
                          >
                            Arcade
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {previewGame && (
              <div>
                <div style={{
                  background: '#0F1117',
                  border: '1px solid #1E2230',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '760px',
                }}>
                  <div style={{
                    padding: '12px 20px',
                    background: '#161922',
                    borderBottom: '1px solid #1E2230',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GamepadIcon size={16} className="text-violet-400" />
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>
                        Live Preview: {previewGame.title || previewGame.spec?.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#7C3AED' }}>
                      Sandboxed Iframe (allow-scripts)
                    </span>
                  </div>

                  <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                    <iframe
                      src={previewGame.publicUrl}
                      title="Game Preview"
                      sandbox="allow-scripts"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>

                  <div style={{ padding: '16px', background: '#0F1117', borderTop: '1px solid #1E2230' }}>
                    <form onSubmit={handlePatchGame} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Patch edit: 'Make obstacles faster and change goal score to 200'…"
                        value={patchInstruction}
                        onChange={(e) => setPatchInstruction(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          background: '#06070A',
                          border: '1px solid #1E2230',
                          borderRadius: '8px',
                          color: '#F5F7F6',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={patching || !patchInstruction.trim()}
                        style={{
                          background: '#3B82F6',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {patching ? 'Patching…' : 'Apply Patch'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
