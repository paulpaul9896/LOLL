import React, { useState } from 'react';
import { CHAMPIONS } from '../../data/champions';
import { LIVE_STATS } from '../../data/stats';
import { Match } from '../../types';
import { champImgUrl, wrColor, brColor, wrBg } from '../../lib/utils';

interface ChampionsViewProps {
  t: (k: string) => string;
  onOpenChamp: (name: string) => void;
  matches: Match[];
}

export default function ChampionsView({ t, onOpenChamp, matches }: ChampionsViewProps) {
  const [view, setView] = useState<'roster' | 'meta'>('roster');
  const [search, setSearch] = useState('');
  const [clsFilter, setClsFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'wr' | 'pr' | 'br'>('wr');

  const filteredChamps = CHAMPIONS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (clsFilter !== 'All' && !c.classes.includes(clsFilter)) return false;
    if (roleFilter !== 'All' && !c.roles.includes(roleFilter)) return false;
    if (diffFilter !== 'All' && c.difficulty !== diffFilter) return false;
    return true;
  });

  const getChampMetaStats = (name: string) => {
    return LIVE_STATS[name] || { wr: 50, pr: 5, br: 1 };
  };

  const metaData = filteredChamps.map(c => ({
    ...c,
    stats: getChampMetaStats(c.name)
  })).sort((a, b) => b.stats[sortBy] - a.stats[sortBy]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-hex-goldlight">{t('champ_title')}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 text-[10px] uppercase tracking-widest">{filteredChamps.length} HEROES REGISTERED</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="text-hex-blue text-[10px] font-medium flex items-center gap-1">
              <i className="fa-solid fa-database"></i> {t('data_source')}
            </span>
          </div>
        </div>
        <div className="flex bg-[#010A13] border border-gray-800 rounded p-1 gap-1">
          <button 
            onClick={() => setView('roster')} 
            className={`px-4 py-1.5 text-xs rounded transition font-heading font-bold ${view === 'roster' ? 'bg-hex-panel text-white shadow-lg border border-hex-gold/20' : 'text-gray-600 hover:text-gray-400'}`}
          >
            {t('champ_tab_roster')}
          </button>
          <button 
            onClick={() => setView('meta')} 
            className={`px-4 py-1.5 text-xs rounded transition font-heading font-bold ${view === 'meta' ? 'bg-hex-panel text-white shadow-lg border border-hex-gold/20' : 'text-gray-600 hover:text-gray-400'}`}
          >
            {t('champ_tab_meta')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#010A13] p-1 rounded border border-white/5">
        <div className="relative">
          <i className="fa-solid fa-search absolute left-3 top-2.5 text-gray-700 text-xs"></i>
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('champ_search')} 
            className="w-full bg-hex-panel border border-gray-800 rounded pl-8 pr-3 py-2 text-white text-xs outline-none focus:border-hex-gold/40 transition" 
          />
        </div>
        <select value={clsFilter} onChange={e => setClsFilter(e.target.value)} className="bg-hex-panel border border-gray-800 rounded px-3 py-2 text-white text-xs outline-none">
          <option value="All">{t('filter_class')}: {t('all')}</option>
          {['Fighter', 'Assassin', 'Mage', 'Marksman', 'Tank', 'Support'].map(f => <option key={f}>{f}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-hex-panel border border-gray-800 rounded px-3 py-2 text-white text-xs outline-none">
          <option value="All">{t('filter_role')}: {t('all')}</option>
          {['Baron', 'Jungle', 'Mid', 'ADC', 'Support'].map(r => <option key={r} value={r}>{t('role_' + r.toLowerCase())}</option>)}
        </select>
        {view === 'roster' ? (
          <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)} className="bg-hex-panel border border-gray-800 rounded px-3 py-2 text-white text-xs outline-none">
            <option value="All">{t('filter_diff')}: {t('all')}</option>
            <option value="Easy">{t('diff_easy')}</option><option value="Medium">{t('diff_medium')}</option><option value="Hard">{t('diff_hard')}</option>
          </select>
        ) : (
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-hex-panel border border-gray-800 rounded px-3 py-2 text-white text-xs outline-none">
            <option value="wr">SORT: {t('win_rate')}</option>
            <option value="pr">SORT: {t('pick_rate')}</option>
            <option value="br">SORT: {t('ban_rate')}</option>
          </select>
        )}
      </div>

      {view === 'roster' ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {filteredChamps.map(c => {
            const stats = LIVE_STATS[c.name];
            return (
              <div 
                key={c.key} 
                onClick={() => onOpenChamp(c.name)}
                className="text-center group cursor-pointer"
              >
                <div className="relative aspect-square w-full rounded-lg border-2 border-gray-800 group-hover:border-hex-gold overflow-hidden transition-all duration-300 shadow-lg group-hover:shadow-[0_0_15px_rgba(200,170,110,0.3)]">
                  <img 
                    src={champImgUrl(c.name, c.dd)} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500" 
                    loading="lazy"
                  />
                  <div className={`absolute bottom-0 right-0 text-[8px] px-1 font-bold ${c.difficulty === 'Easy' ? 'bg-green-900/90 text-green-300' : c.difficulty === 'Hard' ? 'bg-red-900/90 text-red-300' : 'bg-yellow-900/90 text-yellow-300'}`}>
                    {c.difficulty[0]}
                  </div>
                </div>
                <p className="mt-1.5 font-heading text-[10px] text-gray-500 group-hover:text-hex-goldlight transition leading-tight truncate px-0.5">{c.name}</p>
                {stats && <p className={`text-[9px] font-bold ${wrColor(stats.wr)}`}>{stats.wr.toFixed(1)}%</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-hex-panel lol-border rounded-lg overflow-x-auto shadow-2xl">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-[#010A13] border-b border-hex-gold/20 text-gray-500 font-heading text-[10px] uppercase">
              <tr>
                <th className="p-4 w-10">#</th>
                <th className="p-4">CHAMPION</th>
                <th className="p-4">WIN RATE</th>
                <th className="p-4">PICK RATE</th>
                <th className="p-4">BAN RATE</th>
                <th className="p-4">DIFFICULTY</th>
              </tr>
            </thead>
            <tbody>
              {metaData.map((d, i) => (
                <tr 
                  key={d.key} 
                  onClick={() => onOpenChamp(d.name)}
                  className="border-b border-gray-800/40 hover:bg-white/5 transition group cursor-pointer"
                >
                  <td className="p-4 text-gray-700 font-mono text-xs">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={champImgUrl(d.name, d.dd)} className="w-8 h-8 rounded border border-gray-700 group-hover:border-hex-gold transition" />
                      <div>
                        <div className="text-white text-sm font-medium group-hover:text-hex-goldlight">{d.name}</div>
                        <div className="text-[9px] text-gray-600 uppercase tracking-tighter">{d.classes.join(' • ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-bold ${wrColor(d.stats.wr)}`}>{d.stats.wr.toFixed(1)}%</span>
                      <div className="stat-bar-wrap w-24 h-1"><div className={`stat-bar ${wrBg(d.stats.wr)}`} style={{ width: `${Math.min(d.stats.wr / 60 * 100, 100)}%` }}></div></div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{d.stats.pr.toFixed(1)}%</td>
                  <td className="p-4">
                    <span className={`text-sm ${brColor(d.stats.br)} ${d.stats.br >= 30 ? 'font-bold' : ''}`}>{d.stats.br.toFixed(1)}%</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${d.difficulty === 'Easy' ? 'border-green-800 text-green-600' : d.difficulty === 'Hard' ? 'border-red-800 text-red-600' : 'border-yellow-800 text-yellow-600'}`}>
                      {t('diff_' + d.difficulty.toLowerCase())}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
