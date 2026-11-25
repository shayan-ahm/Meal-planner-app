// App state, saved on the phone with AsyncStorage so plans and lists survive closing the app.
// Later, accounts and sync can be added here without touching the screens.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { defaultPrefs } from './logic';
import type { AppState, PlanEntry, Recipe } from './types';

const KEY = 'forkcast.state.v1';

export const defaults = (): AppState => ({
  v: 1, hh: 2, plan: [], checks: {}, have: {}, extras: [], reviews: {}, saved: [], pickN: 2, favs: [], intro: false, prefs: defaultPrefs(),
});

function normalize(raw: unknown): AppState {
  const d = defaults();
  if (!raw || typeof raw !== 'object') return d;
  const s = raw as Partial<AppState>;
  return {
    ...d,
    ...s,
    v: 1,
    plan: Array.isArray(s.plan) ? s.plan : [],
    extras: Array.isArray(s.extras) ? s.extras : [],
    saved: Array.isArray(s.saved) ? s.saved : [],
    checks: s.checks || {},
    have: s.have || {},
    reviews: s.reviews || {},
    pickN: typeof s.pickN === 'number' ? s.pickN : d.pickN,
    // Older saves had no hearts: start with the meals rated 4 or 5 stars.
    favs: Array.isArray(s.favs) ? s.favs : Object.entries(s.reviews || {}).filter(([, v]) => v.stars >= 4).map(([k]) => k),
    prefs: { ...d.prefs, ...(s.prefs || {}) },
  };
}

type Update = (fn: (s: AppState) => AppState) => void;
type Ctx = { state: AppState; ready: boolean; update: Update };
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaults);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((t) => { if (t) setState(normalize(JSON.parse(t))); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {}); }, 300);
  }, [state, ready]);

  const update = useCallback<Update>((fn) => setState((s) => fn(s)), []);
  const value = useMemo(() => ({ state, ready, update }), [state, ready, update]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('useStore must be used inside StoreProvider');
  return c;
}

/* ---------- Actions ---------- */

export const actions = {
  addMeal: (id: string, servings: number) => (s: AppState): AppState => {
    const has = s.plan.some((p) => p.r === id);
    return { ...s, plan: has ? s.plan.map((p) => (p.r === id ? { ...p, s: servings } : p)) : [...s.plan, { r: id, s: servings }] };
  },
  removeMeal: (id: string) => (s: AppState): AppState => ({ ...s, plan: s.plan.filter((p) => p.r !== id) }),
  setServings: (id: string, servings: number) => (s: AppState): AppState => ({
    ...s, plan: s.plan.map((p) => (p.r === id ? { ...p, s: Math.max(1, Math.min(12, servings)) } : p)),
  }),
  markCooked: (id: string) => (s: AppState): AppState => ({
    ...s, plan: s.plan.map((p) => (p.r === id ? { ...p, cooked: true } : p)),
  }),
  setPlan: (plan: PlanEntry[]) => (s: AppState): AppState => ({ ...s, plan }),
  /** Empties the plan and the ticks on the list, ready for next week. */
  clearPlan: () => (s: AppState): AppState => ({ ...s, plan: [], checks: {}, extras: s.extras.filter((x) => !x.done) }),
  toggleCheck: (id: string) => (s: AppState): AppState => ({ ...s, checks: { ...s.checks, [id]: !s.checks[id] } }),
  uncheckAll: () => (s: AppState): AppState => ({ ...s, checks: {}, extras: s.extras.map((x) => ({ ...x, done: false })) }),
  /** For pantry staples: toggle "I'm out, add it to the list". */
  toggleOut: (id: string) => (s: AppState): AppState => {
    const have = { ...s.have };
    if (have[id] === false) delete have[id]; else have[id] = false;
    return { ...s, have };
  },
  addExtra: (name: string) => (s: AppState): AppState => ({ ...s, extras: [...s.extras, { name }] }),
  toggleExtra: (i: number) => (s: AppState): AppState => ({ ...s, extras: s.extras.map((x, k) => (k === i ? { ...x, done: !x.done } : x)) }),
  removeExtra: (i: number) => (s: AppState): AppState => ({ ...s, extras: s.extras.filter((_, k) => k !== i) }),
  /** Rating 4 or 5 stars also hearts the meal. */
  rate: (id: string, stars: number) => (s: AppState): AppState => ({
    ...s,
    reviews: { ...s.reviews, [id]: { notes: s.reviews[id]?.notes || [], stars } },
    favs: stars >= 4 && !s.favs.includes(id) ? [...s.favs, id] : s.favs,
  }),
  toggleFav: (id: string) => (s: AppState): AppState => ({
    ...s, favs: s.favs.includes(id) ? s.favs.filter((x) => x !== id) : [...s.favs, id],
  }),
  addNote: (id: string, t: string) => (s: AppState): AppState => {
    const r = s.reviews[id] || { stars: 0, notes: [] };
    return { ...s, reviews: { ...s.reviews, [id]: { ...r, notes: [{ t, at: Date.now() }, ...r.notes] } } };
  },
  savePlan: (name: string) => (s: AppState): AppState => ({
    ...s,
    saved: [{ id: String(Date.now()), name, at: Date.now(), plan: s.plan.map((p) => ({ r: p.r, s: p.s })) }, ...s.saved],
  }),
  loadSaved: (id: string) => (s: AppState): AppState => {
    const sp = s.saved.find((x) => x.id === id);
    return sp ? { ...s, plan: sp.plan.map((p) => ({ ...p })), checks: {} } : s;
  },
  deleteSaved: (id: string) => (s: AppState): AppState => ({ ...s, saved: s.saved.filter((x) => x.id !== id) }),
};

export const starsOf = (s: AppState) => (id: string) => s.reviews[id]?.stars || 0;
export const isFav = (s: AppState, id: string) => s.favs.includes(id);
export const inPlan = (s: AppState, r: Recipe | string) => s.plan.some((p) => p.r === (typeof r === 'string' ? r : r.id));
