import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { listAsText, listModel, qtyText, subsFor, type ListRow } from '../../lib/logic';
import { actions, useStore } from '../../lib/store';
import { Button, Chip, H2, Label, Muted, tap } from '../../ui/kit';
import { TopBar } from '../../ui/Screen';
import { C, F } from '../../ui/theme';

function Check({ on }: { on: boolean }) {
  return <View style={[s.box, on && s.boxOn]}>{on && <Text style={s.tick}>✓</Text>}</View>;
}

export default function GroceryList() {
  const { state, update } = useStore();
  const [extra, setExtra] = useState('');
  const m = listModel(state);
  const units = state.prefs.units;
  const empty = !m.aisles.length && !m.staples.length && !state.extras.length;

  const addExtra = () => {
    const t = extra.trim();
    if (!t) return;
    update(actions.addExtra(t));
    setExtra('');
  };

  const share = async () => {
    const text = listAsText(state);
    try {
      await Share.share({ message: text });
    } catch {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Your list is copied. Paste it anywhere.');
    }
  };

  const item = (r: ListRow) => {
    const done = !!state.checks[r.id] || state.have[r.id] === true;
    const sub = !done ? subsFor(r.id, state.prefs.avoid) : '';
    return (
      <Pressable
        key={r.id}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        onPress={() => { tap(); update(actions.toggleCheck(r.id)); }}
        style={[s.item, done && { opacity: 0.6 }]}
      >
        <Check on={done} />
        <View style={{ flex: 1 }}>
          <View style={s.nm}>
            <Text style={[s.name, done && s.struck]}>{r.g.name}</Text>
            <Text style={s.q}>{qtyText(r.g, r.q, units)}</Text>
          </View>
          {!!sub && <Text style={s.sub}>Or: {sub}</Text>}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar />
      <ScrollView contentContainerStyle={s.main} keyboardShouldPersistTaps="handled">
        {empty ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Your list is empty</Text>
            <Muted style={{ textAlign: 'center' }}>It builds itself from your meals. Add a few meals first.</Muted>
            <Button title="Choose meals" onPress={() => router.navigate('/recipes')} style={{ marginTop: 10, alignSelf: 'stretch' }} />
          </View>
        ) : (
          <View style={{ gap: 2 }}>
            <H2>{m.toGet ? `${m.toGet} to get` : 'All done 🎉'}</H2>
            <Muted>For {state.plan.filter((p) => !p.cooked).length} meals. Tap items as you shop, or if you already have them.</Muted>
          </View>
        )}

        {m.leftoverTip && (
          <View style={s.tip}>
            <Text style={s.tipText}>
              You’ll have <Text style={s.b}>{qtyText(m.leftoverTip.row.g, m.leftoverTip.row.left, units)} {m.leftoverTip.row.g.name.split(',')[0].toLowerCase()}</Text> left over.{' '}
              <Text style={s.b}>{m.leftoverTip.recipe.n}</Text> uses it up.
            </Text>
            <Button title="Add it" kind="link" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => update(actions.addMeal(m.leftoverTip!.recipe.id, state.hh))} />
          </View>
        )}

        {m.aisles.map((a) => (
          <View key={a.aisle} style={s.aisle}>
            <Label style={s.aisleTitle}>{a.aisle}</Label>
            {a.rows.map(item)}
          </View>
        ))}

        {state.extras.length > 0 && (
          <View style={s.aisle}>
            <Label style={s.aisleTitle}>Other</Label>
            {state.extras.map((x, i) => (
              <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: !!x.done }} onPress={() => { tap(); update(actions.toggleExtra(i)); }} style={[s.item, x.done && { opacity: 0.6 }]}>
                <Check on={!!x.done} />
                <Text style={[s.name, { flex: 1 }, x.done && s.struck]}>{x.name}</Text>
                <Pressable hitSlop={10} accessibilityLabel={`Remove ${x.name}`} onPress={() => update(actions.removeExtra(i))}>
                  <Text style={{ fontSize: 22, color: C.muted }}>×</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}

        {m.staples.length > 0 && (
          <View style={s.aisle}>
            <Label style={s.aisleTitle}>Probably in your pantry</Label>
            {m.staples.map((r) => {
              const out = state.have[r.id] === false;
              const got = out && !!state.checks[r.id];
              return (
                <Pressable key={r.id} disabled={!out} onPress={() => { tap(); update(actions.toggleCheck(r.id)); }} style={[s.item, got && { opacity: 0.6 }]}>
                  {out && <Check on={got} />}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.name, got && s.struck]}>{r.g.name}</Text>
                    <Text style={s.q}>{qtyText(r.g, r.q, units)}</Text>
                  </View>
                  <Chip label={out ? 'On list' : "I'm out"} on={out} onPress={() => update(actions.toggleOut(r.id))} />
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={s.addRow}>
          <TextInput
            value={extra}
            onChangeText={setExtra}
            onSubmitEditing={addExtra}
            placeholder="Add something else…"
            placeholderTextColor={C.muted}
            returnKeyType="done"
            style={s.input}
            accessibilityLabel="Add item"
          />
          <Button title="Add" onPress={addExtra} style={{ paddingHorizontal: 18 }} />
        </View>

        {!empty && (
          <View style={s.btns}>
            <Button title="Share list" kind="ghost" style={{ flex: 1 }} onPress={share} />
            <Button title="Uncheck all" kind="ghost" style={{ flex: 1 }} onPress={() => update(actions.uncheckAll())} />
          </View>
        )}
        {state.plan.some((p) => !p.cooked) && <Button title="Done shopping? Start cooking →" onPress={() => router.navigate('/')} />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  main: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', gap: 4, paddingVertical: 28, paddingHorizontal: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line, borderRadius: 14 },
  emptyTitle: { fontFamily: F.semibold, fontSize: 15, color: C.ink },
  tip: { backgroundColor: C.leafSoft, borderRadius: 12, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 2 },
  tipText: { fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.ink },
  b: { fontFamily: F.semibold },
  aisle: { gap: 3 },
  aisleTitle: { fontSize: 12, paddingTop: 8, paddingBottom: 4, paddingHorizontal: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#B7C4BC', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  boxOn: { backgroundColor: C.leaf, borderColor: C.leaf },
  tick: { color: '#fff', fontSize: 14, fontFamily: F.semibold, lineHeight: 16 },
  nm: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { fontFamily: F.medium, fontSize: 15, color: C.ink, flexShrink: 1 },
  struck: { textDecorationLine: 'line-through', color: C.muted },
  q: { fontFamily: F.body, fontSize: 13, color: C.muted, marginLeft: 'auto' },
  sub: { fontFamily: F.body, fontSize: 12.5, lineHeight: 17, color: C.muted, marginTop: 2 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: { flex: 1, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, fontFamily: F.body, fontSize: 15, color: C.ink },
  btns: { flexDirection: 'row', gap: 8 },
});
