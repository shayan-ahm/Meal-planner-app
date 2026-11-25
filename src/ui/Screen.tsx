import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from './theme';

/** Top bar used on every tab: the app name and a shortcut to Preferences. */
export function TopBar({ children }: { children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.top, { paddingTop: insets.top + 10 }]}>
      <View style={s.row}>
        <Text style={s.brand} accessibilityRole="header">Fork<Text style={{ color: C.leaf }}>cast</Text></Text>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="How it works" onPress={() => router.push('/welcome')} style={[s.help, { marginRight: 8 }]}>
          <Text style={s.helpText}>? How it works</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Preferences" onPress={() => router.push('/preferences')} style={s.prefs}>
          <Ionicons name="options" size={16} color={C.leafInk} />
          <Text style={s.prefsText}>Preferences</Text>
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
  help: { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 11 },
  helpText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  prefs: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.leaf, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 12 },
  prefsText: { fontFamily: F.semibold, fontSize: 13, color: C.leafInk },
});
