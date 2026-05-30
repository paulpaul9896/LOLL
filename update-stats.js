import https from 'https';
import { readFileSync, writeFileSync } from 'fs';

const WRSTATS_URL = 'https://wrstats.online/?filter_rank=4';
const CHAMPIONS_FILE = 'src/data/champions.ts';
const STATS_FILE = 'src/data/stats.ts';

const NAME_OVERRIDES = {
  Nunu: 'Nunu & Willump',
  Fiddlestics: 'Fiddlesticks',
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
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function loadChampionNames() {
  const source = readFileSync(CHAMPIONS_FILE, 'utf8');
  return [...source.matchAll(/name:"([^"]+)"/g)].map((match) => match[1]);
}

function normalizeName(name) {
  return decodeHtml(name).replace(/\s+/g, ' ').trim();
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
  const name = NAME_OVERRIDES[rawName] || rawName;

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

  return { parsed, updatedAt, updatedLabel: updatedLabel || updatedAt };
}

function writeStatsFile(stats, meta) {
  const sortedEntries = Object.entries(stats).sort(([a], [b]) => a.localeCompare(b));
  const statsJson = sortedEntries
    .map(([name, values]) => `"${name.replace(/"/g, '\\"')}":{"wr":${values.wr},"pr":${values.pr},"br":${values.br}}`)
    .join(',');

  const content = `export const STATS_META = {
  rank: 'Legend',
  filterRank: 4,
  source: 'wrstats.online',
  updatedAt: '${meta.updatedAt}',
  updatedLabel: '${meta.updatedLabel.replace(/'/g, "\\'")}',
  championCount: ${sortedEntries.length},
} as const;

export const LIVE_STATS: Record<string, { wr: number; pr: number; br: number }> = {${statsJson}};
`;

  writeFileSync(STATS_FILE, content, 'utf8');
}

async function main() {
  const championNames = loadChampionNames();
  const championSet = new Set(championNames);

  console.log(`Fetching Legend rank stats from ${WRSTATS_URL}...`);
  const html = await fetchText(WRSTATS_URL);
  const { parsed, updatedAt, updatedLabel } = parseWrstats(html);

  const stats = {};
  const unmatchedWrstats = [];
  const missingInWrstats = [];

  for (const [name, values] of parsed.entries()) {
    if (championSet.has(name)) {
      stats[name] = values;
    } else {
      unmatchedWrstats.push(name);
    }
  }

  for (const name of championNames) {
    if (!stats[name]) missingInWrstats.push(name);
  }

  writeStatsFile(stats, { updatedAt, updatedLabel });

  console.log(`Wrote ${Object.keys(stats).length} champions to ${STATS_FILE}`);
  console.log(`Last updated: ${updatedLabel}`);
  if (unmatchedWrstats.length) {
    console.log(`Unmatched wrstats names (${unmatchedWrstats.length}): ${unmatchedWrstats.slice(0, 10).join(', ')}${unmatchedWrstats.length > 10 ? '...' : ''}`);
  }
  if (missingInWrstats.length) {
    console.log(`App champions missing from wrstats (${missingInWrstats.length}): ${missingInWrstats.join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
