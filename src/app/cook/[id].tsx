// Cook mode: one big step at a time, with the ingredients each step needs and one-tap timers.
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { info, ingredientLine, recipe, stepIngredients, stepMinutes } from '../../lib/logic';
import { actions, useStore } from '../../lib/store';
import { Button, H3, Muted, T, tap } from '../../ui/kit';
import { C, F } from '../../ui/theme';

const clock = () => Date.now();
const beep = require('../../../assets/sounds/timer.wav');

export default function Cook() {
  useKeepAwake();
  const { id, s: sParam } = useLocalSearchParams<{ id: string; s?: string }>();
  const r = recipe(String(id));
  const { state, update } = useStore();
  const entry = state.plan.find((p) => p.r === id);
  const serv = Number(sParam) || entry?.s || state.hh;
  const units = state.prefs.units;
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [got, setGot] = useState<Record<number, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const rang = useRef(false);
  const player = useAudioPlayer(beep);

  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true }).catch(() => {}); }, []);
  useEffect(() => {
    if (!timerEnd) return;
    const t = setInterval(() => setNow(clock()), 500);
    return () => clearInterval(t);
  }, [timerEnd]);
  const left = timerEnd ? Math.max(0, Math.round((timerEnd - now) / 1000)) : 0;
  useEffect(() => {
    if (timerEnd && left === 0 && !rang.current) {
      rang.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Vibration.vibrate([0, 300, 150, 300]);
      try { player.seekTo(0); player.play(); } catch {}
    }
  }, [left, timerEnd, player]);

  if (!r) return <View style={{ padding: 24 }}><T>Recipe not found.</T></View>;
  const f = info(r);
  const total = r.s.length + 1; // step 0 is "gather your ingredients"
  const rating = i === total; // the screen after the last step
  const stars = state.reviews[r.id]?.stars || 0;

  const startTimer = (mins: number) => { tap(); rang.current = false; const t = clock(); setNow(t); setTimerEnd(t + mins * 60000); };
  const finish = () => {
    if (entry) update(actions.markCooked(r.id));
    setI(total);
  };

  // Leave cook mode at any step. Falls back to My meals if there's no screen to go back to.
  const exit = () => {
    tap();
    setTimerEnd(null);
    try { player.pause(); } catch {}
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  let body;
  if (i === 0) {
    body = (
      <>
        <Text style={s.stepNo}>Get ready · {serv} serving{serv > 1 ? 's' : ''}</Text>
        <Text style={[s.stepText, { fontSize: 24 }]}>Gather your ingredients</Text>
        <View>
          {r.i.map(([iid, q], k) => (
            <Pressable key={iid} accessibilityRole="checkbox" accessibilityState={{ checked: !!got[k] }} onPress={() => { tap(); setGot({ ...got, [k]: !got[k] }); }} style={s.ing}>
              <View style={[s.box, got[k] && s.boxOn]}>{got[k] && <Text style={s.tick}>✓</Text>}</View>
              <T style={[{ flex: 1 }, got[k] && { color: C.muted, textDecorationLine: 'line-through' }]}>{ingredientLine(iid, q, serv, units)}</T>
            </Pressable>
          ))}
        </View>
      </>
    );
  } else if (rating) {
    body = (
      <>
        <Text style={s.stepNo}>Done</Text>
        <Text style={s.stepText}>Enjoy your meal! How was it?</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} hitSlop={4} accessibilityLabel={`${n} stars`} onPress={() => { tap(); update(actions.rate(r.id, n)); }}>
              <Text style={[s.star, n <= stars && { color: C.star }]}>★</Text>
            </Pressable>
          ))}
        </View>
        <Button
          title={state.favs.includes(r.id) ? '♥  In your favourites' : '♡  Add to favourites'}
          kind="ghost"
          onPress={() => update(actions.toggleFav(r.id))}
        />
        <Muted>Favourites are easy to find again under “My favourites” in Recipes.</Muted>
        {entry && <Muted>Marked as cooked, so it’s off your grocery list.</Muted>}
      </>
    );
  } else {
    const st = r.s[i - 1];
    const used = stepIngredients(r, st, serv, units);
    const mins = stepMinutes(st);
    body = (
      <>
        <Text style={s.stepNo}>Step {i} of {r.s.length}</Text>
        <Text style={s.stepText}>{st}</Text>
        {used.length > 0 && <View style={s.chips}>{used.map((u) => <Text key={u} style={s.chip}>{u}</Text>)}</View>}
        {mins > 0 && <Pressable style={s.timerBtn} onPress={() => startTimer(mins)}><Text style={s.timerBtnText}>⏱  Start {mins} min timer</Text></Pressable>}
        {i === r.s.length && !!f.tip && <View style={s.tip}><T><Text style={{ fontFamily: F.semibold, color: C.leaf }}>Tip: </Text>{f.tip}</T></View>}
        <Pressable onPress={() => setShowAll(!showAll)}><Muted>{showAll ? '▾' : '▸'} All ingredients</Muted></Pressable>
        {showAll && r.i.map(([iid, q]) => <Muted key={iid}>• {ingredientLine(iid, q, serv, units)}</Muted>)}
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={s.bar}>
        <View style={{ flex: 1 }}>
          <Muted>Cooking</Muted>
          <H3 numberOfLines={1}>{r.n}</H3>
        </View>
        {timerEnd !== null && (
          <Pressable accessibilityLabel="Stop timer" onPress={() => { setTimerEnd(null); player.pause(); }} style={[s.timer, left === 0 && { backgroundColor: C.warn }]}>
            <Text style={[s.timerText, left === 0 && { color: '#fff' }]}>
              {left ? `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : "⏱ Time's up"}
            </Text>
          </Pressable>
        )}
        <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Exit cooking" onPress={exit} style={s.exit}>
          <Text style={s.exitText}>✕  Exit</Text>
        </Pressable>
      </View>
      <View style={s.prog}>{Array.from({ length: total }, (_, k) => <View key={k} style={[s.progBar, k <= i && { backgroundColor: C.leaf }]} />)}</View>
      <ScrollView contentContainerStyle={s.body}>{body}</ScrollView>
      <View style={[s.nav, { paddingBottom: 12 + insets.bottom }]}>
        {rating ? (
          <Button title="Close" big style={{ flex: 1 }} onPress={exit} />
        ) : (
          <>
            {i > 0 && <Button title="Back" kind="ghost" big style={{ flex: 1 }} onPress={() => setI(i - 1)} />}
            <Button
              title={i === 0 ? 'Start cooking' : i === total - 1 ? 'Done, enjoy!' : 'Next step'}
              big
              style={{ flex: 1 }}
              onPress={() => (i === total - 1 ? finish() : setI(i + 1))}
            />
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  exit: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  exitText: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
  timer: { backgroundColor: C.leafSoft, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 },
  timerText: { fontFamily: F.semibold, color: C.leaf, fontVariant: ['tabular-nums'] },
  prog: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 10 },
  progBar: { flex: 1, height: 4, borderRadius: 9, backgroundColor: C.line },
  body: { padding: 16, paddingTop: 24, gap: 16 },
  stepNo: { fontFamily: F.semibold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: C.leaf },
  stepText: { fontFamily: F.display, fontSize: 26, lineHeight: 34, color: C.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { fontFamily: F.body, fontSize: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10, overflow: 'hidden', color: C.ink },
  timerBtn: { alignSelf: 'flex-start', backgroundColor: C.leafSoft, borderRadius: 99, paddingVertical: 10, paddingHorizontal: 16 },
  timerBtnText: { fontFamily: F.semibold, color: C.leaf, fontSize: 15 },
  tip: { backgroundColor: C.leafSoft, borderRadius: 12, padding: 12 },
  ing: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#B7C4BC', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: C.leaf, borderColor: C.leaf },
  tick: { color: '#fff', fontSize: 14, fontFamily: F.semibold, lineHeight: 16 },
  star: { fontSize: 40, color: C.line },
  nav: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line },
});
