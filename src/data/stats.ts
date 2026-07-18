export const STATS_META = {
  rank: 'Legend',
  filterRank: '4',
  source: 'wrstats.online',
  updatedAt: '2026-07-18',
  updatedLabel: '2026-07-18',
  championCount: 0,
} as const;

export const LIVE_STATS: Record<string, { wr: number; pr: number; br: number }> = {};
