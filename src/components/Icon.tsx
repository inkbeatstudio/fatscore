// Власний набір іконок в одному стилі: обведення 2.2, заокруглені кінці, сітка 26×26
const P: Record<string, string> = {
  home: '<path d="M4 12.5 13 5l9 7.5"/><path d="M6.5 11v9.5h13V11"/><path d="M11 20.5v-5h4v5"/>',
  food: '<circle cx="13" cy="14" r="8"/><circle cx="13" cy="14" r="4"/><path d="M4 4v5M2.5 4v3.5a1.5 1.5 0 0 0 3 0V4"/>',
  move: '<path d="M3 17.5c3 0 4-1 6-4l2-3 3 2.5c1.5 1.2 3 1.5 5 1.5h2.5a1.5 1.5 0 0 1 1.5 1.5v2H3z"/><path d="M8 21h15"/>',
  wardrobe: '<path d="M10.5 7a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V12"/><path d="M13 12 3 18.5a1 1 0 0 0 .5 1.8h19a1 1 0 0 0 .5-1.8z"/>',
  plus: '<path d="M13 5v16M5 13h16"/>',
  minus: '<path d="M6 13h14"/>',
  drop: '<path d="M13 4c3.5 4.5 6 7.6 6 10.6a6 6 0 0 1-12 0C7 11.6 9.5 8.5 13 4z"/>',
  moon: '<path d="M19 15.5A7.5 7.5 0 0 1 10.5 7a7.5 7.5 0 1 0 8.5 8.5z"/>',
  dumbbell: '<path d="M5 9v8M8 7v12M18 7v12M21 9v8M8 13h10"/>',
  close: '<path d="M7 7l12 12M19 7 7 19"/>',
  back: '<path d="M15 6l-7 7 7 7"/>',
  chevron: '<path d="M10 6l7 7-7 7"/>',
  search: '<circle cx="12" cy="12" r="6.5"/><path d="m17 17 4 4"/>',
  repeat: '<path d="M5 11a7 7 0 0 1 12-4l2 2M21 15a7 7 0 0 1-12 4l-2-2"/><path d="M19 4v5h-5M7 22v-5h5"/>',
  trophy: '<path d="M8 4h10v5a5 5 0 0 1-10 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M18 6h3a3 3 0 0 1-3 4M13 14v4M9 21h8M10 18h6"/>',
  check: '<path d="M7 13.5l4 4L19 9"/>',
  lock: '<rect x="6" y="11" width="14" height="10" rx="3"/><path d="M9 11V8a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="13" cy="9" r="4.2"/><path d="M4.5 22c.8-4.5 4.2-7 8.5-7s7.7 2.5 8.5 7"/>',
  rest: '<path d="M4 17h18M5 17v-4a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v4M5 20v-3M21 20v-3"/><path d="M8 10V8a2 2 0 0 1 2-2h2"/>',
  steps: '<path d="M8 15c-2 0-3-2-3-5s1-6 3-6 3 3 3 6-1 5-3 5zM6 18a2 2 0 0 0 4 0v-1.5M18 20c-2 0-3-2-3-5s1-6 3-6 3 3 3 6-1 5-3 5z"/>',
  play: '<path d="M9 6l11 7-11 7z"/>',
  pause: '<path d="M9 6v14M17 6v14"/>',
  barcode: '<path d="M4 7V5h3M19 5h3v2M4 19v2h3M19 21h3v-2M8 9v8M11 9v8M13.5 9v8M17 9v8"/>',
  star: '<path d="M13 4l2.6 5.6 6 .7-4.5 4.1 1.3 6L13 17.3 7.6 20.4l1.3-6L4.4 10.3l6-.7z"/>',
  heart: '<path d="M13 21s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 21 10c0 6.2-8 11-8 11z"/>',
  flame: '<path d="M13 3c1 4 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.6 1.2 2.6 2.5 3-1-3 0-6 0-8.5z"/>',
  leaf: '<path d="M5 20c0-9 6-15 16-15 0 10-6 16-15 16"/><path d="M5 21c3-5 6-8 10-10"/>',
  book: '<path d="M4 5.5C6.5 4.5 10 4.5 13 6.5c3-2 6.5-2 9-1v14c-2.5-1-6-1-9 1-3-2-6.5-2-9-1z"/><path d="M13 6.5v14"/>',
  pill: '<rect x="4" y="9" width="18" height="8" rx="4" transform="rotate(-35 13 13)"/><path d="M10 9.5l5.5 7"/>',
  sun: '<circle cx="13" cy="13" r="4"/><path d="M13 3v2.5M13 20.5V23M3 13h2.5M20.5 13H23M5.9 5.9l1.8 1.8M18.3 18.3l1.8 1.8M5.9 20.1l1.8-1.8M18.3 7.7l1.8-1.8"/>',
  brain: '<path d="M10 5a3 3 0 0 0-5 2.5A3 3 0 0 0 4 13a3 3 0 0 0 2 4.5A3 3 0 0 0 10 21h1V5.5A2.5 2.5 0 0 0 10 5zM16 5a3 3 0 0 1 5 2.5 3 3 0 0 1 1 5.5 3 3 0 0 1-2 4.5A3 3 0 0 1 16 21h-1V5.5A2.5 2.5 0 0 1 16 5z"/>',
  tooth: '<path d="M8 4c2 0 3 1 5 1s3-1 5-1 4 2 3 6-2 5-2 8-1 4-2 4-1.5-5-4-5-3 5-4 5-2-1-2-4-1-4-2-8 1-6 3-6z"/>',
  chart: '<path d="M4 21h18M7 17v-5M12 17V8M17 17v-8"/>',
  scale: '<rect x="4" y="4" width="18" height="18" rx="5"/><path d="M9 11a4 4 0 0 1 8 0M13 11l2-2"/>',
  game: '<rect x="3" y="8" width="20" height="11" rx="5.5"/><path d="M8 11.5v4M6 13.5h4M17 12.5h.01M19 14.5h.01"/>',
  gear: '<circle cx="13" cy="13" r="3.2"/><path d="M13 3.5v3M13 19.5v3M3.5 13h3M19.5 13h3M6.3 6.3l2.1 2.1M17.6 17.6l2.1 2.1M6.3 19.7l2.1-2.1M17.6 8.4l2.1-2.1"/>',
  download: '<path d="M13 4v12M8 11l5 5 5-5M5 21h16"/>',
  upload: '<path d="M13 16V4M8 9l5-5 5 5M5 21h16"/>',
  globe: '<circle cx="13" cy="13" r="9"/><path d="M4 13h18M13 4c3 3 3 15 0 18M13 4c-3 3-3 15 0 18"/>',
  edit: '<path d="M5 21l1-5L17 5l4 4L10 20z"/><path d="M14.5 7.5l4 4"/>',
  trash: '<path d="M5 7h16M10 7V5h6v2M7 7l1 14h10l1-14"/>',
  pot: '<path d="M4 11h18v3a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7z"/><path d="M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4M2 11h2M22 11h2"/>',
  coin: '<circle cx="13" cy="13" r="9"/><path d="M11 9h3a2 2 0 0 1 0 4h-3m0-4v8"/>',
  plate: '<circle cx="13" cy="13" r="9"/><circle cx="13" cy="13" r="5"/>',
  map: '<path d="M3 6l6-2 8 3 6-2v15l-6 2-8-3-6 2z"/><path d="M9 4v15M17 7v15"/>',
  bell: '<path d="M6 18V12a7 7 0 0 1 14 0v6l2 2H4zM10 21a3 3 0 0 0 6 0"/>',
  info: '<circle cx="13" cy="13" r="9"/><path d="M13 12v6M13 8.5h.01"/>'
};

export const ICON_CHOICES = ['leaf', 'book', 'pill', 'sun', 'brain', 'tooth', 'heart', 'star', 'moon', 'drop', 'steps', 'pot'];

export function Icon({ name, size = 26, stroke = 2.2, className, style }: { name: string; size?: number; stroke?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className={className} style={style} dangerouslySetInnerHTML={{ __html: P[name] || P.star }} />
  );
}

export function Coin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#F0B429" /><circle cx="10" cy="10" r="6" fill="none" stroke="#C98A0C" strokeWidth="1.6" />
      <path d="M8 7.5h3.2a1.4 1.4 0 0 1 0 2.8H8.6m0-2.8v5" stroke="#8A5A00" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
