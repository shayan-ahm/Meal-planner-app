// Recipe facts, preference filtering, grocery list maths and cooking helpers.
// Ported from the Forkcast prototype. Pure functions: no React, no storage.
import {
  ABOUT, AISLES, AVOID_KEYWORDS, AVOID_TAGS, DIET_TAGS, INGREDIENTS, META,
  NUTRITION, PROTEINS, RECIPES, SUBS,
} from '../data/recipes';
import type { AppState, Ingredient, PlanEntry, Prefs, Recipe } from './types';

export const ing = (id: string): Ingredient | null => {
  const a = INGREDIENTS[id];
  return a ? { id, name: a[0], unit: a[1], pack: a[2], aisle: a[4], staple: !!a[5] } : null;
};

const BY_ID = new Map(RECIPES.map((r) => [r.id, r]));
export const recipe = (id: string) => BY_ID.get(id);

export type Macro = { kcal: number; prot: number; carb: number; fat: number };
export type Info = {
  avoids: Set<string>;
  veg: boolean;
  vegan: boolean;
  pesc: boolean;
  hp: boolean;
  loC: boolean;
  loF: boolean;
  loCal: boolean;
  keto: boolean;
  macro: Macro | null;
  labels: string[];
  protein: string;
  type: 'Breakfast' | 'Meal' | 'Snack';
  meals: string[];
  eq: string[];
  cui: string;
  about: string;
  tip: string;
};

const TYPE: Record<string, Info['type']> = { B: 'Breakfast', L: 'Meal', D: 'Meal', S: 'Snack' };
const MEAL_NAME: Record<string, string> = { B: 'Breakfast', L: 'Lunch', D: 'Dinner', S: 'Snack' };

const cache = new Map<string, Info>();
export function info(r: Recipe): Info {
  const hit = cache.get(r.id);
  if (hit) return hit;
  const md = META[r.id] || {};
  const tags = new Set<string>();
  const names: string[] = [];
  const avoids = new Set<string>();
  for (const [id] of r.i) {
    const g = ing(id);
    names.push((g ? g.name : id).toLowerCase());
    if (DIET_TAGS[id]) tags.add(DIET_TAGS[id]);
    if (AVOID_TAGS[id]) AVOID_TAGS[id].forEach((t) => avoids.add(t));
  }
  if (md.spicy) avoids.add('spicy');
  const veg = !tags.has('meat') && !tags.has('fish');
  const vegan = veg && !tags.has('dairy') && !tags.has('egg') && !tags.has('honey');
  const pesc = !tags.has('meat') && tags.has('fish');
  const gf = !tags.has('gluten') && !avoids.has('gluten');
  const df = !tags.has('dairy');
  const labels: string[] = [];
  if (vegan) labels.push('Vegan');
  else if (veg) labels.push('Vegetarian');
  else if (pesc) labels.push('Pescatarian');
  if (gf) labels.push('Gluten-free');
  if (df) labels.push('Dairy-free');

  let protein = 'Veggie-packed';
  for (const [lab, rx] of PROTEINS) if (names.some((n) => rx.test(n))) { protein = lab; break; }

  const nu = [0, 0, 0, 0];
  let known = 0;
  for (const [id, q] of r.i) {
    const n = NUTRITION[id];
    if (n) { known++; for (let k = 0; k < 4; k++) nu[k] += (n[k] * q) / 2; }
  }
  const macro = known >= Math.max(1, r.i.length * 0.6)
    ? { kcal: Math.round(nu[0] / 10) * 10, prot: Math.round(nu[1]), carb: Math.round(nu[2]), fat: Math.round(nu[3]) }
    : null;
  // Labels use share of calories so a small snack can't pass as "high protein" or "low carb".
  const share = (g: number, kcalPerG: number) => (macro && macro.kcal ? (g * kcalPerG) / macro.kcal : 0);
  const hp = !!macro && macro.prot >= 25 && share(macro.prot, 4) >= 0.2;
  const loC = !!macro && macro.carb <= 30 && share(macro.carb, 4) <= 0.26;
  const loF = !!macro && share(macro.fat, 9) <= 0.3;
  const loCal = !!macro && macro.kcal <= 500;
  if (hp) labels.push('High protein');
  if (loC) labels.push('Low carb');
  if (loF) labels.push('Low fat');
  if (loCal) labels.push('Under 500 kcal');

  const ab = ABOUT[r.id] || ['', ''];
  const out: Info = {
    avoids, veg, vegan, pesc, hp, loC, loF, loCal, keto: !!macro && macro.carb <= 15, macro, labels, protein,
    type: TYPE[r.m] || 'Meal',
    meals: md.meals || [MEAL_NAME[r.m]],
    eq: md.eq || ['Stovetop'],
    cui: md.cui || '',
    about: ab[0] || '',
    tip: ab[1] || '',
  };
  cache.set(r.id, out);
  return out;
}

export const defaultPrefs = (): Prefs => ({
  units: 'metric', diet: 'any', avoid: [], eq: ['Stovetop', 'Oven', 'Air fryer', 'Microwave'],
  maxT: 0, cui: [], goals: [], maxCal: 0, maxIng: 0,
});

/** Does this recipe suit the person's preferences? */
export function fits(r: Recipe, P: Prefs): boolean {
  const f = info(r);
  if (P.diet === 'vegetarian' && !f.veg) return false;
  if (P.diet === 'vegan' && !f.vegan) return false;
  if (P.diet === 'pescatarian' && !(f.veg || f.pesc)) return false;
  if (P.diet === 'flexitarian' && (f.avoids.has('beef') || f.avoids.has('pork'))) return false;
  for (const a of P.avoid) if (f.avoids.has(a)) return false;
  if (P.maxIng && r.i.filter(([id]) => !ing(id)?.staple).length > P.maxIng) return false;
  if (!f.eq.every((e) => e === 'No cooking' || P.eq.includes(e))) return false;
  if (P.maxT && r.t > P.maxT) return false;
  const g = P.goals;
  if (g.length && !f.macro) return false;
  if (g.includes('hp') && !f.hp) return false;
  if (g.includes('loC') && !f.loC) return false;
  if (g.includes('loF') && !f.loF) return false;
  if (g.includes('keto') && !f.keto) return false;
  if (P.maxCal && (!f.macro || f.macro.kcal > P.maxCal)) return false;
  return true;
}

/** Lower sorts first: favourite cuisines, then main meals, then nutrition goals. */
export function prefRank(r: Recipe, P: Prefs): number {
  const f = info(r);
  let s = P.cui.includes(f.cui) ? 0 : 1000;
  if (f.type !== 'Meal') s += 5000;
  if (f.macro) {
    if (P.goals.includes('hp')) s -= f.macro.prot;
    if (P.goals.includes('loC')) s += f.macro.carb;
    if (P.goals.includes('loF')) s += f.macro.fat;
  }
  return s;
}

function dishTypes(r: Recipe) {
  const n = r.n.toLowerCase(), ids = r.i.map((x) => x[0]), d = new Set<string>();
  if (/bowl/.test(n)) d.add('bowls');
  if (ids.includes('pasta') || ids.includes('rice_noodles') || /pasta|noodle|stroganoff|scampi/.test(n)) d.add('pasta');
  if (/taco|wrap|quesadilla|pita|burrito(?! bowl)|fajita/.test(n)) d.add('tacos');
  if (/soup|stew|chili|curry|masala|tikka/.test(n)) d.add('soups');
  if (/salad|caesar/.test(n)) d.add('salads');
  if (/sheet-pan|skillet|one-pot|shakshuka|baked|stir-fry/.test(n)) d.add('onepan');
  return d;
}

export function matchCategory(r: Recipe, k: string, stars: (id: string) => number): boolean {
  const f = info(r);
  switch (k) {
    case 'all': return true;
    case 'quick': return r.t <= 20;
    case 'veg': return f.veg;
    case 'vegan': return f.vegan;
    case 'hp': return f.hp;
    case 'loC': return f.loC;
    case 'loF': return f.loF;
    case 'loCal': return f.loCal;
    case 'Breakfast': case 'Snack': return f.type === k;
    case 'fav': return stars(r.id) >= 4;
    case 'Air fryer': case 'Oven': case 'No cooking': return f.eq.includes(k);
    case 'bowls': case 'pasta': case 'tacos': case 'soups': case 'salads': case 'onepan': return dishTypes(r).has(k);
    default: return f.protein === k;
  }
}

export function searchText(r: Recipe): string {
  const f = info(r);
  return [r.n, ...r.i.map(([id]) => ing(id)?.name || id), ...f.labels, f.cui, ...f.eq, f.type, ...f.meals, f.protein]
    .join(' ').toLowerCase();
}

/* ---------- Quantities ---------- */

/** Total of each ingredient needed for the meals not cooked yet. */
export function needs(plan: PlanEntry[]): Record<string, number> {
  const n: Record<string, number> = {};
  for (const e of plan) {
    if (e.cooked) continue;
    const r = recipe(e.r);
    if (!r) continue;
    for (const [id, q] of r.i) n[id] = (n[id] || 0) + (q * e.s) / 2;
  }
  return n;
}

export const shoppingCount = (plan: PlanEntry[]) =>
  Object.keys(needs(plan)).filter((id) => ing(id) && !ing(id)!.staple).length;

/** How many of a recipe's ingredients are new to the current list (lower = cheaper to add). */
export function newItemsFor(r: Recipe, n: Record<string, number>) {
  return r.i.filter(([id]) => { const g = ing(id); return g && !g.staple && !n[id]; }).length;
}
export function sharedFor(r: Recipe, n: Record<string, number>) {
  return r.i.filter(([id]) => { const g = ing(id); return g && !g.staple && n[id]; }).length;
}

export function fmt(q: number): string {
  const w = Math.floor(q + 1e-9), f = q - w;
  const fr: [number, string][] = [[0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾']];
  let best = '', bd = 1;
  for (const [v, s] of fr) { const dd = Math.abs(f - v); if (dd < bd) { bd = dd; best = s; } }
  if (f < 0.12) return String(w || (q > 0 ? '¼' : 0));
  if (f > 0.88) return String(w + 1);
  return (w ? w : '') + best;
}

function unitLabel(u: string, q: number) {
  if (!u) return '';
  if (u === 'lb' || u === 'oz' || u === 'tbsp' || u === 'tsp' || (u === 'cup' && q <= 1)) return u;
  if (u === 'cup') return 'cups';
  if (u === 'bunch') return q > 1 ? 'bunches' : 'bunch';
  if (u === 'inch') return 'in';
  if (u === 'clove' || u === 'can' || u === 'slice' || u === 'head') return q > 1 ? u + 's' : u;
  return u;
}

export function qtyText(g: Ingredient, q: number, units: Prefs['units']): string {
  if (units !== 'imperial' && (g.unit === 'lb' || g.unit === 'oz')) {
    let gr = q * (g.unit === 'lb' ? 453.6 : 28.35);
    if (gr >= 1000) return Math.round(gr / 100) / 10 + ' kg';
    gr = gr >= 100 ? Math.round(gr / 50) * 50 : Math.max(10, Math.round(gr / 10) * 10);
    return gr + ' g';
  }
  return fmt(q) + (g.unit ? ' ' + unitLabel(g.unit, q) : '');
}

export const ingredientLine = (id: string, q: number, servings: number, units: Prefs['units']) => {
  const g = ing(id);
  return g ? `${qtyText(g, (q * servings) / 2, units)} ${g.name.toLowerCase()}` : id;
};

export function subsFor(id: string, avoid: string[]): string {
  const t = SUBS[id] || '';
  if (!t) return '';
  const parts = t.split(/, | or /).filter((x) => !AVOID_KEYWORDS.some(([k, rx]) => avoid.includes(k) && rx.test(x.toLowerCase())));
  if (!parts.length) return '';
  return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' or ' + parts[parts.length - 1];
}

/* ---------- Grocery list ---------- */

export type ListRow = { id: string; g: Ingredient; q: number; left: number };
export type ListModel = {
  aisles: { aisle: string; rows: ListRow[] }[];
  staples: ListRow[];
  toGet: number;
  leftoverTip: { row: ListRow; recipe: Recipe } | null;
};

const PERISHABLE = new Set(['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery']);
const NO_TIP = new Set(['butter', 'parmesan', 'potato', 'carrot', 'bread', 'tortillas', 'eggs', 'garlic', 'onion', 'ginger']);

export function listModel(S: AppState): ListModel {
  const n = needs(S.plan);
  const rows: ListRow[] = [];
  for (const id in n) {
    const g = ing(id);
    if (!g) continue;
    const packs = Math.ceil(n[id] / g.pack - 1e-9);
    rows.push({ id, g, q: n[id], left: packs * g.pack - n[id] });
  }
  const buy = rows.filter((r) => !r.g.staple);
  const staples = rows.filter((r) => r.g.staple).sort((a, b) => a.g.name.localeCompare(b.g.name));
  const toGet =
    buy.filter((r) => !S.checks[r.id] && S.have[r.id] !== true).length +
    S.extras.filter((x) => !x.done).length +
    staples.filter((r) => S.have[r.id] === false && !S.checks[r.id]).length;

  const aisles = AISLES.filter((a) => a !== 'Pantry staples')
    .map((aisle) => ({ aisle, rows: buy.filter((r) => r.g.aisle === aisle).sort((x, y) => x.g.name.localeCompare(y.g.name)) }))
    .filter((a) => a.rows.length);

  let leftoverTip: ListModel['leftoverTip'] = null;
  const inPlan = new Set(S.plan.map((e) => e.r));
  for (const r of buy.slice().sort((a, b) => b.left / b.g.pack - a.left / a.g.pack)) {
    if (!PERISHABLE.has(r.g.aisle) || NO_TIP.has(r.id)) continue;
    if (r.left / r.g.pack < 0.35 || (r.g.pack === 1 && r.left < 0.5)) continue;
    const cand = RECIPES.filter((x) => !inPlan.has(x.id) && fits(x, S.prefs) && x.i.some(([id]) => id === r.id))
      .sort((a, b) => newItemsFor(a, n) - newItemsFor(b, n));
    if (cand.length) { leftoverTip = { row: r, recipe: cand[0] }; break; }
  }
  return { aisles, staples, toGet, leftoverTip };
}

export function listAsText(S: AppState): string {
  const m = listModel(S);
  const lines: string[] = ['Grocery list'];
  for (const a of m.aisles) {
    const open = a.rows.filter((r) => !S.checks[r.id] && S.have[r.id] !== true);
    if (!open.length) continue;
    lines.push('', a.aisle);
    for (const r of open) lines.push(`- ${r.g.name} (${qtyText(r.g, r.q, S.prefs.units)})`);
  }
  const extra = [
    ...m.staples.filter((r) => S.have[r.id] === false && !S.checks[r.id]).map((r) => r.g.name),
    ...S.extras.filter((x) => !x.done).map((x) => x.name),
  ];
  if (extra.length) { lines.push('', 'Other'); for (const x of extra) lines.push(`- ${x}`); }
  return lines.join('\n');
}

/* ---------- Picking meals ---------- */

/**
 * Picks meals for the person. Variety comes first: a protein, cuisine or dish type already
 * in the plan counts against a recipe, so you don't get three chicken dinners. Sharing
 * ingredients with the plan is a smaller bonus that keeps the grocery list short.
 */
export function pickForMe(S: AppState, count: number, rand: () => number = Math.random): PlanEntry[] {
  const plan = S.plan.slice();
  const tally = (key: (r: Recipe) => string[]) => {
    const t: Record<string, number> = {};
    for (const e of plan) { const r = recipe(e.r); if (r) for (const k of key(r)) t[k] = (t[k] || 0) + 1; }
    return t;
  };
  const dishes = (r: Recipe) => [...dishTypes(r)];
  for (let k = 0; k < count; k++) {
    const n = needs(plan);
    const taken = new Set(plan.map((e) => e.r));
    const prot = tally((r) => [info(r).protein]);
    const cui = tally((r) => [info(r).cui]);
    const dish = tally(dishes);
    const cands = RECIPES.filter((r) => !taken.has(r.id) && fits(r, S.prefs) && info(r).type === 'Meal')
      .map((r) => {
        const f = info(r);
        const repeat = (prot[f.protein] || 0) * 40 + (cui[f.cui] || 0) * 10 + dishes(r).reduce((a, d) => a + (dish[d] || 0) * 12, 0);
        const shared = sharedFor(r, n) * 4 - newItemsFor(r, n) * 2;
        const liked = (S.reviews[r.id]?.stars || 0) >= 4 ? 8 : 0;
        const pref = prefRank(r, S.prefs) / 100;
        return { r, score: repeat - shared - liked + pref + rand() * 15 };
      })
      .sort((a, b) => a.score - b.score);
    if (!cands.length) break;
    const top = cands.slice(0, 4);
    plan.push({ r: top[Math.floor(rand() * top.length)].r.id, s: S.hh });
  }
  return plan;
}

/* ---------- Cook mode ---------- */

const ADJ = new Set('yellow fresh baby firm ground long-grain dry shredded grated crumbled frozen rolled red sandwich flour boneless peeled smoked sirloin basil crushed extra fillets chunks green'.split(' '));

/** The ingredients a step mentions, with amounts. */
export function stepIngredients(r: Recipe, step: string, servings: number, units: Prefs['units']): string[] {
  const t = step.toLowerCase(), out: string[] = [];
  for (const [id, q] of r.i) {
    const g = ing(id);
    if (!g) continue;
    const words = g.name.toLowerCase().replace(/\(.*?\)|,.*$/g, '').split(/[\s-]+/).filter((w) => w.length > 2 && !ADJ.has(w));
    if (words.some((w) => new RegExp('\\b(' + w + '|' + w.replace(/e?s$/, '') + ')(e?s)?\\b').test(t))) {
      const name = g.name.toLowerCase().replace(/,.*$/, '').replace(/ \(dry\)/, '');
      out.push((g.staple && g.unit === 'tsp' ? '' : qtyText(g, (q * servings) / 2, units) + ' ') + name);
    }
  }
  return out;
}

/** Minutes mentioned in a step, for a one-tap timer. "8 to 10 minutes" gives 10. */
export function stepMinutes(step: string): number {
  const m = step.match(/(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*min/i);
  const v = m ? +(m[2] || m[1]) : 0;
  return v >= 3 ? v : 0;
}
