import React, { useState } from 'react';
import { Friend } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { showToast } from '../UI/ToastContainer';
import { CHAMPIONS } from '../../data/champions';
import { champImgUrl } from '../../lib/utils';
import { motion } from 'motion/react';

interface EditMemberModalProps {
  friendId: string;
  onClose: () => void;
  t: (k: string) => string;
  friends: Friend[];
}

export default function EditMemberModal({ friendId, onClose, t, friends }: EditMemberModalProps) {
  const f = friends.find(fr => fr.id === friendId);
  const [name, setName] = useState(f?.name || '');
  const [tempChamps, setTempChamps] = useState<string[]>(f?.favoriteChampions || []);
  const [champSearch, setChampSearch] = useState('');
  const [avatar, setAvatar] = useState<string | null>(f?.avatar || null);
  const [loading, setLoading] = useState(false);

  if (!f) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return showToast('Name required', 'error');
    setLoading(true);
    const roles = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="editRoles"]:checked')).map(e => e.value);
    
    try {
      await updateDoc(doc(db, 'artifacts', 'wildrift-companion-platform', 'public', 'data', 'friends', friendId), {
        name,
        favoriteChampions: tempChamps,
        roles,
        avatar: avatar || ''
      });
      showToast('Operative profile updated!', 'success');
      onClose();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-[210] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-hex-panel lol-border p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-xl"><i className="fa-solid fa-xmark"></i></button>
        
        <h2 className="font-heading text-xl text-hex-gold mb-6 border-b border-hex-gold/20 pb-2">{t('squad_edit_title')}</h2>
        
        <div className="space-y-5">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Codename</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#010A13] border border-hex-gold/30 rounded px-3 py-2.5 text-white outline-none focus:border-hex-gold transition font-bold" 
            />
          </div>

          <div className="bg-[#010A13] p-4 rounded border border-gray-800">
            <label className="text-xs text-gray-500 uppercase mb-2 block">{t('squad_lbl_avatar')}</label>
            <div className="flex items-center gap-4">
              {avatar ? (
                <img src={avatar} className="w-14 h-14 rounded-full border-2 border-hex-gold object-cover shadow-lg" />
              ) : (
                <div className="w-14 h-14 rounded-full border border-gray-700 bg-hex-panel flex items-center justify-center text-gray-500">
                  <i className="fa-solid fa-user text-xl"></i>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="text-[10px] text-gray-500 flex-1" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">{t('squad_lbl_main')}</label>
            <div className="relative">
              <input 
                type="text" 
                value={champSearch}
                onChange={e => setChampSearch(e.target.value)}
                placeholder="Search database..." 
                className="w-full bg-[#010A13] border border-gray-700 rounded px-3 py-2 text-white text-sm outline-none mb-2 focus:border-hex-gold/40 transition" 
              />
              {champSearch && (
                <div className="absolute top-full left-0 right-0 bg-[#091428] border border-gray-700 rounded max-h-40 overflow-y-auto z-[220] shadow-2xl">
                  {CHAMPIONS.filter(c => c.name.toLowerCase().includes(champSearch.toLowerCase())).slice(0, 5).map(c => (
                    <div 
                      key={c.key} 
                      onClick={() => { if(!tempChamps.includes(c.name)) setTempChamps([...tempChamps, c.name]); setChampSearch(''); }}
                      className="p-2 hover:bg-white/5 cursor-pointer text-xs flex items-center gap-3 border-b border-white/5 last:border-0"
                    >
                      <img src={champImgUrl(c.name)} className="w-6 h-6 rounded-full" />
                      <span className="text-gray-300">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {tempChamps.map(n => (
                <div key={n} className="bg-hex-panel border border-hex-gold/40 text-gray-200 px-2 py-1 rounded text-[10px] flex items-center gap-2 group">
                  <img src={champImgUrl(n)} className="w-4 h-4 rounded-full" />
                  {n}
                  <i className="fa-solid fa-circle-xmark cursor-pointer text-gray-600 group-hover:text-hex-red transition" onClick={() => setTempChamps(tempChamps.filter(x => x !== n))}></i>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase mb-3 block">{t('squad_lbl_roles')}</label>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
              {['Baron', 'Jungle', 'Mid', 'ADC', 'Support', 'Welfare'].map(r => (
                <label key={r} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    name="editRoles" 
                    value={r} 
                    defaultChecked={f.roles.includes(r)}
                    className="w-4 h-4 accent-hex-blue bg-black border-gray-700 rounded" 
                  /> 
                  <span className="group-hover:text-hex-blue transition">{t('role_' + r.toLowerCase())}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-gray-800 pt-6">
            <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-white transition uppercase text-[10px] tracking-widest">{t('squad_btn_cancel')}</button>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="lol-btn px-8 py-2.5 rounded font-heading text-sm shadow-lg min-w-[140px]"
            >
              {loading ? <i className="fa-solid fa-spinner spinner"></i> : t('squad_btn_save')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
