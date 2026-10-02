'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { MockGame } from '@/lib/mock-data';

const USER_LAT = 12.9279;
const USER_LNG = 77.6271;

interface GameMapProps {
  games: MockGame[];
  liveCounters: Map<string, number>;
  onGameClick: (game: MockGame) => void;
  userCoords?: { lat: number; lng: number } | null;
  userLocationName?: string;
}

export default function GameMap({
  games,
  liveCounters,
  onGameClick,
  userCoords,
  userLocationName,
}: GameMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = userCoords?.lat ?? USER_LAT;
    const initialLng = userCoords?.lng ?? USER_LNG;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([initialLat, initialLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(map);

    const userIcon = L.divIcon({
      className: 'game-marker',
      html: `<div class="user-marker" title="${userLocationName ? 'Live Location: ' + userLocationName : 'You'}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    userMarkerRef.current = L.marker([initialLat, initialLng], { icon: userIcon }).addTo(map);

    if (userCoords) {
      userMarkerRef.current.bindTooltip(
        `<div class="map-pin-tooltip">
          <div class="tooltip-title" style="color: #A78BFA;">● Your Location</div>
          <div class="tooltip-status">${userLocationName || 'Live GPS Active'}</div>
        </div>`,
        { direction: 'top', offset: [0, -10], className: 'game-leaflet-tooltip' }
      );
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update user marker position and pan map when coordinates change
  useEffect(() => {
    if (!mapRef.current) return;
    const targetLat = userCoords?.lat ?? USER_LAT;
    const targetLng = userCoords?.lng ?? USER_LNG;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([targetLat, targetLng]);
      if (userCoords) {
        userMarkerRef.current.bindTooltip(
          `<div class="map-pin-tooltip">
            <div class="tooltip-title" style="color: #A78BFA;">● Your Location</div>
            <div class="tooltip-status">${userLocationName || 'Live GPS Active'}</div>
          </div>`,
          { direction: 'top', offset: [0, -10], className: 'game-leaflet-tooltip' }
        );
      }
    }
    mapRef.current.setView([targetLat, targetLng], 14, { animate: true });
  }, [userCoords?.lat, userCoords?.lng, userLocationName]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    games.forEach(game => {
      const liveCount = liveCounters.get(game.id) ?? game.confirmedPlayers;
      const needed = game.capacity - liveCount;
      const isNeedOne = needed === 1;

      const statusText = needed > 0 ? (isNeedOne ? 'Need 1 more' : `Need ${needed}`) : 'Full';
      const sportName = game.sport.charAt(0) + game.sport.slice(1).toLowerCase();

      const icon = L.divIcon({
        className: 'game-marker-icon',
        html: `
          <div class="game-marker-pin ${isNeedOne ? 'urgent' : ''}" role="button" aria-label="${sportName} at ${game.playground.name}: ${liveCount} of ${game.capacity} players, ${statusText}">
            <span class="marker-code" style="font-size: 11px; font-weight: 800; color: #fff;">${game.sport.substring(0, 2)}</span>
            ${isNeedOne ? '<span class="marker-pip"></span>' : ''}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const gMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${game.playground.lat},${game.playground.lng}`;

      const marker = L.marker([game.playground.lat, game.playground.lng], { icon })
        .addTo(mapRef.current!)
        .on('click', () => onGameClick(game));

      marker.bindTooltip(
        `<div class="map-pin-tooltip">
          <div class="tooltip-title">${game.title}</div>
          <div class="tooltip-status">${liveCount}/${game.capacity} filled • <span class="tooltip-need">${statusText}</span></div>
          <div style="margin-top: 6px; font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
            <span style="color: #8B92A5;">${game.playground.name}</span>
            <span style="color: #A78BFA; font-weight: 700;">Maps <svg style="display:inline-block;vertical-align:middle;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></span>
          </div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -18],
          className: 'game-leaflet-tooltip',
          opacity: 0.98,
        }
      );

      marker.bindPopup(
        `<div style="font-family: sans-serif; padding: 4px; min-width: 180px; color: #111;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${game.playground.name}</div>
          <div style="font-size: 12px; color: #555; margin-bottom: 8px;">${game.playground.address}</div>
          <a href="${gMapsUrl}" target="_blank" rel="noopener noreferrer" style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: #7C3AED;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            border-radius: 6px;
            text-decoration: none;
          ">
            Open in Google Maps <svg style="display:inline-block;vertical-align:middle;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          </a>
        </div>`
      );

      markersRef.current.push(marker);
    });
  }, [games, liveCounters, onGameClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} className="map-container" style={{ width: '100%', height: '100%' }} />

      {userCoords && (
        <button
          type="button"
          onClick={() => {
            if (mapRef.current && userCoords) {
              mapRef.current.setView([userCoords.lat, userCoords.lng], 15, { animate: true });
            }
          }}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            zIndex: 400,
            background: 'rgba(15, 17, 23, 0.92)',
            border: '1px solid rgba(124, 58, 237, 0.4)',
            borderRadius: '20px',
            padding: '6px 12px',
            color: '#C4B5FD',
            fontSize: '11px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
          title="Recenter map on your location"
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 8px #8B5CF6' }}></span>
          <span>Center GPS</span>
        </button>
      )}

      <style>{`
        .user-marker {
          width: 16px;
          height: 16px;
          background: #8B5CF6;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 14px rgba(139, 92, 246, 0.9);
          cursor: pointer;
        }
        .game-marker-pin {
          width: 32px;
          height: 32px;
          background: #0F1117;
          border: 2px solid #7C3AED;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          position: relative;
        }
        .game-marker-pin.urgent {
          border-color: #EF4444;
          background: #201117;
        }
        .marker-pip {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #EF4444;
          border-radius: 50%;
          border: 1px solid #fff;
        }
        .game-leaflet-tooltip {
          background: #0F1117 !important;
          border: 1px solid #1E2230 !important;
          color: #F0F2F5 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .tooltip-title {
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 2px;
        }
        .tooltip-status {
          font-size: 11px;
          color: #8B92A5;
        }
        .tooltip-need {
          color: #C4B5FD;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
