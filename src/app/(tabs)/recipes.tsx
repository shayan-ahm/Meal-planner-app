import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORIES, CUISINES, RECIPES } from '../../data/recipes';
import { fits, info, matchCategory, prefRank, searchText } from '../../lib/logic';
import { recipeSeed } from '../../lib/shuffle';
import { useStore } from '../../lib/store';
import { Chip, H2, Muted, tap } from '../../ui/kit';
import { RecipeCard } from '../../ui/RecipeCard';
import { TopBar } from '../../ui/Screen';
import { C, F } from '../../ui/theme';

export default function Recipes() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const params = useLocalSearchParams<{ cat?: string }>();
  const [cat, setCat] = useState(params.cat || 'all');
  // A shortcut like "My favourites" on My meals opens this tab with ?cat=fav. Apply it once.
  useFocusEffect(useCallback(() => {
    if (params.cat) { setCat(params.cat); router.setParams({ cat: undefined }); }
  }, [params.cat]));
  const [cui, setCui] = useState('');
  const [all, setAll] = useState(false);
  const P = state.prefs;
  const hasFavs = state.favs.length > 0;
  // "My favourites" goes first once there are any.
  const cats = hasFavs ? [...CATEGORIES.filter(([k]) => k === 'fav'), ...CATEGORIES.filter(([k]) => k !== 'fav')] : CATEGORIES.filter(([k]) => k !== 'fav');
  // New random order every time the Recipes tab opens, so people see variety.
  const [seed, setSeed] = useState(recipeSeed);
  useFocusEffect(useCallback(() => { setSeed(recipeSeed()); }, []));
  const hidden = RECIPES.filter((r) => !fits(r, P)).length;

  const list = useMemo(() => {
    const fav = (id: string) => state.favs.includes(id);
    const qq = q.trim().toLowerCase();
    // Shuffle, but keep the broad order: favourite cuisines first, main meals before breakfast and snacks.
    const key = (id: string) => { let h = Math.floor(seed * 2 ** 31); for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; };
    const bucket = (r: (typeof RECIPES)[number]) => Math.floor(prefRank(r, P) / 1000);
    return RECIPES.filter((r) => (all || fits(r, P)) && matchCategory(r, cat, fav) && (!cui || info(r).cui === cui) && (!qq || searchText(r).includes(qq)))
      .sort((a, b) => bucket(a) - bucket(b) || key(a.id) - key(b.id));
  }, [q, cat, cui, all, P, state, seed]);

  const title = [cat !== 'all' ? cats.find((c) => c[0] === cat)?.[2] : '', cui].filter(Boolean).join(' · ');
  const planned = state.plan.length;

  const header = (
    <View style={{ gap: 12, paddingBottom: 4 }}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search recipes or ingredients"
        placeholderTextColor={C.muted}
        style={s.search}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Search recipes"
      />
      {hidden > 0 && (
        <View style={s.fitbar}>
          <Muted style={{ flex: 1 }}>{all ? 'Showing all recipes.' : `Only recipes that fit your preferences (${hidden} hidden).`}</Muted>
          <Chip label={all ? 'Only ones that fit me' : 'Show all'} onPress={() => setAll(!all)} />
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
        {cats.map(([k, e, l]) => {
          const on = cat === k;
          return (
            <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { tap(); setCat(on ? 'all' : k); }} style={[s.cat, on && s.catOn]}>
              <Text style={{ fontSize: 24 }}>{e}</Text>
              <Text style={[s.catText, on && { color: C.leafInk }]} numberOfLines={2}>{l}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
        {[['', 'Any cuisine'], ...CUISINES.map((c) => [c, c])].map(([k, l]) => <Chip key={k} label={l} on={cui === k} onPress={() => setCui(k)} />)}
      </ScrollView>
      <View style={s.resHead}>
        <H2 style={{ flex: 1 }}>{title || 'All recipes'} <Text style={s.count}>{list.length}</Text></H2>
        {!!title && <Chip label="Clear" onPress={() => { setCat('all'); setCui(''); }} />}
      </View>
      {planned > 0 && <Muted>Tap + to add a meal. {planned} in your plan.</Muted>}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar />
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={header}
        ListEmptyComponent={<Muted>No recipes match. Try another category{hidden && !all ? ' or tap Show all' : ''}.</Muted>}
        renderItem={({ item, index }) => (
          <>
            <RecipeCard r={item} />
            {index === list.length - 1 && list.length % 2 === 1 && <View style={{ flex: 1 }} />}
          </>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  search: { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12, fontFamily: F.body, fontSize: 15, color: C.ink },
  fitbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cat: { width: 80, alignItems: 'center', gap: 4, paddingTop: 10, paddingBottom: 8, paddingHorizontal: 4, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 14 },
  catOn: { backgroundColor: C.leaf, borderColor: C.leaf },
  catText: { fontFamily: F.semibold, fontSize: 12, lineHeight: 15, textAlign: 'center', color: C.ink },
  resHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { fontFamily: F.body, fontSize: 13, color: C.muted },
});
