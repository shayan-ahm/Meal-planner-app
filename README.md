# Forkcast

A simple meal planner for iPhone (Android later). Pick the meals you want to cook, get one grocery list for all of them, then cook step by step.

Built with Expo (React Native) and TypeScript. Started from the Forkcast HTML prototype: 78 beginner-friendly recipes, each with a photo.

## What it does

- **My meals**: your plan is just a list of meals. No days, no breakfast/lunch/dinner slots. Change servings per meal, or tap "Pick 3 for me".
- **Recipes**: search, categories, cuisines, and a one-tap **+** to add a meal. Only recipes that fit your preferences are shown.
- **Grocery list**: built from your meals and grouped by aisle, with swaps if the store is out of something, a leftover tip, pantry basics, your own extra items, and sharing.
- **Cook mode**: one big step at a time, the ingredients each step needs, one-tap timers with sound, and the screen stays on.
- **Preferences**: people, units, diet, allergies, dislikes, nutrition goals, time, kitchen equipment, favourite cuisines.
- **Saved on the phone**: the plan, list ticks, ratings, notes and saved plans survive closing the app.

No prices or budgets are shown, on purpose.

## Try it on your phone

1. Install **Expo Go** from the App Store.
2. On a computer with Node.js: `npm install`, then `npx expo start`.
3. Scan the QR code with the iPhone camera.

## Project layout

```
src/app/          screens (Expo Router: every file is a screen)
  (tabs)/         My meals, Recipes, Grocery list
  recipe/[id].tsx recipe details
  cook/[id].tsx   cook mode
  preferences.tsx, saved.tsx
src/lib/logic.ts  recipe facts, filters, grocery maths (no UI)
src/lib/store.tsx app state, saved on the device with AsyncStorage
src/data/         recipes, ingredients, nutrition, photos
src/ui/           shared components and the white and green theme
assets/recipes/   one photo per recipe
```

Checks: `npx tsc --noEmit` and `npx expo lint`.

## Later

- Accounts and sync between devices (the store is the one place to add it).
- Free plus Premium subscription. Nothing is locked yet.
- Timer alerts when the app is in the background, adding your own recipes, App Store release with EAS Build.
