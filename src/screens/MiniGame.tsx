import { useEffect, useRef, useState } from 'react';
import { act, useApp } from '../store';
import { useT } from '../components/ui';
import { Character } from '../components/art';
import { finishGame, stageOf, GAME_PLAYS_PER_DAY } from '../logic/game';
import { today } from '../logic/dates';

const COLORS: [string, string][] = [['#A9BC52', '#5E6E22'], ['#FF8A6B', '#C9361E'], ['#FFD58A', '#D98B32'], ['#B98060', '#7A4A2C'], ['#F7A8C4', '#C0567F']];
const GAME_SEC = 30;

/** «Лови овочі»: 30 секунд, усе, що впіймав, — очки. Промахи не караються, «поганої» їжі немає. */
export default function MiniGame({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(GAME_SEC);
  const [coins, setCoins] = useState(0);
  const cv = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const charX = useRef(0.5);
  const charEl = useRef<HTMLDivElement>(null);
  const playsLeft = Math.max(0, GAME_PLAYS_PER_DAY - s.days[today()].gamePlays);

  useEffect(() => {
    if (phase !== 'play') return;
    const c = cv.current!, b = box.current!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = b.clientWidth, H = b.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext('2d')!; g.scale(dpr, dpr);
    type It = { x: number; y: number; v: number; r: number; c: [string, string]; gold: boolean; rot: number };
    let items: It[] = [], last = performance.now(), spawn = 0, sc = 0, raf = 0, start = last;
    const pops: { x: number; y: number; t: number; txt: string }[] = [];
    const move = (e: PointerEvent) => { const r = b.getBoundingClientRect(); charX.current = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width)); };
    b.addEventListener('pointermove', move); b.addEventListener('pointerdown', move);
    const frame = (now: number) => {
      const dt = Math.min(40, now - last) / 1000; last = now;
      const el = (now - start) / 1000;
      const remain = Math.max(0, GAME_SEC - el);
      setLeft(Math.ceil(remain));
      spawn -= dt;
      if (spawn <= 0 && remain > 0.5) {
        const gold = Math.random() < 0.08;
        items.push({ x: 20 + Math.random() * (W - 40), y: -20, v: 140 + el * 9 + Math.random() * 60, r: gold ? 15 : 12 + Math.random() * 6, c: gold ? ['#FFE38A', '#C98A0C'] : COLORS[Math.floor(Math.random() * COLORS.length)], gold, rot: Math.random() * 6 });
        spawn = Math.max(0.28, 0.75 - el * 0.015);
      }
      const cx = charX.current * W, cy = H - 70;
      if (charEl.current) charEl.current.style.transform = `translateX(${cx - 50}px)`;
      g.clearRect(0, 0, W, H);
      items = items.filter(it => {
        it.y += it.v * dt; it.rot += dt * 2;
        if (it.y > cy - 20 && it.y < cy + 30 && Math.abs(it.x - cx) < 52) {
          const pts = it.gold ? 3 : 1; sc += pts; setScore(sc);
          pops.push({ x: it.x, y: it.y, t: now, txt: '+' + pts });
          try { navigator.vibrate?.(8); } catch { /* */ }
          return false;
        }
        if (it.y > H + 30) return false;
        g.save(); g.translate(it.x, it.y); g.rotate(it.rot);
        const gr = g.createRadialGradient(-it.r * 0.35, -it.r * 0.35, 1, 0, 0, it.r * 1.3); gr.addColorStop(0, it.c[0]); gr.addColorStop(1, it.c[1]);
        g.fillStyle = gr; g.beginPath();
        if (it.gold) { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? it.r * 0.5 : it.r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
        else g.arc(0, 0, it.r, 0, Math.PI * 2);
        g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-it.r * 0.3, -it.r * 0.4, it.r * 0.32, it.r * 0.18, 0, 0, Math.PI * 2); g.fill(); g.restore();
        return true;
      });
      for (const p of pops) {
        const a = (now - p.t) / 700; if (a > 1) continue;
        g.globalAlpha = 1 - a; g.fillStyle = '#3B1E3F'; g.font = `800 18px ${getComputedStyle(document.documentElement).getPropertyValue('--fDisp')}`; g.fillText(p.txt, p.x - 10, p.y - a * 30); g.globalAlpha = 1;
      }
      if (remain <= 0 && !items.length) {
        setPhase('done');
        const fx = act(x => finishGame(x, sc));
        const toast = fx.find(f => f.type === 'toast');
        setCoins(toast ? Math.min(12, Math.floor(sc / 3)) : 0);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); b.removeEventListener('pointermove', move); b.removeEventListener('pointerdown', move); };
  }, [phase]);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row-c" style={{ justifyContent: 'space-between' }}>
        <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Лови овочі', 'Catch the veggies')}</h2>
        {phase === 'play' && <span className="disp" style={{ fontWeight: 700, fontSize: 18 }} aria-live="off">{score} · {left}{t('с', 's')}</span>}
      </div>
      <div ref={box} style={{ position: 'relative', height: 'min(56dvh, 440px)', borderRadius: 26, background: 'var(--oliveLight)', overflow: 'hidden', touchAction: 'none', userSelect: 'none' }}>
        <canvas ref={cv} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true" />
        <div ref={charEl} style={{ position: 'absolute', left: 0, bottom: 4, width: 100, transform: 'translateX(calc(50% * 1))', pointerEvents: 'none' }}>
          <Character char={s.profile.char} eq={s.eq} stage={stageOf(s.level).index} />
        </div>
        {phase !== 'play' && (
          <div className="stack" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center', background: 'rgba(255,248,234,.75)', color: '#3B1E3F' }}>
            {phase === 'ready' ? <>
              <p style={{ fontSize: 15.5, lineHeight: 1.45, fontWeight: 600 }}>{t('Води пальцем, щоб ловити все, що падає. Золоті зірки дають 3 очки. 30 секунд!', 'Slide your finger to catch everything that falls. Gold stars give 3 points. 30 seconds!')}</p>
              <p style={{ fontSize: 13 }}>{playsLeft ? t(`Ігор з монетами сьогодні: ${playsLeft}`, `Rewarded games left today: ${playsLeft}`) : t('Монети на сьогодні зібрано, граємо для задоволення', 'Coins collected for today, playing for fun')}</p>
              <button className="btn press" onClick={() => { setScore(0); setLeft(GAME_SEC); setPhase('play'); }}>{t('Почати', 'Start')}</button>
            </> : <>
              <span className="disp" style={{ fontWeight: 800, fontSize: 56, letterSpacing: -2, lineHeight: 1 }}>{score}</span>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{score >= s.gameBest && score > 0 ? t('Новий рекорд!', 'New best!') : t(`Рекорд: ${s.gameBest}`, `Best: ${s.gameBest}`)}{coins ? t(` +${coins} монет.`, ` +${coins} coins.`) : ''}</p>
              <div className="row-c" style={{ gap: 10 }}>
                <button className="btn ghost press" onClick={close} style={{ color: '#3B1E3F' }}>{t('Досить', 'Done')}</button>
                <button className="btn press" onClick={() => { setScore(0); setLeft(GAME_SEC); setPhase('play'); }}>{t('Ще раз', 'Again')}</button>
              </div>
            </>}
          </div>
        )}
      </div>
    </div>
  );
}
