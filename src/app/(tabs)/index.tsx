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
            <Text style={s.emptyTitle}>How it works</Text>
            {[
              ['restaurant-outline', 'Pick a few meals', 'Tap “Add recipes” below, or let us pick for you.'],
              ['cart-outline', 'Get one grocery list', 'Everything you need, in one list.'],
              ['flame-outline', 'Cook step by step', 'Big steps and timers. Tap Exit any time.'],
            ].map(([icon, t, d], k) => (
              <View key={t} style={s.how}>
                <View style={s.howNum}><Text style={s.howNumText}>{k + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.howTitle}>{t}</Text>
                  <Muted>{d}</Muted>
                </View>
                <Ionicons name={icon as 'cart-outline'} size={22} color={C.leaf} />
              </View>
            ))}
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
                <Pressable style={s.cook} onPress={() => { tap(); router.push(`/cook/${r.id}`); }}>
                  <Text style={s.cookText}>{e.cooked ? 'Cook again' : 'Cook'}</Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Stepper value={e.s} label={servingsLabel(e.s)} onChange={(v) => update(actions.setServings(r.id, v))} />
              </View>
            </View>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add recipes"
          onPress={() => { tap(); router.navigate('/recipes'); }}
          style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        >
          <Ionicons name="add-circle" size={26} color={C.leafInk} />
          <Text style={s.addBtnText}>Add recipes</Text>
        </Pressable>
        <View style={s.pickRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pick ${state.pickN} meals for me`}
            onPress={pick}
            style={({ pressed }) => [s.pickBtn, s.pickBtnSoft, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          >
            <Ionicons name="shuffle" size={20} color={C.leaf} />
            <Text style={[s.pickBtnText, { color: C.leaf }]}>{plan.length ? `Pick ${state.pickN} more for me` : `Pick ${state.pickN} meals for me`}</Text>
          </Pressable>
          <Stepper value={state.pickN} label={String(state.pickN)} min={1} max={7} compact onChange={(v) => update((st) => ({ ...st, pickN: v }))} />
        </View>
        <Muted style={{ textAlign: 'center', marginTop: -4 }}>A varied mix that shares ingredients. Use − and + to choose how many.</Muted>
        {state.favs.length > 0 && (
          <Button title={`♥  Pick from my favourites (${state.favs.length})`} kind="ghost" onPress={() => router.navigate('/recipes?cat=fav')} />
        )}
        {plan.length > 0 && <Button title={`See grocery list (${items} items)`} big onPress={() => router.navigate('/list')} />}
        {macros.length > 0 && <Muted style={{ textAlign: 'center' }}>Average per serving: {avg('kcal')} kcal · {avg('prot')}g protein</Muted>}

        <View style={s.links}>
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
  how: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.leaf, alignItems: 'center', justifyContent: 'center' },
  howNumText: { fontFamily: F.semibold, fontSize: 13, color: C.leafInk },
  howTitle: { fontFamily: F.semibold, fontSize: 15, color: C.ink },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.leaf, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.leaf, borderRadius: 14, paddingVertical: 18, ...shadow },
  addBtnText: { fontFamily: F.displayBold, fontSize: 19, color: C.leafInk },
  pickBtnSoft: { backgroundColor: C.leafSoft, borderWidth: 1.5, borderColor: C.leaf, shadowOpacity: 0, elevation: 0 },
  pickBtnText: { fontFamily: F.semibold, fontSize: 15, color: C.leafInk },
  slot: { backgroundColor: C.surface, borderRadius: 14, padding: 12, gap: 10, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  name: { fontFamily: F.display, fontSize: 17, lineHeight: 21, color: C.ink },
  x: { fontSize: 24, color: C.muted, paddingHorizontal: 4 },
  cook: { backgroundColor: C.leaf, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 16 },
  cookText: { fontFamily: F.semibold, fontSize: 13, color: C.leafInk },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 8 },
});
