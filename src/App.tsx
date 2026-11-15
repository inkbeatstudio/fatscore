import { useEffect, lazy, Suspense } from 'react';
import { LayoutGroup, MotionConfig, motion } from 'motion/react';
import { useApp, storageWorks, act } from './store';
import { FxLayer, SheetHost, useT, openSheet, closeSheet } from './components/ui';
import { Icon } from './components/Icon';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import { go, useNav, type Route, type TabId } from './nav';
import { addWater, setRest } from './logic/game';

const Diary = lazy(() => import('./screens/Diary'));
const Adventure = lazy(() => import('./screens/Adventure'));
const Heroes = lazy(() => import('./screens/Heroes'));
const FoodScreen = lazy(() => import('./screens/Food'));
const Move = lazy(() => import('./screens/Move'));
const Track = lazy(() => import('./screens/Track'));
const Profile = lazy(() => import('./screens/Profile'));
const Friends = lazy(() => import('./screens/Friends'));

function useTheme() {
  const s = useApp();
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = s.settings.theme === 'dark' || (s.settings.theme === 'system' && mq.matches);
      const root = document.documentElement;
      root.dataset.theme = dark ? 'dark' : 'light';
      root.dataset.style = s.settings.style;
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || (dark ? '#2A1630' : '#FFF1D6'));
    };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [s.settings.theme, s.settings.style]);
  useEffect(() => { document.documentElement.lang = s.lang; }, [s.lang]);
}

/** Персонажі кліпають і стежать очима за пальцем */
function useAliveCharacters() {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let t: ReturnType<typeof setTimeout>;
    const blink = () => {
      t = setTimeout(() => {
        document.querySelectorAll('svg.char').forEach(c => { c.classList.add('blink'); setTimeout(() => c.classList.remove('blink'), 140); });
        blink();
      }, 2600 + Math.random() * 3400);
    };
    blink();
    const look = (e: PointerEvent) => {
      if (reduce.matches) return;
      document.querySelectorAll<SVGSVGElement>('svg.char').forEach(svg => {
        const r = svg.getBoundingClientRect(); if (!r.width) return;
        const cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.34, dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, m = Math.min(5, d / 40);
        const p = svg.querySelector<SVGGElement>('.pupils'); if (p) p.style.transform = `translate(${(dx / d) * m}px,${(dy / d) * m}px)`;
      });
    };
    addEventListener('pointermove', look, { passive: true });
    addEventListener('pointerdown', look, { passive: true });
    return () => { clearTimeout(t); removeEventListener('pointermove', look); removeEventListener('pointerdown', look); };
  }, []);
}

export function openQuick(t: ReturnType<typeof useT>) {
  const tile = (icon: string, uk: string, en: string, bg: string, fg: string, onClick: () => void) => (
    <button className="press stack" onClick={() => { closeSheet(); setTimeout(onClick, 60); }}
      style={{ gap: 10, padding: 14, borderRadius: 22, background: 'var(--surface)', textAlign: 'left', minHeight: 104 }}>
      <span style={{ width: 44, height: 44, borderRadius: 15, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={24} /></span>
      <span style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{t(uk, en)}</span>
    </button>
  );
  openSheet(() => (
    <div className="stack" style={{ gap: 12 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Що записуємо?', 'What are we logging?')}</h2>
      <div className="grid2">
        {tile('food', 'Їжу', 'Food', 'var(--peach)', 'var(--peachInk)', () => go('food'))}
        {tile('edit', 'Їжу повідомленням', 'Food as a message', 'var(--peach)', 'var(--peachInk)', () => { go('food'); setTimeout(() => dispatchEvent(new Event('fatscore:chat')), 350); })}
        {tile('barcode', 'Сканувати штрихкод', 'Scan a barcode', 'var(--peach)', 'var(--peachInk)', () => { go('food'); setTimeout(() => dispatchEvent(new Event('fatscore:scan')), 350); })}
        {tile('drop', 'Склянку води', 'A glass of water', 'var(--oliveLight)', 'var(--olive)', () => act(st => addWater(st, 1)))}
        {tile('dumbbell', 'Тренування', 'Workout', 'var(--mustard)', '#3B1E3F', () => go('move'))}
        {tile('map', 'Прогулянку з GPS', 'GPS walk', 'var(--mustard)', '#3B1E3F', () => go('track'))}
        {tile('book', 'Запис у щоденник', 'Diary entry', 'var(--oliveLight)', 'var(--ink)', () => go('diary'))}
        {tile('rest', 'День відпочинку', 'Rest day', 'var(--oliveLight)', 'var(--ink)', () => act(st => setRest(st)))}
      </div>
    </div>
  ));
}

export default function App() {
  const s = useApp();
  const t = useT();
  const nav = useNav();
  useTheme();
  useAliveCharacters();

  if (s.onb < 99) return <MotionConfig reducedMotion="user"><Onboarding /><SheetHost /><FxLayer /></MotionConfig>;

  const r = nav.route;
  const activeTab: TabId | null = (['home', 'diary', 'adventure', 'heroes'] as Route[]).includes(r) ? (r as TabId) : null;
  const tb = (id: TabId, uk: string, en: string, icon: string) => (
    <button className={'t press' + (activeTab === id ? ' on' : '')} onClick={() => (activeTab === id ? scrollTo({ top: 0, behavior: 'smooth' }) : go(id))} aria-current={activeTab === id ? 'page' : undefined}>
      <Icon name={icon} />{t(uk, en)}
    </button>
  );

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <motion.div key={r} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
          {!storageWorks() && <p className="pad" role="alert" style={{ background: 'var(--tomato)', color: 'var(--onAccent)', padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>{t('Браузер не дає зберігати дані (можливо, приватний режим). Записи зникнуть після закриття.', 'Your browser blocks storage (private mode?). Entries will be lost when you close it.')}</p>}
          <Suspense fallback={<div className="screen" />}>
            {r === 'home' && <Home />}
            {r === 'diary' && <Diary />}
            {r === 'adventure' && <Adventure />}
            {r === 'heroes' && <Heroes />}
            {r === 'food' && <FoodScreen date={nav.params.date} />}
            {r === 'move' && <Move />}
            {r === 'track' && <Track />}
            {r === 'profile' && <Profile />}
            {r === 'friends' && <Friends />}
          </Suspense>
        </motion.div>
      </LayoutGroup>
      <nav className="tabs" aria-label={t('Головне меню', 'Main menu')}>
        {tb('home', 'Головна', 'Home', 'home')}
        {tb('diary', 'Щоденник', 'Diary', 'book')}
        <div><button className="plus press" onClick={() => openQuick(t)} aria-label={t('Швидкий запис', 'Quick log')}><Icon name="plus" size={26} stroke={3.2} /></button></div>
        {tb('adventure', 'Пригоди', 'Quests', 'star')}
        {tb('heroes', 'Герої', 'Heroes', 'heart')}
      </nav>
      <SheetHost />
      <FxLayer />
    </MotionConfig>
  );
}
