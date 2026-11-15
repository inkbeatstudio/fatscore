/** Відстань між двома точками, км (формула гаверсинусів) */
export function haversine(a: [number, number], b: [number, number]) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
export function routeKm(pts: [number, number][]) { let d = 0; for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]); return d; }
/** Проріджуємо маршрут до ~300 точок, щоб не роздувати сховище */
export function thin(pts: [number, number][], max = 300): [number, number][] {
  if (pts.length <= max) return pts.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)]);
  const step = pts.length / max;
  const out: [number, number][] = [];
  for (let i = 0; i < max; i++) { const p = pts[Math.floor(i * step)]; out.push([+p[0].toFixed(5), +p[1].toFixed(5)]); }
  const last = pts[pts.length - 1]; out.push([+last[0].toFixed(5), +last[1].toFixed(5)]);
  return out;
}
export type ActKind = 'walk' | 'run' | 'bike' | 'hike';
export const ACT_MET: Record<ActKind, number> = { walk: 3.5, run: 9.8, bike: 7.5, hike: 6 };
export function guessKind(km: number, min: number, hint = ''): ActKind {
  const h = hint.toLowerCase();
  if (/bik|cycl|ride|вело/.test(h)) return 'bike';
  if (/run|jog|біг/.test(h)) return 'run';
  if (/hik|trek|похід/.test(h)) return 'hike';
  if (/walk|ходьб|прогул/.test(h)) return 'walk';
  const kmh = min ? km / (min / 60) : 0;
  return kmh > 16 ? 'bike' : kmh > 7.5 ? 'run' : 'walk';
}

/** Імпорт GPX або TCX з годинника чи застосунку-трекера */
export function parseTrackFile(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('bad');
  const pts: [number, number][] = [];
  const times: number[] = [];
  doc.querySelectorAll('trkpt, rtept').forEach(p => {
    const lat = parseFloat(p.getAttribute('lat') || ''), lon = parseFloat(p.getAttribute('lon') || '');
    if (isFinite(lat) && isFinite(lon)) { pts.push([lat, lon]); const tm = p.querySelector('time')?.textContent; if (tm) times.push(Date.parse(tm)); }
  });
  if (!pts.length) doc.querySelectorAll('Trackpoint').forEach(p => {
    const lat = parseFloat(p.querySelector('LatitudeDegrees')?.textContent || ''), lon = parseFloat(p.querySelector('LongitudeDegrees')?.textContent || '');
    if (isFinite(lat) && isFinite(lon)) { pts.push([lat, lon]); const tm = p.querySelector('Time')?.textContent; if (tm) times.push(Date.parse(tm)); }
  });
  if (pts.length < 2) throw new Error('empty');
  const hint = (doc.querySelector('trk > type')?.textContent || '') + ' ' + (doc.querySelector('Activity')?.getAttribute('Sport') || '') + ' ' + (doc.querySelector('trk > name, metadata > name')?.textContent || '');
  let km = routeKm(pts);
  const tcxDist = doc.querySelector('Lap > DistanceMeters')?.textContent;
  if (tcxDist && +tcxDist > 0) km = +tcxDist / 1000;
  const valid = times.filter(isFinite);
  const start = valid.length ? Math.min(...valid) : Date.now();
  const min = valid.length > 1 ? Math.max(1, Math.round((Math.max(...valid) - start) / 60000)) : Math.round(km * 12);
  return { km: Math.round(km * 100) / 100, min, start, route: thin(pts), kind: guessKind(km, min, hint) };
}
