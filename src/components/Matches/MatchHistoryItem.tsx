import React from 'react';
import { Match } from '../../types';
import { champImgUrl } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { showToast } from '../UI/ToastContainer';

interface MatchHistoryItemProps {
  match: Match;
  t: (k: string) => string;
  onOpenChamp: (name: string) => void;
}

export default function MatchHistoryItem({ match, t, onOpenChamp }: MatchHistoryItemProps) {
  const handleDelete = async () => {
    if (!window.confirm('Delete this match record?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', 'wildrift-companion-platform', 'public', 'data', 'matches', match.id));
      showToast('Match deleted', 'info');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className={`bg-hex-panel border-l-4 ${match.result === 'Victory' ? 'border-l-hex-green' : 'border-l-hex-red'} rounded shadow p-4 relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`font-heading font-bold ${match.result === 'Victory' ? 'text-hex-green' : 'text-hex-red'} uppercase tracking-widest`}>
            {match.result === 'Victory' ? t('match_victory') : t('match_defeat')}
          </span>
          <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
            {match.date} • Recorded by: {match.savedBy.split('@')[0]}
            {match.duration ? ` • ${match.duration} MIN` : ''}
          </div>
        </div>
        <button onClick={handleDelete} className="text-gray-700 hover:text-hex-red transition opacity-0 group-hover:opacity-100"><i className="fa-solid fa-trash-can"></i></button>
      </div>

      <div className="flex flex-wrap gap-2">
        {match.players.map((p, i) => (
          <div 
            key={i} 
            onClick={() => onOpenChamp(p.champion)}
            className="bg-[#010A13] border border-gray-800 hover:border-hex-gold transition pl-1 pr-3 py-1 rounded flex items-center gap-2 cursor-pointer group/player min-w-[120px]"
          >
            <div className="relative w-8 h-8 rounded-full border border-gray-700 overflow-hidden flex-shrink-0">
              <img src={champImgUrl(p.champion)} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-bold truncate tracking-tight">{p.name}</div>
              <div className="text-hex-gold text-[9px] truncate uppercase">{p.champion}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-hex-green font-mono">{p.kills}/{p.deaths}/{p.assists}</span>
                {p.dmgDealt && <span className="text-[8px] text-gray-600">⚔️{(p.dmgDealt/1000).toFixed(1)}k</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {match.screenshot && (
        <div className="mt-3 relative h-32 rounded border border-gray-800 overflow-hidden group/img">
          <img src={match.screenshot} className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-hex-panel to-transparent pointer-events-none"></div>
          <button 
            onClick={() => window.open(match.screenshot!, '_blank')}
            className="absolute bottom-2 right-2 text-[10px] text-hex-blue hover:text-white transition bg-hex-bg/80 px-2 py-1 rounded border border-hex-blue/30"
          >
            <i className="fa-solid fa-expand mr-1"></i> VIEW FULL
          </button>
        </div>
      )}
    </div>
  );
}
