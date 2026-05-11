import React from 'react';

export default function Footer({ t }: { t: (k: string) => string }) {
  return (
    <footer className="bg-hex-panel border-t border-hex-gold/20 text-center py-2 text-xs text-gray-600">
      英雄聯盟 沖分群組 v3.2 • 禁屌人平台 • {t('stat_updated')}
    </footer>
  );
}
