import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc, where } from 'firebase/firestore';
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
import ToastContainer from './components/UI/ToastContainer';
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

  const t = (key: string) => (i18n[lang] as any)[key] || key;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // App settings
        getDoc(doc(db, 'artifacts', 'wildrift-companion-platform', 'public', 'appConfig')).then(snap => {
          if (snap.exists() && snap.data().geminiKey) {
            localStorage.setItem('gemini_api_key', snap.data().geminiKey);
          }
        });

        // Subscriptions
        const friendsUnsub = onSnapshot(collection(db, 'artifacts', 'wildrift-companion-platform', 'public', 'data', 'friends'), snap => {
          setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() } as Friend)));
        }, error => {
          handleFirestoreError(error, OperationType.LIST, 'friends');
        });
        const matchesUnsub = onSnapshot(query(collection(db, 'artifacts', 'wildrift-companion-platform', 'public', 'data', 'matches'), orderBy('timestamp', 'desc')), snap => {
          setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Match)));
        }, error => {
          handleFirestoreError(error, OperationType.LIST, 'matches');
        });

        setLoading(false);
        return () => {
          friendsUnsub();
          matchesUnsub();
        };
      } else {
        setFriends([]);
        setMatches([]);
        setLoading(false);
      }
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
