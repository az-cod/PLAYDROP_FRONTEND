import { io, Socket } from 'socket.io-client';
import { mockGames, currentUser, type MockGame } from './mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://playdrop-api.onrender.com/api';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'https://playdrop-api.onrender.com/game';
const ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export function getGameSocket(): Socket {
  if (!socket) {
    socket = io(WS_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

function getStoredToken(explicitToken?: string): string | null {
  if (explicitToken) return explicitToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('playdrop_token');
  }
  return null;
}


export async function checkApiHealth(): Promise<{ online: boolean; uptimeSec?: number; latencyMs?: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${ROOT_URL}/health`, { cache: 'no-store' });
    const latencyMs = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { online: true, uptimeSec: data.uptimeSec, latencyMs };
    }
    return { online: false, latencyMs };
  } catch {
    return { online: false, latencyMs: Date.now() - start };
  }
}


export async function fetchMyProfile(token?: string) {
  const authToken = getStoredToken(token);
  if (!authToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.warn('Failed to fetch profile:', err);
    return null;
  }
}

export async function upgradeToCreatorApi(token?: string) {
  const authToken = getStoredToken(token);
  if (!authToken) throw new Error('Authentication required');

  const res = await fetch(`${API_BASE_URL}/auth/upgrade-to-creator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to upgrade to creator');
  }
  return data.user;
}

export async function registerApi(email: string, password?: string, name?: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Registration failed');
  }
  return await res.json();
}

export async function loginApi(email: string, password?: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Login failed');
  }
  return await res.json();
}

export async function resetPasswordApi(email: string, newPassword?: string) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Password reset failed');
  }
  return await res.json();
}

export async function requestMagicLinkApi(email: string) {
  const res = await fetch(`${API_BASE_URL}/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Magic link generation failed');
  }
  return await res.json();
}

export async function syncUserApi(token: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Sync user failed:', err);
    return null;
  }
}


export async function fetchMyQuota(token?: string) {
  const authToken = getStoredToken(token);
  if (!authToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/quota/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.quota;
  } catch (err) {
    console.warn('Failed to fetch user quota:', err);
    return null;
  }
}


export async function fetchPublishedGames(genre?: string, search?: string) {
  try {
    const url = new URL(`${API_BASE_URL}/games`);
    if (genre && genre !== 'ALL') url.searchParams.set('genre', genre.toLowerCase());
    if (search?.trim()) url.searchParams.set('search', search.trim());

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.games || [];
  } catch (err) {
    console.warn('Failed to fetch games:', err);
    return [];
  }
}

export async function fetchPublishedGameBySlug(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/games/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.game;
  } catch (err) {
    console.warn('Failed to fetch game details:', err);
    return null;
  }
}

export async function fetchMyPublishedGames(token?: string) {
  const authToken = getStoredToken(token);
  if (!authToken) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/games/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.games || [];
  } catch (err) {
    console.warn('Failed to fetch my games:', err);
    return [];
  }
}

export async function createPublishedGameApi(gameData: any, token?: string) {
  const authToken = getStoredToken(token);
  if (!authToken) throw new Error('Authentication required');

  const res = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(gameData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create game project');
  }
  return data.game;
}

export async function publishGameVersionApi(gameId: string, versionId?: string, token?: string) {
  const authToken = getStoredToken(token);
  if (!authToken) throw new Error('Authentication required');

  const res = await fetch(`${API_BASE_URL}/games/${gameId}/publish`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ versionId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to publish game');
  }
  return data.game;
}

export async function recordGamePlayApi(gameId: string) {
  try {
    await fetch(`${API_BASE_URL}/games/${gameId}/play`, { method: 'POST' });
  } catch {}
}


export async function requestGameGenerationApi(
  prompt: string,
  genre?: string,
  title?: string,
  token?: string,
) {
  const authToken = getStoredToken(token);
  if (!authToken) throw new Error('Authentication required');

  const res = await fetch(`${API_BASE_URL}/generation/spec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ prompt, genre, title }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to enqueue game generation');
  }
  return data;
}

export async function requestGamePatchApi(
  gameId: string,
  instruction: string,
  currentSpec?: any,
  token?: string,
) {
  const authToken = getStoredToken(token);
  if (!authToken) throw new Error('Authentication required');

  const res = await fetch(`${API_BASE_URL}/generation/patch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ gameId, instruction, currentSpec }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to enqueue patch job');
  }
  return data;
}

export async function fetchJobStatusApi(jobId: string, token?: string) {
  const authToken = getStoredToken(token);
  if (!authToken) throw new Error('Authentication required');

  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch job status');
  }
  return data.job;
}


export function generateIdempotencyKey(prefix = 'req'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function fetchNearbyGames(
  lat = 12.9352,
  lng = 77.6245,
  maxDistance = 50,
  sport?: string,
): Promise<MockGame[]> {
  try {
    const url = new URL(`${API_BASE_URL}/games/nearby`);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lng', lng.toString());
    url.searchParams.set('maxDistance', maxDistance.toString());
    if (sport && sport !== 'ALL') {
      url.searchParams.set('sport', sport);
    }

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return mockGames;
    const backendGames = await res.json();
    return backendGames.length > 0 ? backendGames : mockGames;
  } catch {
    return mockGames;
  }
}

export async function joinGameApi(gameId: string, userId = currentUser.id, idempotencyKey?: string) {
  return { joined: true, waitlisted: false };
}

export async function leaveGameApi(gameId: string, userId = currentUser.id, idempotencyKey?: string) {
  return { left: true };
}

export async function checkInApi(gameId: string, lat: number, lng: number, userId = currentUser.id, idempotencyKey?: string) {
  return { success: true };
}

export async function createGameApi(gameData: any, idempotencyKey?: string) {
  return createPublishedGameApi(gameData);
}


function getAdminHeaders(adminKey?: string, token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const key = adminKey || (typeof window !== 'undefined' ? localStorage.getItem('playdrop_admin_key') : null) || 'playdrop-admin-secret-2026';
  if (key) {
    headers['x-admin-key'] = key;
  }
  const authToken = getStoredToken(token);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

export async function fetchAdminUsageApi(adminKey?: string, token?: string) {
  const res = await fetch(`${API_BASE_URL}/admin/usage`, {
    headers: getAdminHeaders(adminKey, token),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch admin usage (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function pruneExpiredJobsApi(adminKey?: string, token?: string) {
  const res = await fetch(`${API_BASE_URL}/admin/prune-jobs`, {
    method: 'POST',
    headers: getAdminHeaders(adminKey, token),
  });
  if (!res.ok) {
    throw new Error(`Failed to prune expired jobs: ${await res.text()}`);
  }
  return res.json();
}

export async function toggleAiKillSwitchApi(enabled: boolean, adminKey?: string, token?: string) {
  const res = await fetch(`${API_BASE_URL}/admin/kill-switch`, {
    method: 'POST',
    headers: getAdminHeaders(adminKey, token),
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) {
    throw new Error(`Failed to toggle AI kill switch: ${await res.text()}`);
  }
  return res.json();
}

export async function triggerKeepaliveApi(adminKey?: string, token?: string) {
  const res = await fetch(`${API_BASE_URL}/admin/trigger-keepalive`, {
    method: 'POST',
    headers: getAdminHeaders(adminKey, token),
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger keepalive: ${await res.text()}`);
  }
  return res.json();
}

export async function triggerTestErrorApi(adminKey?: string, token?: string) {
  const res = await fetch(`${API_BASE_URL}/admin/test-error`, {
    headers: getAdminHeaders(adminKey, token),
  });
  return res.status;
}

