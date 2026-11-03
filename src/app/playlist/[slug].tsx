import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { playlist, playlistVideos } from "../../catalog";
import { PlayAll } from "../../components/Lists";
import { Empty, TopBar } from "../../components/ui";
import { VideoMenuProvider, VideoRow } from "../../components/VideoCard";
import { metaOf } from "../../meta";
import { hours } from "../../picks";
import { useColors } from "../../theme";
import { Mosaic } from "../(tabs)/playlists";

export default function PlaylistPage() {
  const c = useColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const p = useMemo(() => playlist(slug), [slug]);
  const videos = useMemo(() => playlistVideos(slug), [slug]);
  if (!p) return <View style={{ flex: 1 }}><TopBar /><Empty text="This playlist isn't available." /></View>;
  const seconds = videos.reduce((t, v) => t + (metaOf(v.vid)?.duration ?? 0), 0);
  const line = [`Curated by Claude`, `${videos.length} videos`, seconds ? hours(Math.round(seconds / 60)) : ""].filter(Boolean).join(" • ");
  return (
    <VideoMenuProvider>
      <View style={{ flex: 1 }}>
        <TopBar />
        <FlatList
          data={videos}
          keyExtractor={(v) => v.vid}
          renderItem={({ item, index }) => <VideoRow video={item} note={item.note} index={index + 1} />}
          ListHeaderComponent={
            <View style={styles.head}>
              <Mosaic vids={p.cover} />
              <Text style={[styles.h1, { color: c.text }]} accessibilityRole="header">{p.title}</Text>
              <Text style={[styles.sub, { color: c.muted }]}>{line}</Text>
              <Text style={[styles.intro, { color: c.text }]}>{p.intro}</Text>
              <View style={styles.play}><PlayAll vids={videos.map((v) => v.vid)} /></View>
            </View>
          }
        />
      </View>
    </VideoMenuProvider>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 12, paddingBottom: 8 },
  h1: { fontSize: 22, lineHeight: 28, fontWeight: "700", marginTop: 12 },
  sub: { fontSize: 13, marginTop: 4 },
  intro: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  play: { marginHorizontal: -12, marginTop: 12 },
});
