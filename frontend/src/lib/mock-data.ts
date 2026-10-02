
export interface MockGame {
  id: string;
  sport: string;
  sportEmoji: string;
  title: string;
  playground: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  capacity: number;
  confirmedPlayers: number;
  neededPlayers: number;
  status: string;
  startsAt: string;
  endsAt: string;
  distance: number; // meters
  isLive: boolean;
  hostName: string;
  players: MockPlayer[];
  waitlist: MockWaitlistPlayer[];
}

export interface MockPlayer {
  id: string;
  name: string;
  initials: string;
  status: string;
  isHost: boolean;
  reliability: number;
}

export interface MockWaitlistPlayer {
  id: string;
  name: string;
  initials: string;
  position: number;
}

export interface MockUser {
  id: string;
  name: string;
  handle: string;
  initials: string;
  sports: string[];
  ditchScore: number;
  reliabilityPercent: number;
  successfulGames: number;
  totalGames: number;
  noShows: number;
  checkInRate: number;
}

export const currentUser: MockUser = {
  id: 'u_self',
  name: 'Ashutosh',
  handle: '@ashutosh',
  initials: 'AS',
  sports: ['CRICKET', 'FOOTBALL', 'BASKETBALL'],
  ditchScore: 4,
  reliabilityPercent: 95,
  successfulGames: 21,
  totalGames: 22,
  noShows: 0,
  checkInRate: 0.95,
};

const now = new Date();
const today6pm = new Date(now);
today6pm.setHours(18, 0, 0, 0);
const today630pm = new Date(now);
today630pm.setHours(18, 30, 0, 0);
const today545pm = new Date(now);
today545pm.setHours(17, 45, 0, 0);
const today8pm = new Date(now);
today8pm.setHours(20, 0, 0, 0);
const today830pm = new Date(now);
today830pm.setHours(20, 30, 0, 0);
const tomorrow530pm = new Date(now);
tomorrow530pm.setDate(tomorrow530pm.getDate() + 1);
tomorrow530pm.setHours(17, 30, 0, 0);
const sat7pm = new Date(now);
sat7pm.setDate(sat7pm.getDate() + (6 - sat7pm.getDay() + 7) % 7 || 7);
sat7pm.setHours(19, 0, 0, 0);

export const mockGames: MockGame[] = [
  {
    id: 'g_001',
    sport: 'CRICKET',
    sportEmoji: '',
    title: 'Koramangala Cricket',
    playground: {
      name: 'Koramangala Cricket Ground',
      address: '4th Block, Koramangala',
      lat: 12.9352,
      lng: 77.6245,
    },
    capacity: 11,
    confirmedPlayers: 7,
    neededPlayers: 4,
    status: 'OPEN',
    startsAt: today6pm.toISOString(),
    endsAt: today8pm.toISOString(),
    distance: 700,
    isLive: true,
    hostName: 'Rahul',
    players: [
      { id: 'p1', name: 'Rahul', initials: 'RA', status: 'CHECKED_IN', isHost: true, reliability: 98 },
      { id: 'p2', name: 'Amit', initials: 'AM', status: 'ON_THE_WAY', isHost: false, reliability: 92 },
      { id: 'p3', name: 'Priya', initials: 'PR', status: 'CHECKED_IN', isHost: false, reliability: 96 },
      { id: 'p4', name: 'Arjun', initials: 'AR', status: 'ON_THE_WAY', isHost: false, reliability: 88 },
      { id: 'p5', name: 'Karan', initials: 'KA', status: 'CHECKED_IN', isHost: false, reliability: 94 },
      { id: 'p6', name: 'Dev', initials: 'DE', status: 'JOINED', isHost: false, reliability: 85 },
      { id: 'p7', name: 'Neha', initials: 'NE', status: 'CHECKED_IN', isHost: false, reliability: 97 },
    ],
    waitlist: [],
  },
  {
    id: 'g_002',
    sport: 'FOOTBALL',
    sportEmoji: '',
    title: 'HSR Football',
    playground: {
      name: 'HSR Layout Ground',
      address: 'HSR Layout, Sector 2',
      lat: 12.9116,
      lng: 77.6389,
    },
    capacity: 8,
    confirmedPlayers: 5,
    neededPlayers: 3,
    status: 'OPEN',
    startsAt: today630pm.toISOString(),
    endsAt: today830pm.toISOString(),
    distance: 1200,
    isLive: false,
    hostName: 'Vikram',
    players: [
      { id: 'p8', name: 'Vikram', initials: 'VI', status: 'CONFIRMED', isHost: true, reliability: 91 },
      { id: 'p9', name: 'Sneha', initials: 'SN', status: 'CONFIRMED', isHost: false, reliability: 89 },
      { id: 'p10', name: 'Rohan', initials: 'RO', status: 'JOINED', isHost: false, reliability: 76 },
      { id: 'p11', name: 'Aisha', initials: 'AI', status: 'CONFIRMED', isHost: false, reliability: 93 },
      { id: 'p12', name: 'Siddharth', initials: 'SI', status: 'JOINED', isHost: false, reliability: 82 },
    ],
    waitlist: [
      { id: 'w1', name: 'Tanvi', initials: 'TA', position: 1 },
    ],
  },
  {
    id: 'g_003',
    sport: 'BASKETBALL',
    sportEmoji: '',
    title: 'BTM Basketball',
    playground: {
      name: 'BTM Layout Court',
      address: 'BTM Layout, 2nd Stage',
      lat: 12.9166,
      lng: 77.6101,
    },
    capacity: 6,
    confirmedPlayers: 3,
    neededPlayers: 3,
    status: 'OPEN',
    startsAt: today545pm.toISOString(),
    endsAt: today8pm.toISOString(),
    distance: 1500,
    isLive: true,
    hostName: 'Maya',
    players: [
      { id: 'p13', name: 'Maya', initials: 'MA', status: 'CHECKED_IN', isHost: true, reliability: 99 },
      { id: 'p14', name: 'Aarav', initials: 'AA', status: 'ON_THE_WAY', isHost: false, reliability: 90 },
      { id: 'p15', name: 'Zoya', initials: 'ZO', status: 'JOINED', isHost: false, reliability: 87 },
    ],
    waitlist: [
      { id: 'w2', name: 'Ravi', initials: 'RV', position: 1 },
      { id: 'w3', name: 'Lata', initials: 'LA', position: 2 },
    ],
  },
  {
    id: 'g_004',
    sport: 'BADMINTON',
    sportEmoji: '',
    title: 'Indiranagar Badminton',
    playground: {
      name: 'Indiranagar Club',
      address: '12th Main, Indiranagar',
      lat: 12.9784,
      lng: 77.6408,
    },
    capacity: 4,
    confirmedPlayers: 4,
    neededPlayers: 0,
    status: 'FULL',
    startsAt: today6pm.toISOString(),
    endsAt: today8pm.toISOString(),
    distance: 900,
    isLive: true,
    hostName: 'Pooja',
    players: [
      { id: 'p16', name: 'Pooja', initials: 'PO', status: 'PLAYING', isHost: true, reliability: 97 },
      { id: 'p17', name: 'Nikhil', initials: 'NI', status: 'PLAYING', isHost: false, reliability: 94 },
      { id: 'p18', name: 'Divya', initials: 'DI', status: 'PLAYING', isHost: false, reliability: 91 },
      { id: 'p19', name: 'Akash', initials: 'AK', status: 'PLAYING', isHost: false, reliability: 88 },
    ],
    waitlist: [],
  },
  {
    id: 'g_005',
    sport: 'CRICKET',
    sportEmoji: '',
    title: 'JP Nagar Cricket',
    playground: {
      name: 'JP Nagar Grounds',
      address: '6th Phase, JP Nagar',
      lat: 12.8990,
      lng: 77.5855,
    },
    capacity: 11,
    confirmedPlayers: 10,
    neededPlayers: 1,
    status: 'OPEN',
    startsAt: today630pm.toISOString(),
    endsAt: today830pm.toISOString(),
    distance: 2300,
    isLive: false,
    hostName: 'Sameer',
    players: [
      { id: 'p20', name: 'Sameer', initials: 'SA', status: 'CONFIRMED', isHost: true, reliability: 96 },
      { id: 'p21', name: 'Riya', initials: 'RI', status: 'CONFIRMED', isHost: false, reliability: 93 },
      { id: 'p22', name: 'Varun', initials: 'VA', status: 'CONFIRMED', isHost: false, reliability: 90 },
      { id: 'p23', name: 'Meera', initials: 'ME', status: 'CONFIRMED', isHost: false, reliability: 88 },
      { id: 'p24', name: 'Jay', initials: 'JA', status: 'CONFIRMED', isHost: false, reliability: 85 },
      { id: 'p25', name: 'Tara', initials: 'TR', status: 'ON_THE_WAY', isHost: false, reliability: 92 },
      { id: 'p26', name: 'Harsh', initials: 'HA', status: 'CONFIRMED', isHost: false, reliability: 87 },
      { id: 'p27', name: 'Nisha', initials: 'NS', status: 'CONFIRMED', isHost: false, reliability: 91 },
      { id: 'p28', name: 'Kabir', initials: 'KB', status: 'CONFIRMED', isHost: false, reliability: 89 },
      { id: 'p28b', name: 'Dhruv', initials: 'DH', status: 'CONFIRMED', isHost: false, reliability: 94 },
    ],
    waitlist: [
      { id: 'w4', name: 'Aditya', initials: 'AD', position: 1 },
      { id: 'w5', name: 'Priti', initials: 'PT', position: 2 },
      { id: 'w6', name: 'Mohit', initials: 'MO', position: 3 },
    ],
  },
  {
    id: 'g_006',
    sport: 'FOOTBALL',
    sportEmoji: '',
    title: 'Whitefield Football',
    playground: {
      name: 'Whitefield Sports Complex',
      address: 'ITPL Main Road, Whitefield',
      lat: 12.9698,
      lng: 77.7500,
    },
    capacity: 10,
    confirmedPlayers: 6,
    neededPlayers: 4,
    status: 'OPEN',
    startsAt: tomorrow530pm.toISOString(),
    endsAt: sat7pm.toISOString(),
    distance: 4200,
    isLive: false,
    hostName: 'Manish',
    players: [
      { id: 'p29', name: 'Manish', initials: 'MN', status: 'CONFIRMED', isHost: true, reliability: 94 },
      { id: 'p30', name: 'Ananya', initials: 'AN', status: 'CONFIRMED', isHost: false, reliability: 91 },
      { id: 'p31', name: 'Deepak', initials: 'DP', status: 'CONFIRMED', isHost: false, reliability: 88 },
      { id: 'p32', name: 'Kavya', initials: 'KV', status: 'CONFIRMED', isHost: false, reliability: 93 },
      { id: 'p33', name: 'Rajesh', initials: 'RJ', status: 'CONFIRMED', isHost: false, reliability: 86 },
      { id: 'p34', name: 'Simran', initials: 'SM', status: 'CONFIRMED', isHost: false, reliability: 95 },
    ],
    waitlist: [],
  },
];

export const sportFilters = [
  { key: 'ALL', label: 'All', count: mockGames.length },
  { key: 'CRICKET', label: 'Cricket', count: mockGames.filter(g => g.sport === 'CRICKET').length },
  { key: 'FOOTBALL', label: 'Football', count: mockGames.filter(g => g.sport === 'FOOTBALL').length },
  { key: 'BASKETBALL', label: 'Basketball', count: mockGames.filter(g => g.sport === 'BASKETBALL').length },
  { key: 'BADMINTON', label: 'Badminton', count: mockGames.filter(g => g.sport === 'BADMINTON').length },
  { key: 'TENNIS', label: 'Tennis', count: 0 },
];

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function getTimeUntil(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff < 0) return 'Started';
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return `In ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hrs < 24) return `In ${hrs}h ${remainMins}m`;
  const days = Math.floor(hrs / 24);
  return `In ${days}d`;
}

export function getStatusPillClass(status: string): string {
  switch (status) {
    case 'CHECKED_IN': return 'checked-in';
    case 'ON_THE_WAY': return 'on-way';
    case 'JOINED': case 'CONFIRMED': return 'joined';
    case 'WAITLISTED': case 'OFFER_PENDING': return 'waiting';
    case 'NO_SHOW': case 'DITCHED': return 'no-show';
    case 'PLAYING': return 'playing';
    default: return 'joined';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'CHECKED_IN': return 'Checked In';
    case 'ON_THE_WAY': return 'On the Way';
    case 'JOINED': return 'Joined';
    case 'CONFIRMED': return 'Confirmed';
    case 'WAITLISTED': return 'Waiting';
    case 'OFFER_PENDING': return 'Offer Pending';
    case 'NO_SHOW': return 'No Show';
    case 'DITCHED': return 'Ditched';
    case 'PLAYING': return 'Playing';
    case 'ARRIVED': return 'Arrived';
    default: return status;
  }
}
