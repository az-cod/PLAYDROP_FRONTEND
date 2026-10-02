'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
 mockGames, sportFilters, currentUser,
 formatDistance, formatTime, getTimeUntil,
 getStatusPillClass, getStatusLabel,
 type MockGame, type MockPlayer,
} from '@/lib/mock-data';
import {
 fetchNearbyGames,
 joinGameApi,
 leaveGameApi,
 createGameApi,
 checkInApi,
 getGameSocket,
 generateIdempotencyKey,
 syncUserApi,
} from '@/lib/api';
import AuthModal from '@/components/AuthModal';
import LocationModal from '@/components/LocationModal';
import { createClient } from '@/utils/supabase/client';

import { getGoogleMapsUrl, POPULAR_VENUES, calculateDistanceMeters } from '@/lib/maps';

const GameMap = dynamic(() => import('@/components/GameMap'), { ssr: false });
const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), { ssr: false });


const Icons = {
 Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
 Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
 Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
 Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
 MessageSquare: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
 Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
 User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
 MapPin: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
 Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
 ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
 ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
 Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
 Trophy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
 Map: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
 Logo: () => (
 <svg viewBox="0 0 32 32" fill="none">
 <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" />
 <path d="M16 6 L16 16 L22 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
 <circle cx="16" cy="16" r="3" fill="currentColor" />
 </svg>
 ),
 X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Compass: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  ExternalLink: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
};


export default function HomePage() {
 const [activeSport, setActiveSport] = useState('ALL');
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedGame, setSelectedGame] = useState<MockGame | null>(null);
 const [activeTab, setActiveTab] = useState('home');
 const [toastMessage, setToastMessage] = useState('');
 const [toastType, setToastType] = useState<'success' | 'error'>('success');
 const [showToast, setShowToast] = useState(false);
 const [games, setGames] = useState<MockGame[]>(mockGames);
 const [joinedGames, setJoinedGames] = useState<Set<string>>(new Set());
 const [liveCounters, setLiveCounters] = useState<Map<string, number>>(new Map());
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [isLiveConnected, setIsLiveConnected] = useState(false);
 const [showAuthModal, setShowAuthModal] = useState(false);
 const [authUser, setAuthUser] = useState<any>(null);
 const [isActionPending, setIsActionPending] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    isLive: boolean;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

const showToastMessage = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
 setToastMessage(msg);
 setToastType(type);
 setShowToast(true);
 setTimeout(() => setShowToast(false), 3500);
 }, []);

  const requestLiveLocation = useCallback(async (isUserInitiated = false) => {
    // CRITICAL: Do NOT access location until the user logs in
    if (!authUser) {
      if (isUserInitiated) {
        setShowAuthModal(true);
        showToastMessage('Please sign in to enable live GPS location', 'error');
      }
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      if (isUserInitiated) showToastMessage('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    const applyPosition = async (lat: number, lng: number) => {
      let areaName = `Live GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const sub = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || data.address?.city_district || data.address?.city || data.address?.town;
          const city = data.address?.city || data.address?.state_district || data.address?.state;
          if (sub && city && sub !== city) {
            areaName = `${sub}, ${city}`;
          } else if (sub || city) {
            areaName = `${sub || city}`;
          }
        }
      } catch {}

      setUserLocation({
        lat,
        lng,
        name: areaName,
        isLive: true,
      });
      setIsLocating(false);
      showToastMessage(`📍 Live location locked: ${areaName}`);

      fetchNearbyGames(lat, lng, 50, activeSport).then(fetched => {
        if (fetched && fetched.length > 0) {
          setGames(fetched);
          const counters = new Map<string, number>();
          fetched.forEach(g => counters.set(g.id, g.confirmedPlayers));
          setLiveCounters(counters);
        }
      });
    };

    // 2-stage GPS acquisition: fast high accuracy -> reliable low accuracy fallback
    navigator.geolocation.getCurrentPosition(
      (pos) => applyPosition(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn('High-accuracy GPS timed out, trying standard accuracy fallback...', err);
        navigator.geolocation.getCurrentPosition(
          (pos) => applyPosition(pos.coords.latitude, pos.coords.longitude),
          (fallbackErr) => {
            setIsLocating(false);
            const msg = fallbackErr.code === 1
              ? 'Location permission denied in browser settings'
              : 'Unable to acquire GPS signal. Check your device location settings.';
            setLocationError(msg);
            if (isUserInitiated) showToastMessage(msg, 'error');
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  }, [authUser, activeSport, showToastMessage]);

  const handleSelectHub = useCallback((hub: { name: string; lat: number; lng: number }) => {
    setUserLocation({
      lat: hub.lat,
      lng: hub.lng,
      name: hub.name,
      isLive: false,
    });
    setShowLocationModal(false);
    showToastMessage(`Browsing games near ${hub.name}`);
    fetchNearbyGames(hub.lat, hub.lng, 50, activeSport).then(fetched => {
      if (fetched && fetched.length > 0) {
        setGames(fetched);
        const counters = new Map<string, number>();
        fetched.forEach(g => counters.set(g.id, g.confirmedPlayers));
        setLiveCounters(counters);
      }
    });
  }, [activeSport, showToastMessage]);

 useEffect(() => {
 if (typeof window !== 'undefined') {
 const urlParams = new URLSearchParams(window.location.search);
 const magicToken = urlParams.get('magicToken');
 if (magicToken) {
 syncUserApi(magicToken).then((res: any) => {
 if (res?.user) {
 setAuthUser(res.user);
 localStorage.setItem('playdrop_auth_user', JSON.stringify(res.user));
 localStorage.setItem('playdrop_token', magicToken);
 showToastMessage(`Logged in via Magic Link!`);
 window.history.replaceState({}, document.title, window.location.pathname);
 }
 });
 } else {
 const savedUser = localStorage.getItem('playdrop_auth_user');
 if (savedUser) {
 try {
 setAuthUser(JSON.parse(savedUser));
 } catch {}
 }
 }
 }

 fetchNearbyGames(12.9352, 77.6245, 50, activeSport).then(fetched => {
 if (fetched && fetched.length > 0) {
 setGames(fetched);
 const counters = new Map<string, number>();
 fetched.forEach(g => counters.set(g.id, g.confirmedPlayers));
 setLiveCounters(counters);
 setIsLiveConnected(true);
 }
 });

 const socket = getGameSocket();
 socket.on('connect', () => setIsLiveConnected(true));

 socket.on('game-event', (payload: any) => {
 if (payload.event === 'GAME_CREATED') {
 fetchNearbyGames(12.9352, 77.6245, 50, activeSport).then(fetched => {
 if (fetched && fetched.length > 0) {
 setGames(fetched);
 const counters = new Map<string, number>();
 fetched.forEach(g => counters.set(g.id, g.confirmedPlayers));
 setLiveCounters(counters);
 }
 });
 showToastMessage(` New game posted: ${payload.data?.playground?.name || 'Local Ground'} (${payload.data?.sport || 'Game'})!`);
 } else if (payload.event === 'SLOT_OPENED') {
 const venue = payload.data?.venue || 'Local Turf';
 const sport = payload.data?.sport || 'Game';
 showToastMessage(` LAST MINUTE SLOT OPENED: ${venue} (${sport})! Grab it now!`, 'success');
 if (payload.data?.confirmedPlayers !== undefined) {
 setLiveCounters(prev => {
 const next = new Map(prev);
 next.set(payload.gameId, payload.data.confirmedPlayers);
 return next;
 });
 }
 } else if (payload.data?.confirmedPlayers !== undefined) {
 setLiveCounters(prev => {
 const next = new Map(prev);
 next.set(payload.gameId, payload.data.confirmedPlayers);
 return next;
 });
 }
 });

 const supabase = createClient();
 supabase.auth.getSession().then(({ data: { session } }) => {
 if (session?.user) {
 setAuthUser(session.user);
 if (typeof window !== 'undefined') {
 localStorage.setItem('playdrop_auth_user', JSON.stringify(session.user));
 }
 }
 });

 const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
 if (session?.user) {
 setAuthUser(session.user);
 if (typeof window !== 'undefined') {
 localStorage.setItem('playdrop_auth_user', JSON.stringify(session.user));
 }
 }
 });

 return () => {
 socket.off('game-event');
 subscription.unsubscribe();
 };
 }, [activeSport, showToastMessage]);

 const filteredGames = games.filter(g => {
 const matchesSport = activeSport === 'ALL' || g.sport === activeSport;
 const matchesSearch = !searchQuery.trim() ||
 g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 g.playground.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 g.playground.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
 g.sport.toLowerCase().includes(searchQuery.toLowerCase());
 return matchesSport && matchesSearch;
 });

 const sortedGames = [...filteredGames].sort((a, b) => {
 const aNeed = a.capacity - (liveCounters.get(a.id) ?? a.confirmedPlayers);
 const bNeed = b.capacity - (liveCounters.get(b.id) ?? b.confirmedPlayers);
 if (aNeed === 1 && bNeed !== 1) return -1;
 if (bNeed === 1 && aNeed !== 1) return 1;
 return a.distance - b.distance;
 });

 const handleJoinGame = useCallback(async (game: MockGame) => {
 if (isActionPending) return;
 const currentCount = liveCounters.get(game.id) ?? game.confirmedPlayers;
 if (currentCount >= game.capacity) {
 showToastMessage('Game is full! Added to waitlist.', 'error');
 return;
 }

 setIsActionPending(true);
 const playerId = authUser?.id || authUser?.email || currentUser.id;
 const idemKey = generateIdempotencyKey(`join_${game.id}_${playerId}`);

 try {
 await joinGameApi(game.id, playerId, idemKey);
 } catch {
 } finally {
 setIsActionPending(false);
 }

 setJoinedGames(prev => new Set([...prev, game.id]));
 setLiveCounters(prev => {
 const next = new Map(prev);
 next.set(game.id, currentCount + 1);
 return next;
 });

 const newNeed = game.capacity - (currentCount + 1);
 showToastMessage(
 newNeed === 0
 ? ` Game full! All ${game.capacity} slots filled.`
 : ` Joined! ${newNeed} more player${newNeed > 1 ? 's' : ''} needed.`,
 'success',
 );
 }, [authUser, liveCounters, showToastMessage, isActionPending]);

 const handleLeaveGame = useCallback(async (game: MockGame) => {
 if (isActionPending) return;
 setIsActionPending(true);
 const playerId = authUser?.id || authUser?.email || currentUser.id;
 const idemKey = generateIdempotencyKey(`leave_${game.id}_${playerId}`);
 const currentCount = liveCounters.get(game.id) ?? game.confirmedPlayers;

 try {
 await leaveGameApi(game.id, playerId, idemKey);
 setJoinedGames(prev => {
 const next = new Set(prev);
 next.delete(game.id);
 return next;
 });
 setLiveCounters(prev => {
 const next = new Map(prev);
 next.set(game.id, Math.max(0, currentCount - 1));
 return next;
 });
 showToastMessage(' You left the game. Slot broadcasted as open to nearby players!', 'success');
 } catch {
 showToastMessage('Failed to leave game. Please try again.', 'error');
 } finally {
 setIsActionPending(false);
 }
 }, [authUser, liveCounters, showToastMessage, isActionPending]);

 const handleCheckIn = useCallback(async (game: MockGame, coords?: { lat: number; lng: number }) => {
 if (isActionPending) return;
 setIsActionPending(true);
 const playerId = authUser?.id || authUser?.email || currentUser.id;
 const idemKey = generateIdempotencyKey(`checkin_${game.id}_${playerId}`);

 const lat = coords?.lat ?? game.playground.lat;
 const lng = coords?.lng ?? game.playground.lng;

 try {
 await checkInApi(game.id, lat, lng, playerId, idemKey);
 showToastMessage(` Checked in successfully at ${game.playground.name}!`, 'success');
 } catch (err: any) {
 showToastMessage(err.message || `Check-in failed at ${game.playground.name}`, 'error');
 throw err;
 } finally {
 setIsActionPending(false);
 }
 }, [authUser, showToastMessage, isActionPending]);


 return (
 <div className="app-layout">
 
 <aside className="sidebar">
 <div className="sidebar-logo">
 <Icons.Logo />
 <span>PlayDrop</span>
 </div>

 <nav className="sidebar-nav">
 {[
 { key: 'home', icon: Icons.Home, label: 'Home' },
 { key: 'find', icon: Icons.Search, label: 'Find Game' },
 { key: 'create', icon: Icons.Plus, label: 'Create Game' },
 { key: 'mygames', icon: Icons.Calendar, label: 'My Games' },
 { key: 'messages', icon: Icons.MessageSquare, label: 'Messages' },
 { key: 'notifications', icon: Icons.Bell, label: 'Notifications', badge: 3 },
 { key: 'arcade', icon: Icons.Map, label: 'Cloud Arcade', href: '/games' },
 { key: 'creator', icon: Icons.Trophy, label: 'Creator Studio', href: '/creator' },
 { key: 'profile', icon: Icons.User, label: 'Profile' },
 ].map(item => item.href ? (
 <Link
 key={item.key}
 href={item.href}
 className="nav-item"
 style={{ textDecoration: 'none' }}
 >
 <item.icon />
 {item.label}
 </Link>
 ) : (
 <button
 key={item.key}
 className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
 onClick={() => {
 setActiveTab(item.key);
 if (item.key === 'create') setShowCreateModal(true);
 if (item.key === 'home') setSelectedGame(null);
 }}
 >
 <item.icon />
 {item.label}
 {item.badge && <span className="badge">{item.badge}</span>}
 </button>
 ))}
 </nav>

 {authUser ? (
 <div className="sidebar-profile">
 <div className="sidebar-profile-avatar" style={{ overflow: 'hidden' }}>
 {authUser.user_metadata?.avatar_url ? (
 <img src={authUser.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 ) : (
 authUser.email?.substring(0, 2).toUpperCase() || 'PL'
 )}
 </div>
 <div className="sidebar-profile-info" style={{ overflow: 'hidden' }}>
 <div className="sidebar-profile-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
 {authUser.user_metadata?.full_name || authUser.email?.split('@')[0]}
 </div>
 <div className="sidebar-profile-handle" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 'var(--text-2xs)' }}>
 {authUser.email}
 </div>
 </div>
 <button
 title="Sign Out"
 onClick={async () => {
 const supabase = createClient();
 try { await supabase.auth.signOut(); } catch {}
 if (typeof window !== 'undefined') {
 localStorage.removeItem('playdrop_auth_user');
 localStorage.removeItem('playdrop_token');
 }
 setAuthUser(null);
 showToastMessage('Signed out');
 }}
 style={{ color: 'var(--text-muted)', padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
 >
 <Icons.X />
 </button>
 </div>
 ) : (
 <div style={{ padding: '0 16px 16px' }}>
 <Link
 href="/login"
 className="join-btn"
 style={{
 width: '100%',
 height: '36px',
 fontSize: 'var(--text-xs)',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 textDecoration: 'none',
 }}
 aria-label="Sign In or Join PlayDrop"
 >
 Sign In / Join
 </Link>
 </div>
 )}
 </aside>

 
 <main className="main-content">
 {selectedGame ? (
 <GameRoom
 game={selectedGame}
 liveCount={liveCounters.get(selectedGame.id) ?? selectedGame.confirmedPlayers}
 onBack={() => setSelectedGame(null)}
 onJoin={() => handleJoinGame(selectedGame)}
 onLeave={handleLeaveGame}
 onCheckIn={handleCheckIn}
 isJoined={joinedGames.has(selectedGame.id)}
 isActionPending={isActionPending}
 />
 ) : activeTab === 'profile' ? (
 <ProfilePage
 authUser={authUser}
 onSignOut={async () => {
 const supabase = createClient();
 try { await supabase.auth.signOut(); } catch {}
 if (typeof window !== 'undefined') {
 localStorage.removeItem('playdrop_auth_user');
 localStorage.removeItem('playdrop_token');
 }
 setAuthUser(null);
 showToastMessage('Signed out');
 }}
 onRequireAuth={() => setShowAuthModal(true)}
 />
 ) : activeTab === 'notifications' ? (
 <NotificationsPage />
 ) : activeTab === 'mygames' ? (
 <MyGamesPage
 games={games}
 joinedGames={joinedGames}
 authUser={authUser}
 onSelectGame={setSelectedGame}
 onOpenCreate={() => setShowCreateModal(true)}
 />
 ) : activeTab === 'messages' ? (
 <MessagesPage games={games} authUser={authUser} />
 ) : (
 <>
 
 <div className="page-header">
 <div>
 <h1>
 Find Your Game.<br />
 <span className="accent">Fill the Slot.</span>
 </h1>
 <p>Real people. Real games. Near you.</p>
 </div>
 <div className="header-actions">
 <button className="location-badge" aria-label="Location: Koramangala, Bengaluru">
 <Icons.MapPin />
 Koramangala, Bengaluru
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
 </button>
 <button className="icon-btn" aria-label="Notifications (3 unread)" onClick={() => setActiveTab('notifications')}>
 <Icons.Bell />
 <span className="dot" />
 </button>
 {!authUser && (
 <Link
 href="/login"
 className="join-btn header-auth-btn"
 style={{
 textDecoration: 'none',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 }}
 aria-label="Sign In or Join PlayDrop"
 >
 Sign In / Join
 </Link>
 )}
 </div>
 </div>

 
 <div className="search-bar">
 <Icons.Search />
 <input
 placeholder="Search by location, sport or venue..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 />
 {searchQuery && (
 <button
 type="button"
 onClick={() => setSearchQuery('')}
 style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 8px' }}
 >
                <Icons.X />
 </button>
 )}
 <button className="filter-btn">
 <Icons.Filter />
 </button>
 </div>

 
 <div className="sport-filters">
 {sportFilters.map(sf => (
 <button
 key={sf.key}
 className={`sport-chip ${activeSport === sf.key ? 'active' : ''}`}
 onClick={() => setActiveSport(sf.key)}
 >
 {sf.label} ({sf.count})
 </button>
 ))}
 </div>

 
 <div className="map-section">
 <div className="map-container">
 <GameMap
 games={filteredGames}
 liveCounters={liveCounters}
 onGameClick={(g) => setSelectedGame(g)}
 />
 </div>
 </div>

 
 <div className="games-section">
 <div className="section-header">
 <h2 className="section-title">Nearby Games</h2>
 <button className="section-link">
 See all <Icons.ArrowRight />
 </button>
 </div>

 <div className="games-grid stagger">
 {sortedGames.map((game) => {
 const liveCount = liveCounters.get(game.id) ?? game.confirmedPlayers;
 const needed = game.capacity - liveCount;
 const isNeedOne = needed === 1;
 const isFull = needed <= 0;
 const fillPercent = (liveCount / game.capacity) * 100;

 return (
 <div
 key={game.id}
 className={`game-card animate-fade-in ${isNeedOne ? 'need-one' : ''}`}
 onClick={() => setSelectedGame(game)}
 style={{ cursor: 'pointer' }}
 >
 {isNeedOne && (
 <div className="need-one-banner">
 <span className="fire"></span>
 ONE MORE PLAYER NEEDED
 </div>
 )}

 <div className="game-card-image">
 <div style={{
 width: '100%', height: '100%',
 background: `linear-gradient(135deg, var(--elevated), var(--surface))`,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: 'var(--text-2xl)', opacity: 0.5,
 }}>
 {game.sportEmoji}
 </div>

 <div className="game-card-sport-badge">
 <span>{game.sportEmoji}</span>
 {game.sport}
 </div>

 {game.isLive ? (
 <div className="live-badge">
 <span className="pulse" />
 LIVE
 </div>
 ) : (
 <div className="time-badge">{getTimeUntil(game.startsAt)}</div>
 )}
 </div>

 <div className="game-card-body">
 <div className="game-card-title">{game.title}</div>
 <div className="game-card-meta">
 <Icons.MapPin />
 <span>{formatDistance(game.distance)} away</span>
 <a
 href={getGoogleMapsUrl(game.playground)}
 target="_blank"
 rel="noopener noreferrer"
 onClick={(e) => e.stopPropagation()}
 style={{
 color: 'var(--primary)',
 marginLeft: '6px',
 fontSize: '11px',
 fontWeight: 600,
 display: 'inline-flex',
 alignItems: 'center',
 gap: '2px',
 background: 'rgba(124, 58, 237, 0.12)',
 padding: '1px 6px',
 borderRadius: '4px',
 border: '1px solid rgba(124, 58, 237, 0.3)',
 textDecoration: 'none',
 }}
 title="Open directions in Google Maps"
 >
 Maps <Icons.ExternalLink />
 </a>
 <span className="dot" />
 <span>Starts {formatTime(game.startsAt)}</span>
 </div>

 <div className="player-count-section">
 <div className="player-count-row">
 <span className="player-count">
 {liveCount} <span className="slash">/</span> <span className="total">{game.capacity}</span>
 </span>
 {!isFull && (
 <span className={`need-badge ${isNeedOne ? 'urgent' : ''}`}>
 NEED {needed} MORE
 </span>
 )}
 {isFull && (
 <span style={{ color: 'var(--status-danger)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
 FULL
 </span>
 )}
 </div>
 <div className="player-bar">
 <div
 className={`player-bar-fill ${fillPercent >= 90 ? 'almost-full' : ''} ${isFull ? 'full' : ''}`}
 style={{ width: `${Math.min(fillPercent, 100)}%` }}
 />
 </div>
 </div>

 <div className="player-avatars">
 {game.players.slice(0, 4).map(p => (
 <div key={p.id} className="player-avatar">{p.initials}</div>
 ))}
 {game.players.length > 4 && (
 <div className="player-avatar more">+{game.players.length - 4}</div>
 )}
 </div>

 <button
 className={`join-btn ${isFull ? 'waitlist' : ''} ${joinedGames.has(game.id) ? 'full' : ''}`}
 onClick={(e) => {
 e.stopPropagation();
 if (joinedGames.has(game.id)) return;
 handleJoinGame(game);
 }}
 >
 {joinedGames.has(game.id) ? 'Joined' : isFull ? 'Join Waitlist' : 'Join Game'}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </>
 )}
 </main>

 
 {!selectedGame && (activeTab === 'home' || activeTab === 'find') && (
 <aside className="right-panel">
 
 <div style={{ marginBottom: '24px' }}>
 <div className="section-header">
 <h3 className="section-title">My Upcoming Games</h3>
 <button className="section-link">
 See all <Icons.ArrowRight />
 </button>
 </div>

 {games.slice(0, 3).map(game => (
 <div key={game.id} className="upcoming-game-item" onClick={() => setSelectedGame(game)}>
 <div className="upcoming-sport-icon">{game.sportEmoji}</div>
 <div className="upcoming-info">
 <div className="upcoming-name">{game.sport.charAt(0) + game.sport.slice(1).toLowerCase()}</div>
 <div className="upcoming-detail">{game.playground.name}</div>
 <div className="upcoming-detail">{getTimeUntil(game.startsAt)}</div>
 </div>
 <div className="upcoming-count">
 {liveCounters.get(game.id) ?? game.confirmedPlayers}/{game.capacity}
 </div>
 <span style={{ width: '16px', height: '16px', color: 'var(--text-muted)', flexShrink: 0 }}>
 <Icons.ChevronRight />
 </span>
 </div>
 ))}
 </div>

 
 <div style={{ marginBottom: '24px' }}>
 <div className="section-header">
 <h3 className="section-title">Your Reliability</h3>
 </div>
 <div className="reliability-card">
 <div className="reliability-header">
 <span className="reliability-label">
 <Icons.Trophy />
 </span>
 <span className="reliability-score">{currentUser.reliabilityPercent}%</span>
 </div>
 <div className="reliability-bar">
 <div
 className="reliability-bar-fill"
 style={{
 width: `${currentUser.reliabilityPercent}%`,
 background: currentUser.reliabilityPercent >= 80 ? 'var(--brand-gradient, var(--primary))' : 'var(--status-warning)',
 }}
 />
 </div>
 <div className="reliability-stats">
 <div className="reliability-stat">
 <div className="value">{currentUser.successfulGames}</div>
 <div className="label">Games</div>
 </div>
 <div className="reliability-stat">
 <div className="value">{currentUser.noShows}</div>
 <div className="label">No-shows</div>
 </div>
 <div className="reliability-stat">
 <div className="value">{Math.round(currentUser.checkInRate * 100)}%</div>
 <div className="label">Check-in rate</div>
 </div>
 </div>
 </div>
 </div>
 </aside>
 )}

 
 <nav className="mobile-nav">
 <div className="mobile-nav-items">
 {[
 { key: 'home', icon: Icons.Home, label: 'Home' },
 { key: 'find', icon: Icons.Map, label: 'Map' },
 { key: 'create', icon: Icons.Plus, label: '', fab: true },
 { key: 'messages', icon: Icons.MessageSquare, label: 'Messages' },
 { key: 'profile', icon: Icons.User, label: 'Profile' },
 ].map(item => (
 <button
 key={item.key}
 className={`mobile-nav-item ${activeTab === item.key ? 'active' : ''}`}
 onClick={() => {
 setActiveTab(item.key);
 if (item.key === 'create') setShowCreateModal(true);
 if (item.key === 'home') setSelectedGame(null);
 }}
 >
 {item.fab ? (
 <div className="create-game-fab">
 <Icons.Plus />
 </div>
 ) : (
 <>
 <item.icon />
 {item.label}
 </>
 )}
 </button>
 ))}
 </div>
 </nav>

 <div className={`toast ${showToast ? 'show' : ''} ${toastType}`}>
 {toastMessage}
 </div>

 
 {showCreateModal && (
 <CreateGameModal
 onClose={() => setShowCreateModal(false)}
 onCreated={(newGame, msg) => {
 setGames(prev => [newGame, ...prev.filter(g => g.id !== newGame.id)]);
 setLiveCounters(prev => {
 const next = new Map(prev);
 next.set(newGame.id, newGame.confirmedPlayers);
 return next;
 });
 setJoinedGames(prev => new Set([...prev, newGame.id]));
 showToastMessage(msg, 'success');
 }}
 authUser={authUser}
 onRequireAuth={() => setShowAuthModal(true)}
 />
 )}

 
 <AuthModal
 isOpen={showAuthModal}
 onClose={() => setShowAuthModal(false)}
 onSuccess={(user) => {
 setAuthUser(user);
 showToastMessage(`Welcome to PlayDrop, ${user.user_metadata?.full_name || user.email}!`);
 }}
 />
 </div>
 );
}


function GameRoom({ game, liveCount, onBack, onJoin, onLeave, onCheckIn, isJoined, isActionPending }: {
 game: MockGame;
 liveCount: number;
 onBack: () => void;
 onJoin: () => void;
 onLeave?: (game: MockGame) => void;
 onCheckIn?: (game: MockGame, coords?: { lat: number; lng: number }) => Promise<void> | void;
 isJoined: boolean;
 isActionPending?: boolean;
}) {
 const needed = game.capacity - liveCount;
 const isFull = needed <= 0;

 const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
 const [distanceToGround, setDistanceToGround] = useState<number | null>(null);
 const [isSimulatedArrival, setIsSimulatedArrival] = useState(false);
 const [isCheckedIn, setIsCheckedIn] = useState(false);
 const [isGpsLoading, setIsGpsLoading] = useState(false);
 const [gpsError, setGpsError] = useState('');

 const GEOFENCE_RADIUS_METERS = 200; // Geofence requirement: 200m from turf

 useEffect(() => {
 if (!isJoined) return;
 if (!navigator.geolocation) {
 setGpsError('Geolocation is not supported by your browser');
 return;
 }

 setIsGpsLoading(true);

 const updatePosition = (lat: number, lng: number) => {
 setUserCoords({ lat, lng });
 const dist = calculateDistanceMeters(lat, lng, game.playground.lat, game.playground.lng);
 setDistanceToGround(dist);
 setIsGpsLoading(false);
 setGpsError('');
 };

 navigator.geolocation.getCurrentPosition(
 (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude),
 (err) => {
 setIsGpsLoading(false);
 setGpsError(err.message || 'GPS location unavailable');
 },
 { enableHighAccuracy: true, timeout: 10000 }
 );

 const watchId = navigator.geolocation.watchPosition(
 (pos) => {
 if (!isSimulatedArrival) {
 updatePosition(pos.coords.latitude, pos.coords.longitude);
 }
 },
 () => {},
 { enableHighAccuracy: true, maximumAge: 5000 }
 );

 return () => navigator.geolocation.clearWatch(watchId);
 }, [isJoined, game.playground.lat, game.playground.lng, isSimulatedArrival]);

 const isAtVenue = distanceToGround !== null && distanceToGround <= GEOFENCE_RADIUS_METERS;

 const toggleSimulateArrival = () => {
 if (!isSimulatedArrival) {
 setIsSimulatedArrival(true);
 setUserCoords({ lat: game.playground.lat, lng: game.playground.lng });
 setDistanceToGround(15);
 setGpsError('');
 } else {
 setIsSimulatedArrival(false);
 navigator.geolocation.getCurrentPosition((pos) => {
 setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
 setDistanceToGround(calculateDistanceMeters(pos.coords.latitude, pos.coords.longitude, game.playground.lat, game.playground.lng));
 });
 }
 };

 const handleDoCheckIn = async () => {
 if (!onCheckIn) return;
 const coords = userCoords || { lat: game.playground.lat, lng: game.playground.lng };
 try {
 await onCheckIn(game, coords);
 setIsCheckedIn(true);
 } catch {}
 };

 return (
 <div className="game-room animate-fade-in">
 
 <button
 onClick={onBack}
 style={{
 display: 'flex', alignItems: 'center', gap: '8px',
 color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500,
 marginBottom: '16px', padding: '6px 0',
 }}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
 Back to games
 </button>

 
 <div className="game-room-header">
 <div className="game-room-sport">
 <span style={{ fontSize: '20px' }}>{game.sportEmoji}</span>
 {game.sport}
 {game.isLive && (
 <span className="live-badge" style={{ position: 'static' }}>
 <span className="pulse" />
 LIVE
 </span>
 )}
 </div>
 <h1 className="game-room-title">{game.playground.name}</h1>
 <div className="game-room-meta" style={{ flexWrap: 'wrap', gap: '8px' }}>
 <a
 href={getGoogleMapsUrl(game.playground)}
 target="_blank"
 rel="noopener noreferrer"
 className="maps-direction-pill"
 title="Open directions in Google Maps"
 >
 <Icons.MapPin />
 <span>{formatDistance(game.distance)} away</span>
 <span style={{ opacity: 0.5 }}>•</span>
 <span> Google Maps <Icons.ExternalLink /></span>
 </a>
 <span>•</span>
 <span>{formatTime(game.startsAt)} to {formatTime(game.endsAt)}</span>
 <span>•</span>
 <span>Hosted by {game.hostName}</span>
 </div>
 </div>

 
 <div className="game-room-count">
 <div className="big-count">
 {liveCount} <span className="slash">/</span> <span className="total">{game.capacity}</span>
 </div>
 <div className="count-label">Players</div>
 {!isFull && (
 <div className="need-text">
 {needed === 1 ? ' Need 1 more player!' : `● Need ${needed} more`}
 </div>
 )}
 {isFull && (
 <div className="need-text" style={{ color: 'var(--status-warning)' }}>
 Game is full
 </div>
 )}
 </div>

 
 <div style={{ marginBottom: '24px' }}>
 <div className="player-bar" style={{ height: '8px' }}>
 <div
 className={`player-bar-fill ${(liveCount / game.capacity) >= 0.9 ? 'almost-full' : ''}`}
 style={{ width: `${(liveCount / game.capacity) * 100}%` }}
 />
 </div>
 </div>

 
 {!isJoined && (
 <button
 className={`join-btn ${isFull ? 'waitlist' : ''}`}
 style={{ marginBottom: '24px', padding: '14px', fontSize: '16px' }}
 onClick={onJoin}
 disabled={isActionPending}
 >
 {isActionPending ? 'Processing...' : isFull ? 'Join Waitlist' : needed === 1 ? ' Fill the Last Slot!' : 'Join Game'}
 </button>
 )}
 {isJoined && (
 <div className="checkin-container">
 {isCheckedIn ? (
 <div className="checkin-badge checked-in">
 <span className="dot pulse" />
 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> You are checked in at {game.playground.name}! Match slot confirmed.</span>
 </div>
 ) : isAtVenue ? (
 <div className="checkin-badge ready">
 <span className="dot pulse" />
 <span> You have arrived! ({distanceToGround}m away) — Check-in unlocked!</span>
 </div>
 ) : (
 <div className="checkin-badge locked">
 <span></span>
 <span>
 {distanceToGround !== null
 ? `${formatDistance(distanceToGround)} away from venue • Check-in unlocks within ${GEOFENCE_RADIUS_METERS}m of turf`
 : isGpsLoading
 ? 'Acquiring live GPS location...'
 : gpsError
 ? `GPS: ${gpsError}`
 : 'Awaiting device GPS...'}
 </span>
 </div>
 )}

 <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
 <button
 type="button"
 className={`checkin-btn ${isCheckedIn ? 'done' : isAtVenue ? 'active' : 'disabled'}`}
 onClick={handleDoCheckIn}
 disabled={!isAtVenue || isActionPending || isCheckedIn}
 title={
 isCheckedIn
 ? 'Checked in'
 : isAtVenue
 ? 'Confirm your arrival at the venue'
 : `Reach within ${GEOFENCE_RADIUS_METERS}m of ${game.playground.name} to check in`
 }
 >
 {isCheckedIn ? (
 'Checked In'
 ) : isAtVenue ? (
 ' Check In Now'
 ) : (
 ` Check In (${distanceToGround !== null ? `${formatDistance(distanceToGround)} away` : 'Locked'})`
 )}
 </button>

 <button
 type="button"
 className="leave-btn"
 onClick={() => onLeave && onLeave(game)}
 disabled={isActionPending}
 title="Leave match or ditch slot. Releases slot to nearby players instantly via Redis."
 >
 Leave / Ditch
 </button>
 </div>

 
 <div style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginTop: '10px',
 fontSize: '11px',
 color: 'var(--text-muted)',
 flexWrap: 'wrap',
 gap: '8px',
 }}>
 <span>
 Live GPS: {userCoords ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : 'Detecting...'}
 </span>
 <button
 type="button"
 onClick={toggleSimulateArrival}
 className="simulate-geofence-btn"
 title="Simulate GPS coordinates at the venue for testing"
 >
 {isSimulatedArrival ? ' Reset to Device GPS' : ' Test: Simulate Arriving at Venue'}
 </button>
 </div>
 </div>
 )}


 
 <div className="player-list">
 <div className="player-list-header">
 <span>Players ({game.players.length})</span>
 <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</span>
 </div>
 {game.players.map((player) => (
 <PlayerItem key={player.id} player={player} />
 ))}
 </div>

 
 {game.waitlist.length > 0 && (
 <div className="player-list">
 <div className="player-list-header">
 <span>Waitlist ({game.waitlist.length})</span>
 <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Position</span>
 </div>
 {game.waitlist.map((wp) => (
 <div key={wp.id} className="waitlist-item">
 <div className="waitlist-position">#{wp.position}</div>
 <div className="player-item-avatar">{wp.initials}</div>
 <div className="player-item-info">
 <div className="player-item-name">{wp.name}</div>
 <div className="player-item-role">In queue</div>
 </div>
 <span className="status-pill waiting">
 <span className="dot" />
 Waiting
 </span>
 </div>
 ))}
 </div>
 )}

 
 <div className="reliability-card" style={{ marginTop: '24px' }}>
 <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
 Game Details
 </h3>
 <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span style={{ color: 'var(--text-muted)' }}>Venue</span>
 <a
 href={getGoogleMapsUrl(game.playground)}
 target="_blank"
 rel="noopener noreferrer"
 style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
 title="Open venue in Google Maps"
 >
 {game.playground.name}
 <Icons.ExternalLink />
 </a>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span style={{ color: 'var(--text-muted)' }}>Address</span>
 <a
 href={getGoogleMapsUrl(game.playground)}
 target="_blank"
 rel="noopener noreferrer"
 style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textAlign: 'right', textDecoration: 'none' }}
 title="Open address in Google Maps"
 >
 {game.playground.address}
 <Icons.ExternalLink />
 </a>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 <span style={{ color: 'var(--text-muted)' }}>Starts</span>
 <span>{formatTime(game.startsAt)}</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 <span style={{ color: 'var(--text-muted)' }}>Ends</span>
 <span>{formatTime(game.endsAt)}</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 <span style={{ color: 'var(--text-muted)' }}>Queue</span>
 <span style={{ color: 'var(--primary)' }}>Enabled</span>
 </div>
 </div>

 
 <a
 href={getGoogleMapsUrl(game.playground)}
 target="_blank"
 rel="noopener noreferrer"
 className="google-maps-btn"
 style={{ marginTop: '16px' }}
 title="Navigate to ground in Google Maps"
 >
 <span style={{ display: 'inline-flex', alignItems: 'center' }}><Icons.Compass /></span>
 <span>Open Playground in Google Maps</span>
 <span style={{ color: 'var(--primary)', marginLeft: 'auto', fontSize: '13px', fontWeight: 700 }}>Directions <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></span>
 </a>
 </div>
 </div>
 );
}


function PlayerItem({ player }: { player: MockPlayer }) {
 return (
 <div className="player-item">
 <div className="player-item-avatar">{player.initials}</div>
 <div className="player-item-info">
 <div className="player-item-name">
 {player.name}
 {player.isHost && (
 <span style={{
 marginLeft: '6px', fontSize: '10px', fontWeight: 600,
 color: 'var(--status-waiting)', textTransform: 'uppercase',
 }}>
 Host
 </span>
 )}
 </div>
 <div className="player-item-role" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span style={{
 color: player.reliability >= 90 ? 'var(--primary)' : player.reliability >= 75 ? 'var(--status-warning)' : 'var(--status-danger)',
 }}>
 {player.reliability}% reliable
 </span>
 </div>
 </div>
 <span className={`status-pill ${getStatusPillClass(player.status)}`}>
 <span className="dot" />
 {getStatusLabel(player.status)}
 </span>
 </div>
 );
}


function ProfilePage({
 authUser,
 onSignOut,
 onRequireAuth,
}: {
 authUser: any;
 onSignOut?: () => void;
 onRequireAuth?: () => void;
}) {
 const displayName = authUser?.user_metadata?.full_name || authUser?.name || authUser?.email?.split('@')[0] || currentUser.name;
 const email = authUser?.email || 'ashutosh@playdrop.app';
 const initials = displayName.slice(0, 2).toUpperCase();
 const ditchScore = authUser?.ditchScore !== undefined ? authUser.ditchScore : currentUser.ditchScore;
 const reliability = authUser?.checkInRate !== undefined ? Math.round(authUser.checkInRate * 100) : currentUser.reliabilityPercent;
 const sports = authUser?.sports || currentUser.sports;

 return (
 <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto', padding: '24px 16px' }}>
 <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
 <div className="profile-avatar">{initials}</div>
 <div className="profile-info">
 <h2>{displayName}</h2>
 <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{email}</div>
 <div className="profile-sports" style={{ marginTop: '8px' }}>
 {sports.map((s: string) => (
 <span key={s} className="profile-sport-tag">
 {s === 'CRICKET' ? '' : s === 'FOOTBALL' ? '' : ''} {s}
 </span>
 ))}
 </div>
 </div>
 </div>

 <div>
 {authUser ? (
 <button
 className="join-btn"
 onClick={onSignOut}
 style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', fontSize: '13px' }}
 >
 Sign Out
 </button>
 ) : (
 <button className="join-btn" onClick={onRequireAuth} style={{ padding: '8px 16px', fontSize: '13px' }}>
 Sign In / Join
 </button>
 )}
 </div>
 </div>

 <div style={{ marginTop: '24px' }}>
 <h3 className="section-title" style={{ marginBottom: '16px' }}>Reliability Score</h3>
 <div className="reliability-card">
 <div className="reliability-header">
 <span className="reliability-label"> Reliable Match Player</span>
 <span className="reliability-score">{reliability}%</span>
 </div>
 <div className="reliability-bar">
 <div
 className="reliability-bar-fill"
 style={{ width: `${reliability}%`, background: 'var(--brand-gradient, var(--primary))' }}
 />
 </div>
 <div className="reliability-stats">
 <div className="reliability-stat">
 <div className="value">{authUser?.successfulGames ?? 21}</div>
 <div className="label">Completed</div>
 </div>
 <div className="reliability-stat">
 <div className="value">{(authUser?.totalGames ?? 22) - (authUser?.successfulGames ?? 21)}</div>
 <div className="label">Cancelled</div>
 </div>
 <div className="reliability-stat">
 <div className="value">{authUser?.noShows ?? 0}</div>
 <div className="label">No-shows</div>
 </div>
 </div>
 </div>

 <h3 className="section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>Ditch Score</h3>
 <div className="reliability-card">
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
 <span style={{ fontSize: '28px', fontWeight: 800 }}>{ditchScore}</span>
 <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 600 }}>/ 100</span>
 </div>
 <div className="player-bar" style={{ height: '8px', marginBottom: '12px' }}>
 <div className="player-bar-fill" style={{ width: `${Math.min(ditchScore * 5, 100)}%`, background: 'var(--primary)' }} />
 </div>
 <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
 Lower is better. Score increases when you cancel late or don&apos;t show up. Complete scheduled games to reduce your score.
 </p>
 </div>

 <h3 className="section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>Recent Match Activity</h3>
 <div className="player-list">
 {[
 { sport: '', name: 'Koramangala Cricket Ground', date: 'Yesterday', result: 'Completed', status: 'checked-in' },
 { sport: '', name: 'HSR Layout Football Arena', date: '3 days ago', result: 'Completed', status: 'checked-in' },
 { sport: '', name: 'BTM Layout Basketball Court', date: '1 week ago', result: 'Completed', status: 'checked-in' },
 ].map((g, i) => (
 <div key={i} className="player-item">
 <div style={{ fontSize: '24px', width: '36px', textAlign: 'center' }}>{g.sport}</div>
 <div className="player-item-info">
 <div className="player-item-name">{g.name}</div>
 <div className="player-item-role">{g.date}</div>
 </div>
 <span className={`status-pill ${g.status}`}>
 <span className="dot" />
 {g.result}
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}


function MyGamesPage({
 games,
 joinedGames,
 authUser,
 onSelectGame,
 onOpenCreate,
}: {
 games: MockGame[];
 joinedGames: Set<string>;
 authUser: any;
 onSelectGame: (g: MockGame) => void;
 onOpenCreate: () => void;
}) {
 const currentUserId = authUser?.id || authUser?.email || currentUser.id;
 const userPrefix = authUser?.email?.split('@')[0]?.toLowerCase();

 const myGames = games.filter(g =>
 joinedGames.has(g.id) ||
 g.players?.some(p => p.id === currentUserId || (userPrefix && p.name.toLowerCase().includes(userPrefix))) ||
 (userPrefix && g.hostName && g.hostName.toLowerCase().includes(userPrefix))
 );

 return (
 <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
 <div>
 <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '-0.02em' }}>My Games</h2>
 <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
 Games you are hosting or have claimed a slot for
 </p>
 </div>
 <button className="join-btn" onClick={onOpenCreate} style={{ padding: '8px 16px', fontSize: '13px' }}>
 + Create New
 </button>
 </div>

 {myGames.length === 0 ? (
 <div style={{
 textAlign: 'center',
 padding: '60px 20px',
 background: 'var(--surface)',
 borderRadius: 'var(--radius-lg)',
 border: '1px dashed var(--border)',
 }}>
 <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
 <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No active games yet</h3>
 <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
 Join an open slot nearby or create your own game and invite teammates!
 </p>
 <button className="join-btn" onClick={onOpenCreate}>
 Host a Game Now
 </button>
 </div>
 ) : (
 <div className="games-grid">
 {myGames.map(game => (
 <div
 key={game.id}
 className="game-card animate-fade-in"
 onClick={() => onSelectGame(game)}
 style={{ cursor: 'pointer' }}
 >
 <div className="game-card-image">
 <div style={{
 width: '100%', height: '100%',
 background: 'linear-gradient(135deg, var(--elevated), var(--surface))',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: '28px', opacity: 0.7,
 }}>
 {game.sportEmoji}
 </div>
 <div className="game-card-sport-badge">
 <span>{game.sportEmoji}</span>
 {game.sport}
 </div>
 </div>
 <div className="game-card-body">
 <div className="game-card-title">{game.title}</div>
 <div className="game-card-meta">
 <Icons.MapPin />
 {game.playground.name}
 <span className="dot" />
 Starts {formatTime(game.startsAt)}
 </div>
 <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span className="status-pill open">
 <span className="dot" />
 {game.confirmedPlayers}/{game.capacity} Confirmed
 </span>
 <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
 View Room →
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}


function MessagesPage({ games, authUser }: { games: MockGame[]; authUser: any }) {
 const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id || '');
 const [messages, setMessages] = useState<Record<string, Array<{ id: string; sender: string; text: string; time: string; isSelf: boolean }>>>({
 [games[0]?.id || 'g1']: [
 { id: '1', sender: 'Rahul', text: 'Hey team! Bringing the extra cricket kit and balls.', time: '10:14 AM', isSelf: false },
 { id: '2', sender: 'Amit', text: 'Awesome! Ground slot is reserved for 6 PM sharp.', time: '10:18 AM', isSelf: false },
 { id: '3', sender: 'Priya', text: 'Count me in for opening overs ', time: '10:25 AM', isSelf: false },
 ],
 });
 const [draft, setDraft] = useState('');

 const currentMessages = messages[selectedGameId] || [
 { id: 'init', sender: 'System', text: 'Welcome to game match chat! Coordinate arrival and teams here.', time: 'Just now', isSelf: false },
 ];

 const handleSend = (e: React.FormEvent) => {
 e.preventDefault();
 if (!draft.trim()) return;
 const newMsg = {
 id: Date.now().toString(),
 sender: authUser?.user_metadata?.full_name || authUser?.name || authUser?.email?.split('@')[0] || 'You',
 text: draft.trim(),
 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 isSelf: true,
 };
 setMessages(prev => ({
 ...prev,
 [selectedGameId]: [...(prev[selectedGameId] || []), newMsg],
 }));
 setDraft('');
 };

 const activeGame = games.find(g => g.id === selectedGameId) || games[0];

 return (
 <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%', height: 'calc(100vh - 48px)', display: 'flex', gap: '20px' }}>
 
 <div style={{ width: '280px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
 <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Game Chats</h3>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
 {games.slice(0, 6).map(g => (
 <button
 key={g.id}
 onClick={() => setSelectedGameId(g.id)}
 style={{
 display: 'flex', alignItems: 'center', gap: '10px',
 padding: '10px 12px', borderRadius: 'var(--radius-md)',
 background: selectedGameId === g.id ? 'var(--surface-elevated)' : 'transparent',
 border: selectedGameId === g.id ? '1px solid var(--border)' : '1px solid transparent',
 color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer',
 }}
 >
 <span style={{ fontSize: '20px' }}>{g.sportEmoji}</span>
 <div style={{ overflow: 'hidden' }}>
 <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
 {g.playground.name}
 </div>
 <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{g.sport}</div>
 </div>
 </button>
 ))}
 </div>
 </div>

 
 <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
 
 <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
 <span style={{ fontSize: '24px' }}>{activeGame?.sportEmoji || ''}</span>
 <div>
 <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{activeGame?.playground.name || 'Game Chat'}</h4>
 <span style={{ fontSize: '12px', color: 'var(--primary)' }}>● {activeGame?.confirmedPlayers || 2} players online</span>
 </div>
 </div>

 
 <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
 {currentMessages.map(m => (
 <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.isSelf ? 'flex-end' : 'flex-start' }}>
 <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
 {m.sender} • {m.time}
 </div>
 <div style={{
 maxWidth: '70%', padding: '10px 14px', borderRadius: '12px',
 background: m.isSelf ? 'var(--primary)' : 'var(--surface-elevated)',
 color: m.isSelf ? '#ffffff' : 'var(--text-primary)',
 fontWeight: m.isSelf ? 500 : 400,
 fontSize: '14px', border: m.isSelf ? 'none' : '1px solid var(--border)',
 }}>
 {m.text}
 </div>
 </div>
 ))}
 </div>

 
 <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
 <input
 className="form-input"
 placeholder="Type a message to teammates..."
 value={draft}
 onChange={e => setDraft(e.target.value)}
 style={{ flex: 1 }}
 />
 <button className="join-btn" type="submit" style={{ padding: '0 20px' }}>
 Send
 </button>
 </form>
 </div>
 </div>
 );
}


function NotificationsPage() {
 const [notifications, setNotifications] = useState([
 { id: 1, title: 'Game Request', message: 'Alex wants to join your Football match.', time: '2m ago', isUnread: true },
 { id: 2, title: 'Match Starting Soon', message: 'Your Koramangala Cricket match starts in 1 hour.', time: '1h ago', isUnread: true },
 { id: 3, title: 'Slot Offer Accepted', message: 'You have been accepted into Basketball court.', time: '2h ago', isUnread: true },
 { id: 4, title: 'New Game Nearby', message: 'A new Badminton game was posted near HSR Layout.', time: '1d ago', isUnread: false },
 ]);

 const markAllRead = () => {
 setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
 };

 return (
 <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
 <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '-0.02em' }}>Notifications</h2>
 <button onClick={markAllRead} style={{ fontSize: 'var(--text-sm)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
 Mark all as read
 </button>
 </div>
 
 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 {notifications.map(n => (
 <div 
 key={n.id} 
 style={{ 
 padding: '16px', 
 borderRadius: 'var(--radius-lg)', 
 background: n.isUnread ? 'var(--surface-elevated)' : 'var(--surface)',
 border: '1px solid var(--border)',
 display: 'flex',
 flexDirection: 'column',
 gap: '6px'
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
 <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
 {n.isUnread && <span style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />}
 {n.title}
 </strong>
 <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{n.time}</span>
 </div>
 <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', paddingLeft: n.isUnread ? '16px' : '0' }}>{n.message}</p>
 </div>
 ))}
 </div>
 </div>
 );
}


function CreateGameModal({
 onClose,
 onCreated,
 authUser,
 onRequireAuth,
}: {
 onClose: () => void;
 onCreated: (newGame: MockGame, msg: string) => void;
 authUser: any;
 onRequireAuth: () => void;
}) {
 const [sport, setSport] = useState('CRICKET');
 const [playgroundName, setPlaygroundName] = useState('Koramangala Turf Arena');
 const [address, setAddress] = useState('4th Block, Koramangala');
 const [lat, setLat] = useState(12.9352);
 const [lng, setLng] = useState(77.6245);
 const [showMapPicker, setShowMapPicker] = useState(false);
 const [isLocating, setIsLocating] = useState(false);
 const [locationSuccessMsg, setLocationSuccessMsg] = useState('');
 const [capacity, setCapacity] = useState(10);
 const [skillLevel, setSkillLevel] = useState('MIXED');
 const [startTime, setStartTime] = useState('18:00');
 const [endTime, setEndTime] = useState('20:00');
 const [description, setDescription] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const [errorMsg, setErrorMsg] = useState('');

 const sports = [
 { key: 'CRICKET', emoji: '', name: 'Cricket' },
 { key: 'FOOTBALL', emoji: '', name: 'Football' },
 { key: 'BASKETBALL', emoji: '', name: 'Basketball' },
 { key: 'BADMINTON', emoji: '', name: 'Badminton' },
 { key: 'TENNIS', emoji: '', name: 'Tennis' },
 { key: 'VOLLEYBALL', emoji: '', name: 'Volleyball' },
 { key: 'HOCKEY', emoji: '', name: 'Hockey' },
 { key: 'TABLE_TENNIS', emoji: '', name: 'TT' },
 ];

 const handleUseCurrentLocation = () => {
 if (!navigator.geolocation) {
 setErrorMsg('Geolocation is not supported by your browser');
 return;
 }
 setIsLocating(true);
 setLocationSuccessMsg('');
 setErrorMsg('');
 navigator.geolocation.getCurrentPosition(
 async (pos) => {
 const userLat = Number(pos.coords.latitude.toFixed(6));
 const userLng = Number(pos.coords.longitude.toFixed(6));
 setLat(userLat);
 setLng(userLng);
 setIsLocating(false);
 setLocationSuccessMsg(` Locked to device GPS: ${userLat}, ${userLng}`);

 try {
 const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`);
 if (res.ok) {
 const data = await res.json();
 if (data.display_name && (!address || address === '4th Block, Koramangala')) {
 setAddress(data.display_name.split(',').slice(0, 3).join(', '));
 }
 }
 } catch {}
 },
 (err) => {
 setIsLocating(false);
 setErrorMsg('Unable to retrieve GPS location: ' + err.message);
 },
 { timeout: 10000, enableHighAccuracy: true }
 );
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!playgroundName.trim()) {
 setErrorMsg('Please enter a playground or venue name');
 return;
 }

 setSubmitting(true);
 setErrorMsg('');

 try {
 const now = new Date();
 const [startH, startM] = startTime.split(':').map(Number);
 const [endH, endM] = endTime.split(':').map(Number);

 const startsAt = new Date(now);
 startsAt.setHours(startH || 18, startM || 0, 0, 0);
 if (startsAt.getTime() < now.getTime()) {
 startsAt.setDate(startsAt.getDate() + 1);
 }

 const endsAt = new Date(startsAt);
 endsAt.setHours(endH || 20, endM || 0, 0, 0);
 if (endsAt.getTime() <= startsAt.getTime()) {
 endsAt.setTime(startsAt.getTime() + 2 * 3600 * 1000);
 }

 const hostId = authUser?.id || authUser?.email || 'u_guest_host';
 const idemKey = generateIdempotencyKey(`host_game_${hostId}`);

 const res = await createGameApi({
 hostId,
 sport,
 playground: {
 name: playgroundName.trim(),
 address: address.trim(),
 lat,
 lng,
 },
 capacity: Number(capacity) || 10,
 startsAt: startsAt.toISOString(),
 endsAt: endsAt.toISOString(),
 description: description.trim(),
 skillLevel,
 idempotencyKey: idemKey,
 });

 const sportObj = sports.find(s => s.key === sport);
 const hostDisplayName = authUser?.user_metadata?.full_name || authUser?.name || authUser?.email?.split('@')[0] || 'You (Host)';

 const newMockGame: MockGame = {
 id: res._id || `game-${Date.now()}`,
 sport,
 sportEmoji: sportObj?.emoji || '',
 title: `${playgroundName} ${sport}`,
 playground: {
 name: playgroundName,
 address,
 lat: res.playground?.location?.coordinates?.[1] || lat,
 lng: res.playground?.location?.coordinates?.[0] || lng,
 },
 capacity: Number(capacity) || 10,
 confirmedPlayers: 1,
 neededPlayers: Math.max(0, (Number(capacity) || 10) - 1),
 status: 'OPEN',
 startsAt: startsAt.toISOString(),
 endsAt: endsAt.toISOString(),
 distance: 800,
 isLive: true,
 hostName: hostDisplayName,
 players: [
 {
 id: hostId,
 name: hostDisplayName,
 initials: hostDisplayName.slice(0, 2).toUpperCase(),
 status: 'confirmed',
 isHost: true,
 reliability: 98,
 },
 ],
 waitlist: [],
 };

 onCreated(newMockGame, `Game "${playgroundName}" created! `);
 onClose();
 } catch (err: any) {
 setErrorMsg(err.message || 'Failed to create game on backend');
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="create-game-modal-overlay" onClick={onClose}>
 <div className="create-game-modal" style={{ maxWidth: '520px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
 <div>
 <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>Create Sports Event</h3>
 <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '2px 0 0' }}>Post a game for nearby players to join</p>
 </div>
 <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
 <Icons.X />
 </button>
 </div>

 {errorMsg && (
 <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: '#F87171', padding: '10px 14px', borderRadius: '8px', fontSize: 'var(--text-xs)', marginBottom: '16px' }}>
 {errorMsg}
 </div>
 )}

 <form onSubmit={handleSubmit}>
 <div className="form-group">
 <label className="form-label">Sport</label>
 <div className="sport-selector">
 {sports.map(s => (
 <button
 type="button"
 key={s.key}
 className={`sport-option ${sport === s.key ? 'selected' : ''}`}
 onClick={() => setSport(s.key)}
 >
 <span className="emoji">{s.emoji}</span>
 <span className="name">{s.name}</span>
 </button>
 ))}
 </div>
 </div>

 <div className="form-group">
 <label className="form-label">Playground / Turf Name</label>
 <input
 className="form-input"
 placeholder="e.g. Koramangala Cricket Ground"
 value={playgroundName}
 onChange={e => setPlaygroundName(e.target.value)}
 required
 />
 </div>

 <div className="form-group">
 <label className="form-label">Address / Landmark</label>
 <input
 className="form-input"
 placeholder="e.g. 4th Block, Koramangala"
 value={address}
 onChange={e => setAddress(e.target.value)}
 />
 </div>

 
 <div className="form-group" style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
 <label className="form-label" style={{ margin: 0 }}>Ground Location (GPS)</label>
 <div style={{ display: 'flex', gap: '8px' }}>
 <button
 type="button"
 onClick={handleUseCurrentLocation}
 disabled={isLocating}
 className="location-action-btn"
 title="Detect GPS location from device"
 >
 {isLocating ? ' Detecting...' : ' Use My GPS'}
 </button>
 <button
 type="button"
 onClick={() => setShowMapPicker(!showMapPicker)}
 className={`location-action-btn ${showMapPicker ? 'active' : ''}`}
 title="Toggle interactive map pin drop"
 >
 {showMapPicker ? 'Hide Map' : 'Pick on Map'}
 </button>
 </div>
 </div>

 
 <div style={{ marginBottom: '10px' }}>
 <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
 Popular Arenas:
 </div>
 <div className="venue-chip-container">
 {POPULAR_VENUES.map(v => (
 <button
 type="button"
 key={v.name}
 className={`venue-chip ${playgroundName === v.name ? 'selected' : ''}`}
 onClick={() => {
 setPlaygroundName(v.name);
 setAddress(v.address);
 setLat(v.lat);
 setLng(v.lng);
 setLocationSuccessMsg(`Selected: ${v.name}`);
 }}
 >
 {v.name.split(' ')[0]} {v.name.split(' ')[1] || ''}
 </button>
 ))}
 </div>
 </div>

 
 {showMapPicker && (
 <div style={{ marginBottom: '10px' }}>
 <LocationPickerMap
 lat={lat}
 lng={lng}
 onChange={(newLat, newLng) => {
 setLat(newLat);
 setLng(newLng);
 setLocationSuccessMsg(`Pin set: ${newLat}, ${newLng}`);
 }}
 />
 </div>
 )}

 
 <div style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: '8px 12px',
 background: 'var(--elevated)',
 borderRadius: 'var(--radius-md)',
 border: '1px solid var(--border)',
 fontSize: '12px',
 }}>
 <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
 <span>GPS: <strong>{lat.toFixed(4)}, {lng.toFixed(4)}</strong></span>
 </span>
 <a
 href={getGoogleMapsUrl({ name: playgroundName, address, lat, lng })}
 target="_blank"
 rel="noopener noreferrer"
 style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
 title="Verify destination in Google Maps"
 >
 Test in Google Maps <Icons.ExternalLink />
 </a>
 </div>

 {locationSuccessMsg && (
 <div style={{ fontSize: '11px', color: '#C4B5FD', marginTop: '4px' }}>
 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{locationSuccessMsg}</span>
 </div>
 )}
 </div>

 <div className="form-row">
 <div className="form-group">
 <label className="form-label">Players Needed</label>
 <input
 className="form-input"
 type="number"
 min={2}
 max={30}
 value={capacity}
 onChange={e => setCapacity(Number(e.target.value))}
 />
 </div>
 <div className="form-group">
 <label className="form-label">Skill Level</label>
 <select
 className="form-input"
 value={skillLevel}
 onChange={e => setSkillLevel(e.target.value)}
 style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
 >
 <option value="BEGINNER">Beginner</option>
 <option value="INTERMEDIATE">Intermediate</option>
 <option value="ADVANCED">Advanced</option>
 <option value="MIXED">Mixed</option>
 </select>
 </div>
 </div>

 <div className="form-row">
 <div className="form-group">
 <label className="form-label">Start Time</label>
 <input
 className="form-input"
 type="time"
 value={startTime}
 onChange={e => setStartTime(e.target.value)}
 />
 </div>
 <div className="form-group">
 <label className="form-label">End Time</label>
 <input
 className="form-input"
 type="time"
 value={endTime}
 onChange={e => setEndTime(e.target.value)}
 />
 </div>
 </div>

 <div className="form-group">
 <label className="form-label">Description (optional)</label>
 <textarea
 className="form-input"
 rows={2}
 placeholder="e.g. Bring your own bat, white tennis ball match..."
 value={description}
 onChange={e => setDescription(e.target.value)}
 style={{ resize: 'vertical', minHeight: '50px' }}
 />
 </div>

 <button
 type="submit"
 className="join-btn"
 disabled={submitting}
 style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '15px' }}
 >
 {submitting ? 'Creating Event...' : 'Post Game & Fill Slots'}
 </button>
 </form>
 </div>
 </div>
 );
}
