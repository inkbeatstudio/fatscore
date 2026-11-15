import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { act, useApp } from '../store';
import { useT, openSheet, closeSheet, Stepper } from '../components/ui';
import { Plate } from '../components/art';
import { Icon } from '../components/Icon';
import { MealVariety, openCopy, useSwipe } from '../components/foodbits';
import { addFoods, autoMeal, MEALS, removeFood, uid, settle, newDay } from '../logic/game';
import { parseMeal } from '../logic/parse';
import { back } from '../nav';
import { locale } from '../i18n';
import { colorCount, dailyNorm, dayTotals, entryNutr } from '../logic/nutrition';
import { CATS, LOCAL_FOODS, searchFoods } from '../data/foods';
import { addDays, today, parse } from '../logic/dates';
import { fmt } from '../i18n';
import { searchOFF, productByBarcode } from '../services/off';
import { cameraSupported, getDetector, startCamera, stopCamera } from '../services/scanner';
import type { Cat, Effect, Food, MealKey } from '../types';

export default function FoodScreen({ date: dateParam }: { date?: string }) {
  const s = useApp();
  const t = useT();
  const [cur, setCur] = useState(dateParam || today());
  const date = cur !== today() ? cur : undefined;
  const shift = (n: number) => { const k = addDays(cur, n); if (k <= today()) setCur(k); };
  const swipe = useSwipe(() => shift(-1), () => shift(1));
  const dayLabel = !date ? t('Сьогодні', 'Today') : cur === addDays(today(), -1) ? t('Вчора', 'Yesterday') : parse(cur).toLocaleDateString(locale(s.lang), { weekday: 'short', day: 'numeric', month: 'long' });
  const d = s.days[date || today()] || newDay(date || today());
  const n = dailyNorm(s.profile);
  const tot = dayTotals(d);
  const nn = s.profile.noNum;
  const [meal, setMeal] = useState<MealKey>(autoMeal());
  const [q, setQ] = useState('');
  const [online, setOnline] = useState<{ state: 'idle' | 'loading' | 'done' | 'error'; items: Food[]; msg?: string; q?: string }>({ state: 'idle', items: [] });
  const all = useMemo(() => [...s.customFoods, ...LOCAL_FOODS], [s.customFoods]);
  const local = useMemo(() => searchFoods(all, q), [all, q]);
  const yMeal = (s.days[addDays(date || today(), -1)]?.foods || []).filter(f => f.meal === meal);

  useEffect(() => {
    const on = () => openScanner(meal, date);
    const chat = () => openChat(meal, date);
    addEventListener('fatscore:scan', on);
    addEventListener('fatscore:chat', chat);
    return () => { removeEventListener('fatscore:scan', on); removeEventListener('fatscore:chat', chat); };
  }, [meal, date]);
  useEffect(() => { if (online.q && online.q !== q.trim()) setOnline({ state: 'idle', items: [] }); }, [q]);

  const searchOnline = async () => {
    const query = q.trim();
    if (query.length < 2) return;
    setOnline({ state: 'loading', items: [], q: query });
    try {
      const items = await searchOFF(query, s.lang);
      setOnline({ state: 'done', items, q: query });
    } catch (e: any) {
      setOnline({ state: 'error', items: [], q: query, msg: e?.message === 'offline' ? t('Немає інтернету. Вбудована база працює й офлайн.', 'You\'re offline. The built-in database works offline.') : e?.message === 'rate' ? t('Забагато запитів до бази. Спробуй за хвилину.', 'Too many requests. Try again in a minute.') : t('Не вдалося зв\'язатися з Open Food Facts. Спробуй ще раз.', 'Couldn\'t reach Open Food Facts. Try again.') });
    }
  };

  const row = (f: Food) => (
    <button key={f.id} className="row press" onClick={() => openAdd(f, meal, { date })}>
      <span className="dot" style={{ background: CATS[f.cat].c[1] }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.l(f.name)}{f.brand ? <span className="muted" style={{ fontWeight: 500 }}> · {f.brand}</span> : null}</span>
        <span className="muted" style={{ fontSize: 12.5 }}>{nn ? t.l(f.por) : `${f.kcal} ${t('ккал у 100 г', 'kcal per 100 g')}, ${t.l(f.por)}`}{f.src === 'custom' || f.src === 'recipe' ? t(' · моя', ' · mine') : ''}</span>
      </span>
      <Icon name="plus" size={22} style={{ color: 'var(--ink2)' }} />
    </button>
  );

  const groups = MEALS.map(m => ({ m, es: d.foods.filter(f => f.meal === m.k) })).filter(g => g.es.length);

  return (
    <main className="screen" {...swipe}>
      <div className="pad row-c" style={{ justifyContent: 'space-between', gap: 12 }}>
        <div><div className="row-c" style={{ gap: 4 }}><button className="icon-btn press" onClick={back} aria-label={t('Назад', 'Back')} style={{ color: 'var(--ink)', marginLeft: -10 }}><Icon name="back" /></button><h1 className="h1">{t('Їжа', 'Food')}</h1></div>
          <div className="row-c" style={{ gap: 2, marginTop: 4, marginLeft: -8 }}>
            <button className="icon-btn press" style={{ width: 34, height: 34, color: 'var(--ink)' }} onClick={() => shift(-1)} aria-label={t('Попередній день', 'Previous day')}><Icon name="back" size={18} /></button>
            <span style={{ fontSize: 14, fontWeight: 700, color: date ? 'var(--tomato)' : 'var(--ink)', minWidth: 74, textAlign: 'center' }} aria-live="polite">{dayLabel}</span>
            <button className="icon-btn press" style={{ width: 34, height: 34, color: 'var(--ink)', opacity: date ? 1 : 0.3 }} disabled={!date} onClick={() => shift(1)} aria-label={t('Наступний день', 'Next day')}><Icon name="chevron" size={18} /></button>
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 4, fontWeight: 500 }}>{nn ? t(`Кольорів на тарілці: ${colorCount(d)} із 5`, `Plate colours: ${colorCount(d)} of 5`) : `${fmt(tot.kcal, s.lang)} ${t('із', 'of')} ${fmt(n.target, s.lang)} ${t('ккал', 'kcal')}`}</p></div>
        <motion.div layoutId="plate"><Plate foods={d.foods} size={92} /></motion.div>
      </div>

      <div className="pad chips" style={{ marginTop: 14 }} role="tablist">
        {MEALS.map(m => <button key={m.k} role="tab" aria-selected={meal === m.k} className={'chip press' + (meal === m.k ? ' on' : '')} onClick={() => setMeal(m.k)}>{t.l(m.name)}</button>)}
      </div>

      <div className="pad row-c" style={{ marginTop: 12, gap: 8 }}>
        <form className="row-c" style={{ position: 'relative', flex: 1 }} onSubmit={e => { e.preventDefault(); if (local.length < 3) searchOnline(); (document.activeElement as HTMLElement)?.blur(); }} role="search">
          <span style={{ position: 'absolute', left: 14, color: 'var(--ink2)', display: 'flex' }}><Icon name="search" size={22} /></span>
          <input className="field" type="search" enterKeyHint="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('Борщ, сирники, йогурт…', 'Borsch, oats, yogurt…')} style={{ paddingLeft: 46 }} aria-label={t('Пошук їжі', 'Search food')} autoComplete="off" />
        </form>
        <button className="press" onClick={() => openScanner(meal, date)} aria-label={t('Сканувати штрихкод', 'Scan barcode')} style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--ink)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="barcode" size={26} /></button>
      </div>

      <div className="pad stack" style={{ gap: 8, marginTop: 12 }}>
        {q.trim() ? <>
          {local.map(row)}
          {local.length === 0 && online.state === 'idle' && <div className="empty">{t('У вбудованій базі такого немає. Пошукаймо у світовій базі продуктів.', 'Not in the built-in database. Let\'s search the world food database.')}</div>}
          {online.state === 'idle' && q.trim().length >= 2 && <button className="btn ghost block press" onClick={searchOnline}><Icon name="globe" size={20} />{t('Шукати в Open Food Facts', 'Search Open Food Facts')}</button>}
          {online.state === 'loading' && <div className="empty" aria-live="polite">{t('Шукаю у світовій базі…', 'Searching the world database…')}</div>}
          {online.state === 'error' && <div className="empty" role="alert">{online.msg}</div>}
          {online.state === 'done' && <>
            <span className="lbl" style={{ marginTop: 6 }}>{t('Open Food Facts', 'Open Food Facts')}</span>
            {online.items.length ? online.items.map(row) : <div className="empty">{t('Нічого не знайшлося. Можна додати свою страву.', 'Nothing found. You can add your own food.')}</div>}
          </>}
          <button className="btn ghost block press" onClick={() => openCustom({ name: q.trim(), meal, date })}><Icon name="edit" size={20} />{t('Створити свою страву', 'Create my own food')}</button>
        </> : <>
          {yMeal.length > 0 && <button className="row press" onClick={() => act(x => addFoods(x, yMeal.map(e => ({ food: e.food, g: e.g })), meal, { repeat: true, date }))} style={{ background: 'var(--oliveLight)' }}>
            <span style={{ color: 'var(--olive)', display: 'flex' }}><Icon name="repeat" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{t('Повторити вчорашнє: ', 'Repeat yesterday\'s ')}{t.l(MEALS.find(m => m.k === meal)!.name).toLowerCase()}</span>
              <span className="muted" style={{ fontSize: 12.5 }}>{yMeal.map(e => t.l(e.food.name)).join(', ')}</span></span>
          </button>}
          <button className="row press" onClick={() => openChat(meal, date)} style={{ background: 'var(--peach)' }}>
            <span style={{ color: 'var(--peachInk)', display: 'flex' }}><Icon name="edit" /></span>
            <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{t('Написати, що з\'їв', 'Type what you ate')}</span><span className="muted" style={{ fontSize: 12.5 }}>{t('«250 г гречки, курка і салат» — розберу сам', '«250 g buckwheat, chicken and salad» — I\'ll sort it out')}</span></span>
          </button>
          <div className="grid2">
            <button className="btn ghost small press" onClick={() => openCustom({ meal, date })}><Icon name="edit" size={18} />{t('Своя страва', 'My food')}</button>
            <button className="btn ghost small press" onClick={() => openRecipe()}><Icon name="pot" size={18} />{t('Свій рецепт', 'My recipe')}</button>
          </div>
          {s.favorites.length > 0 && <><span className="lbl" style={{ marginTop: 8 }}>{t('Улюблене', 'Favourites')}</span>{s.favorites.slice(0, 8).map(row)}</>}
          {s.recent.length > 0 && <><span className="lbl" style={{ marginTop: 8 }}>{t('Останні', 'Recent')}</span>{s.recent.filter(r => !s.favorites.some(f => f.id === r.id)).slice(0, 6).map(row)}</>}
          {s.customFoods.length > 0 && <><span className="lbl" style={{ marginTop: 8 }}>{t('Мої страви й рецепти', 'My foods & recipes')}</span>{s.customFoods.slice(0, 6).map(row)}</>}
          <span className="lbl" style={{ marginTop: 8 }}>{t('Українська кухня', 'Ukrainian dishes')}</span>
          {LOCAL_FOODS.filter(f => f.ua).slice(0, 10).map(row)}
        </>}
      </div>

      <section className="pad stack" style={{ marginTop: 26, gap: 14 }}>
        <h2 className="sectionT">{date ? t('Записано за цей день', 'Logged that day') : t('Сьогодні записано', 'Logged today')}</h2>
        {groups.length === 0 && <div className="empty">{t(`Поки що порожньо. ${s.profile.cname} чекає на першу страву.`, `Nothing yet. ${s.profile.cname} is waiting for the first dish.`)}</div>}
        {groups.map(({ m, es }) => (
          <div key={m.k} className="stack" style={{ gap: 6 }}>
            <div className="row-c" style={{ justifyContent: 'space-between', gap: 8 }}>
              <span className="row-c" style={{ gap: 10, minWidth: 0, flexWrap: 'wrap' }}><span className="lbl">{t.l(m.name)}</span><MealVariety es={es} /></span>
              <span className="row-c" style={{ gap: 4 }}>{!nn && <span className="lbl">{fmt(es.reduce((a, e) => a + entryNutr(e).kcal, 0), s.lang)} {t('ккал', 'kcal')}</span>}
                <button className="icon-btn press" style={{ width: 34, height: 34 }} onClick={() => openCopy(cur, m.k)} aria-label={t(`Копіювати: ${m.name.uk.toLowerCase()}`, `Copy ${m.name.en.toLowerCase()}`)}><Icon name="copy" size={18} /></button></span>
            </div>
            {es.map(e => (
              <div key={e.id} className="row">
                <span className="dot" style={{ background: CATS[e.food.cat].c[1] }} />
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>{t.l(e.food.name)}</span>
                  <span className="muted" style={{ fontSize: 12.5 }}>{nn ? CATS[e.food.cat][s.lang] : `${e.g} ${t('г', 'g')}, ${fmt(entryNutr(e).kcal, s.lang)} ${t('ккал', 'kcal')}`}</span></span>
                <button className="icon-btn press" onClick={() => act(x => removeFood(x, e.id, date))} aria-label={t(`Видалити ${e.food.name.uk}`, `Remove ${e.food.name.en}`)}><Icon name="close" size={20} /></button>
              </div>
            ))}
          </div>
        ))}
        {!nn && d.foods.length > 0 && <div className="card" style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6, textAlign: 'center' }}>
          {([[t('Білки', 'Protein'), tot.p, n.prot], [t('Жири', 'Fat'), tot.f, n.fat], [t('Вуглев.', 'Carbs'), tot.c, n.carb], [t('Клітк.', 'Fibre'), tot.fiber, n.fiber]] as const).map(([l, v, m]) => (
            <div key={l}><div className="disp" style={{ fontWeight: 700, fontSize: 15 }}>{fmt(v, s.lang)}<span style={{ fontSize: 11, fontWeight: 500 }}>/{m}</span></div><div className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{l}, {t('г', 'g')}</div></div>
          ))}
        </div>}
      </section>
      <p className="pad muted" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 18 }}>{t('Дані про продукти: вбудована база та Open Food Facts (ліцензія ODbL). Значення для домашніх страв усереднені.', 'Food data: built-in database and Open Food Facts (ODbL licence). Values for home-cooked dishes are averages.')}</p>
    </main>
  );
}

// ——— Додавання продукту
export function openAdd(food: Food, meal: MealKey, opts: { scanned?: boolean; date?: string } = {}) {
  openSheet(close => <AddFood food={food} meal={meal} close={close} scanned={opts.scanned} date={opts.date} />);
}
function AddFood({ food, meal, close, scanned, date }: { food: Food; meal: MealKey; close: () => void; scanned?: boolean; date?: string }) {
  const s = useApp();
  const t = useT();
  const [g, setG] = useState(food.g);
  const [m, setM] = useState<MealKey>(meal);
  const nn = s.profile.noNum;
  const fav = s.favorites.some(f => f.id === food.id);
  const step = food.g >= 150 ? 25 : food.g >= 40 ? 10 : 5;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-c" style={{ gap: 12 }}>
        <span className="dot" style={{ width: 22, height: 22, background: CATS[food.cat].c[1] }} />
        <div style={{ flex: 1, minWidth: 0 }}><h2 className="disp" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{t.l(food.name)}</h2>
          <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{food.brand ? food.brand + ', ' : ''}{CATS[food.cat][s.lang]}, {t.l(food.por)} ≈ {food.g} {t('г', 'g')}</span></div>
        <button className="icon-btn press" aria-pressed={fav} aria-label={fav ? t('Прибрати з улюбленого', 'Remove from favourites') : t('В улюблене', 'Add to favourites')} style={{ color: fav ? 'var(--tomato)' : 'var(--ink2)' }}
          onClick={() => act(x => { x.favorites = fav ? x.favorites.filter(f => f.id !== food.id) : [food, ...x.favorites].slice(0, 30); })}><Icon name="heart" size={24} stroke={fav ? 3 : 2.2} /></button>
      </div>
      <Stepper value={g} onChange={setG} step={step} min={5} max={3000} unit={t('г', 'g')} />
      <div className="chips">
        {([[food.g, t.l(food.por)], [Math.round(food.g / 2), t('пів порції', 'half')], [100, '100 ' + t('г', 'g')], [food.g * 2, t('дві порції', 'double')]] as const).map(([v, l], i) =>
          <button key={i} className={'chip press' + (g === v ? ' on' : '')} onClick={() => setG(v)}>{l}</button>)}
      </div>
      {!nn && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, textAlign: 'center' }}>
        {([[t('ккал', 'kcal'), food.kcal], [t('білки', 'protein'), food.p], [t('жири', 'fat'), food.f], [t('вуглев.', 'carbs'), food.c]] as const).map(([l, v]) => (
          <div key={l} className="card" style={{ padding: '10px 4px', borderRadius: 16 }}><div className="disp" style={{ fontWeight: 700, fontSize: 17 }}>{fmt((v * g) / 100, s.lang)}</div><div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{l}</div></div>
        ))}
      </div>}
      <div className="chips">{MEALS.map(x => <button key={x.k} className={'chip press' + (m === x.k ? ' on' : '')} onClick={() => setM(x.k)}>{t.l(x.name)}</button>)}</div>
      <button className="btn block press" data-autofocus onClick={() => { act(x => addFoods(x, [{ food, g }], m, { scanned, date })); close(); }}>{t('Додати', 'Add')}: {t.l(MEALS.find(x => x.k === m)!.name).toLowerCase()}</button>
      {(food.src === 'custom' || food.src === 'recipe') && <button className="btn ghost block press small" onClick={() => { act(x => { x.customFoods = x.customFoods.filter(f => f.id !== food.id); x.favorites = x.favorites.filter(f => f.id !== food.id); }); close(); }}><Icon name="trash" size={18} />{t('Видалити з моїх страв', 'Delete from my foods')}</button>}
    </div>
  );
}

// ——— Сканер штрихкодів
export function openScanner(meal: MealKey, date?: string) { openSheet(close => <Scanner meal={meal} close={close} date={date} />); }
function Scanner({ meal, close, date }: { meal: MealKey; close: () => void; date?: string }) {
  const s = useApp();
  const t = useT();
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'looking' | 'denied' | 'unsupported' | 'error'>(cameraSupported() ? 'starting' : 'unsupported');
  const [manual, setManual] = useState('');
  const busy = useRef(false);

  const lookup = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    setStatus('looking');
    try { navigator.vibrate?.(30); } catch { /* */ }
    const mine = s.customFoods.find(f => f.barcode === code);
    if (mine) { closeSheet(); setTimeout(() => openAdd(mine, meal, { scanned: true, date }), 320); return; }
    try {
      const f = await productByBarcode(code);
      closeSheet();
      setTimeout(() => (f ? openAdd(f, meal, { scanned: true, date }) : openCustom({ barcode: code, notFound: true, meal, date })), 320);
    } catch (e: any) {
      busy.current = false;
      setStatus('error');
      setManual(code);
    }
  };

  useEffect(() => {
    if (status === 'unsupported') return;
    let stream: MediaStream | null = null, raf = 0, alive = true, last = 0;
    (async () => {
      try {
        stream = await startCamera(video.current!);
        if (!alive) { stopCamera(stream); return; }
        setStatus('scanning');
        const det = await getDetector();
        const loop = async (ts: number) => {
          if (!alive) return;
          if (ts - last > 220 && video.current && video.current.readyState >= 2 && !busy.current) {
            last = ts;
            try {
              const codes = await det.detect(video.current);
              const c = codes.find(x => /^\d{8,14}$/.test(x.rawValue));
              if (c) { lookup(c.rawValue); return; }
            } catch { /* наступний кадр */ }
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (e: any) {
        setStatus(e?.name === 'NotAllowedError' ? 'denied' : 'error');
      }
    })();
    return () => { alive = false; cancelAnimationFrame(raf); stopCamera(stream); };
  }, []);

  const msg = {
    starting: t('Вмикаю камеру…', 'Starting camera…'),
    scanning: t('Наведи камеру на штрихкод', 'Point the camera at a barcode'),
    looking: t('Шукаю продукт…', 'Looking up the product…'),
    denied: t('Немає доступу до камери. Дозволь його в налаштуваннях браузера або введи код вручну.', 'No camera access. Allow it in browser settings or type the code.'),
    unsupported: t('Камера тут недоступна. Введи цифри під штрихкодом.', 'Camera isn\'t available here. Type the digits under the barcode.'),
    error: t('Не вдалося прочитати чи знайти продукт. Перевір інтернет або введи код вручну.', 'Couldn\'t read or find the product. Check your connection or type the code.')
  }[status];

  return (
    <div className="stack" style={{ gap: 14 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Сканер штрихкодів', 'Barcode scanner')}</h2>
      {status !== 'unsupported' && status !== 'denied' && (
        <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: '#1C0E20', aspectRatio: '4 / 3' }}>
          <video ref={video} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '12%', right: '12%', top: '34%', bottom: '34%', borderRadius: 16, boxShadow: '0 0 0 999px rgba(28,14,32,.45)', border: '3px solid #F0B429' }} />
        </div>
      )}
      <p aria-live="polite" style={{ fontSize: 14.5, lineHeight: 1.45, fontWeight: 500 }}>{msg}</p>
      <form className="row-c" style={{ gap: 8 }} onSubmit={e => { e.preventDefault(); const c = manual.replace(/\D/g, ''); if (c.length >= 8) { busy.current = false; lookup(c); } }}>
        <input className="field" inputMode="numeric" placeholder={t('Цифри під штрихкодом', 'Digits under the barcode')} value={manual} onChange={e => setManual(e.target.value)} aria-label={t('Штрихкод', 'Barcode')} />
        <button className="btn small press" type="submit" style={{ minHeight: 52 }}>{t('Знайти', 'Find')}</button>
      </form>
      {status === 'error' && <button className="btn ghost block press" onClick={() => { const c = manual.replace(/\D/g, ''); closeSheet(); setTimeout(() => openCustom({ barcode: c.length >= 8 ? c : undefined, notFound: c.length >= 8, meal, date }), 320); }}><Icon name="edit" size={20} />{t('Додати продукт вручну', 'Add the product manually')}</button>}
      <button className="btn ghost block press" onClick={close}>{t('Скасувати', 'Cancel')}</button>
    </div>
  );
}

// ——— Своя страва
const CAT_LIST: Cat[] = ['veg', 'fruit', 'protein', 'grain', 'dairy', 'sweet', 'fat', 'drink'];
type CustomPre = { name?: string; barcode?: string; notFound?: boolean; meal?: MealKey; date?: string };
export function openCustom(pre: CustomPre) { openSheet(close => <CustomFood pre={pre} close={close} />); }
function CustomFood({ pre, close }: { pre: CustomPre; close: () => void }) {
  const t = useT();
  const [f, setF] = useState({ name: pre.name || '', kcal: '', p: '', fat: '', c: '', g: '100', cat: 'grain' as Cat });
  const [err, setErr] = useState('');
  const num = (v: string) => parseFloat(v.replace(',', '.'));
  const save = () => {
    const kcal = num(f.kcal), g = num(f.g);
    if (!f.name.trim() || !isFinite(kcal) || kcal < 0 || kcal > 950 || !isFinite(g) || g <= 0) { setErr(t('Заповни назву, калорійність на 100 г (0–950) і порцію.', 'Fill in the name, kcal per 100 g (0–950) and portion.')); return; }
    const food: Food = { id: uid('my'), src: 'custom', name: { uk: f.name.trim(), en: f.name.trim() }, kcal: Math.round(kcal), p: num(f.p) || 0, f: num(f.fat) || 0, c: num(f.c) || 0, cat: f.cat, g: Math.round(g), por: { uk: 'моя порція', en: 'my portion' }, barcode: pre.barcode };
    act(x => { x.customFoods = [food, ...x.customFoods]; });
    close();
    setTimeout(() => openAdd(food, pre.meal || autoMeal(), { scanned: !!pre.barcode, date: pre.date }), 320);
  };
  const inp = (k: keyof typeof f, label: string, mode: 'decimal' | 'text' = 'decimal') => (
    <label className="stack" style={{ gap: 6 }}><span className="lbl">{label}</span><input className="field" inputMode={mode} value={f[k] as string} onChange={e => { setF({ ...f, [k]: e.target.value }); setErr(''); }} /></label>
  );
  return (
    <div className="stack" style={{ gap: 12 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Своя страва', 'My own food')}</h2>
      {pre.notFound && <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>{t(`Продукту ${pre.barcode} поки немає в базі. Додай його сам, дані є на упаковці. Наступного разу сканер його впізнає.`, `Product ${pre.barcode} isn't in the database yet. Add it from the label — next time the scanner will know it.`)}</p>}
      {inp('name', t('Назва', 'Name'), 'text')}
      <div className="grid2">{inp('kcal', t('Ккал на 100 г', 'kcal per 100 g'))}{inp('g', t('Порція, г', 'Portion, g'))}</div>
      <div className="grid3">{inp('p', t('Білки, г', 'Protein, g'))}{inp('fat', t('Жири, г', 'Fat, g'))}{inp('c', t('Вуглеводи, г', 'Carbs, g'))}</div>
      <span className="lbl">{t('Що це найбільше?', 'What is it mostly?')}</span>
      <div className="chips" style={{ flexWrap: 'wrap' }}>{CAT_LIST.map(c => <button key={c} className={'chip press' + (f.cat === c ? ' on' : '')} onClick={() => setF({ ...f, cat: c })}>{CATS[c][t.lang]}</button>)}</div>
      {err && <p role="alert" style={{ color: 'var(--tomato)', fontWeight: 600, fontSize: 13.5 }}>{err}</p>}
      <button className="btn block press" onClick={save}>{t('Зберегти', 'Save')}</button>
    </div>
  );
}

// ——— Свій рецепт: додаєш інгредієнти — застосунок рахує порцію
export function openRecipe() { openSheet(close => <Recipe close={close} />); }
function Recipe({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  const [name, setName] = useState('');
  const [servings, setServings] = useState(4);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<{ food: Food; g: number }[]>([]);
  const [cat, setCat] = useState<Cat>('grain');
  const [cooked, setCooked] = useState('');
  const res = useMemo(() => searchFoods([...s.customFoods, ...LOCAL_FOODS], q, 6), [q]);
  const total = items.reduce((a, x) => { const k = x.g / 100; a.kcal += x.food.kcal * k; a.p += x.food.p * k; a.f += x.food.f * k; a.c += x.food.c * k; a.fiber += (x.food.fiber || 0) * k; a.g += x.g; return a; }, { kcal: 0, p: 0, f: 0, c: 0, fiber: 0, g: 0 });
  const cw = parseFloat(cooked.replace(',', '.'));
  // Вага готової страви: вода випаровується (або вбирається), тож рахуємо 100 г саме готової страви
  const W = isFinite(cw) && cw > 0 ? cw : total.g;
  const per100 = (v: number) => (W ? Math.round((v / W) * 1000) / 10 : 0);
  const save = () => {
    if (!name.trim() || !items.length) return;
    const food: Food = { id: uid('rc'), src: 'recipe', name: { uk: name.trim(), en: name.trim() }, kcal: Math.round((total.kcal / W) * 100), p: per100(total.p), f: per100(total.f), c: per100(total.c), fiber: per100(total.fiber), cat, g: Math.round(W / servings), por: { uk: `1 з ${servings} порцій`, en: `1 of ${servings} servings` } };
    act(x => { x.customFoods = [food, ...x.customFoods]; x.stats.recipes++; const fx: Effect[] = [{ type: 'toast', icon: 'pot', text: t('Рецепт збережено. Шукай його в «Мої страви».', 'Recipe saved. Find it under «My foods».') }]; settle(x, fx); return fx; });
    close();
  };
  return (
    <div className="stack" style={{ gap: 12 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Свій рецепт', 'My recipe')}</h2>
      <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Назва страви', 'Dish name')}</span><input className="field" value={name} onChange={e => setName(e.target.value)} placeholder={t('Мамин борщ', 'Mum\'s borsch')} /></label>
      <span className="lbl">{t('Скільки порцій виходить', 'How many servings')}</span>
      <Stepper value={servings} onChange={setServings} min={1} max={30} />
      <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Додай інгредієнт', 'Add an ingredient')}</span><input className="field" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('Картопля, морква…', 'Potato, carrot…')} /></label>
      {res.map(f => <button key={f.id} className="row press" style={{ minHeight: 50 }} onClick={() => { setItems([...items, { food: f, g: f.g }]); setQ(''); }}><span className="dot" style={{ background: CATS[f.cat].c[1] }} /><span style={{ flex: 1, fontWeight: 600 }}>{t.l(f.name)}</span><Icon name="plus" size={20} /></button>)}
      {items.map((x, i) => (
        <div key={i} className="row" style={{ minHeight: 56 }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14.5 }}>{t.l(x.food.name)}</span>
          <input className="field" inputMode="numeric" value={x.g} onChange={e => { const v = parseInt(e.target.value) || 0; setItems(items.map((y, j) => (j === i ? { ...y, g: v } : y))); }} style={{ width: 86, minHeight: 44, textAlign: 'right' }} aria-label={t('Грами', 'Grams')} />
          <span className="muted">{t('г', 'g')}</span>
          <button className="icon-btn press" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label={t('Прибрати', 'Remove')}><Icon name="close" size={18} /></button>
        </div>
      ))}
      {items.length > 0 && <>
        <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Вага готової страви, г (необовʼязково)', 'Cooked weight, g (optional)')}</span>
          <input className="field" inputMode="numeric" value={cooked} onChange={e => setCooked(e.target.value)} placeholder={t(`Сирі продукти: ${fmt(total.g, s.lang)} г`, `Raw ingredients: ${fmt(total.g, s.lang)} g`)} />
          <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.4 }}>{t('Зваж каструлю з готовою стравою і відніми вагу порожньої. Під час варіння вода випаровується, тож так порція буде точнішою.', 'Weigh the pot with the finished dish and subtract the empty pot. Water evaporates while cooking, so this makes servings more accurate.')}</span></label>
        <div className="card" style={{ padding: 14, fontSize: 14, lineHeight: 1.5 }}>
          {t('Уся страва', 'Whole dish')}: {fmt(W, s.lang)} {t('г', 'g')}, {fmt(total.kcal, s.lang)} {t('ккал', 'kcal')}<br />
          <b>{t('Порція', 'Serving')}: {fmt(W / servings, s.lang)} {t('г', 'g')}, {fmt(total.kcal / servings, s.lang)} {t('ккал', 'kcal')}</b>
        </div>
      </>}
      <span className="lbl">{t('Основа страви', 'Mostly')}</span>
      <div className="chips" style={{ flexWrap: 'wrap' }}>{CAT_LIST.map(c => <button key={c} className={'chip press' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{CATS[c][t.lang]}</button>)}</div>
      <button className="btn block press" disabled={!name.trim() || !items.length} onClick={save}>{t('Зберегти рецепт', 'Save recipe')}</button>
    </div>
  );
}

// ——— Запис повідомленням: «250 г гречки, курка 150 і салат»
export function openChat(meal: MealKey, date?: string) { openSheet(close => <ChatLog meal={meal} date={date} close={close} />); }
function ChatLog({ meal, date, close }: { meal: MealKey; date?: string; close: () => void }) {
  const s = useApp();
  const t = useT();
  const [text, setText] = useState('');
  const [items, setItems] = useState<{ text: string; food: Food | null; g: number }[] | null>(null);
  const [m, setM] = useState<MealKey>(meal);
  const all = [...s.customFoods, ...LOCAL_FOODS];
  const ok = (items || []).filter(i => i.food);
  const voice = useVoice(s.lang, said => { setText(v => (v.trim() ? v.trim() + ', ' : '') + said); setItems(null); });
  return (
    <div className="stack" style={{ gap: 12 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{voice.supported ? t('Напиши або скажи, що з\'їв', 'Type or say what you ate') : t('Напиши, що з\'їв', 'Type what you ate')}</h2>
      <div style={{ position: 'relative' }}>
        <textarea className="field" rows={3} value={text} data-autofocus onChange={e => { setText(e.target.value); setItems(null); }}
          placeholder={t('Наприклад: 2 сирники зі сметаною, кава з молоком і банан', 'For example: 2 eggs, a slice of rye bread and a cappuccino')} style={{ padding: voice.supported ? '14px 64px 14px 14px' : 14, lineHeight: 1.5, fontSize: 16, width: '100%' }} aria-label={t('Що з\'їв', 'What you ate')} />
        {voice.supported && <button className="press" onClick={voice.toggle} aria-pressed={voice.on} aria-label={voice.on ? t('Зупинити запис голосу', 'Stop voice input') : t('Сказати голосом', 'Speak')}
          style={{ position: 'absolute', right: 8, top: 8, width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: voice.on ? 'var(--tomato)' : 'var(--ink)', color: voice.on ? '#fff' : 'var(--bg)', boxShadow: voice.on ? '0 0 0 6px color-mix(in srgb, var(--tomato) 25%, transparent)' : 'none', transition: 'box-shadow .3s' }}>
          <Icon name="mic" size={24} /></button>}
      </div>
      {voice.on && <p aria-live="polite" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tomato)' }}>{t('Слухаю… Говори, наприклад: «тарілка борщу і два шматки хліба»', 'Listening… Say, for example: «a bowl of soup and two slices of bread»')}</p>}
      {voice.err && <p role="alert" className="muted" style={{ fontSize: 13.5, lineHeight: 1.45 }}>{voice.err}</p>}
      {!items && <button className="btn block press" disabled={!text.trim()} onClick={() => setItems(parseMeal(text, all))}>{t('Розібрати', 'Sort it out')}</button>}
      {items && <>
        {items.map((it, i) => (
          <div key={i} className="row" style={{ minHeight: 56, opacity: it.food ? 1 : 0.6 }}>
            <span className="dot" style={{ background: it.food ? CATS[it.food.cat].c[1] : 'var(--track)' }} />
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontWeight: 600, fontSize: 14.5 }}>{it.food ? t.l(it.food.name) : t('Не впізнав', 'Not recognised')}</span><span className="muted" style={{ fontSize: 12 }}>«{it.text}»</span></span>
            {it.food && <><input className="field" inputMode="numeric" value={it.g} onChange={e => setItems(items.map((y, j) => (j === i ? { ...y, g: parseInt(e.target.value) || 0 } : y)))} style={{ width: 76, minHeight: 42, textAlign: 'right', fontSize: 15 }} aria-label={t('Грами', 'Grams')} /><span className="muted">{t('г', 'g')}</span></>}
            <button className="icon-btn press" style={{ width: 36, height: 36 }} onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label={t('Прибрати', 'Remove')}><Icon name="close" size={16} /></button>
          </div>
        ))}
        {items.some(i => !i.food) && <p className="muted" style={{ fontSize: 13 }}>{t('Те, що не впізнав, можна знайти пошуком або додати як свою страву.', 'Anything not recognised can be found via search or added as your own food.')}</p>}
        <div className="chips">{MEALS.map(x => <button key={x.k} className={'chip press' + (m === x.k ? ' on' : '')} onClick={() => setM(x.k)}>{t.l(x.name)}</button>)}</div>
        <button className="btn block press" disabled={!ok.length} onClick={() => { act(x => addFoods(x, ok.map(i => ({ food: i.food!, g: i.g })), m, { chat: true, date })); close(); }}>{t(`Додати (${ok.length})`, `Add (${ok.length})`)}</button>
        <button className="btn ghost block press small" onClick={() => setItems(null)}>{t('Змінити текст', 'Edit text')}</button>
      </>}
    </div>
  );
}

/** Голосовий ввід через вбудоване розпізнавання браузера (Safari на iPhone, Chrome). Нічого не зберігаємо. */
function useVoice(lang: 'uk' | 'en', onText: (s: string) => void) {
  const t = useT();
  const SR: any = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const [on, setOn] = useState(false);
  const [err, setErr] = useState('');
  const rec = useRef<any>(null);
  useEffect(() => () => { try { rec.current?.abort(); } catch { /* */ } }, []);
  const toggle = () => {
    if (on) { try { rec.current?.stop(); } catch { /* */ } return; }
    setErr('');
    try {
      const r = new SR();
      r.lang = lang === 'en' ? 'en-US' : 'uk-UA';
      r.interimResults = false;
      r.continuous = false;
      r.maxAlternatives = 1;
      r.onresult = (e: any) => { const txt = Array.from(e.results).map((x: any) => x[0].transcript).join(' ').trim(); if (txt) onText(txt); };
      r.onerror = (e: any) => setErr(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? t('Немає доступу до мікрофона. Дозволь його в налаштуваннях Safari (Сайти → Мікрофон) або просто напиши текстом.', 'No microphone access. Allow it in browser settings or just type instead.')
        : e.error === 'no-speech' ? t('Нічого не почув. Спробуй ще раз, ближче до телефона.', 'Didn\'t hear anything. Try again a bit closer.')
        : t('Розпізнавання голосу зараз недоступне. Можна написати текстом.', 'Voice recognition isn\'t available right now. You can type instead.'));
      r.onend = () => setOn(false);
      rec.current = r;
      r.start();
      setOn(true);
    } catch { setErr(t('Розпізнавання голосу тут недоступне. Можна написати текстом.', 'Voice input isn\'t available here. You can type instead.')); setOn(false); }
  };
  return { supported: !!SR, on, err, toggle };
}
