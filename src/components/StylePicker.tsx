import { act, useApp } from '../store';
import { useT } from './ui';
import { Icon } from './Icon';
import type { Style } from '../types';

const STYLES: { id: Style; uk: string; en: string; dUk: string; dEn: string; bg: string; ink: string; font: string; weight: number; dots: string[] }[] = [
  { id: 'tactile', uk: 'Тактильна кухня', en: 'Tactile kitchen', dUk: 'Тепла «їстівна» палітра, м\'які об\'ємні наліпки', dEn: 'Warm edible palette, soft sticker-like shapes',
    bg: '#FFF1D6', ink: '#3B1E3F', font: "'Unbounded', sans-serif", weight: 800, dots: ['#E5462B', '#F0B429', '#6F7F2E', '#FFB892'] },
  { id: 'riso', uk: 'Спортивна ризографія', en: 'Sporty risograph', dUk: 'Енергія клубного журналу: фарби зі зсувом, рівень як стартовий номер', dEn: 'Running-club zine energy: offset inks, level as a race bib',
    bg: '#E9EFE9', ink: '#1D2B53', font: "'Dela Gothic One', sans-serif", weight: 400, dots: ['#FF48B0', '#0078BF', '#FFE800', '#1D2B53'] },
  { id: 'night', uk: 'Нічна кімната', en: 'Night room', dUk: 'Ілюстрована книжка перед сном. Найспокійніший стиль', dEn: 'A bedtime picture book. The calmest style',
    bg: '#142420', ink: '#F4E7D2', font: "'Alegreya', Georgia, serif", weight: 800, dots: ['#FFC56B', '#E8907A', '#8FB394', '#F4E7D2'] }
];

export default function StylePicker() {
  const s = useApp();
  const t = useT();
  const pick = (id: Style) => act(x => {
    x.settings.style = id;
    // нічна кімната задумана темною; інші стилі не чіпають обрану тему
    if (id === 'night' && x.settings.theme !== 'dark') x.settings.theme = 'dark';
  });
  return (
    <div className="stack" style={{ gap: 8 }} role="radiogroup" aria-label={t('Стиль оформлення', 'Design style')}>
      {STYLES.map(st => {
        const on = s.settings.style === st.id;
        return (
          <button key={st.id} role="radio" aria-checked={on} className="press row-c" onClick={() => pick(st.id)}
            style={{ gap: 14, padding: 10, borderRadius: 20, background: 'var(--surface)', textAlign: 'left', boxShadow: on ? 'inset 0 0 0 3px var(--ink)' : 'inset 0 0 0 1.5px var(--line)' }}>
            <span aria-hidden="true" className="stack" style={{ width: 84, height: 76, borderRadius: 14, background: st.bg, color: st.ink, flexShrink: 0, padding: 9, justifyContent: 'space-between',
              backgroundImage: st.id === 'riso' ? 'radial-gradient(rgba(29,43,83,.12) 1px, transparent 1.3px)' : st.id === 'night' ? 'radial-gradient(circle at 80% 15%, rgba(255,197,107,.35), transparent 55%)' : undefined, backgroundSize: st.id === 'riso' ? '5px 5px' : undefined }}>
              <span style={{ fontFamily: st.font, fontWeight: st.weight, fontSize: 24, lineHeight: 1, textShadow: st.id === 'riso' ? '2px 2px 0 rgba(255,72,176,.6)' : undefined }}>Аа</span>
              <span className="row-c" style={{ gap: 4 }}>{st.dots.map(c => <i key={c} style={{ width: 13, height: 13, borderRadius: st.id === 'riso' ? 3 : '50%', background: c, boxShadow: c === st.bg ? 'inset 0 0 0 1px rgba(0,0,0,.2)' : undefined }} />)}</span>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 15.5 }}>{t(st.uk, st.en)}</span>
              <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.35, display: 'block', marginTop: 2 }}>{t(st.dUk, st.dEn)}</span>
            </span>
            {on && <span style={{ color: 'var(--olive)', flexShrink: 0 }}><Icon name="check" stroke={3} /></span>}
          </button>
        );
      })}
    </div>
  );
}
