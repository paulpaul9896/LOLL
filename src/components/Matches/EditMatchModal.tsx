import React, { useState } from 'react';
import { Match, MatchPlayer } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { showToast } from '../UI/ToastContainer';

interface EditMatchModalProps {
  match: Match;
  onClose: () => void;
}

export default function EditMatchModal({ match, onClose }: EditMatchModalProps) {
  const [result, setResult] = useState(match.result);
  const [duration, setDuration] = useState(match.duration?.toString() || '');
  const [players, setPlayers] = useState<MatchPlayer[]>(match.players);

  const handleUpdatePlayer = (index: number, field: keyof MatchPlayer, value: any) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    // update kda
    if (field === 'kills' || field === 'deaths' || field === 'assists') {
      const k = newPlayers[index].kills || 0;
      const d = newPlayers[index].deaths || 0;
      const a = newPlayers[index].assists || 0;
      newPlayers[index].kda = d === 0 ? 'Perfect' : ((k + a) / d).toFixed(2);
    }
    setPlayers(newPlayers);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'matches', match.id), {
        result,
        duration: parseInt(duration) || null,
        players
      });
      showToast('Match updated successfully', 'success');
      onClose();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-hex-panel border border-gray-700 w-full max-w-4xl rounded shadow-2xl p-6 my-8">
        <h2 className="text-xl font-heading text-hex-gold font-bold mb-4">Edit Match Record</h2>
        
        <div className="flex gap-4 mb-4">
          <select value={result} onChange={e => setResult(e.target.value as 'Victory' | 'Defeat')} className="bg-[#010A13] border border-gray-700 text-white px-3 py-2 rounded">
            <option value="Victory">Victory</option>
            <option value="Defeat">Defeat</option>
          </select>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (min)" className="bg-[#010A13] border border-gray-700 text-white px-3 py-2 rounded" />
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {players.map((p, i) => (
            <div key={i} className="bg-[#010A13] p-4 rounded border border-gray-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                <input value={p.name} onChange={e => handleUpdatePlayer(i, 'name', e.target.value)} placeholder="Name" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded" />
                <input value={p.champion} onChange={e => handleUpdatePlayer(i, 'champion', e.target.value)} placeholder="Champion" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded" />
                <input value={p.role || ''} onChange={e => handleUpdatePlayer(i, 'role', e.target.value)} placeholder="Role" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded" />
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-2">
                <input type="number" value={p.kills} onChange={e => handleUpdatePlayer(i, 'kills', parseInt(e.target.value) || 0)} placeholder="K" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded w-full" />
                <input type="number" value={p.deaths} onChange={e => handleUpdatePlayer(i, 'deaths', parseInt(e.target.value) || 0)} placeholder="D" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded w-full" />
                <input type="number" value={p.assists} onChange={e => handleUpdatePlayer(i, 'assists', parseInt(e.target.value) || 0)} placeholder="A" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded w-full" />
                <input type="number" value={p.dmgDealt || ''} onChange={e => handleUpdatePlayer(i, 'dmgDealt', parseInt(e.target.value) || null)} placeholder="DMG Dealt" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded w-full" />
                <input type="number" value={p.dmgTaken || ''} onChange={e => handleUpdatePlayer(i, 'dmgTaken', parseInt(e.target.value) || null)} placeholder="DMG Taken" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded w-full" />
                <input type="number" value={p.cs || ''} onChange={e => handleUpdatePlayer(i, 'cs', parseInt(e.target.value) || null)} placeholder="CS" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded w-full" />
                <input type="number" value={p.gold || ''} onChange={e => handleUpdatePlayer(i, 'gold', parseInt(e.target.value) || null)} placeholder="Gold" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded w-full" />
                <input type="number" value={p.wards || ''} onChange={e => handleUpdatePlayer(i, 'wards', parseInt(e.target.value) || null)} placeholder="Wards" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded w-full" />
                <input value={p.notes || ''} onChange={e => handleUpdatePlayer(i, 'notes', e.target.value)} placeholder="Notes (MVP/SVP)" className="bg-hex-panel border border-gray-700 text-white px-2 py-1 text-sm rounded col-span-2 w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-700 text-gray-300 rounded hover:bg-gray-800 transition">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-hex-gold text-black font-bold rounded hover:bg-yellow-400 transition">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
