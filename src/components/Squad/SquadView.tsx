import React, { useState } from 'react';
import { Friend, Match } from '../../types';
import { db } from '../../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { showToast } from '../UI/ToastContainer';
import { CHAMPIONS } from '../../data/champions';
import { champImgUrl, wrColor, wrBg } from '../../lib/utils';

interface SquadViewProps {
  friends: Friend[];
  matches: Match[];
  t: (k: string) => string;
  onOpenChamp: (name: string) => void;
  onEditFriend: (id: string) => void;
}

export default function SquadView({ friends, matches, t, onOpenChamp, onEditFriend }: SquadViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [tempChamps, setTempChamps] = useState<string[]>([]);
  const [champSearch, setChampSearch] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddMember = async () => {
    if (!newName.trim()) return showToast('Name required', 'error');
    const roles = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="newRoles"]:checked')).map(e => e.value);
    try {
      await addDoc(collection(db, 'friends'), {
        name: newName,
        favoriteChampions: tempChamps,
        roles,
        avatar: avatar || '',
        squadId: 'global'
      });
      setShowAdd(false);
      setNewName('');
      setTempChamps([]);
      setAvatar(null);
      showToast('New squad member enlisted!', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eject member from platform?')) return;
    try {
      await deleteDoc(doc(db, 'friends', id));
      showToast('Member removed', 'info');
    } catch (e: any) { }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center bg-hex-panel/40 p-4 rounded-lg lol-border">
        <div>
          <h1 className="font-heading text-2xl text-hex-goldlight">{t('squad_title')}</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest">{friends.length} OPERATIVES ACTIVE</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="lol-btn px-4 py-2 rounded font-heading text-sm">
          <i className="fa-solid fa-plus text-xs"></i> {t('squad_add')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-hex-panel lol-border rounded">
            <p className="text-gray-500 italic">{t('squad_empty')}</p>
          </div>
        ) : (
          friends.map(f => (
            <FriendCard key={f.id} f={f} matches={matches} t={t} onOpenChamp={onOpenChamp} onEdit={() => onEditFriend(f.id)} onDelete={() => handleDelete(f.id)} />
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-hex-panel lol-border p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-heading text-xl text-hex-gold mb-4">{t('squad_add_title')}</h2>
            <input 
              type="text" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t('squad_ph_name')} 
              className="w-full bg-[#010A13] border border-hex-gold/30 rounded px-3 py-2 text-white outline-none focus:border-hex-gold mb-3" 
            />
            
            <div className="mb-3 bg-[#010A13] p-3 rounded border border-gray-800">
              <label className="text-sm text-gray-400 block mb-1">{t('squad_lbl_avatar')}</label>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="text-xs text-gray-400 w-full mb-2" />
              {avatar && <img src={avatar} className="w-14 h-14 rounded-full border-2 border-hex-gold object-cover" />}
            </div>

            <div className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{t('squad_lbl_main')}</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={champSearch}
                  onChange={e => setChampSearch(e.target.value)}
                  placeholder="Search champion..." 
                  className="w-full bg-[#010A13] border border-gray-700 rounded px-2 py-1.5 text-white text-sm outline-none mb-1" 
                />
                {champSearch && (
                  <div className="absolute top-full left-0 right-0 bg-[#091428] border border-gray-700 rounded max-h-32 overflow-y-auto z-[60] shadow-xl">
                    {CHAMPIONS.filter(c => c.name.toLowerCase().includes(champSearch.toLowerCase())).slice(0, 5).map(c => (
                      <div 
                        key={c.key} 
                        onClick={() => { if(!tempChamps.includes(c.name)) setTempChamps([...tempChamps, c.name]); setChampSearch(''); }}
                        className="p-2 hover:bg-white/5 cursor-pointer text-xs flex items-center gap-2"
                      >
                        <img src={champImgUrl(c.name)} className="w-5 h-5 rounded-full" /> {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {tempChamps.map(n => (
                  <div key={n} className="bg-hex-panel border border-hex-gold text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5">
                    <img src={champImgUrl(n)} className="w-4 h-4 rounded-full" />
                    {n}
                    <i className="fa-solid fa-xmark cursor-pointer text-gray-500 hover:text-hex-red" onClick={() => setTempChamps(tempChamps.filter(x => x !== n))}></i>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm text-gray-400 block mb-2">{t('squad_lbl_roles')}</label>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                {['Baron', 'Jungle', 'Mid', 'ADC', 'Support', 'Welfare'].map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" name="newRoles" value={r} className="accent-hex-blue" /> 
                    <span className="group-hover:text-hex-blue transition">{t('role_' + r.toLowerCase())}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-gray-800 pt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white transition uppercase text-xs tracking-widest">{t('squad_btn_cancel')}</button>
              <button onClick={handleAddMember} className="lol-btn px-6 py-2 rounded font-heading text-sm">{t('squad_btn_add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FriendCardProps {
  key?: React.Key;
  f: Friend;
  matches: Match[];
  t: any;
  onOpenChamp: any;
  onEdit: any;
  onDelete: any;
}

function FriendCard({ f, matches, t, onOpenChamp, onEdit, onDelete }: FriendCardProps) {
  const operativeMatches = matches.filter(m => m.players.some(p => p.name === f.name));
  const wins = operativeMatches.filter(m => m.result === 'Victory').length;
  const wr = operativeMatches.length ? Math.round((wins / operativeMatches.length) * 100) : null;
  
  let kills=0, deaths=0, assists=0, count=0;
  operativeMatches.forEach(m => {
    m.players.filter(p => p.name === f.name).forEach(p => {
      if(p.kills !== undefined && p.kills !== null) {
        kills += p.kills; deaths += p.deaths || 0; assists += p.assists || 0; count++;
      }
    });
  });
  const kda = count > 0 ? ((kills + assists) / Math.max(deaths, 1)).toFixed(1) : null;

  return (
    <div className="bg-hex-panel lol-border rounded-lg p-5 shadow-lg group relative">
      <div className="flex items-start gap-4 mb-4">
        {f.avatar ? (
          <img src={f.avatar} className="w-16 h-16 rounded-full border-2 border-hex-gold object-cover shadow-[0_0_10px_rgba(200,170,110,0.2)]" />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-hex-gold/30 bg-[#010A13] flex items-center justify-center font-heading text-3xl text-hex-gold">
            {f.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg text-hex-goldlight truncate">{f.name}</h3>
          <div className="flex flex-wrap gap-1 mt-2">
            {(f.roles || []).map(r => (
              <span key={r} className="role-pill">{t('role_' + r.toLowerCase())}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onEdit} className="text-gray-600 hover:text-hex-blue transition text-sm"><i className="fa-solid fa-pen-to-square"></i></button>
          <button onClick={onDelete} className="text-gray-600 hover:text-hex-red transition text-sm"><i className="fa-solid fa-user-minus"></i></button>
        </div>
      </div>

      {f.favoriteChampions?.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <i className="fa-solid fa-shield-heart text-hex-red/60 text-[8px]"></i> Specialty Data
          </p>
          <div className="flex flex-wrap gap-1.5">
            {f.favoriteChampions.map(c => (
              <div 
                key={c} 
                onClick={() => onOpenChamp(c)}
                className="flex items-center gap-1.5 bg-[#010A13] border border-gray-800 hover:border-hex-gold px-2 py-1 rounded cursor-pointer transition group/spec"
              >
                <img src={champImgUrl(c)} className="w-4 h-4 rounded-full grayscale group-hover/spec:grayscale-0 transition" />
                <span className="text-gray-400 group-hover/spec:text-white text-[10px]">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {operativeMatches.length > 0 && (
        <div className="border-t border-gray-800 pt-3 mt-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-center">
              <p className="text-lg font-bold text-hex-gold leading-none">{operativeMatches.length}</p>
              <p className="text-[9px] text-gray-600 uppercase">Deployed</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold leading-none ${wr! && wr >= 50 ? 'text-hex-green' : 'text-hex-red'}`}>{wr}%</p>
              <p className="text-[9px] text-gray-600 uppercase">Win Rate</p>
            </div>
            {kda && (
              <div className="text-center">
                <p className="text-lg font-bold text-hex-blue leading-none">{kda}</p>
                <p className="text-[9px] text-gray-600 uppercase">Avg KDA</p>
              </div>
            )}
            <div className="flex-1 ml-2">
               <div className="stat-bar-wrap h-1.5"><div className={`stat-bar ${wr! >= 50 ? 'bg-hex-green' : 'bg-hex-red'}`} style={{ width: `${wr}%` }}></div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
