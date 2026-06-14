import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { Friend, Match } from './types';
import { i18n, Lang } from './data/i18n';
import LoginView from './components/Auth/LoginView';
import DashboardView from './components/Dashboard/DashboardView';
import MatchesView from './components/Matches/MatchesView';
import SquadView from './components/Squad/SquadView';
import ChampionsView from './components/Champions/ChampionsView';
import SettingsView from './components/Settings/SettingsView';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ToastContainer, { showToast } from './components/UI/ToastContainer';
import ChampionModal from './components/Champions/ChampionModal';
import EditMemberModal from './components/Squad/EditMemberModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Lang>((localStorage.getItem('wr_lang') as Lang) || 'zh');
  const [tab, setTab] = useState<string>(localStorage.getItem('wr_tab') || 'dashboard');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedChamp, setSelectedChamp] = useState<string | null>(null);
  const [editingFriendId, setEditingFriendId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const t = (key: string) => (i18n[lang] as any)[key] || key;

  const migrateLegacy = async () => {
    try {
      const legacyFriends = collection(db, 'artifacts', 'wildrift-companion-platform', 'public', 'data', 'friends');
      const legacyMatches = collection(db, 'artifacts', 'wildrift-companion-platform', 'public', 'data', 'matches');
      const [lf, lm, la] = await Promise.all([
        getDocs(legacyFriends),
        getDocs(legacyMatches),
        getDoc(doc(db, 'artifacts', 'wildrift-companion-platform', 'public', 'appConfig')),
      ]);

      if (lf.size === 0 && lm.size === 0 && !la.exists()) return;

      const batch = writeBatch(db);
      lf.forEach((d) => {
        const data = d.data();
        if (!data.squadId) data.squadId = 'global';
        batch.set(doc(collection(db, 'friends'), d.id), data, { merge: true });
      });
      lm.forEach((d) => {
        batch.set(doc(collection(db, 'matches'), d.id), d.data(), { merge: true });
      });
      if (la.exists()) {
        batch.set(doc(db, 'appConfig', 'settings'), la.data(), { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Legacy migration skipped:', e);
    }
  };

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setMatches([]);
      setDataLoading(false);
      return;
    }

    let cancelled = false;
    let friendsUnsub = () => {};
    let matchesUnsub = () => {};

    const startSubscriptions = async () => {
      setDataLoading(true);
      try {
        await user.getIdToken();
        await migrateLegacy();
      } catch (e) {
        console.error('Failed to prepare cloud sync:', e);
        showToast(lang === 'zh' ? '雲端同步準備失敗，請重新整理' : 'Cloud sync failed, please refresh', 'error');
      }

      if (cancelled) return;

      let friendsReady = false;
      let matchesReady = false;
      const markReady = () => {
        if (friendsReady && matchesReady) setDataLoading(false);
      };

      friendsUnsub = onSnapshot(
        query(collection(db, 'friends'), where('squadId', '==', 'global')),
        (snap) => {
          setFriends(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Friend)));
          friendsReady = true;
          markReady();
        },
        (error) => {
          console.error('Friends sync error:', error);
          showToast(lang === 'zh' ? '無法載入戰友名單，請檢查登入狀態' : 'Failed to load squad members', 'error');
          friendsReady = true;
          markReady();
        }
      );

      matchesUnsub = onSnapshot(
        query(collection(db, 'matches'), orderBy('timestamp', 'desc')),
        (snap) => {
          setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match)));
          matchesReady = true;
          markReady();
        },
        (error) => {
          console.error('Matches sync error:', error);
          showToast(lang === 'zh' ? '無法載入對戰紀錄，請檢查 Firestore 權限' : 'Failed to load match history', 'error');
          matchesReady = true;
          markReady();
        }
      );
    };

    startSubscriptions();

    return () => {
      cancelled = true;
      friendsUnsub();
      matchesUnsub();
    };
  }, [user, lang]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        getDoc(doc(db, 'appConfig', 'settings')).then(snap => {
          if (snap.exists() && snap.data().geminiKey) {
            localStorage.setItem('gemini_api_key', snap.data().geminiKey);
          }
        });
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (tab !== 'login') localStorage.setItem('wr_tab', tab);
  }, [tab]);

  const handleNavigate = (newTab: string) => setTab(newTab);
  const handleChangeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('wr_lang', newLang);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hex-bg">
        <div className="text-hex-gold font-heading flex items-center gap-2">
          <i className="fa-solid fa-spinner spinner"></i> nexus initializing...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-body">
      <ToastContainer />
      
      {user && (
        <Navbar 
          activeTab={tab} 
          onNavigate={handleNavigate} 
          lang={lang} 
          t={t} 
        />
      )}

      <main className={`flex-grow max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 flex flex-col ${!user ? 'justify-center' : ''}`}>
        {!user ? (
          <LoginView lang={lang} onChangeLang={handleChangeLang} t={t} />
        ) : dataLoading ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <div className="text-hex-gold font-heading flex items-center gap-2">
              <i className="fa-solid fa-spinner spinner"></i>
              {lang === 'zh' ? '正在同步雲端紀錄...' : 'Syncing cloud records...'}
            </div>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && <DashboardView friends={friends} matches={matches} t={t} onOpenChamp={setSelectedChamp} />}
            {tab === 'matches' && <MatchesView friends={friends} matches={matches} t={t} onOpenChamp={setSelectedChamp} user={user} />}
            {tab === 'friends' && <SquadView friends={friends} matches={matches} t={t} onOpenChamp={setSelectedChamp} onEditFriend={setEditingFriendId} />}
            {tab === 'champions' && <ChampionsView t={t} onOpenChamp={setSelectedChamp} matches={matches} />}
            {tab === 'settings' && <SettingsView lang={lang} onChangeLang={handleChangeLang} t={t} user={user} />}
          </>
        )}
      </main>

      {user && <Footer t={t} />}

      {selectedChamp && (
        <ChampionModal 
          champName={selectedChamp} 
          onClose={() => setSelectedChamp(null)} 
          t={t} 
          matches={matches}
          onOpenChamp={setSelectedChamp}
        />
      )}

      {editingFriendId && (
        <EditMemberModal 
          friendId={editingFriendId} 
          onClose={() => setEditingFriendId(null)} 
          t={t} 
          friends={friends}
        />
      )}
    </div>
  );
}
