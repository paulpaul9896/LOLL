export interface Friend {
  id: string;
  name: string;
  favoriteChampions: string[];
  roles: string[];
  avatar?: string;
}

export interface MatchPlayer {
  name: string;
  champion: string;
  role?: string | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  kda?: string | null;
  dmgDealt?: number | null;
  dmgTaken?: number | null;
  cs?: number | null;
  gold?: number | null;
  wards?: number | null;
  duration?: number | null;
  notes?: string | null;
}

export interface Match {
  id: string;
  timestamp: number;
  date: string;
  result: 'Victory' | 'Defeat';
  players: MatchPlayer[];
  savedBy: string;
  screenshot?: string | null;
  duration?: number | null;
  notes?: string | null;
  appVersion?: string;
}

export interface AppConfig {
  geminiKey?: string;
  slideshowImages?: string[];
}

export interface LiveStats {
  stats: Record<string, { wr: number; pr: number; br: number }>;
  updatedAt: number;
  source: string;
}

export interface Champion {
  key: string;
  name: string;
  dd: string;
  classes: string[];
  roles: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  counters: string[];
  goodVs: string[];
  tips: string[];
}
