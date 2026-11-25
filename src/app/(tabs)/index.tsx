import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { info, pickForMe, recipe, shoppingCount } from '../../lib/logic';
import { actions, useStore } from '../../lib/store';
import { Button, H2, Muted, Photo, Stepper, servingsLabel, tap } from '../../ui/kit';
import { TopBar } from '../../ui/Screen';
import { C, F, shadow } from '../../ui/theme';

export default function MyMeals() {
  const { state, update } = useStore();
  const plan = state.plan.filter((e) => recipe(e.r));
  const items = shoppingCount(plan);
  const macros = plan.map((e) => info(recipe(e.r)!).macro).filter(Boolean) as { kcal: number; prot: number }[];
  // First launch: show the short guide once.
  useEffect(() => { if (!state.intro) router.push('/welcome'); }, [state.intro]);
  const pick = () => { tap(); update((st) => actions.setPlan(pickForMe(st, st.pickN))(st)); };
  const avg = (k: 'kcal' | 'prot') => Math.round(macros.reduce((a, m) => a + m[k], 0) / Math.max(1, macros.length));

  const savePlan = () => {
    const suggested = `Plan for ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    if (Platform.OS !== 'ios') {
      // Android has no text prompt built in, so save with a dated name.
      update(actions.savePlan(suggested));
      Alert.alert('Plan saved', `Saved as "${suggested}".`);
      return;
    }
    Alert.prompt(
      'Save this plan',
      'Give it a name so you can reuse it another week.',
      (name) => { if (name?.trim()) update(actions.savePlan(name.trim())); },
      'plain-text',
      suggested,
    );
  };

  const clearAll = () =>
    Alert.alert('Clear all meals?', 'Your grocery list will be emptied too. Saved plans are kept.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => update(actions.clearPlan()) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar />
      <ScrollView contentContainerStyle={s.main}>
        <H2>{plan.length ? `My meals (${plan.length})` : 'My meals'}</H2>

        {!plan.length && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No meals yet</Text>
            <Muted>Add a few meals and we’ll make one grocery list for all of them.</Muted>
          </View>
        )}

        {plan.map((e) => {
          const r = recipe(e.r)!;
          const m = info(r).macro;
          return (
            <View key={e.r} style={s.slot}>
              <View style={s.row}>
                <Pressable onPress={() => router.push(`/recipe/${r.id}`)} accessibilityLabel={`Open ${r.n}`}>
                  <Photo r={r} style={s.thumb} />
                </Pressable>
                <Pressable style={{ flex: 1 }} onPress={() => router.push(`/recipe/${r.id}`)}>
                  <Text style={[s.name, e.cooked && { color: C.muted }]}>{r.n}</Text>
                  <Muted>{e.cooked ? '✓ Cooked' : `${r.t} min${m ? ` · ${m.kcal} kcal` : ''}`}</Muted>
                </Pressable>
                <Pressable hitSlop={10} accessibilityLabel={`Remove ${r.n}`} onPress={() => { tap(); update(actions.removeMeal(r.id)); }}>
                  <Text style={s.x}>×</Text>
                </Pressable>
              </View>
              <View style={s.row}>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [s.cook, e.cooked && s.cookDone, pressed && { opacity: 0.85 }]}
                  onPress={() => { tap(); router.push(`/cook/${r.id}`); }}
                >
                  <Ionicons name="flame" size={16} color={e.cooked ? C.leaf : C.leafInk} />
                  <Text style={[s.cookText, e.cooked && { color: C.leaf }]}>{e.cooked ? 'Cook again' : 'Start cooking'}</Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Stepper value={e.s} label={servingsLabel(e.s)} onChange={(v) => update(actions.setServings(r.id, v))} />
              </View>
            </View>
          );
        })}

        {plan.length > 0 && <Button title={`See grocery list (${items} items)`} big onPress={() => router.navigate('/list')} />}

        {/* Adding meals: one clear green button, with "pick for me" as a quieter option. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add recipes"
          onPress={() => { tap(); router.navigate('/recipes'); }}
          style={({ pressed }) => [s.addBtn, plan.length > 0 && s.addBtnSoft, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="add" size={22} color={plan.length ? C.leaf : C.leafInk} />
          <Text style={[s.addBtnText, plan.length > 0 && { color: C.leaf }]}>{plan.length ? 'Add more recipes' : 'Add recipes'}</Text>
        </Pressable>
        <View style={s.pickRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pick ${state.pickN} meals for me`}
            onPress={pick}
            style={({ pressed }) => [s.pickBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="shuffle" size={18} color={C.leaf} />
            <Text style={s.pickBtnText}>{plan.length ? `Pick ${state.pickN} more for me` : `Or pick ${state.pickN} for me`}</Text>
          </Pressable>
          <Stepper value={state.pickN} label={String(state.pickN)} min={1} max={7} compact onChange={(v) => update((st) => ({ ...st, pickN: v }))} />
        </View>
        {macros.length > 0 && <Muted style={{ textAlign: 'center' }}>Average per serving: {avg('kcal')} kcal · {avg('prot')}g protein</Muted>}

        <View style={s.links}>
          {state.favs.length > 0 && <Button title={`♥ My favourites (${state.favs.length})`} kind="link" onPress={() => router.navigate('/recipes?cat=fav')} />}
          {plan.length > 0 && <Button title="Save this plan" kind="link" onPress={savePlan} />}
          {state.saved.length > 0 && <Button title={`Saved plans (${state.saved.length})`} kind="link" onPress={() => router.push('/saved')} />}
          {plan.length > 0 && <Button title="Clear all meals" kind="link" onPress={clearAll} />}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  main: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { gap: 12, padding: 16, backgroundColor: C.surface, borderRadius: 14 },
  emptyTitle: { fontFamily: F.display, fontSize: 17, color: C.ink },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12 },
  pickBtnText: { fontFamily: F.semibold, fontSize: 15, color: C.leaf },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.leaf, borderRadius: 12, paddingVertical: 14 },
  addBtnSoft: { backgroundColor: C.leafSoft },
  addBtnText: { fontFamily: F.semibold, fontSize: 16, color: C.leafInk },
  slot: { backgroundColor: C.surface, borderRadius: 14, padding: 12, gap: 10, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  name: { fontFamily: F.display, fontSize: 17, lineHeight: 21, color: C.ink },
  x: { fontSize: 24, color: C.muted, paddingHorizontal: 4 },
  cook: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.leaf, borderRadius: 99, paddingVertical: 9, paddingHorizontal: 16 },
  cookDone: { backgroundColor: C.leafSoft },
  cookText: { fontFamily: F.semibold, fontSize: 15, color: C.leafInk },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 8 },
});
