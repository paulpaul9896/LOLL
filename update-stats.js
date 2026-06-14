import https from 'https';
import { readFileSync, writeFileSync } from 'fs';

const WRSTATS_URL = 'https://wrstats.online/?filter_rank=4';
const RY2X_STATS_URL = 'https://ry2x.github.io/WildRift-Merged-Stats-Data/heroStats.json';
const CHAMPIONS_FILE = 'src/data/champions.ts';
const STATS_FILE = 'src/data/stats.ts';

const WRSTATS_NAME_OVERRIDES = {
  Nunu: 'Nunu & Willump',
  Fiddlestics: 'Fiddlesticks',
};

const API_NAME_OVERRIDES = {
  'Aurelion Sol': 'AurelionSol',
  'Dr. Mundo': 'DrMundo',
  'Jarvan IV': 'JarvanIV',
  "K'Sante": 'KSante',
  "Kai'Sa": 'Kaisa',
  "Kha'Zix": 'Khazix',
  "Kog'Maw": 'KogMaw',
  'Lee Sin': 'LeeSin',
  'Master Yi': 'MasterYi',
  'Miss Fortune': 'MissFortune',
  'Nunu & Willump': 'Nunu',
  'Twisted Fate': 'TwistedFate',
  "Vel'Koz": 'Velkoz',
  'Xin Zhao': 'XinZhao',
};

const ROLE_TO_LANE = {
  Baron: 'top',
  Jungle: 'jungle',
  Mid: 'mid',
  ADC: 'ad',
  Support: 'support',
};

function decodeHtml(text) {
  return text
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LOLL-stats-updater/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    request.on('error', reject);
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

function loadChampions() {
  const source = readFileSync(CHAMPIONS_FILE, 'utf8');
  return [...source.matchAll(/name:"([^"]+)"[\s\S]*?roles:\[([^\]]*)\]/g)].map((match) => ({
    name: match[1],
    roles: [...match[2].matchAll(/"([^"]+)"/g)].map((role) => role[1]),
  }));
}

function normalizeName(name) {
  return decodeHtml(name).replace(/\s+/g, ' ').trim();
}

function parsePercent(value) {
  return parseFloat(String(value).replace('%', ''));
}

function parseStatsRow(rowHtml) {
  const win = rowHtml.match(/Win:\s*<strong[^>]*>([\d.]+)%<\/strong>/);
  const pick = rowHtml.match(/Pick:\s*<strong[^>]*>([\d.]+)%<\/strong>/);
  const ban = rowHtml.match(/Ban:\s*<strong[^>]*>([\d.]+)%<\/strong>/);
  if (!win || !pick || !ban) return null;
  return {
    wr: parseFloat(win[1]),
    pr: parseFloat(pick[1]),
    br: parseFloat(ban[1]),
  };
}

function parseChampionBlock(blockHtml) {
  const altMatch = blockHtml.match(/alt="([^"]+)"/);
  if (!altMatch) return null;

  const rawName = normalizeName(altMatch[1]);
  const name = WRSTATS_NAME_OVERRIDES[rawName] || rawName;

  const rows = [...blockHtml.matchAll(
    /<div class="grid grid-cols-4 gap-2 items-center text-sm p-1 rounded([^"]*)">([\s\S]*?)<\/div>\s*(?:<div class="grid grid-cols-4|<\/div>\s*<\/div>\s*<!-- Buttons for desktop)/g
  )];

  let stats = null;
  for (const [, classSuffix, rowHtml] of rows) {
    const rowStats = parseStatsRow(rowHtml);
    if (!rowStats) continue;
    if (classSuffix.includes('bg-blue-900/50') || rowHtml.includes('&#9733;')) {
      stats = rowStats;
      break;
    }
    if (!stats) stats = rowStats;
  }

  if (!stats) {
    const fallback = blockHtml.match(/Win:\s*<strong[^>]*>([\d.]+)%<\/strong>[\s\S]*?Pick:\s*<strong[^>]*>([\d.]+)%<\/strong>[\s\S]*?Ban:\s*<strong[^>]*>([\d.]+)%<\/strong>/);
    if (!fallback) return null;
    stats = {
      wr: parseFloat(fallback[1]),
      pr: parseFloat(fallback[2]),
      br: parseFloat(fallback[3]),
    };
  }

  return { name, stats };
}

function parseWrstats(html) {
  const updatedMatch = html.match(/Last Updated:\s*<span[^>]*>([^<]+)<\/span>/i);
  const updatedLabel = updatedMatch ? decodeHtml(updatedMatch[1]).replace(/\s*\([^)]*\)\s*$/, '').trim() : null;
  const updatedAt = updatedLabel
    ? updatedLabel.split(',').slice(0, 2).join(',').trim()
    : new Date().toISOString().slice(0, 10);

  const blocks = html.split(/(?=<div class="champion-list-item)/g);
  const parsed = new Map();

  for (const block of blocks) {
    if (!block.includes('champion-list-item')) continue;
    const entry = parseChampionBlock(block);
    if (entry) parsed.set(entry.name, entry.stats);
  }

  return {
    stats: parsed,
    meta: {
      rank: 'Legend',
      filterRank: 4,
      source: 'wrstats.online',
      updatedAt,
      updatedLabel: updatedLabel || updatedAt,
    },
  };
}

function buildRy2xIndex(rankData) {
  const index = new Map();
  for (const [lane, heroes] of Object.entries(rankData)) {
    for (const hero of heroes) {
      if (!index.has(hero.id)) index.set(hero.id, {});
      index.get(hero.id)[lane] = hero;
    }
  }
  return index;
}

function pickRy2xStats(champion, heroIndex) {
  const apiId = API_NAME_OVERRIDES[champion.name] || champion.name;
  const laneStats = heroIndex.get(apiId);
  if (!laneStats) return null;

  const lanes = champion.roles
    .map((role) => ROLE_TO_LANE[role])
    .filter(Boolean);

  let candidates = lanes
    .map((lane) => laneStats[lane])
    .filter(Boolean);

  if (!candidates.length) {
    candidates = Object.values(laneStats);
  }

  if (!candidates.length) return null;

  const best = candidates.reduce((current, next) => (
    parsePercent(next.appear_rate_percent) > parsePercent(current.appear_rate_percent) ? next : current
  ));

  return {
    wr: parsePercent(best.win_rate_percent),
    pr: parsePercent(best.appear_rate_percent),
    br: parsePercent(best.forbid_rate_percent),
  };
}

function parseRy2x(payload, champions) {
  const rank = 'master_plus';
  const rankData = payload.data?.[rank];
  if (!rankData) {
    throw new Error(`Rank "${rank}" not found in ry2x payload`);
  }

  const heroIndex = buildRy2xIndex(rankData);
  const stats = {};
  const missing = [];

  for (const champion of champions) {
    const values = pickRy2xStats(champion, heroIndex);
    if (values) {
      stats[champion.name] = values;
    } else {
      missing.push(champion.name);
    }
  }

  const updatedAt = payload.date.slice(0, 10);
  const updatedLabel = new Date(payload.date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

  return {
    stats,
    missing,
    meta: {
      rank: 'Master+',
      filterRank: rank,
      source: 'CN API via WildRift-Merged-Stats-Data',
      updatedAt,
      updatedLabel,
    },
  };
}

function writeStatsFile(stats, meta) {
  const sortedEntries = Object.entries(stats).sort(([a], [b]) => a.localeCompare(b));
  const statsJson = sortedEntries
    .map(([name, values]) => `"${name.replace(/"/g, '\\"')}":{"wr":${values.wr},"pr":${values.pr},"br":${values.br}}`)
    .join(',');

  const content = `export const STATS_META = {
  rank: '${meta.rank.replace(/'/g, "\\'")}',
  filterRank: '${String(meta.filterRank).replace(/'/g, "\\'")}',
  source: '${meta.source.replace(/'/g, "\\'")}',
  updatedAt: '${meta.updatedAt.replace(/'/g, "\\'")}',
  updatedLabel: '${meta.updatedLabel.replace(/'/g, "\\'")}',
  championCount: ${sortedEntries.length},
} as const;

export const LIVE_STATS: Record<string, { wr: number; pr: number; br: number }> = {${statsJson}};
`;

  writeFileSync(STATS_FILE, content, 'utf8');
}

async function fetchFromWrstats(champions) {
  console.log(`Trying wrstats Legend stats from ${WRSTATS_URL}...`);
  const html = await fetchText(WRSTATS_URL);
  const { stats: parsed, meta } = parseWrstats(html);
  const championSet = new Set(champions.map((c) => c.name));
  const stats = {};
  const unmatched = [];
  const missing = [];

  for (const [name, values] of parsed.entries()) {
    if (championSet.has(name)) stats[name] = values;
    else unmatched.push(name);
  }

  for (const champion of champions) {
    if (!stats[champion.name]) missing.push(champion.name);
  }

  return { stats, meta, unmatched, missing };
}

async function fetchFromRy2x(champions) {
  console.log(`Fetching Master+ stats from ${RY2X_STATS_URL}...`);
  const payload = await fetchJson(RY2X_STATS_URL);
  const { stats, missing, meta } = parseRy2x(payload, champions);
  return { stats, meta, unmatched: [], missing };
}

async function main() {
  const champions = loadChampions();
  let result;

  try {
    result = await fetchFromWrstats(champions);
    console.log('Using wrstats.online as data source.');
  } catch (error) {
    console.warn(`wrstats fetch failed (${error.message}). Falling back to ry2x JSON API.`);
    result = await fetchFromRy2x(champions);
    console.log('Using CN API via WildRift-Merged-Stats-Data.');
  }

  writeStatsFile(result.stats, result.meta);

  console.log(`Wrote ${Object.keys(result.stats).length} champions to ${STATS_FILE}`);
  console.log(`Last updated: ${result.meta.updatedLabel}`);
  if (result.unmatched.length) {
    console.log(`Unmatched source names (${result.unmatched.length}): ${result.unmatched.slice(0, 10).join(', ')}${result.unmatched.length > 10 ? '...' : ''}`);
  }
  if (result.missing.length) {
    console.log(`App champions missing from source (${result.missing.length}): ${result.missing.join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
