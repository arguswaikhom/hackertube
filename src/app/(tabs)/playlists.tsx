import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { playlists, type Playlist } from "../../catalog";
import { TopBar } from "../../components/ui";
import { Frame } from "../../components/VideoCard";
import { columnsFor, useColors } from "../../theme";

const TIERS = [
  ["start", "Start here", "Broad, essential lists for your first visit."],
  ["deep", "Deep dives", "One obsession each, for when you want to go down a rabbit hole."],
];

export function Mosaic({ vids, label }: { vids: string[]; label?: string }) {
  return (
    <View style={styles.mosaic}>
      {vids.map((v) => <View key={v} style={styles.tile}><Frame vid={v} badge={false} /></View>)}
      {label ? <Text style={styles.count}>{label}</Text> : null}
    </View>
  );
}

function Card({ p, width }: { p: Playlist; width: number }) {
  const c = useColors();
  return (
    <Pressable style={{ width }} onPress={() => router.push(`/playlist/${p.slug}`)} accessibilityRole="button" accessibilityLabel={p.title}>
      <Mosaic vids={p.cover} label={`${p.count} videos`} />
      <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>{p.title}</Text>
      <Text style={[styles.pitch, { color: c.muted }]} numberOfLines={3}>{p.pitch}</Text>
    </Pressable>
  );
}

export default function Playlists() {
  const c = useColors();
  const all = useMemo(playlists, []);
  const screen = useWindowDimensions().width;
  const columns = columnsFor(screen);
  const width = (screen - 24 - 12 * (columns - 1)) / columns;
  return (
    <View style={{ flex: 1 }}>
      <TopBar back={false} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={[styles.h1, { color: c.text }]} accessibilityRole="header">Playlists</Text>
        <Text style={[styles.pitch, { color: c.muted }]}>Curated by Claude from what Hacker News recommends, each in a deliberate order.</Text>
        {TIERS.map(([tier, title, blurb]) => (
          <View key={tier} style={styles.tier}>
            <Text style={[styles.h2, { color: c.text }]} accessibilityRole="header">{title}</Text>
            <Text style={[styles.pitch, { color: c.muted }]}>{blurb}</Text>
            <View style={styles.grid}>
              {all.filter((p) => p.tier === tier).map((p) => <Card key={p.slug} p={p} width={width} />)}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 12, paddingBottom: 24 },
  h1: { fontSize: 24, fontWeight: "700" },
  h2: { fontSize: 19, fontWeight: "700" },
  tier: { marginTop: 22 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, columnGap: 12, marginTop: 12 },
  mosaic: { flexDirection: "row", flexWrap: "wrap", borderRadius: 10, overflow: "hidden" },
  tile: { width: "50%" },
  count: { position: "absolute", right: 6, bottom: 6, color: "#fff", backgroundColor: "rgba(0,0,0,0.8)", fontSize: 12, fontWeight: "600", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  title: { fontSize: 15, lineHeight: 20, fontWeight: "600", marginTop: 8 },
  pitch: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
