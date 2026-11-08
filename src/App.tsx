import { useEffect, useState, lazy, Suspense } from 'react';
import { LayoutGroup, MotionConfig, motion } from 'motion/react';
import { useApp, storageWorks } from './store';
import { FxLayer, SheetHost, useT, openSheet, closeSheet } from './components/ui';
import { Icon } from './components/Icon';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import FoodScreen from './screens/Food';
import Move from './screens/Move';
import Wardrobe from './screens/Wardrobe';
import { act } from './store';
import { addWater, setRest } from './logic/game';

const Profile = lazy(() => import('./screens/Profile'));

export type Tab = 'home' | 'food' | 'move' | 'ward' | 'profile';
const TABS: Tab[] = ['home', 'food', 'move', 'ward', 'profile'];

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

function readHash(): Tab { const h = location.hash.slice(1) as Tab; return TABS.includes(h) ? h : 'home'; }

export default function App() {
  const s = useApp();
  const t = useT();
  const [tab, setTabState] = useState<Tab>(readHash);
  useTheme();
  useAliveCharacters();
  useEffect(() => {
    const on = () => setTabState(readHash());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const setTab = (x: Tab) => {
    if (x === tab) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
    closeSheet();
    scrollTo(0, 0);
    history.replaceState(null, '', x === 'home' ? location.pathname + location.search : '#' + x);
    setTabState(x);
  };

  if (s.onb < 99) return <MotionConfig reducedMotion="user"><Onboarding /><SheetHost /><FxLayer /></MotionConfig>;

  const quick = () => openSheet(close => (
    <div className="stack" style={{ gap: 10 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t('Що записуємо?', 'What are we logging?')}</h2>
      <button className="opt press" onClick={() => { close(); setTab('food'); }}><span className="ic" style={{ background: 'var(--peach)', color: 'var(--peachInk)' }}><Icon name="food" size={24} /></span>{t('Їжу', 'Food')}</button>
      <button className="opt press" onClick={() => { close(); setTab('food'); setTimeout(() => window.dispatchEvent(new Event('fatscore:scan')), 350); }}><span className="ic" style={{ background: 'var(--peach)', color: 'var(--peachInk)' }}><Icon name="barcode" size={24} /></span>{t('Сканувати штрихкод', 'Scan a barcode')}</button>
      <button className="opt press" onClick={() => { close(); act(st => addWater(st, 1)); }}><span className="ic" style={{ background: 'var(--oliveLight)', color: 'var(--olive)' }}><Icon name="drop" size={24} /></span>{t('Склянку води', 'A glass of water')}</button>
      <button className="opt press" onClick={() => { close(); setTab('move'); }}><span className="ic" style={{ background: 'var(--mustard)', color: '#3B1E3F' }}><Icon name="dumbbell" size={24} /></span>{t('Тренування або кроки', 'Workout or steps')}</button>
      <button className="opt press" onClick={() => { close(); act(st => setRest(st)); }}><span className="ic" style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 2px var(--line)' }}><Icon name="rest" size={24} /></span>{t('День відпочинку', 'Rest day')}</button>
    </div>
  ));

  const tb = (id: Tab, uk: string, en: string, icon: string) => (
    <button className={'t press' + (tab === id ? ' on' : '')} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
      <Icon name={icon} />{t(uk, en)}
    </button>
  );

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
          {!storageWorks() && <p className="pad" role="alert" style={{ background: 'var(--tomato)', color: '#FFF1D6', padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>{t('Браузер не дає зберігати дані (можливо, приватний режим). Записи зникнуть після закриття.', 'Your browser blocks storage (private mode?). Entries will be lost when you close it.')}</p>}
          {tab === 'home' && <Home go={setTab} />}
          {tab === 'food' && <FoodScreen />}
          {tab === 'move' && <Move />}
          {tab === 'ward' && <Wardrobe />}
          {tab === 'profile' && <Suspense fallback={<div className="screen" />}><Profile go={setTab} /></Suspense>}
        </motion.div>
      </LayoutGroup>
      <nav className="tabs" aria-label={t('Головне меню', 'Main menu')}>
        {tb('home', 'Дім', 'Home', 'home')}
        {tb('food', 'Їжа', 'Food', 'food')}
        <div><button className="plus press" onClick={quick} aria-label={t('Швидкий запис', 'Quick log')}><Icon name="plus" size={26} stroke={3.2} /></button></div>
        {tb('move', 'Рух', 'Move', 'move')}
        {tb('ward', 'Гардероб', 'Wardrobe', 'wardrobe')}
      </nav>
      <SheetHost />
      <FxLayer />
    </MotionConfig>
  );
}
