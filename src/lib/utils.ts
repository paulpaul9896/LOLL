import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function champImgUrl(name: string, dd: string = '') {
  if (name === 'Norra') {
    return `https://ddragon.leagueoflegends.com/cdn/14.9.1/img/champion/Yuumi.png`;
  }
  const ddName = dd || name.replace(/[' &\-]/g, '');
  return `https://ddragon.leagueoflegends.com/cdn/14.9.1/img/champion/${ddName}.png`;
}

export function formatWRAbilityText(raw: string) {
  if (!raw) return '';
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(\+[\d.]+%?\s*(?:AP|AD|bonus AD|base AD|max health|current health|missing health))/gi,
      '<span class="text-hex-gold font-bold">$1</span>')
    .replace(/Cooldown:\s*[\d\s/]+/g, (s: string) => '<span class="text-hex-blue text-[10px]">' + s + '</span>')
    .replace(/\b(\d+\s*\/\s*\d+(?:\s*\/\s*\d+)*)/g, '<span class="text-orange-400">$1</span>')
    .replace(/\n/g, '<br>');
}

export function wrColor(wr: number) {
  return wr >= 52 ? 'text-green-400' : wr >= 50 ? 'text-hex-green' : wr >= 48 ? 'text-hex-gold' : 'text-hex-red';
}

export function wrBg(wr: number) {
  return wr >= 52 ? 'bg-green-400' : wr >= 50 ? 'bg-hex-green' : wr >= 48 ? 'bg-hex-gold' : 'bg-hex-red';
}

export function brColor(br: number) {
  return br >= 30 ? 'text-hex-red' : br >= 10 ? 'text-hex-gold' : 'text-green-400';
}
