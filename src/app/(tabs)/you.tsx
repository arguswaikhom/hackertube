import { useMemo } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { videosFor, type Video } from "../../catalog";
import { TopBar, type IconName } from "../../components/ui";
import { Frame, openVideo } from "../../components/VideoCard";
import { useStore } from "../../store";
import { useColors } from "../../theme";

function Shelf({ title, kind, videos, empty }: { title: string; kind: string; videos: Video[]; empty: string }) {
  const c = useColors();
  return (
    <View style={styles.shelf}>
      <Pressable style={styles.shelfHead} onPress={() => router.push(`/saved/${kind}`)} accessibilityRole="button">
        <Text style={[styles.h2, { color: c.text }]}>{title}</Text>
        <Text style={[styles.link, { color: c.text }]}>View all</Text>
      </Pressable>
      {videos.length ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={videos.slice(0, 12)}
          keyExtractor={(v) => v.vid}
          contentContainerStyle={styles.rail}
          renderItem={({ item }) => (
            <Pressable style={styles.tile} onPress={() => openVideo(item.vid)} accessibilityRole="button" accessibilityLabel={item.title}>
              <Frame vid={item.vid} style={styles.round} />
              <Text style={[styles.tileTitle, { color: c.text }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.tileSub, { color: c.muted }]} numberOfLines={1}>{item.channel}</Text>
            </Pressable>
          )}
        />
      ) : <Text style={[styles.empty, { color: c.muted }]}>{empty}</Text>}
    </View>
  );
}

function Row({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <MaterialIcons name={icon} size={24} color={c.text} />
      <Text style={[styles.rowText, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

export default function You() {
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
        <View style={styles.rows}>
          <Row icon="settings" label="Settings" onPress={() => router.push("/settings")} />
          <Row icon="info-outline" label="About and data" onPress={() => router.push("/about")} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: { marginTop: 14 },
  shelfHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingBottom: 8 },
  h2: { fontSize: 18, fontWeight: "700" },
  link: { fontSize: 13, fontWeight: "600" },
  rail: { gap: 10, paddingHorizontal: 12 },
  tile: { width: 150 },
  round: { borderRadius: 8 },
  tileTitle: { fontSize: 13, lineHeight: 17, fontWeight: "600", marginTop: 6 },
  tileSub: { fontSize: 12, lineHeight: 16, marginTop: 1 },
  empty: { fontSize: 14, lineHeight: 20, paddingHorizontal: 12 },
  rows: { marginTop: 18 },
  row: { flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 16, paddingVertical: 13 },
  rowText: { fontSize: 15 },
});
