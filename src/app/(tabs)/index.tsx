import { router } from 'expo-router';
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
            <Muted style={{ textAlign: 'center' }}>Pick the meals you want to cook. We’ll build one grocery list for all of them.</Muted>
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

        <Button title="+ Add meals" kind={plan.length ? 'ghost' : 'primary'} big={!plan.length} onPress={() => router.navigate('/recipes')} />
        <View style={s.pick}>
          <Pressable
            accessibilityRole="button"
            style={{ flex: 1 }}
            onPress={() => { tap(); update((st) => actions.setPlan(pickForMe(st, st.pickN))(st)); }}
          >
            <Text style={s.pickTitle}>{plan.length ? 'Add' : 'Not sure? Pick'} {state.pickN} {state.pickN === 1 ? 'meal' : 'meals'} for me</Text>
            <Muted>A mix of different meals that share ingredients</Muted>
          </Pressable>
          <Stepper value={state.pickN} label={String(state.pickN)} min={1} max={7} compact onChange={(v) => update((st) => ({ ...st, pickN: v }))} />
        </View>
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
  empty: { alignItems: 'center', gap: 4, paddingVertical: 28, paddingHorizontal: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line, borderRadius: 14 },
  emptyTitle: { fontFamily: F.semibold, fontSize: 15, color: C.ink },
  slot: { backgroundColor: C.surface, borderRadius: 14, padding: 12, gap: 10, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  name: { fontFamily: F.display, fontSize: 17, lineHeight: 21, color: C.ink },
  x: { fontSize: 24, color: C.muted, paddingHorizontal: 4 },
  cook: { backgroundColor: C.leaf, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 16 },
  cookText: { fontFamily: F.semibold, fontSize: 13, color: C.leafInk },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.leafSoft, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  pickTitle: { fontFamily: F.semibold, fontSize: 15, color: C.leaf },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 8 },
});
