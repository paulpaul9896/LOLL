import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Match, Friend, MatchPlayer } from '../../types';
import { User } from 'firebase/auth';
import { showToast } from '../UI/ToastContainer';
import { CHAMPIONS } from '../../data/champions';
import { champImgUrl, formatWRAbilityText } from '../../lib/utils';
import MatchHistoryItem from './MatchHistoryItem';

interface MatchesViewProps {
  friends: Friend[];
  matches: Match[];
  t: (k: string) => string;
  onOpenChamp: (name: string) => void;
  user: User;
}

export default function MatchesView({ friends, matches, t, onOpenChamp, user }: MatchesViewProps) {
  const [result, setResult] = useState<'Victory' | 'Defeat' | ''>('');
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [currentFriend, setCurrentFriend] = useState('');
  const [currentChamp, setCurrentChamp] = useState('');
  const [champSearch, setChampSearch] = useState('');
  const [showChampDrop, setShowChampDrop] = useState(false);
  const [kills, setKills] = useState('');
  const [deaths, setDeaths] = useState('');
  const [assists, setAssists] = useState('');
  const [dmgDealt, setDmgDealt] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [role, setRole] = useState('');
  
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const filteredChamps = CHAMPIONS.filter(c => 
    c.name.toLowerCase().includes(champSearch.toLowerCase())
  ).slice(0, 8);

  const handleAddPlayer = () => {
    if (!currentFriend || !currentChamp) {
      showToast('Select member and champion', 'error');
      return;
    }
    if (matchPlayers.length >= 5) {
      showToast('Team full (max 5)', 'error');
      return;
    }
    if (matchPlayers.find(p => p.name === currentFriend)) {
      showToast('Member already added', 'error');
      return;
    }

    const k = parseInt(kills) || 0;
    const d = parseInt(deaths) || 0;
    const a = parseInt(assists) || 0;
    const kda = ((k + a) / Math.max(d, 1)).toFixed(2);

    const newPlayer: MatchPlayer = {
      name: currentFriend,
      champion: currentChamp,
      role: role || null,
      kills: parseInt(kills) || 0,
      deaths: parseInt(deaths) || 0,
      assists: parseInt(assists) || 0,
      kda,
      dmgDealt: parseInt(dmgDealt) || null,
      notes: notes.trim() || null
    };

    setMatchPlayers([...matchPlayers, newPlayer]);
    // Reset inputs
    setChampSearch('');
    setCurrentChamp('');
    setKills('');
    setDeaths('');
    setAssists('');
    setDmgDealt('');
    setNotes('');
  };

  const handleRemovePlayer = (idx: number) => {
    setMatchPlayers(matchPlayers.filter((_, i) => i !== idx));
  };

  const handleSaveMatch = async () => {
    if (!result || matchPlayers.length === 0) {
      showToast('Set result and add players', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'artifacts', 'wildrift-companion-platform', 'public', 'data', 'matches'), {
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('zh-HK'),
        result,
        players: matchPlayers,
        savedBy: user.email || 'unknown',
        screenshot: screenshots[0] || null,
        duration: parseInt(duration) || null,
        appVersion: '3.0'
      });
      
      setResult('');
      setMatchPlayers([]);
      setScreenshots([]);
      setDuration('');
      showToast('Match saved!', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newScreens: string[] = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        // Basic compression helper
        compressImage(dataUrl).then(compressed => {
          setScreenshots(prev => [...prev, compressed]);
        });

        // Auto-detect result from filename
        const fn = file.name.toLowerCase();
        if (fn.includes('victory') || fn.includes('win')) setResult('Victory');
        else if (fn.includes('defeat') || fn.includes('loss')) setResult('Defeat');
      };
      reader.readAsDataURL(file);
    });
  };

  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  const parseWithAI = async () => {
    if (screenshots.length === 0) return showToast('Upload screenshot first', 'error');
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return showToast('Set Gemini API key in Settings', 'error');

    setIsParsing(true);
    try {
      const base64 = screenshots[0].split(',')[1];
      const mimeType = 'image/jpeg';
      
      const prompt = `Analyze this Wild Rift match result. Extract Result (Victory/Defeat), Match Duration (min), and for up to 5 players: Name, Champion, Kills, Deaths, Assists, Damage Dealt. Return ONLY JSON: {"result":"Victory"|"Defeat", "duration":number, "players": [{"name":"str", "champion":"str", "kills":num, "deaths":num, "assists":num, "dmgDealt":num}]}`;

      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" }
        })
      });

      if (!resp.ok) throw new Error('Gemini API error');
      const data = await resp.json();
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text);

      if (parsed.result) setResult(parsed.result);
      if (parsed.duration) setDuration(parsed.duration.toString());
      
      if (parsed.players) {
        const newPlayers = parsed.players.map((p: any) => {
          const champ = CHAMPIONS.find(c => c.name.toLowerCase().includes(p.champion.toLowerCase()))?.name || p.champion;
          const friend = friends.find(f => f.name.toLowerCase().includes(p.name.toLowerCase()))?.name || 'Unknown';
          return {
            name: friend,
            champion: champ,
            kills: p.kills || 0,
            deaths: p.deaths || 0,
            assists: p.assists || 0,
            dmgDealt: p.dmgDealt || null,
            kda: ((p.kills + p.assists) / Math.max(p.deaths, 1)).toFixed(2)
          };
        });
        setMatchPlayers(newPlayers);
      }
      showToast('AI parsed match data!', 'success');
    } catch (e: any) {
      showToast('AI parsing failed: ' + e.message, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="bg-hex-panel lol-border p-5 rounded-lg shadow lg:sticky lg:top-20 h-fit">
        <h2 className="font-heading text-lg text-hex-goldlight mb-4 border-b border-hex-gold/20 pb-2">{t('match_title')}</h2>
        
        <div className="mb-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setResult('Victory')} 
              className={`flex-1 py-2 border rounded transition text-sm font-heading ${result === 'Victory' ? 'bg-hex-green/20 border-hex-green text-hex-green font-bold' : 'border-hex-green/40 text-hex-green hover:bg-hex-green/10'}`}
            >
              {t('match_victory')}
            </button>
            <button 
              onClick={() => setResult('Defeat')} 
              className={`flex-1 py-2 border rounded transition text-sm font-heading ${result === 'Defeat' ? 'bg-hex-red/20 border-hex-red text-hex-red font-bold' : 'border-hex-red/40 text-hex-red hover:bg-hex-red/10'}`}
            >
              {t('match_defeat')}
            </button>
          </div>
        </div>

        <div className="mb-3 bg-[#010A13] border border-gray-800 p-3 rounded space-y-2">
          <p className="text-xs text-gray-400">{t('match_add_player')}</p>
          <select 
            value={currentFriend}
            onChange={(e) => setCurrentFriend(e.target.value)}
            className="w-full bg-hex-panel border border-gray-700 rounded px-2 py-1.5 text-white text-sm outline-none"
          >
            <option value="">{t('match_sel_friend')}</option>
            {friends.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            <option value="Myself">Myself</option>
          </select>
          
          <div className="relative">
            <input 
              type="text" 
              value={champSearch}
              onChange={(e) => { setChampSearch(e.target.value); setShowChampDrop(true); }}
              placeholder={t('match_sel_champ')} 
              className="w-full bg-hex-panel border border-gray-700 rounded px-2 py-1.5 text-white text-sm outline-none" 
            />
            {showChampDrop && champSearch && (
              <div className="absolute top-full left-0 right-0 bg-[#091428] border border-gray-700 rounded mt-1 max-h-40 overflow-y-auto z-50 shadow-xl">
                {filteredChamps.map(c => (
                  <div 
                    key={c.key} 
                    onClick={() => { setCurrentChamp(c.name); setChampSearch(c.name); setShowChampDrop(false); }}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 cursor-pointer text-sm"
                  >
                    <img src={champImgUrl(c.name)} className="w-5 h-5 rounded-full" />
                    <span className="text-white">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1">
            <input type="number" value={kills} onChange={e => setKills(e.target.value)} placeholder="K" className="bg-hex-panel border border-gray-700 rounded py-1 text-white text-xs outline-none text-center" />
            <input type="number" value={deaths} onChange={e => setDeaths(e.target.value)} placeholder="D" className="bg-hex-panel border border-gray-700 rounded py-1 text-white text-xs outline-none text-center" />
            <input type="number" value={assists} onChange={e => setAssists(e.target.value)} placeholder="A" className="bg-hex-panel border border-gray-700 rounded py-1 text-white text-xs outline-none text-center" />
          </div>

          <button 
            onClick={handleAddPlayer}
            className="w-full py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-hex-gold rounded border border-gray-700 transition"
          >
            {t('match_btn_add_team')}
          </button>
        </div>

        <ul className="space-y-1.5 mb-4 min-h-[40px]">
          {matchPlayers.length === 0 ? (
            <li className="text-gray-500 italic text-xs">{t('match_no_players')}</li>
          ) : (
            matchPlayers.map((p, i) => (
              <li key={i} className="flex items-center justify-between bg-[#010A13] p-2 rounded border border-gray-800">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={champImgUrl(p.champion)} className="w-6 h-6 rounded-full border border-hex-gold flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-white text-xs font-bold truncate">{p.name}</span>
                      <span className="text-hex-gold text-[10px]">{p.champion}</span>
                    </div>
                    <span className="text-[10px] text-hex-green">{p.kills}/{p.deaths}/{p.assists}</span>
                  </div>
                </div>
                <i className="fa-solid fa-xmark text-gray-600 hover:text-hex-red cursor-pointer ml-2" onClick={() => handleRemovePlayer(i)}></i>
              </li>
            ))
          )}
        </ul>

        <div className="mb-4 bg-[#010A13] border border-gray-800 p-3 rounded">
          <label className="text-xs text-gray-400 block mb-1">
            <i className="fa-solid fa-image mr-1"></i> Screenshot <span className="text-hex-blue text-[9px]">(AI Auto-fill)</span>
          </label>
          <input type="file" onChange={handleScreenshotChange} accept="image/*" className="text-xs text-gray-500 w-full mb-2" />
          
          {screenshots.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1">
                {screenshots.map((s, i) => <img key={i} src={s} className="w-16 h-12 object-cover rounded border border-gray-700" />)}
              </div>
              <button 
                disabled={isParsing}
                onClick={parseWithAI}
                className="w-full py-1.5 bg-hex-blue/20 border border-hex-blue/40 text-hex-blue rounded hover:bg-hex-blue/30 transition text-[11px] flex items-center justify-center gap-2"
              >
                {isParsing ? <i className="fa-solid fa-spinner spinner"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} 
                {isParsing ? 'Analyzing...' : 'AI Parse Screenshot'}
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={handleSaveMatch}
          className="lol-btn w-full py-3 rounded font-heading font-bold text-sm"
        >
          {t('match_save_btn')}
        </button>
      </div>

      <div className="lg:col-span-2 space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-20 bg-hex-panel lol-border rounded">
            <p className="text-gray-500 font-heading tracking-widest">{t('match_empty')}</p>
          </div>
        ) : (
          matches.map(m => (
            <MatchHistoryItem key={m.id} match={m} t={t} onOpenChamp={onOpenChamp} />
          ))
        )}
      </div>
    </div>
  );
}
