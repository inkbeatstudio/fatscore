import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp, onEffects } from '../store';
import { tx, lx } from '../i18n';
import type { Effect, L10n } from '../types';
import { Character, ItemThumb } from './art';
import { Coin, Icon } from './Icon';
import { chime, haptic } from '../services/feedback';
import { stageOf } from '../logic/game';

export function useT() {
  const s = useApp();
  const t = (uk: string, en: string) => tx(s.lang, uk, en);
  t.l = (v: L10n | string) => lx(s.lang, v);
  t.lang = s.lang;
  return t;
}

export const springy = { type: 'spring' as const, stiffness: 420, damping: 32 };

// ——— Нижні шторки
type SheetRender = (close: () => void) => ReactNode;
let sheet: { id: number; render: SheetRender } | null = null;
const sheetL = new Set<() => void>();
let sid = 0;
export function openSheet(render: SheetRender) { sheet = { id: ++sid, render }; sheetL.forEach(l => l()); }
export function closeSheet() { sheet = null; sheetL.forEach(l => l()); }
function useSheet() { return useSyncExternalStore(cb => { sheetL.add(cb); return () => sheetL.delete(cb); }, () => sheet); }

export function SheetHost() {
  const s = useSheet();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!s) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', onKey);
    const el = ref.current?.querySelector<HTMLElement>('[data-autofocus]');
    setTimeout(() => el?.focus(), 280);
    return () => window.removeEventListener('keydown', onKey);
  }, [s?.id]);
  return (
    <AnimatePresence>
      {s && <motion.div key={'scrim' + s.id} className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSheet} />}
      {s && (
        <motion.div key={'sheet' + s.id} ref={ref} className="sheet" role="dialog" aria-modal="true"
          initial={{ y: '105%' }} animate={{ y: 0 }} exit={{ y: '105%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} dragListener={false} dragSnapToOrigin>
          <div className="grab" onPointerDown={() => { /* перетягування — через жест закриття нижче */ }} />
          <DragCloser />
          {s.render(closeSheet)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
/** Закриття шторки свайпом вниз за «ручку» */
function DragCloser() {
  const start = useRef<number | null>(null);
  return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 34, touchAction: 'none' }}
    onPointerDown={e => { start.current = e.clientY; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
    onPointerUp={e => { if (start.current != null && e.clientY - start.current > 60) closeSheet(); start.current = null; }} aria-hidden="true" />;
}

// ——— Реакції персонажа (для головного екрана)
let reaction: { n: number; kind: string; text?: string } = { n: 0, kind: '' };
const reactL = new Set<() => void>();
export function useReaction() { return useSyncExternalStore(cb => { reactL.add(cb); return () => reactL.delete(cb); }, () => reaction); }
export function pushReaction(kind: string, text?: string) { reaction = { n: reaction.n + 1, kind, text }; reactL.forEach(l => l()); }

// ——— Тости і святкування
type Toast = { id: number; text: string; icon?: string };
type Cel = Extract<Effect, { type: 'celebrate' }> & { id: number };
let tid = 0;
export function FxLayer() {
  const s = useApp();
  const t = useT();
  const [toast, setToast] = useState<Toast | null>(null);
  const [queue, setQueue] = useState<Cel[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => onEffects(fx => {
    const toasts = fx.filter(f => f.type === 'toast') as Extract<Effect, { type: 'toast' }>[];
    if (toasts.length) {
      const last = toasts[toasts.length - 1];
      setToast({ id: ++tid, text: toasts.length > 1 ? toasts.map(x => x.text).slice(-2).join(' · ') : last.text, icon: last.icon });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 2600);
    }
    const cels = fx.filter(f => f.type === 'celebrate') as Extract<Effect, { type: 'celebrate' }>[];
    if (cels.length) setQueue(q => [...q, ...cels.map(c => ({ ...c, id: ++tid }))]);
    fx.forEach(f => {
      if (f.type === 'react') pushReaction(f.kind, f.text);
      if (f.type === 'sound') chime(f.kind);
      if (f.type === 'haptic') haptic(f.pattern);
    });
  }), []);
  const cur = queue[0];
  useEffect(() => {
    if (!cur) return;
    chime(cur.kind);
    haptic(cur.kind === 'level' ? [30, 40, 60] : [25, 30, 25]);
  }, [cur?.id]);
  const close = () => setQueue(q => q.slice(1));
  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} className="toast" role="status" initial={{ y: -90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -90, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
            {toast.icon === 'coin' ? <Coin size={18} /> : <Icon name={toast.icon || 'check'} size={18} stroke={2.6} />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cur && (
          <motion.div key={cur.id} className="celebrate" role="dialog" aria-modal="true" aria-label={cur.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Confetti />
            <motion.div className="ccard" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
              {cur.kind === 'level' && <>
                <div style={{ width: 170, marginBottom: -6 }}><Character char={s.profile.char} eq={s.eq} stage={stageOf(s.level).index} exercise /></div>
                <div className="big">{cur.big}</div>
              </>}
              {cur.kind === 'record' && <>
                <div style={{ width: 96, height: 96, borderRadius: 32, background: 'var(--mustard)', color: '#3B1E3F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trophy" size={56} stroke={2} /></div>
                <div className="big" style={{ fontSize: 42 }}>{cur.big}</div>
              </>}
              {cur.kind === 'item' && cur.item && <div style={{ width: 210, padding: 14, borderRadius: 28, background: 'var(--surface)' }}><ItemThumb id={cur.item} style={{ height: 110 }} /></div>}
              {cur.kind === 'city' && <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--mustard)', color: '#3B1E3F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="map" size={50} stroke={2} /></div>}
              {(cur.kind === 'ach' || cur.kind === 'streak') && <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--olive)', color: '#FFF8EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={cur.kind === 'streak' ? 'flame' : 'star'} size={52} stroke={2.4} /></div>}
              <h2 className="disp" style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.2 }}>{cur.title}</h2>
              {cur.text && <p className="muted" style={{ fontSize: 15, lineHeight: 1.45 }}>{cur.text}</p>}
              <button className="btn block press" style={{ marginTop: 6 }} onClick={close} autoFocus>{t('Чудово', 'Awesome')}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Конфеті з об'ємних шматочків: кружечки, листочки, кубики, краплі — м'яке світло зверху */
function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = ref.current!; const dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d')!; g.scale(dpr, dpr);
    const cols = [['#FF7A5C', '#C9361E'], ['#FFCB52', '#D99511'], ['#A9BC52', '#5E6E22'], ['#FFD0B5', '#E88E62'], ['#F7A8C4', '#C0567F']];
    const ps = Array.from({ length: 120 }, () => ({ x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.42, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 17 - 6, r: Math.random() * 7 + 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, s: Math.floor(Math.random() * 4), c: cols[Math.floor(Math.random() * cols.length)], z: Math.random() * 0.6 + 0.7 }));
    let t = 0, raf = 0;
    const frame = () => {
      t++; g.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += 0.42; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.a += p.va;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.scale(p.z, p.z * (0.6 + 0.4 * Math.abs(Math.cos(p.a * 2))));
        const gr = g.createRadialGradient(-p.r * 0.35, -p.r * 0.35, 1, 0, 0, p.r * 1.3); gr.addColorStop(0, p.c[0]); gr.addColorStop(1, p.c[1]); g.fillStyle = gr;
        g.beginPath();
        if (p.s === 0) g.arc(0, 0, p.r, 0, Math.PI * 2);
        else if (p.s === 1) g.ellipse(0, 0, p.r * 0.6, p.r * 1.3, 0, 0, Math.PI * 2);
        else if (p.s === 2) { const r = p.r; g.moveTo(-r + 4, -r); g.arcTo(r, -r, r, r, 4); g.arcTo(r, r, -r, r, 4); g.arcTo(-r, r, -r, -r, 4); g.arcTo(-r, -r, r, -r, 4); }
        else { g.arc(0, 0, p.r, Math.PI, 0); g.lineTo(0, p.r * 1.4); g.closePath(); }
        g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-p.r * 0.3, -p.r * 0.4, p.r * 0.32, p.r * 0.18, 0, 0, Math.PI * 2); g.fill(); g.restore();
      }
      if (t < 240) raf = requestAnimationFrame(frame); else g.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}

export function Switch({ on, onChange, label, sub }: { on: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <button className="row press" role="switch" aria-checked={on} onClick={onChange} style={{ padding: '12px 14px' }}>
      <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 600 }}>{label}</span>{sub && <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.35, display: 'block' }}>{sub}</span>}</span>
      <span className={'switch' + (on ? ' on' : '')}><i /></span>
    </button>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, unit = '', format }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; unit?: string; format?: (v: number) => string }) {
  const t = useT();
  return (
    <div className="stepper">
      <button className="press" onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))} aria-label={t('Менше', 'Less')}>−</button>
      <span className="v" aria-live="polite">{format ? format(value) : value}{unit && ' ' + unit}</span>
      <button className="press" onClick={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))} aria-label={t('Більше', 'More')}>+</button>
    </div>
  );
}

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  const t = useT();
  return (
    <div className="pad row-c" style={{ gap: 6, justifyContent: 'space-between', minHeight: 48 }}>
      <div className="row-c" style={{ gap: 6 }}>
        {onBack && <button className="icon-btn press" onClick={onBack} aria-label={t('Назад', 'Back')} style={{ color: 'var(--ink)', marginLeft: -10 }}><Icon name="back" /></button>}
        <h1 className="h1">{title}</h1>
      </div>
      {right}
    </div>
  );
}
