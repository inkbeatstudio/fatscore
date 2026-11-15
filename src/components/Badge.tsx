import { memo, useMemo } from 'react';
import { ICON_PATHS } from './Icon';
import { TIERS, type AchDef } from '../data/achievements';

let n = 0;
/** Значок досягнення: розетка кольору рівня (бронза → діамант), у центрі — іконка серії. Сезонні — шестикутні. */
export const Badge = memo(function Badge({ a, earned, size = 88, progress }: { a: AchDef; earned: boolean; size?: number; progress?: number }) {
  const html = useMemo(() => {
    const P = 'bd' + (++n).toString(36);
    const t = TIERS[Math.min(a.tier, TIERS.length - 1)];
    const pts: string[] = [];
    if (a.seasonal) for (let i = 0; i < 6; i++) { const ang = (Math.PI / 3) * i - Math.PI / 2; pts.push(`${60 + Math.cos(ang) * 50},${58 + Math.sin(ang) * 50}`); }
    else for (let i = 0; i < 32; i++) { const ang = (Math.PI / 16) * i; const r = i % 2 ? 44 : 50; pts.push(`${60 + Math.cos(ang) * r},${58 + Math.sin(ang) * r}`); }
    const icon = a.secret && !earned ? '<path d="M10 10a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M13 18.5h.01"/>' : ICON_PATHS[a.icon] || ICON_PATHS.star;
    const ribbons = a.tier >= 1 ? `<path d="M40 92l-8 26 14-6 8 10 6-28z" fill="${a.color}"/><path d="M80 92l8 26-14-6-8 10-6-28z" fill="${a.color}"/>` : '';
    const ring = !earned && progress != null && progress > 0 ? `<circle cx="60" cy="58" r="54" fill="none" stroke="var(--track)" stroke-width="5"/><circle cx="60" cy="58" r="54" fill="none" stroke="var(--olive)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(Math.min(1, progress) * 339).toFixed(1)} 400" transform="rotate(-90 60 58)"/>` : '';
    return `<defs><radialGradient id="${P}t" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="${t.c[0]}"/><stop offset="1" stop-color="${t.c[1]}"/></radialGradient>
      <radialGradient id="${P}c" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#000000" stop-opacity=".12"/></radialGradient></defs>
      ${ring}${ribbons}
      <ellipse cx="60" cy="112" rx="30" ry="4" fill="#3B1E3F" opacity=".12"/>
      <polygon points="${pts.join(' ')}" fill="url(#${P}t)"/>
      <circle cx="60" cy="58" r="34" fill="${a.color}"/><circle cx="60" cy="58" r="34" fill="url(#${P}c)"/>
      <circle cx="60" cy="58" r="34" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="2"/>
      <g transform="translate(43 41) scale(1.3)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
      <ellipse cx="46" cy="38" rx="12" ry="6" fill="#fff" opacity=".25" transform="rotate(-25 46 38)"/>`;
  }, [a.id, earned, progress]);
  return <svg viewBox="0 0 120 124" width={size} height={size * 124 / 120} role="img" aria-label={a.name.uk}
    style={{ display: 'block', filter: earned ? undefined : 'grayscale(1)', opacity: earned ? 1 : 0.5 }} dangerouslySetInnerHTML={{ __html: html }} />;
});
