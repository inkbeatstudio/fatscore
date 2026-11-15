import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { act, useApp } from '../store';
import { useT, ScreenHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { addWorkout } from '../logic/game';
import { metKcal } from '../logic/nutrition';
import { ACT_MET, haversine, thin, type ActKind } from '../services/geo';
import { fmt } from '../i18n';
import { back, go } from '../nav';

const KINDS: [ActKind, string, string][] = [['walk', 'Прогулянка', 'Walk'], ['run', 'Біг', 'Run'], ['bike', 'Велосипед', 'Ride'], ['hike', 'Похід', 'Hike']];
const MAX_KMH: Record<ActKind, number> = { walk: 15, run: 30, bike: 70, hike: 15 };

/** Запис маршруту через GPS. Працює, поки екран увімкнений (обмеження браузера) */
export default function Track() {
  const s = useApp();
  const t = useT();
  const [kind, setKind] = useState<ActKind>('walk');
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'error'>('idle');
  const [err, setErr] = useState('');
  const [km, setKm] = useState(0);
  const [sec, setSec] = useState(0);
  const [acc, setAcc] = useState<number | null>(null);
  const pts = useRef<[number, number][]>([]);
  const lastT = useRef(0);
  const watch = useRef<number | null>(null);
  const lock = useRef<any>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const line = useRef<L.Polyline | null>(null);
  const dot = useRef<L.CircleMarker | null>(null);
  const supported = 'geolocation' in navigator;

  useEffect(() => {
    if (!mapEl.current) return;
    const m = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView([50.45, 30.52], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    line.current = L.polyline([], { color: '#E5462B', weight: 6, opacity: 0.9 }).addTo(m);
    map.current = m;
    navigator.geolocation?.getCurrentPosition(p => m.setView([p.coords.latitude, p.coords.longitude], 16), () => {}, { enableHighAccuracy: true, timeout: 8000 });
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (status !== 'running') return;
    const iv = setInterval(() => setSec(x => x + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  const wake = async () => { try { lock.current = await (navigator as any).wakeLock?.request('screen'); } catch { /* не підтримується */ } };
  useEffect(() => {
    const on = () => { if (document.visibilityState === 'visible' && status === 'running') wake(); };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [status]);
  useEffect(() => () => { if (watch.current != null) navigator.geolocation.clearWatch(watch.current); lock.current?.release?.(); }, []);

  const onPos = (p: GeolocationPosition) => {
    setAcc(Math.round(p.coords.accuracy));
    if (p.coords.accuracy > 40) return;
    const pt: [number, number] = [p.coords.latitude, p.coords.longitude];
    const prev = pts.current[pts.current.length - 1];
    if (prev) {
      const d = haversine(prev, pt);
      const dt = (p.timestamp - lastT.current) / 3600000;
      if (d < 0.004) return;
      if (dt > 0 && d / dt > MAX_KMH[kind]) return;
      setKm(x => x + d);
    }
    lastT.current = p.timestamp;
    pts.current.push(pt);
    line.current?.addLatLng(pt);
    if (map.current) {
      if (!dot.current) dot.current = L.circleMarker(pt, { radius: 8, color: '#FFF1D6', weight: 3, fillColor: '#E5462B', fillOpacity: 1 }).addTo(map.current);
      dot.current.setLatLng(pt);
      map.current.panTo(pt);
    }
  };
  const start = () => {
    if (!supported) return;
    setErr('');
    watch.current = navigator.geolocation.watchPosition(onPos, e => { setErr(e.code === 1 ? t('Немає дозволу на геолокацію. Дозволь його в налаштуваннях браузера.', 'No location permission. Allow it in browser settings.') : t('GPS-сигнал слабкий. Вийди на відкрите місце.', 'Weak GPS signal. Try an open area.')); if (e.code === 1) setStatus('error'); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    wake();
    setStatus('running');
  };
  const pause = () => { if (watch.current != null) navigator.geolocation.clearWatch(watch.current); watch.current = null; lock.current?.release?.(); setStatus('paused'); };
  const finish = () => {
    pause();
    const min = Math.max(1, Math.round(sec / 60));
    const name = { walk: { uk: 'Прогулянка', en: 'Walk' }, run: { uk: 'Біг', en: 'Run' }, bike: { uk: 'Велосипед', en: 'Ride' }, hike: { uk: 'Похід', en: 'Hike' } }[kind];
    if (km >= 0.05) act(x => addWorkout(x, { kind: 'cardio', name, detail: `${min} ${t('хв', 'min')}`, min, km: Math.round(km * 100) / 100, kcal: metKcal(ACT_MET[kind], x.profile.weight, min), source: 'gps', route: thin(pts.current) }));
    go('diary');
  };
  const pace = km > 0.05 ? sec / 60 / km : 0;
  const mm = String(Math.floor(sec / 60)).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0');

  return (
    <main className="screen">
      <ScreenHeader title={t('Маршрут', 'Route')} onBack={() => { if (status === 'running' || status === 'paused') { if (!confirmLeave(t)) return; pause(); } back(); }} />
      <section className="pad" style={{ marginTop: 10 }}>
        <div ref={mapEl} style={{ height: 300, borderRadius: 24, overflow: 'hidden', background: 'var(--oliveLight)', zIndex: 0 }} aria-label={t('Мапа маршруту', 'Route map')} />
      </section>
      <section className="pad grid3" style={{ marginTop: 12 }}>
        {[[fmt(km, s.lang, 2), t('км', 'km')], [`${mm}:${ss}`, t('час', 'time')], [pace ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, '0')}` : '—', t('хв/км', 'min/km')]].map(([v, l]) => (
          <div key={l} className="card stack" style={{ padding: '12px 6px', alignItems: 'center', gap: 2 }}><span className="disp" style={{ fontWeight: 800, fontSize: 22 }}>{v}</span><span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{l}</span></div>
        ))}
      </section>
      <section className="pad stack" style={{ marginTop: 14, gap: 12 }}>
        {status === 'idle' && <div className="chips">{KINDS.map(([k, uk, en]) => <button key={k} className={'chip press' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>{t(uk, en)}</button>)}</div>}
        {!supported && <div className="empty">{t('Цей браузер не підтримує геолокацію.', 'This browser doesn\'t support geolocation.')}</div>}
        {err && <p role="alert" style={{ color: 'var(--tomato)', fontWeight: 600, fontSize: 14 }}>{err}</p>}
        {acc != null && status !== 'idle' && <span className="lbl">{t(`Точність GPS: ±${acc} м`, `GPS accuracy: ±${acc} m`)}{acc > 40 ? t(' — чекаю кращого сигналу', ' — waiting for a better signal') : ''}</span>}
        {status === 'idle' && <button className="btn block press" disabled={!supported} onClick={start}><Icon name="play" size={20} />{t('Почати', 'Start')}</button>}
        {status === 'running' && <button className="btn ghost block press" onClick={pause}><Icon name="pause" size={20} />{t('Пауза', 'Pause')}</button>}
        {status === 'paused' && <div className="row-c" style={{ gap: 10 }}><button className="btn ghost press" style={{ flex: 1 }} onClick={start}><Icon name="play" size={20} />{t('Далі', 'Resume')}</button><button className="btn press" style={{ flex: 1.3 }} onClick={finish}>{t('Завершити', 'Finish')}</button></div>}
        {status === 'running' && <button className="btn block press" onClick={finish}>{t('Завершити й зберегти', 'Finish and save')}</button>}
        <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{t('Тримай екран увімкненим: браузер не дає сайтам записувати GPS у фоні. Повноцінний фоновий запис і кроки з телефона з\'являться в мобільному застосунку. Маршрут зберігається лише на цьому пристрої.', 'Keep the screen on: browsers don\'t allow websites to record GPS in the background. Full background tracking and phone steps will come with the mobile app. Your route stays on this device.')}</p>
      </section>
    </main>
  );
}
function confirmLeave(t: ReturnType<typeof useT>) {
  // window.confirm заблокований у деяких вбудованих браузерах — тоді просто ставимо на паузу
  try { return window.confirm(t('Зупинити запис маршруту без збереження?', 'Stop recording without saving?')); } catch { return true; }
}
