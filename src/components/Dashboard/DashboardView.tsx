import React from 'react';
import { Match, Friend } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { champImgUrl, wrColor } from '../../lib/utils';

interface DashboardViewProps {
  friends: Friend[];
  matches: Match[];
  t: (k: string) => string;
  onOpenChamp: (name: string) => void;
}

export default function DashboardView({ friends, matches, t, onOpenChamp }: DashboardViewProps) {
  const wins = matches.filter(m => m.result === 'Victory').length;
  const overallWr = matches.length ? Math.round((wins / matches.length) * 100) : 0;

  // Process chart data
  const champStats: Record<string, { p: number; w: number }> = {};
  matches.forEach(m => {
    const isWin = m.result === 'Victory';
    m.players.forEach(p => {
      if (!champStats[p.champion]) champStats[p.champion] = { p: 0, w: 0 };
      champStats[p.champion].p++;
      if (isWin) champStats[p.champion].w++;
    });
  });

  const chartData = Object.entries(champStats)
    .map(([name, data]) => ({
      name,
      wr: Math.round((data.w / data.p) * 100),
      games: data.p
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 10);

  const topChamps = Object.entries(champStats)
    .sort((a, b) => b[1].p - a[1].p)
    .slice(0, 6)
    .map(([name, data]) => {
      let kills = 0, deaths = 0, assists = 0, count = 0, dmg = 0, dmgCount = 0;
      matches.forEach(m => {
        m.players.filter(p => p.champion === name).forEach(p => {
          if (p.kills !== null && p.kills !== undefined) {
            kills += p.kills; deaths += p.deaths || 0; assists += p.assists || 0; count++;
          }
          if (p.dmgDealt) { dmg += p.dmgDealt; dmgCount++; }
        });
      });
      return {
        name,
        games: data.p,
        wr: Math.round((data.w / data.p) * 100),
        avgKda: count > 0 ? ((kills + assists) / Math.max(deaths, 1)).toFixed(1) : null,
        avgDmg: dmgCount > 0 ? ((dmg / dmgCount) / 1000).toFixed(1) : null,
      };
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:h-[calc(100vh-160px)]">
      <div className="lg:col-span-2 space-y-5 lg:h-full lg:overflow-y-auto lg:pr-2 custom-scrollbar">
        <div className="bg-hex-panel lol-border p-5 rounded-lg shadow">
          <h2 className="font-heading text-lg text-hex-goldlight mb-4 flex items-center gap-2">
            <i className="fa-solid fa-chart-bar text-hex-blue"></i> {t('dash_wr')}
          </h2>
          {matches.length === 0 ? (
            <p className="text-gray-400 italic py-8 text-center">{t('dash_no_matches')}</p>
          ) : (
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#4a5568" tick={{ fill: '#A09B8C', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="#4a5568" tick={{ fill: '#F0E6D2', fontStyle: 'Cinzel', fontSize: 10 }} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ backgroundColor: '#091428', border: '1px solid #C8AA6E', color: '#F0E6D2', fontSize: '12px' }}
                    itemStyle={{ color: '#0AC8B9' }}
                  />
                  <Bar dataKey="wr" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.wr >= 50 ? '#0AC8B9' : '#E84057'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-hex-panel lol-border p-4 rounded-lg shadow flex justify-between items-center overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs text-gray-400 uppercase tracking-tighter">{t('dash_total')}</p>
              <p className="font-heading text-4xl text-hex-gold">{matches.length}</p>
            </div>
            <i className="fa-solid fa-gamepad text-5xl text-hex-gold/10 absolute -right-2"></i>
          </div>
          <div className="bg-hex-panel lol-border p-4 rounded-lg shadow flex justify-between items-center overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs text-gray-400 uppercase tracking-tighter">{t('dash_overall')}</p>
              <p className={`font-heading text-4xl ${overallWr >= 50 ? 'text-hex-green' : 'text-hex-red'}`}>{overallWr}%</p>
            </div>
            <i className="fa-solid fa-trophy text-5xl text-hex-green/10 absolute -right-2"></i>
          </div>
        </div>

        <DashboardRecent matches={matches} t={t} />
      </div>

      <div className="space-y-4 lg:h-full lg:overflow-y-auto lg:pr-2 custom-scrollbar">
        <div className="bg-hex-panel lol-border p-4 rounded-lg shadow">
          <h2 className="font-heading text-sm text-hex-blue mb-3 flex items-center gap-2">
            <i className="fa-solid fa-users"></i> {t('squad_title')} ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="text-gray-500 text-sm italic">{t('squad_empty')}</p>
          ) : (
            <>
              {friends.slice(0, 6).map(f => (
                <div key={f.id} className="flex items-center gap-2 bg-[#010A13] rounded p-2 mb-1.5 border border-white/5">
                  {f.avatar ? (
                    <img src={f.avatar} className="w-8 h-8 rounded-full border border-hex-gold object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-hex-gold/30 bg-hex-panel flex items-center justify-center font-heading text-xs text-hex-gold flex-shrink-0 uppercase">
                      {f.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{f.name}</p>
                    <p className="text-hex-gold text-[10px] truncate uppercase tracking-tighter">{f.roles.map(r => t('role_' + r.toLowerCase())).join(' • ')}</p>
                  </div>
                </div>
              ))}
              {friends.length > 6 && <p className="text-gray-600 text-[10px] text-center mt-2 italic">+{friends.length - 6} more戰友</p>}
            </>
          )}
        </div>

        <div className="bg-hex-panel lol-border p-4 rounded-lg shadow">
          <h2 className="font-heading text-sm text-hex-gold mb-3 flex items-center gap-2">
            <i className="fa-solid fa-star"></i> Top Performance
          </h2>
          {topChamps.length === 0 ? (
             <p className="text-gray-500 text-sm italic">{t('dash_no_matches')}</p>
          ) : (
            topChamps.map(d => (
              <div key={d.name} className="flex items-center gap-2 mb-3 last:mb-0 group cursor-pointer" onClick={() => onOpenChamp(d.name)}>
                <img src={champImgUrl(d.name)} className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-hex-gold transition" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center pr-1">
                    <span className="text-white text-sm truncate block font-medium group-hover:text-hex-goldlight transition">{d.name}</span>
                    <span className={`text-[10px] font-bold ${wrColor(d.wr)}`}>{d.wr}%</span>
                  </div>
                  {d.avgKda && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500">KDA {d.avgKda}</span>
                      <span className="text-[9px] text-gray-700">|</span>
                      <span className="text-[9px] text-gray-500">{d.avgDmg}k dmg</span>
                      <span className="ml-auto text-[9px] text-gray-700">{d.games} games</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardRecent({ matches, t }: { matches: Match[], t: (k: string) => string }) {
  const recent = matches.slice(0, 4);
  if (recent.length === 0) return null;

  return (
    <div className="bg-hex-panel lol-border rounded-lg p-4 shadow">
      <h3 className="font-heading text-xs text-gray-500 mb-3 tracking-widest uppercase">RECENT EXPEDITIONS</h3>
      <div className="space-y-2">
        {recent.map(m => (
          <div key={m.id} className={`${m.result === 'Victory' ? 'victory-banner' : 'defeat-banner'} rounded p-2 flex items-center gap-3 border border-white/5`}>
            <span className={`text-xs font-bold font-heading ${m.result === 'Victory' ? 'text-hex-green' : 'text-hex-red'} w-14 shrink-0`}>
              {m.result === 'Victory' ? t('match_victory') : t('match_defeat')}
            </span>
            <div className="flex -space-x-1.5 flex-wrap">
              {m.players.map((p, i) => (
                <img 
                  key={i} 
                  src={champImgUrl(p.champion)} 
                  title={p.champion} 
                  className="w-7 h-7 rounded-full border-2 border-hex-panel z-[1]" 
                />
              ))}
            </div>
            <div className="ml-auto text-right">
              <span className="text-gray-400 text-[10px] block">{m.date}</span>
              <span className="text-gray-600 text-[9px] block uppercase truncate max-w-[100px]">{m.savedBy.split('@')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
