import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { recipe } from '../lib/logic';
import { actions, useStore } from '../lib/store';
import { Button, H3, Muted, Photo } from '../ui/kit';
import { C, shadow } from '../ui/theme';

export default function SavedPlans() {
  const { state, update } = useStore();

  const use = (id: string, name: string) => {
    const go = () => { update(actions.loadSaved(id)); router.back(); };
    if (!state.plan.length) return go();
    Alert.alert(`Use “${name}”?`, 'This replaces the meals in your current plan.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Use this plan', onPress: go },
    ]);
  };

  const remove = (id: string, name: string) =>
    Alert.alert(`Delete “${name}”?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => update(actions.deleteSaved(id)) },
    ]);

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {!state.saved.length && <Muted>No saved plans yet. On My meals, tap “Save this plan” to keep a set of meals you like.</Muted>}
      {state.saved.map((sp) => {
        const rs = sp.plan.map((p) => recipe(p.r)).filter(Boolean);
        return (
          <View key={sp.id} style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <H3>{sp.name}</H3>
                <Muted>{rs.length} meals · saved {new Date(sp.at).toLocaleDateString()}</Muted>
              </View>
              <Pressable hitSlop={10} accessibilityLabel={`Delete ${sp.name}`} onPress={() => remove(sp.id, sp.name)}>
                <Text style={{ fontSize: 24, color: C.muted }}>×</Text>
              </Pressable>
            </View>
            <View style={s.thumbs}>{rs.slice(0, 6).map((r) => <Photo key={r!.id} r={r!} style={s.thumb} />)}</View>
            <Muted numberOfLines={2}>{rs.map((r) => r!.n).join(' · ')}</Muted>
            <Button title="Use this plan" onPress={() => use(sp.id, sp.name)} />
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 14, padding: 12, gap: 8, ...shadow },
  thumbs: { flexDirection: 'row', gap: 6 },
  thumb: { width: 44, height: 44, borderRadius: 10 },
});
