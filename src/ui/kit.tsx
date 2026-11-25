// Small building blocks shared by every screen.
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { PHOTOS } from '../data/photos';
import type { Recipe } from '../lib/types';
import { C, F } from './theme';

export const tap = () => { Haptics.selectionAsync().catch(() => {}); };

type TProps = TextProps & { style?: StyleProp<TextStyle>; children?: ReactNode };
export const T = ({ style, ...p }: TProps) => <Text {...p} style={[s.body, style]} />;
export const H1 = ({ style, ...p }: TProps) => <Text {...p} accessibilityRole="header" style={[s.h1, style]} />;
export const H2 = ({ style, ...p }: TProps) => <Text {...p} accessibilityRole="header" style={[s.h2, style]} />;
export const H3 = ({ style, ...p }: TProps) => <Text {...p} accessibilityRole="header" style={[s.h3, style]} />;
export const Muted = ({ style, ...p }: TProps) => <Text {...p} style={[s.body, s.muted, style]} />;
export const Label = ({ style, ...p }: TProps) => <Text {...p} style={[s.label, style]} />;

type BtnProps = {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'link';
  big?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
};
export function Button({ title, onPress, kind = 'primary', big, style, disabled, accessibilityLabel }: BtnProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [
        s.btn,
        kind === 'ghost' && s.btnGhost,
        kind === 'link' && s.btnLink,
        big && s.btnBig,
        (pressed || disabled) && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[s.btnText, kind !== 'primary' && { color: kind === 'link' ? C.leaf : C.ink }, big && { fontSize: 16 }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, style }: { label: string; on?: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={() => { tap(); onPress(); }}
      style={[s.chip, on && s.chipOn, style]}
    >
      <Text style={[s.chipText, on && { color: C.leafInk }]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({ value, label, onChange, min = 1, max = 12, compact }: { value: number; label: string; onChange: (v: number) => void; min?: number; max?: number; compact?: boolean }) {
  return (
    <View style={s.stepper}>
      <Pressable accessibilityLabel="Fewer" hitSlop={6} style={s.stepBtn} onPress={() => { tap(); onChange(Math.max(min, value - 1)); }}>
        <Text style={s.stepSign}>−</Text>
      </Pressable>
      <Text style={[s.stepText, compact && { minWidth: 26 }]}>{label}</Text>
      <Pressable accessibilityLabel="More" hitSlop={6} style={s.stepBtn} onPress={() => { tap(); onChange(Math.min(max, value + 1)); }}>
        <Text style={s.stepSign}>+</Text>
      </Pressable>
    </View>
  );
}

export function Tag({ label, alt }: { label: string; alt?: boolean }) {
  return <Text style={[s.tag, alt && { backgroundColor: '#FFF4D6' }]}>{label}</Text>;
}

export function Photo({ r, style }: { r: Recipe; style: StyleProp<any> }) {
  const src = PHOTOS[r.id];
  if (!src) return <View style={[style, { backgroundColor: r.c || C.leafSoft }]} />;
  return <Image source={src} style={style} contentFit="cover" transition={150} accessibilityLabel={r.n} />;
}

export const servingsLabel = (n: number) => `${n} serving${n === 1 ? '' : 's'}`;

const s = StyleSheet.create({
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.ink },
  muted: { color: C.muted, fontSize: 13, lineHeight: 18 },
  h1: { fontFamily: F.displayBold, fontSize: 26, color: C.ink, letterSpacing: -0.4 },
  h2: { fontFamily: F.display, fontSize: 20, lineHeight: 25, color: C.ink },
  h3: { fontFamily: F.display, fontSize: 16, lineHeight: 21, color: C.ink },
  label: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: C.muted },
  btn: { backgroundColor: C.leaf, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  btnLink: { backgroundColor: 'transparent', paddingVertical: 8 },
  btnBig: { paddingVertical: 15 },
  btnText: { fontFamily: F.semibold, fontSize: 15, color: C.leafInk },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { backgroundColor: C.leaf, borderColor: C.leaf },
  chipText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 99, backgroundColor: C.bg },
  stepBtn: { width: 36, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepSign: { fontSize: 20, color: C.ink, lineHeight: 22 },
  stepText: { fontFamily: F.semibold, fontSize: 13, minWidth: 74, textAlign: 'center', color: C.ink },
  tag: { fontFamily: F.semibold, fontSize: 11, color: C.ink, backgroundColor: C.leafSoft, borderRadius: 99, paddingVertical: 2, paddingHorizontal: 8, overflow: 'hidden' },
});
