import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { topics } from "../../catalog";
import { Chip, TopBar } from "../../components/ui";
import { hasMeta } from "../../meta";
import { useColors } from "../../theme";

export default function Categories() {
  const c = useColors();
  const areas = useMemo(topics, []);
  const go = (params: Record<string, string>) => router.push({ pathname: "/browse", params });

  return (
    <View style={{ flex: 1 }}>
      <TopBar back={false} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={[styles.h1, { color: c.text }]} accessibilityRole="header">Categories</Text>
        <View style={styles.wrap}>
          <Chip label="Recently recommended" onPress={() => go({ sort: "recent", title: "Recently recommended" })} />
          {hasMeta() ? <Chip label="Hidden gems" onPress={() => go({ gems: "1", title: "Hidden gems" })} /> : null}
          <Chip label="All videos" onPress={() => go({ title: "All videos" })} />
        </View>
        {areas.map((a) => (
          <View key={a.id} style={styles.area}>
            <Pressable style={styles.areaHead} onPress={() => go({ area: a.id, title: a.name })} accessibilityRole="button">
              <Text style={[styles.h2, { color: c.text }]}>{a.name}</Text>
              <Text style={[styles.count, { color: c.muted }]}>{a.n}</Text>
            </Pressable>
            {a.categories.map((k) => (
              <Pressable key={k.id} style={styles.cat} onPress={() => go({ cat: k.id, title: k.name })} accessibilityRole="button">
                <Text style={[styles.catText, { color: c.text }]}>{k.name}</Text>
                <Text style={[styles.count, { color: c.muted }]}>{k.n}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 12, paddingBottom: 24 },
  h1: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  area: { marginTop: 22 },
  areaHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 6 },
  h2: { fontSize: 18, fontWeight: "700", flexShrink: 1 },
  cat: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 9 },
  catText: { fontSize: 15, flexShrink: 1 },
  count: { fontSize: 13 },
});
