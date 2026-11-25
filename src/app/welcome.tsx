// First-time guide: three short screens that show how the app works, in order.
// Also reachable later from "How it works" on My meals.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';
import { Button, tap } from '../ui/kit';
import { C, F } from '../ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const STEPS: { icon: IconName; title: string; text: string; hint: string }[] = [
  {
    icon: 'restaurant',
    title: 'Pick a few meals',
    text: 'Choose the meals you want to cook this week from Recipes, or tap “Pick for me” and we’ll choose a varied mix.',
    hint: 'No days or meal slots. Just a short list of meals.',
  },
  {
    icon: 'cart',
    title: 'Get one grocery list',
    text: 'We add up the ingredients for all your meals into one list, sorted by aisle. Tick things off as you shop.',
    hint: 'Already have salt or oil at home? Mark it and it stays off the list.',
  },
  {
    icon: 'flame',
    title: 'Cook step by step',
    text: 'Tap “Cook” on a meal for big, one-at-a-time steps with built-in timers. Your screen stays on while you cook.',
    hint: 'You can tap Exit at any time to leave cooking mode.',
  },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { update } = useStore();
  const [i, setI] = useState(0);
  const st = STEPS[i];
  const last = i === STEPS.length - 1;
  const done = () => {
    update((s) => ({ ...s, intro: true }));
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <View style={s.top}>
        <Text style={s.brand}>Fork<Text style={{ color: C.leaf }}>cast</Text></Text>
        {!last && (
          <Pressable hitSlop={12} accessibilityRole="button" onPress={done}>
            <Text style={s.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View style={s.center}>
        <Text style={s.kicker}>Step {i + 1} of {STEPS.length}</Text>
        <View style={s.badge}><Ionicons name={st.icon} size={56} color={C.leaf} /></View>
        <Text style={s.title}>{st.title}</Text>
        <Text style={s.text}>{st.text}</Text>
        <Text style={s.hint}>{st.hint}</Text>
      </View>

      {/* The full sequence, so it's clear where this step fits. */}
      <View style={s.flow}>
        {STEPS.map((x, k) => (
          <Pressable key={x.title} style={s.flowItem} onPress={() => { tap(); setI(k); }} accessibilityLabel={`Step ${k + 1}: ${x.title}`}>
            <View style={[s.flowDot, k <= i && s.flowDotOn]}>
              <Text style={[s.flowNum, k <= i && { color: C.leafInk }]}>{k + 1}</Text>
            </View>
            <Text style={[s.flowLabel, k === i && { color: C.ink, fontFamily: F.semibold }]} numberOfLines={2}>{x.title}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.nav}>
        {i > 0 && <Button title="Back" kind="ghost" big style={{ flex: 1 }} onPress={() => setI(i - 1)} />}
        <Button title={last ? 'Get started' : 'Next'} big style={{ flex: 2 }} onPress={() => (last ? done() : setI(i + 1))} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: F.displayBold, fontSize: 24, color: C.ink, letterSpacing: -0.4 },
  skip: { fontFamily: F.semibold, fontSize: 15, color: C.muted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 8 },
  kicker: { fontFamily: F.semibold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: C.leaf },
  badge: { width: 120, height: 120, borderRadius: 60, backgroundColor: C.leafSoft, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  title: { fontFamily: F.displayBold, fontSize: 28, color: C.ink, textAlign: 'center' },
  text: { fontFamily: F.body, fontSize: 17, lineHeight: 25, color: C.ink, textAlign: 'center' },
  hint: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.muted, textAlign: 'center' },
  flow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  flowItem: { flex: 1, alignItems: 'center', gap: 6 },
  flowDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  flowDotOn: { backgroundColor: C.leaf, borderColor: C.leaf },
  flowNum: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
  flowLabel: { fontFamily: F.body, fontSize: 12, color: C.muted, textAlign: 'center' },
  nav: { flexDirection: 'row', gap: 10 },
});
