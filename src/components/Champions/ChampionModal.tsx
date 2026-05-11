import React, { useState, useEffect } from 'react';
import { Match } from '../../types';
import { CHAMPIONS } from '../../data/champions';
import { LIVE_STATS } from '../../data/stats';
import { champImgUrl, wrColor, wrBg, formatWRAbilityText } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChampionModalProps {
  champName: string;
  onClose: () => void;
  t: (k: string) => string;
  matches: Match[];
}

export default function ChampionModal({ champName, onClose, t, matches }: ChampionModalProps) {
  const c = CHAMPIONS.find(ch => ch.name === champName);
  const ls = LIVE_STATS[champName];
  const [abilities, setAbilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!c) return;
    setLoading(true);
    fetch(`https://ddragon.leagueoflegends.com/cdn/14.9.1/data/en_US/champion/${c.dd}.json`)
      .then(r => r.json())
      .then(json => {
        const data = Object.values(json.data)[0] as any;
        const mapped = [
          { slot: 'P', name: data.passive.name, desc: data.passive.description, icon: `https://ddragon.leagueoflegends.com/cdn/14.9.1/img/passive/${data.passive.image.full}` },
          ...data.spells.map((s: any, i: number) => ({
            slot: ['Q', 'W', 'E', 'R'][i],
            name: s.name,
            desc: s.description,
            icon: `https://ddragon.leagueoflegends.com/cdn/14.9.1/img/spell/${s.image.full}`
          }))
        ];
        setAbilities(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [champName, c]);

  if (!c) return null;

  const platformMatches = matches.filter(m => m.players.some(p => p.champion === champName));
  const platformWr = platformMatches.length ? Math.round((platformMatches.filter(m => m.result === 'Victory').length / platformMatches.length) * 100) : null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#091428] border border-hex-gold rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition z-10 text-xl"><i className="fa-solid fa-xmark"></i></button>

        <div className="p-6 border-b border-hex-gold/20" style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #010A13 100%)' }}>
          <div className="flex items-start gap-5">
            <img src={champImgUrl(c.name, c.dd)} className="w-24 h-24 rounded-lg border-2 border-hex-gold shadow-[0_0_20px_rgba(200,170,110,0.3)]" />
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-3xl text-hex-goldlight tracking-wide">{c.name}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {c.classes.map(cl => <span key={cl} className={`class-badge class-${cl} border-opacity-50`}>{cl}</span>)}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {c.roles.map(r => <span key={r} className="role-pill opacity-80">{t('role_' + r.toLowerCase())}</span>)}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Difficulty</p>
              <p className={`font-heading text-lg ${c.difficulty === 'Easy' ? 'text-hex-green' : c.difficulty === 'Hard' ? 'text-hex-red' : 'text-hex-gold'}`}>{t('diff_' + c.difficulty.toLowerCase())}</p>
            </div>
          </div>

          {ls && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-[#010A13] border border-hex-green/20 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase mb-1">{t('win_rate')}</p>
                <p className={`text-2xl font-bold font-heading ${wrColor(ls.wr)}`}>{ls.wr.toFixed(1)}%</p>
                <div className="stat-bar-wrap mt-2 overflow-hidden"><div className={`stat-bar ${wrBg(ls.wr)}`} style={{ width: `${Math.min(ls.wr / 60 * 100, 100)}%` }}></div></div>
              </div>
              <div className="bg-[#010A13] border border-hex-blue/20 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase mb-1">{t('pick_rate')}</p>
                <p className="text-2xl font-bold font-heading text-hex-blue">{ls.pr.toFixed(1)}%</p>
                <div className="stat-bar-wrap mt-2"><div className="stat-bar bg-hex-blue" style={{ width: `${Math.min(ls.pr / 25 * 100, 100)}%` }}></div></div>
              </div>
              <div className="bg-[#010A13] border border-hex-red/20 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase mb-1">{t('ban_rate')}</p>
                <p className="text-2xl font-bold font-heading text-hex-red">{ls.br.toFixed(1)}%</p>
                <div className="stat-bar-wrap mt-2"><div className="stat-bar bg-hex-red" style={{ width: `${Math.min(ls.br / 80 * 100, 100)}%` }}></div></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="font-heading text-sm text-hex-gold mb-4 uppercase tracking-widest"><i className="fa-solid fa-bolt-lightning mr-2"></i>{t('champ_abilities')}</h3>
            {loading ? (
              <div className="flex items-center gap-3 text-gray-600 text-sm italic"><i className="fa-solid fa-spinner spinner"></i> Syncing Nexus database...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {abilities.map(a => (
                  <div key={a.slot} className="flex gap-4 p-3 rounded bg-white/5 border border-white/5 hover:border-white/10 transition group">
                    <div className="w-12 h-12 rounded border-2 border-gray-800 overflow-hidden flex-shrink-0 bg-black group-hover:border-hex-gold transition">
                      <img src={a.icon} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-hex-gold text-black px-1.5 rounded font-bold uppercase">{a.slot}</span>
                        <span className="text-white text-sm font-bold group-hover:text-hex-goldlight transition">{a.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed max-w-prose" dangerouslySetInnerHTML={{ __html: a.desc.replace(/<br\s*\/?>/gi, ' ') }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-heading text-sm text-hex-red uppercase tracking-widest"><i className="fa-solid fa-shield-halved mr-2"></i>{t('champ_counters')}</h3>
              <div className="flex flex-wrap gap-2">
                {c.counters.map(n => (
                  <div key={n} onClick={() => openChampModal(n)} className="flex items-center gap-2 bg-[#010A13] border border-hex-red/30 hover:border-hex-red px-3 py-1.5 rounded-lg cursor-pointer transition">
                    <img src={champImgUrl(n)} className="w-6 h-6 rounded-full border border-gray-700" />
                    <span className="text-gray-300 text-xs font-medium">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-heading text-sm text-hex-green uppercase tracking-widest"><i className="fa-solid fa-swords mr-2"></i>{t('champ_good_vs')}</h3>
              <div className="flex flex-wrap gap-2">
                {c.goodVs.map(n => (
                  <div key={n} onClick={() => openChampModal(n)} className="flex items-center gap-2 bg-[#010A13] border border-hex-green/30 hover:border-hex-green px-3 py-1.5 rounded-lg cursor-pointer transition">
                    <img src={champImgUrl(n)} className="w-6 h-6 rounded-full border border-gray-700" />
                    <span className="text-gray-300 text-xs font-medium">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-sm text-hex-blue uppercase tracking-widest"><i className="fa-solid fa-lightbulb mr-2"></i>{t('champ_tips')}</h3>
            <div className="grid grid-cols-1 gap-2">
              {c.tips.map((tip, i) => (
                <div key={i} className="tip-box flex items-start gap-4">
                  <span className="text-hex-gold font-mono text-[10px] mt-0.5">0{i+1}</span>
                  <span className="text-sm italic">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {platformWr !== null && (
            <div className="bg-[#010A13] border border-hex-blue/40 rounded-xl p-5 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-1 opacity-5 text-4xl text-hex-blue font-heading select-none">DATA.NEXUS</div>
               <h3 className="font-heading text-[10px] text-hex-blue uppercase tracking-[0.2em] mb-4">SQUAD PERF ANALYTICS</h3>
               <div className="flex items-center gap-8">
                 <div className="text-center">
                    <p className="text-2xl font-bold text-hex-gold leading-none">{platformMatches.length}</p>
                    <p className="text-[9px] text-gray-600 uppercase mt-1">Platform Games</p>
                 </div>
                 <div className="text-center">
                    <p className={`text-2xl font-bold leading-none ${platformWr >= 50 ? 'text-hex-green' : 'text-hex-red'}`}>{platformWr}%</p>
                    <p className="text-[9px] text-gray-600 uppercase mt-1">SQUAD WIN RATE</p>
                 </div>
                 <div className="flex-1">
                    <div className="stat-bar-wrap h-2 bg-gray-900"><div className={`stat-bar ${platformWr >= 50 ? 'bg-hex-green' : 'bg-hex-red'} shadow-[0_0_10px_rgba(0,176,155,0.4)]`} style={{ width: `${platformWr}%` }}></div></div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
