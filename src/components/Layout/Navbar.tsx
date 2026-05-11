import React from 'react';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  lang: string;
  t: (k: string) => string;
}

export default function Navbar({ activeTab, onNavigate, t }: NavbarProps) {
  const tabs = [
    { id: 'dashboard', label: t('nav_dash'), icon: null },
    { id: 'matches', label: t('nav_matches'), icon: null },
    { id: 'friends', label: t('nav_friends'), icon: null },
    { id: 'champions', label: t('nav_champs'), icon: null },
    { id: 'settings', label: null, icon: 'fa-gear' },
  ];

  return (
    <nav className="bg-hex-panel border-b border-hex-gold/30 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div 
              className="w-9 h-9 rounded-full border-2 border-hex-gold overflow-hidden cursor-pointer ai-glow flex-shrink-0"
              onClick={() => onNavigate('champions')}
            >
              <img src="/icon.png" className="w-full h-full object-cover" alt="Logo" onError={(e) => { e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/14.9.1/img/profileicon/29.png'; }} />
            </div>
            <div className="leading-tight pointer-events-none">
              <span className="font-heading font-bold text-sm text-hex-goldlight tracking-wide">英雄聯盟</span>
              <span className="font-heading font-bold text-sm text-hex-red tracking-wide ml-1">沖分群組</span>
            </div>
          </div>
          <div className="flex overflow-x-auto text-xs sm:text-sm no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`px-2 sm:px-3 py-2 font-heading font-bold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'tab-active' : 'text-gray-400 hover:text-hex-gold'}`}
              >
                {tab.label || (tab.icon && <i className={`fa-solid ${tab.icon}`}></i>)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
