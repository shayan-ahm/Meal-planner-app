import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVOID } from '../../data/recipes';
import { info, ingredientLine, recipe } from '../../lib/logic';
import { actions, useStore } from '../../lib/store';
import { Button, H2, H3, Label, Muted, Photo, Stepper, T, Tag, servingsLabel, tap } from '../../ui/kit';
import { C, F } from '../../ui/theme';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = recipe(String(id));
  const { state, update } = useStore();
  const entry = state.plan.find((p) => p.r === id);
  const [serv, setServ] = useState(entry?.s ?? state.hh);
  const [note, setNote] = useState('');
  const insets = useSafeAreaInsets();
  if (!r) return <View style={{ padding: 24 }}><T>Recipe not found.</T></View>;

  const f = info(r);
  const allergens = AVOID.filter(([k, , kind]) => kind === 'a' && f.avoids.has(k)).map(([, l]) => l);
  const rv = state.reviews[r.id];
  const stars = rv?.stars || 0;
  const m = f.macro;
  const fav = state.favs.includes(r.id);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={[s.main, { paddingBottom: 120 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <View style={s.head}>
          <H2 style={{ flex: 1 }}>{r.n}</H2>
          <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel={fav ? 'Remove from favourites' : 'Add to favourites'} onPress={() => { tap(); update(actions.toggleFav(r.id)); }} style={[s.fav, fav && s.favOn]}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? C.warn : C.ink} />
            <Text style={s.favText}>{fav ? 'Saved' : 'Favourite'}</Text>
          </Pressable>
          <Pressable hitSlop={12} accessibilityLabel="Close" onPress={() => router.back()}><Text style={s.x}>×</Text></Pressable>
        </View>
        <Photo r={r} style={s.hero} />
        {!!f.about && <T>{f.about}</T>}

        <View style={s.facts}>
          <View style={s.fact}><Label>Time</Label><Text style={s.factVal}>{r.t} min</Text></View>
          <View style={s.fact}><Label>Calories</Label><Text style={s.factVal}>{m ? m.kcal : '–'}</Text></View>
          <View style={s.fact}><Label>Uses</Label><Text style={s.factVal}>{f.eq.join(', ')}</Text></View>
        </View>

        <View style={s.tags}>
          {f.meals.map((x) => <Tag key={x} label={x} alt />)}
          {f.labels.map((l) => <Tag key={l} label={l} />)}
        </View>
        {allergens.length > 0 && <Muted>Contains: {allergens.join(', ')}</Muted>}

        <View style={s.head}>
          <H3 style={{ flex: 1 }}>Ingredients</H3>
          <Stepper value={serv} label={servingsLabel(serv)} onChange={setServ} />
        </View>
        <View style={{ gap: 6 }}>
          {r.i.map(([iid, q]) => <T key={iid}>•  {ingredientLine(iid, q, serv, state.prefs.units)}</T>)}
        </View>

        <H3>Steps</H3>
        <View style={{ gap: 10 }}>
          {r.s.map((st, k) => (
            <View key={k} style={s.step}>
              <Text style={s.stepNo}>{k + 1}</Text>
              <T style={{ flex: 1 }}>{st}</T>
            </View>
          ))}
        </View>
        {!!f.tip && <View style={s.tip}><T><Text style={{ fontFamily: F.semibold, color: C.leaf }}>Tip: </Text>{f.tip}</T></View>}

        <H3>Nutrition per serving</H3>
        {m ? (
          <View style={s.nut}>
            {([['kcal', m.kcal], ['protein', m.prot + 'g'], ['carbs', m.carb + 'g'], ['fat', m.fat + 'g']] as const).map(([l, v]) => (
              <View key={l} style={s.nutCell}><Text style={s.nutVal}>{v}</Text><Muted>{l}</Muted></View>
            ))}
          </View>
        ) : <Muted>Nutrition isn’t available for this recipe yet.</Muted>}
        <Muted style={{ fontSize: 11 }}>Estimates from typical ingredient values.</Muted>

        <H3>Your rating</H3>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} hitSlop={4} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} onPress={() => { tap(); update(actions.rate(r.id, n === stars ? 0 : n)); }}>
              <Text style={[s.star, n <= stars && { color: C.star }]}>★</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note, like “less salt next time”"
            placeholderTextColor={C.muted}
            style={s.input}
            onSubmitEditing={() => { if (note.trim()) { update(actions.addNote(r.id, note.trim())); setNote(''); } }}
          />
          <Button title="Save" kind="ghost" onPress={() => { if (note.trim()) { update(actions.addNote(r.id, note.trim())); setNote(''); } }} />
        </View>
        {rv?.notes.map((n) => (
          <View key={n.at} style={s.note}>
            <T>{n.t}</T>
            <Muted style={{ fontSize: 11 }}>{new Date(n.at).toLocaleDateString()}</Muted>
          </View>
        ))}
      </ScrollView>

      <View style={[s.cta, { paddingBottom: 12 + insets.bottom }]}>
        <Button title="Cook now" kind="ghost" style={{ flex: 1 }} onPress={() => router.replace(`/cook/${r.id}?s=${serv}`)} />
        {entry && entry.s === serv ? (
          <Button title="Remove from my meals" kind="ghost" style={{ flex: 1.4 }} onPress={() => update(actions.removeMeal(r.id))} />
        ) : (
          <Button title={entry ? 'Update servings' : 'Add to my meals'} style={{ flex: 1.4 }} onPress={() => { update(actions.addMeal(r.id, serv)); router.back(); }} />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  main: { padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  x: { fontSize: 30, color: C.muted, lineHeight: 32 },
  fav: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 10 },
  favOn: { borderColor: '#F3C1C1', backgroundColor: '#FDECEC' },
  favText: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
  hero: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: C.leafSoft },
  facts: { flexDirection: 'row', gap: 8 },
  fact: { flex: 1, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, gap: 2 },
  factVal: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  step: { flexDirection: 'row', gap: 10 },
  stepNo: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.leafSoft, color: C.leaf, textAlign: 'center', lineHeight: 24, fontFamily: F.semibold, fontSize: 13, overflow: 'hidden' },
  tip: { backgroundColor: C.leafSoft, borderRadius: 12, padding: 12 },
  nut: { flexDirection: 'row', gap: 6 },
  nutCell: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 8, alignItems: 'center' },
  nutVal: { fontFamily: F.display, fontSize: 18, color: C.ink },
  star: { fontSize: 32, color: C.line },
  input: { flex: 1, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, fontFamily: F.body, fontSize: 14, color: C.ink },
  note: { backgroundColor: C.surface, borderRadius: 12, padding: 10, gap: 2 },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line },
});
