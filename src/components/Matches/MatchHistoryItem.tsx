import React from 'react';
import { Match } from '../../types';
import { champImgUrl } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { showToast } from '../UI/ToastContainer';

interface MatchHistoryItemProps {
  key?: React.Key;
  match: Match;
  t: (k: string) => string;
  onOpenChamp: (name: string) => void;
  onEdit: (match: Match) => void;
}

export default function MatchHistoryItem({ match, t, onOpenChamp, onEdit }: MatchHistoryItemProps) {
  const handleDelete = async () => {
    if (!window.confirm('Delete this match record?')) return;
    try {
      await deleteDoc(doc(db, 'matches', match.id));
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
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onEdit(match)} className="text-gray-500 hover:text-hex-blue transition" title="Edit"><i className="fa-solid fa-pen"></i></button>
          <button onClick={handleDelete} className="text-gray-700 hover:text-hex-red transition" title="Delete"><i className="fa-solid fa-trash-can"></i></button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-gray-800 pt-3">
        {match.players.map((p, i) => (
          <div 
            key={i} 
            onClick={() => onOpenChamp(p.champion)}
            className="bg-[#010A13] border border-gray-800 hover:border-hex-gold transition px-3 py-2 rounded flex items-center justify-between cursor-pointer group/player min-w-[200px]"
          >
            <div className="flex items-center gap-3 w-1/3 min-w-[120px]">
              <div className="relative w-9 h-9 rounded-full border border-gray-700 overflow-hidden flex-shrink-0">
                <img src={champImgUrl(p.champion)} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-white text-[13px] font-bold truncate tracking-tight">{p.name}</div>
                  {p.role && <div className="text-gray-500 text-[10px]">({p.role})</div>}
                </div>
                <div className="text-hex-gold text-[10px] truncate uppercase">{p.champion}</div>
              </div>
            </div>

            <div className="w-1/4 min-w-[100px] flex flex-col items-center">
              <span className="text-[12px] text-hex-green font-mono tracking-wider">{p.kills}/{p.deaths}/{p.assists}</span>
              <span className="text-[10px] text-gray-500 mt-0.5">KDA: {p.kda}</span>
            </div>

            <div className="flex-1 flex flex-wrap gap-2 text-[10px] text-gray-400 justify-end items-center">
              {p.dmgDealt && <span className="flex items-center gap-1" title="Damage Dealt"><i className="fa-solid fa-fire text-hex-red"></i> {p.dmgDealt.toLocaleString()}</span>}
              {p.dmgTaken && <span className="flex items-center gap-1" title="Damage Taken"><i className="fa-solid fa-shield text-gray-500"></i> {p.dmgTaken.toLocaleString()}</span>}
              {p.cs && <span className="flex items-center gap-1" title="CS/Farm"><i className="fa-solid fa-khanda text-gray-400"></i> {p.cs}</span>}
              {p.gold && <span className="flex items-center gap-1" title="Gold"><i className="fa-solid fa-coins text-yellow-500"></i> {p.gold.toLocaleString()}</span>}
              {p.wards && <span className="flex items-center gap-1" title="Wards"><i className="fa-solid fa-eye text-blue-400"></i> {p.wards}</span>}
              {p.notes && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ml-1 ${p.notes.toLowerCase().includes('mvp') ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : p.notes.toLowerCase().includes('svp') ? 'bg-gray-400/20 text-gray-400 border border-gray-400/50' : 'bg-hex-panel text-gray-300'}`}>
                  {p.notes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
