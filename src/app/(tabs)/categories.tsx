import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { topics } from "../../catalog";
import { Chip, Heading, TopBar } from "../../components/ui";
import { hasMeta } from "../../meta";
import { font, useColors } from "../../theme";

export default function Categories() {
  const c = useColors();
  const areas = useMemo(topics, []);
  const go = (params: Record<string, string>) => router.push({ pathname: "/browse", params });

  return (
    <View style={{ flex: 1 }}>
      <TopBar back={false} />
      <ScrollView contentContainerStyle={styles.page}>
        <Heading>Categories</Heading>
        <View style={styles.wrap}>
          <Chip label="Recently recommended" onPress={() => go({ sort: "recent", title: "Recently recommended" })} />
          {hasMeta() ? <Chip label="Hidden gems" onPress={() => go({ gems: "1", title: "Hidden gems" })} /> : null}
          <Chip label="All videos" onPress={() => go({ title: "All videos" })} />
        </View>
        {areas.map((a) => (
          <View key={a.id} style={[styles.area, { backgroundColor: c.raised }]}>
            <Pressable style={({ pressed }) => [styles.areaHead, pressed && { opacity: 0.6 }]} onPress={() => go({ area: a.id, title: a.name })} accessibilityRole="button">
              <Text style={[styles.h2, { color: c.text }]}>{a.name}</Text>
              <Text style={[styles.count, { color: c.muted }]}>{a.n}</Text>
            </Pressable>
            {a.categories.map((k) => (
              <Pressable key={k.id} style={({ pressed }) => [styles.cat, { borderTopColor: c.line }, pressed && { opacity: 0.6 }]} onPress={() => go({ cat: k.id, title: k.name })} accessibilityRole="button">
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
  page: { paddingBottom: 24 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, marginBottom: 6 },
  area: { marginTop: 14, marginHorizontal: 12, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  areaHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 10 },
  h2: { fontFamily: font.display, fontSize: 18, fontWeight: "600", letterSpacing: -0.2, flexShrink: 1 },
  cat: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  catText: { fontFamily: font.body, fontSize: 15, flexShrink: 1 },
  count: { fontFamily: font.body, fontSize: 13 },
});
