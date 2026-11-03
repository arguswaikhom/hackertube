import { useMemo } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { videosFor, type Video } from "../../catalog";
import { Press, TopBar, type IconName } from "../../components/ui";
import { Frame, openVideo } from "../../components/VideoCard";
import { useStore } from "../../store";
import { font, useColors } from "../../theme";

function Shelf({ title, kind, videos, empty }: { title: string; kind: string; videos: Video[]; empty: string }) {
  const c = useColors();
  return (
    <View style={styles.shelf}>
      <View style={styles.shelfHead}>
        <Text style={[styles.h2, { color: c.text }]} accessibilityRole="header">{title}</Text>
        <Press onPress={() => router.push(`/saved/${kind}`)} accessibilityRole="button" accessibilityLabel={`View all: ${title}`}
          style={[styles.viewAll, { borderColor: c.line }]}>
          <Text style={[styles.link, { color: c.text }]}>View all</Text>
        </Press>
      </View>
      {videos.length ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={videos.slice(0, 12)}
          keyExtractor={(v) => v.vid}
          contentContainerStyle={styles.rail}
          renderItem={({ item }) => (
            <Press style={styles.tile} scale={0.96} onPress={() => openVideo(item.vid)} accessibilityRole="button" accessibilityLabel={item.title}>
              <Frame vid={item.vid} style={styles.round} />
              <Text style={[styles.tileTitle, { color: c.text }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.tileSub, { color: c.muted }]} numberOfLines={1}>{item.channel}</Text>
            </Press>
          )}
        />
      ) : <Text style={[styles.empty, { color: c.muted }]}>{empty}</Text>}
    </View>
  );
}

function Row({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.line }]} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon} size={22} color={c.text} />
      <Text style={[styles.rowText, { color: c.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

export default function You() {
  const c = useColors();
  const { seen, later, likes } = useStore();
  const recent = useMemo(() => videosFor([...seen].reverse()), [seen]);
  const saved = useMemo(() => videosFor([...later].reverse()), [later]);
  const liked = useMemo(() => videosFor([...likes].reverse()), [likes]);
  return (
    <View style={{ flex: 1 }}>
      <TopBar back={false} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Shelf title="History" kind="history" videos={recent} empty="Videos you open will show up here." />
        <Shelf title="Watch later" kind="later" videos={saved} empty="Save videos with the clock button on a thumbnail." />
        <Shelf title="Liked videos" kind="liked" videos={liked} empty="Videos you like show up here, and shape your Home feed." />
        <View style={[styles.rows, { backgroundColor: c.raised }]}>
          <Row icon="settings-outline" label="Settings" onPress={() => router.push("/settings")} />
          <View style={[styles.divider, { backgroundColor: c.line }]} />
          <Row icon="information-circle-outline" label="About and data" onPress={() => router.push("/about")} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: { marginTop: 18 },
  shelfHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  viewAll: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, justifyContent: "center" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  h2: { fontFamily: font.display, fontSize: 20, fontWeight: "600", letterSpacing: -0.2 },
  link: { fontFamily: font.body, fontSize: 13, fontWeight: "600" },
  rail: { gap: 12, paddingHorizontal: 16 },
  tile: { width: 156 },
  round: { borderRadius: 14 },
  tileTitle: { fontFamily: font.body, fontSize: 13, lineHeight: 17, fontWeight: "600", marginTop: 6 },
  tileSub: { fontFamily: font.body, fontSize: 12, lineHeight: 16, marginTop: 1 },
  empty: { fontFamily: font.body, fontSize: 14, lineHeight: 20, paddingHorizontal: 16 },
  rows: { marginTop: 26, marginHorizontal: 12, borderRadius: 20, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
  rowText: { flex: 1, fontFamily: font.body, fontSize: 15, fontWeight: "500" },
});
