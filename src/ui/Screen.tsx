import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';
import { C, F } from './theme';

/** Top bar used on every tab: the app name and a shortcut to Preferences. */
export function TopBar({ children }: { children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  return (
    <View style={[s.top, { paddingTop: insets.top + 10 }]}>
      <View style={s.row}>
        <Text style={s.brand} accessibilityRole="header">Fork<Text style={{ color: C.leaf }}>cast</Text></Text>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="How it works" onPress={() => router.push('/welcome')} style={[s.prefs, { marginRight: 8 }]}>
          <Text style={s.prefsText}>? How it works</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Preferences" onPress={() => router.push('/preferences')} style={s.prefs}>
          <Text style={s.prefsText}>⚙ <Text style={{ fontFamily: F.semibold }}>{state.hh}</Text> ppl</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  top: { backgroundColor: C.bg, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: F.displayBold, fontSize: 24, color: C.ink, letterSpacing: -0.4 },
  prefs: { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 },
  prefsText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
});
