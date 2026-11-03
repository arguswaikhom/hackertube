import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { IconName } from "../../components/ui";
import { font, reduceMotion, useColors } from "../../theme";

const TABS: [name: string, title: string, off: IconName, on: IconName][] = [
  ["index", "Home", "home-outline", "home"],
  ["longs", "Longs", "film-outline", "film"],
  ["categories", "Categories", "grid-outline", "grid"],
  ["playlists", "Playlists", "albums-outline", "albums"],
  ["you", "You", "person-circle-outline", "person-circle"],
];

/** The tab icon, with an orange pill that grows in behind it when the tab is selected. */
function TabIcon({ focused, off, on }: { focused: boolean; off: IconName; on: IconName }) {
  const c = useColors();
  const [t] = useState(() => new Animated.Value(focused ? 1 : 0));
  useEffect(() => {
    if (reduceMotion) t.setValue(focused ? 1 : 0);
    else Animated.spring(t, { toValue: focused ? 1 : 0, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
  }, [focused, t]);
  return (
    <View style={styles.slot}>
      <Animated.View style={[styles.pill, { backgroundColor: c.accentSoft, opacity: t, transform: [{ scaleX: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]} />
      <Ionicons name={focused ? on : off} size={22} color={focused ? c.accentText : c.text} />
    </View>
  );
}

export default function TabsLayout() {
  const c = useColors();
  const bottom = useSafeAreaInsets().bottom;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.muted,
        // Taller than the default so the icon pill and label both fit, on phones with and without a gesture bar.
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.line, height: 64 + bottom, paddingTop: 6, paddingBottom: bottom + 6 },
        tabBarLabelStyle: { fontFamily: font.body, fontSize: 11, fontWeight: "600", marginTop: 1 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      {TABS.map(([name, title, off, on]) => (
        <Tabs.Screen key={name} name={name} options={{
          title,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} off={off} on={on} />,
        }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slot: { width: 60, height: 28, alignItems: "center", justifyContent: "center" },
  pill: { ...StyleSheet.absoluteFill, borderRadius: 14 },
});
