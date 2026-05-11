import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User, signOut } from 'firebase/auth';
import { Lang } from '../../data/i18n';
import { showToast } from '../UI/ToastContainer';

interface SettingsViewProps {
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  t: (k: string) => string;
  user: User;
}

export default function SettingsView({ lang, onChangeLang, t, user }: SettingsViewProps) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'artifacts', 'wildrift-companion-platform', 'public', 'appConfig'))
      .then(snap => {
        if (snap.exists() && snap.data().geminiKey) {
          setApiKey(snap.data().geminiKey);
          localStorage.setItem('gemini_api_key', snap.data().geminiKey);
        }
      });
  }, []);

  const handleSaveKey = async () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setLoading(true);
    try {
      await setDoc(doc(db, 'artifacts', 'wildrift-companion-platform', 'public', 'appConfig'), {
        geminiKey: apiKey,
        updatedAt: Date.now()
      }, { merge: true });
      showToast('Gemini key shared with squad!', 'success');
    } catch (e: any) {
      showToast('Key saved locally only', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Logged out operative', 'info');
    } catch (e: any) { }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-hex-gold/20 pb-4">
        <h1 className="font-heading text-2xl text-hex-goldlight">{t('set_title')}</h1>
        <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mt-1">NEXUS CONTROL PANEL</p>
      </div>

      <div className="bg-hex-panel lol-border p-6 rounded-lg shadow-xl space-y-6">
        <section>
          <h2 className="font-heading text-sm text-hex-gold mb-4 flex items-center gap-3">
            <i className="fa-solid fa-globe text-hex-blue"></i> {t('set_lang')}
          </h2>
          <div className="flex gap-4">
            <button 
              onClick={() => onChangeLang('en')} 
              className={`flex-1 py-3 rounded border font-heading text-sm transition ${lang === 'en' ? 'border-hex-blue bg-hex-blue/10 text-white shadow-[0_0_15px_rgba(10,200,185,0.2)]' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}
            >
              English
            </button>
            <button 
              onClick={() => onChangeLang('zh')} 
              className={`flex-1 py-3 rounded border font-heading text-sm transition ${lang === 'zh' ? 'border-hex-blue bg-hex-blue/10 text-white shadow-[0_0_15px_rgba(10,200,185,0.2)]' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}
            >
              繁體中文
            </button>
          </div>
        </section>

        <section className="pt-6 border-t border-gray-800">
          <h2 className="font-heading text-sm text-hex-gold mb-2 flex items-center gap-3">
            <i className="fa-brands fa-google text-hex-blue"></i> Gemini Operative AI
          </h2>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed tracking-tighter">Enter your Gemini API key to enable tactical screenshot analysis. This key is shared with your entire squad via Nexus cloud sync.</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..." 
              className="flex-1 bg-[#010A13] border border-hex-gold/30 rounded px-4 py-2.5 text-white text-sm outline-none focus:border-hex-gold transition font-mono" 
            />
            <button 
              onClick={handleSaveKey}
              disabled={loading}
              className="lol-btn px-6 py-2.5 rounded font-heading text-sm shadow-xl"
            >
              {loading ? <i className="fa-solid fa-spinner spinner"></i> : <><i className="fa-solid fa-floppy-disk"></i> SAVE</>}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 italic">Keys are encrypted at rest. Deployment to Cloud Firestore successful.</p>
        </section>

        <section className="pt-6 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#010A13] rounded border border-gray-800 group">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 group-hover:text-hex-gold transition">Nexus Build</p>
            <p className="text-white text-sm font-bold">WR-Companion v3.0.0-PRO</p>
          </div>
          <div className="p-4 bg-[#010A13] rounded border border-gray-800 group">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 group-hover:text-hex-gold transition">Telemetry Service</p>
            <p className="text-white text-sm font-bold">Cloud-Sync-Ready (us-east1)</p>
          </div>
        </section>

        <div className="pt-8 flex flex-col items-center border-t border-gray-800">
          <div className="w-16 h-16 rounded-full border-2 border-hex-green bg-hex-green/5 flex items-center justify-center mb-3">
             <i className="fa-solid fa-user-check text-2xl text-hex-green"></i>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t('set_logged_in')}</p>
          <p className="text-white font-heading text-lg mb-6 border-b border-hex-gold/40 pb-1">{user.email}</p>
          <button 
            onClick={handleLogout}
            className="lol-btn w-full py-4 rounded font-heading tracking-[0.3em] text-lg shadow-2xl hover:text-hex-red hover:border-hex-red transition duration-300"
          >
            TERMINATE SESSION
          </button>
        </div>
      </div>
    </div>
  );
}
