export const MOODS: { v: 1 | 2 | 3 | 4; uk: string; en: string; path: string }[] = [
  { v: 1, uk: 'Важко', en: 'Rough', path: '<circle cx="14" cy="14" r="11"/><path d="M9.5 19c2.5-2 6.5-2 9 0"/><path d="M10 11.5h.01M18 11.5h.01" stroke-width="3"/>' },
  { v: 2, uk: 'Так собі', en: 'Meh', path: '<circle cx="14" cy="14" r="11"/><path d="M10 18h8"/><path d="M10 11.5h.01M18 11.5h.01" stroke-width="3"/>' },
  { v: 3, uk: 'Добре', en: 'Good', path: '<circle cx="14" cy="14" r="11"/><path d="M9.5 17c2.5 2.5 6.5 2.5 9 0"/><path d="M10 11.5h.01M18 11.5h.01" stroke-width="3"/>' },
  { v: 4, uk: 'Чудово', en: 'Great', path: '<circle cx="14" cy="14" r="11"/><path d="M8.5 15.5h11a5.5 5.5 0 0 1-11 0z"/><path d="M9 11c1-1.5 2.5-1.5 3.5 0M15.5 11c1-1.5 2.5-1.5 3.5 0"/>' }
];
export const MoodFace = ({ path, size = 28 }: { path: string; size?: number }) => <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: path }} />;

