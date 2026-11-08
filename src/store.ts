import Dexie, { type Table } from 'dexie';
import { useSyncExternalStore } from 'react';
import type { Effect, State } from './types';
import { freshState, onOpen, STATE_VERSION, ensureToday } from './logic/game';

class DB extends Dexie {
  kv!: Table<{ key: string; value: unknown }, string>;
  constructor() {
    super('fatscore');
    this.version(1).stores({ kv: 'key' });
  }
}
const db = new DB();

let state: State = freshState(navigator.language?.startsWith('uk') || navigator.language?.startsWith('ru') ? 'uk' : 'en');
let ready = false;
let storageOk = true;
const listeners = new Set<() => void>();
const fxListeners = new Set<(fx: Effect[]) => void>();

function migrate(raw: any): State {
  const base = freshState(raw?.lang || 'uk');
  const s: State = { ...base, ...raw, profile: { ...base.profile, ...(raw?.profile || {}) }, settings: { ...base.settings, ...(raw?.settings || {}) },
    stats: { ...base.stats, ...(raw?.stats || {}) }, eq: { ...base.eq, ...(raw?.eq || {}) } };
  for (const k of Object.keys(s.days)) {
    const d: any = s.days[k];
    s.days[k] = { habits: {}, quests: {}, rewards: {}, gamePlays: 0, workouts: [], foods: [], water: 0, steps: 0, rest: false, ...d };
  }
  s.v = STATE_VERSION;
  return s;
}

export async function initStore() {
  try {
    const row = await db.kv.get('state');
    if (row?.value) state = migrate(row.value);
    try { await navigator.storage?.persist?.(); } catch { /* не всі браузери */ }
  } catch {
    storageOk = false;
  }
  const fx = onOpen(state);
  ready = true;
  emitChange();
  persist();
  if (fx.length) setTimeout(() => fxListeners.forEach(l => l(fx)), 600);
}

let saveT: ReturnType<typeof setTimeout> | undefined;
function persist() {
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    try { await db.kv.put({ key: 'state', value: state }); storageOk = true; }
    catch { storageOk = false; emitChange(); }
  }, 250);
}
window.addEventListener('pagehide', () => { try { db.kv.put({ key: 'state', value: state }); } catch { /* */ } });

function emitChange() { listeners.forEach(l => l()); }

/** Змінити стан. fn отримує копію і може повернути ефекти (тост, святкування, реакція персонажа) */
export function act(fn: (s: State) => Effect[] | void) {
  const draft: State = structuredClone(state);
  ensureToday(draft);
  const fx = fn(draft) || [];
  state = draft;
  emitChange();
  persist();
  if (fx.length) fxListeners.forEach(l => l(fx));
  return fx;
}
export function replaceState(next: State) { state = migrate(next); emitChange(); persist(); }
export function resetState() { const lang = state.lang; state = freshState(lang); emitChange(); persist(); }
export const getState = () => state;
export const isReady = () => ready;
export const storageWorks = () => storageOk;

export function useApp(): State {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => state);
}
export function onEffects(cb: (fx: Effect[]) => void) { fxListeners.add(cb); return () => { fxListeners.delete(cb); }; }
export function emitEffects(fx: Effect[]) { fxListeners.forEach(l => l(fx)); }
