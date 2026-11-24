import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVOID, CUISINES, EQUIPMENT } from '../data/recipes';
import { defaultPrefs } from '../lib/logic';
import { useStore } from '../lib/store';
import type { Prefs } from '../lib/types';
import { Button, Chip, H3, Muted, Stepper, T } from '../ui/kit';
import { C } from '../ui/theme';

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={s.sec}>
      <H3>{title}</H3>
      {!!hint && <Muted>{hint}</Muted>}
      <View style={s.chips}>{children}</View>
    </View>
  );
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function Preferences() {
  const { state, update } = useStore();
  const [P, setP] = useState<Prefs>(state.prefs);
  const [hh, setHh] = useState(state.hh);
  const [applyAll, setApplyAll] = useState(false);
  const insets = useSafeAreaInsets();
  const set = (patch: Partial<Prefs>) => setP({ ...P, ...patch });
  const radio = <K extends keyof Prefs>(key: K, opts: [Prefs[K], string][]) =>
    opts.map(([v, l]) => <Chip key={String(v)} label={l} on={P[key] === v} onPress={() => set({ [key]: v } as Partial<Prefs>)} />);

  const save = () => {
    update((st) => ({ ...st, prefs: P, hh, plan: applyAll ? st.plan.map((p) => ({ ...p, s: hh })) : st.plan }));
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom }}>
        <Muted>We only suggest recipes that fit. Everything is optional.</Muted>

        <View style={s.sec}>
          <H3>People</H3>
          <View style={s.row}>
            <Stepper value={hh} label={`${hh} ${hh === 1 ? 'person' : 'people'}`} onChange={setHh} />
          </View>
          <View style={s.row}>
            <Switch value={applyAll} onValueChange={setApplyAll} trackColor={{ true: C.leaf, false: C.line }} />
            <T style={{ flex: 1 }}>Update meals I already added</T>
          </View>
        </View>

        <Section title="Units" hint="For meat, fish and produce weights.">
          {radio('units', [['metric', 'Metric (kg, g)'], ['imperial', 'Imperial (lb, oz)']])}
        </Section>
        <Section title="Diet">
          {radio('diet', [['any', 'Anything'], ['flexitarian', 'No red meat'], ['pescatarian', 'Pescatarian'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan']])}
        </Section>
        <Section title="Allergies" hint="Recipes with these are always hidden.">
          {AVOID.filter((x) => x[2] === 'a').map(([k, l]) => <Chip key={k} label={l} on={P.avoid.includes(k)} onPress={() => set({ avoid: toggle(P.avoid, k) })} />)}
        </Section>
        <Section title="Foods I don't eat">
          {AVOID.filter((x) => x[2] === 'd').map(([k, l]) => <Chip key={k} label={l} on={P.avoid.includes(k)} onPress={() => set({ avoid: toggle(P.avoid, k) })} />)}
        </Section>
        <Section title="Nutrition goals" hint="Per serving.">
          {([['hp', 'High protein (30g+)'], ['loC', 'Low carb (25g or less)'], ['keto', 'Keto (15g carbs or less)'], ['loF', 'Low fat (15g or less)']] as const).map(([k, l]) => (
            <Chip key={k} label={l} on={P.goals.includes(k)} onPress={() => set({ goals: toggle(P.goals, k) })} />
          ))}
        </Section>
        <Section title="Calories per serving">
          {radio('maxCal', [0, 400, 500, 600, 750].map((v) => [v, v ? `Up to ${v}` : 'Any'] as [number, string]))}
        </Section>
        <Section title="Time to cook">
          {radio('maxT', [0, 20, 30, 45].map((v) => [v, v ? `Up to ${v} min` : 'Any'] as [number, string]))}
        </Section>
        <Section title="Keep it simple" hint="Number of ingredients to buy (pantry basics not counted).">
          {radio('maxIng', [0, 5, 7].map((v) => [v, v ? `${v} or fewer` : 'Any'] as [number, string]))}
        </Section>
        <Section title="My kitchen has">
          {EQUIPMENT.map((e) => <Chip key={e} label={e} on={P.eq.includes(e)} onPress={() => set({ eq: toggle(P.eq, e) })} />)}
        </Section>
        <Section title="Favourite cuisines" hint="Shown first.">
          {CUISINES.map((c) => <Chip key={c} label={c} on={P.cui.includes(c)} onPress={() => set({ cui: toggle(P.cui, c) })} />)}
        </Section>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <Button title="Reset" kind="ghost" style={{ flex: 1 }} onPress={() => { setP(defaultPrefs()); setHh(2); }} />
        <Button title="Save" style={{ flex: 2 }} onPress={save} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sec: { gap: 8, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line },
});
