import { useSyncExternalStore } from 'react';

export type TabId = 'home' | 'diary' | 'adventure' | 'heroes';
export type PageId = 'food' | 'move' | 'track' | 'profile' | 'friends';
export type Route = TabId | PageId;
export const TABS: TabId[] = ['home', 'diary', 'adventure', 'heroes'];
const ALL: Route[] = [...TABS, 'food', 'move', 'track', 'profile', 'friends'];

type Nav = { route: Route; params: { date?: string; from?: Route } };
const read = (): Route => { const h = location.hash.slice(1) as Route; return ALL.includes(h) ? h : 'home'; };
let nav: Nav = { route: read(), params: {} };
const L = new Set<() => void>();
const emit = () => L.forEach(l => l());

/** Перехід між вкладками та сторінками. Сторінки (їжа, рух…) відкриваються поверх і мають кнопку «назад» */
export function go(route: Route, params: Nav['params'] = {}) {
  const from = nav.route;
  nav = { route, params: { ...params, from: params.from ?? (TABS.includes(route as TabId) ? undefined : from) } };
  history.replaceState(null, '', route === 'home' ? location.pathname + location.search : '#' + route);
  scrollTo(0, 0);
  emit();
}
export function back() { go(nav.params.from && nav.params.from !== nav.route ? nav.params.from : 'home'); }
export function useNav() { return useSyncExternalStore(cb => { L.add(cb); return () => L.delete(cb); }, () => nav); }
addEventListener('hashchange', () => { const r = read(); if (r !== nav.route) { nav = { route: r, params: {} }; emit(); } });
