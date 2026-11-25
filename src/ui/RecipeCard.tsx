import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { info } from '../lib/logic';
import { actions, inPlan, isFav, useStore } from '../lib/store';
import type { Recipe } from '../lib/types';
import { Photo, Tag, tap } from './kit';
import { C, F, shadow } from './theme';

/** Grid card with a one-tap "+" to add the meal to the plan. */
export function RecipeCard({ r }: { r: Recipe }) {
  const { state, update } = useStore();
  const f = info(r);
  const added = inPlan(state, r);
  const stars = state.reviews[r.id]?.stars || 0;
  const fav = isFav(state, r.id);
  const tags = [f.type !== 'Meal' ? f.type : '', f.labels.find((l) => l === 'Vegan' || l === 'Vegetarian') || '', f.hp ? 'High protein' : '']
    .filter(Boolean).slice(0, 2);
  return (
    <View style={s.wrap}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${r.n}`} onPress={() => router.push(`/recipe/${r.id}`)} style={s.card}>
        <Photo r={r} style={s.photo} />
        <View style={s.body}>
          <Text style={s.title} numberOfLines={2}>{r.n}</Text>
          <Text style={s.facts}>{r.t} min{f.macro ? ` · ${f.macro.kcal} kcal` : ''}</Text>
          {stars > 0 && <Text style={s.stars}>{'★'.repeat(stars)}<Text style={{ color: C.line }}>{'★'.repeat(5 - stars)}</Text></Text>}
          {tags.length > 0 && <View style={s.tags}>{tags.map((t) => <Tag key={t} label={t} alt={t === 'High protein'} />)}</View>}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fav ? `Remove ${r.n} from favourites` : `Add ${r.n} to favourites`}
        accessibilityState={{ selected: fav }}
        hitSlop={6}
        onPress={() => { tap(); update(actions.toggleFav(r.id)); }}
        style={[s.add, s.heart]}
      >
        <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? C.warn : C.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={added ? `Remove ${r.n} from my meals` : `Add ${r.n} to my meals`}
        accessibilityState={{ selected: added }}
        hitSlop={6}
        onPress={() => { tap(); update(added ? actions.removeMeal(r.id) : actions.addMeal(r.id, state.hh)); }}
        style={[s.add, added && s.addOn]}
      >
        <Text style={[s.addText, added && { color: '#fff', fontSize: 18 }]}>{added ? '✓' : '+'}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, position: 'relative' },
  card: { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', ...shadow },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: C.leafSoft },
  body: { padding: 10, gap: 3 },
  title: { fontFamily: F.display, fontSize: 15, lineHeight: 19, color: C.ink },
  facts: { fontFamily: F.body, fontSize: 12, color: C.muted },
  stars: { color: C.star, fontSize: 12, letterSpacing: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  add: {
    position: 'absolute', top: 8, right: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  addOn: { backgroundColor: C.leaf },
  heart: { right: undefined, left: 8, width: 36, height: 36, borderRadius: 18, top: 10 },
  addText: { color: C.leaf, fontSize: 24, lineHeight: 26, fontFamily: F.semibold },
});
