/** [name, unit, pack size, pack price, aisle, isPantryStaple?] */
export type IngredientRow = [string, string, number, number, string, number?];

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  pack: number;
  aisle: string;
  staple: boolean;
};

/** B = breakfast, L = lunch, D = dinner, S = snack. Used as a tag only. */
export type MealTag = 'B' | 'L' | 'D' | 'S';

export type Recipe = {
  id: string;
  /** name */
  n: string;
  m: MealTag;
  /** minutes */
  t: number;
  /** placeholder colour */
  c: string;
  /** ingredients as [ingredient id, quantity for 2 servings] */
  i: [string, number][];
  /** steps */
  s: string[];
};

export type PlanEntry = { r: string; s: number; cooked?: boolean };

export type Prefs = {
  units: 'metric' | 'imperial';
  diet: 'any' | 'flexitarian' | 'pescatarian' | 'vegetarian' | 'vegan';
  avoid: string[];
  eq: string[];
  maxT: number;
  cui: string[];
  goals: string[];
  maxCal: number;
  maxIng: number;
};

export type Extra = { name: string; done?: boolean };

export type Review = { stars: number; notes: { t: string; at: number }[] };

/** A plan the person saved to reuse later. */
export type SavedPlan = { id: string; name: string; at: number; plan: PlanEntry[] };

export type AppState = {
  v: 1;
  /** people in the household, the default number of servings */
  hh: number;
  plan: PlanEntry[];
  /** grocery items ticked off */
  checks: Record<string, boolean>;
  /** pantry staples: false means "I'm out, put it on the list" */
  have: Record<string, boolean>;
  extras: Extra[];
  reviews: Record<string, Review>;
  saved: SavedPlan[];
  /** how many meals "Pick for me" adds at a time */
  pickN: number;
  prefs: Prefs;
};
