import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import type { IconName } from "../../components/ui";
import { useColors } from "../../theme";

const TABS: [name: string, title: string, off: IconName, on: IconName][] = [
  ["index", "Home", "home", "home"],
  ["longs", "Longs", "movie", "movie"],
  ["categories", "Categories", "category", "category"],
  ["playlists", "Playlists", "playlist-play", "playlist-play"],
  ["you", "You", "person-outline", "person"],
];

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.text,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.line },
        tabBarLabelStyle: { fontSize: 11 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      {TABS.map(([name, title, off, on]) => (
        <Tabs.Screen key={name} name={name} options={{
          title,
          tabBarIcon: ({ focused, color }) => <MaterialIcons name={focused ? on : off} size={25} color={String(color)} />,
        }} />
      ))}
    </Tabs>
  );
}
