import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { listModel } from '../../lib/logic';
import { useStore } from '../../lib/store';
import { C, F } from '../../ui/theme';

export default function TabsLayout() {
  const { state } = useStore();
  const toGet = listModel(state).toGet;
  const toCook = state.plan.filter((p) => !p.cooked).length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.leaf,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.line },
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 12 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My meals',
          // Shows how many chosen meals are still to cook, like the grocery count.
          tabBarBadge: toCook || undefined,
          tabBarBadgeStyle: { backgroundColor: C.leaf, color: C.leafInk, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name={toCook ? 'restaurant' : 'restaurant-outline'} color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{ title: 'Recipes', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Grocery list',
          tabBarBadge: toGet || undefined,
          tabBarBadgeStyle: { backgroundColor: C.warn, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color as string} size={size} />,
        }}
      />
    </Tabs>
  );
}
