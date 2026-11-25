// The Recipes tab shows a new random order each time you come to it from another tab.
// Opening a recipe and coming back keeps the same order, so you don't lose your place.
let seed = Math.random();
export const reshuffleRecipes = () => { seed = Math.random(); };
export const recipeSeed = () => seed;
