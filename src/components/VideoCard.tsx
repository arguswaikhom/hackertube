import { createContext, useContext, useState } from "react";
import { Linking, Pressable, Share, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { Video } from "../catalog";
import { metaOf, useMetaVersion } from "../meta";
import { ago, duration, views } from "../picks";
import { toggleDislike, toggleLater, useStore } from "../store";
import { hit, useColors } from "../theme";
import { MenuItem, Sheet } from "./ui";

const youtubeUrl = (vid: string) => `https://www.youtube.com/watch?v=${vid}`;

export const openVideo = (vid: string) => router.push(`/watch/${vid}`);

/** "877K views • 11 years ago", or the HN numbers until YouTube's are available. */
export function subline(v: Video) {
  const m = metaOf(v.vid);
  if (m) return [views(m.views), ago(m.published)].filter(Boolean).join(" • ");
  return v.recommenders ? `${v.recommenders} HN recommender${v.recommenders === 1 ? "" : "s"}` : `Cited ${v.mentions}× on HN`;
}

/** The middle-of-the-video frame by default (Settings can switch it), falling back to the regular thumbnail. */
export function Frame({ vid, style, badge = true }: { vid: string; style?: ViewStyle; badge?: boolean }) {
  const c = useColors();
  const { frames, later } = useStore();
  const [fallback, setFallback] = useState(false);
  const d = duration(metaOf(vid)?.duration);
  return (
    <View style={[styles.frame, { backgroundColor: c.raised }, style]}>
      <Image
        style={StyleSheet.absoluteFill}
        source={`https://i.ytimg.com/vi/${vid}/${frames && !fallback ? "hq2" : "hqdefault"}.jpg`}
        contentFit="cover"
        cachePolicy="disk"
        recyclingKey={vid}
        transition={100}
        onError={() => setFallback(true)}
      />
      {badge && d ? <Text style={[styles.badge, { backgroundColor: c.badge }]}>{d}</Text> : null}
      {badge ? (
        <Pressable onPress={() => toggleLater(vid)} hitSlop={hit} style={[styles.later, { backgroundColor: c.badge }]}
          accessibilityRole="button" accessibilityLabel={later.includes(vid) ? "Remove from Watch later" : "Save to Watch later"}>
          <MaterialIcons name={later.includes(vid) ? "check" : "schedule"} size={16} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

// One menu per list, opened from any row, so thousands of rows don't each carry a Modal.
const MenuContext = createContext<(v: Video) => void>(() => {});
export const useVideoMenu = () => useContext(MenuContext);

export function VideoMenuProvider({ children }: { children: React.ReactNode }) {
  const [v, setV] = useState<Video | null>(null);
  const { later, dislikes } = useStore();
  const act = (fn: () => void) => () => { setV(null); fn(); };
  return (
    <MenuContext.Provider value={setV}>
      {children}
      <Sheet open={!!v} onClose={() => setV(null)}>
        {v ? (
          <>
            <MenuItem icon="schedule" label={later.includes(v.vid) ? "Remove from Watch later" : "Save to Watch later"} onPress={act(() => toggleLater(v.vid))} />
            <MenuItem icon="block" label={dislikes.includes(v.vid) ? "Undo Not interested" : "Not interested"} onPress={act(() => toggleDislike(v.vid))} />
            <MenuItem icon="share" label="Share" onPress={act(() => { Share.share({ message: `${v.title} ${youtubeUrl(v.vid)}` }); })} />
            <MenuItem icon="open-in-new" label="Open in YouTube" onPress={act(() => { Linking.openURL(youtubeUrl(v.vid)); })} />
          </>
        ) : null}
      </Sheet>
    </MenuContext.Provider>
  );
}

function More({ video }: { video: Video }) {
  const c = useColors();
  const open = useVideoMenu();
  return (
    <Pressable onPress={() => open(video)} hitSlop={hit} accessibilityRole="button" accessibilityLabel={`More actions for ${video.title}`} style={styles.more}>
      <MaterialIcons name="more-vert" size={20} color={c.text} />
    </Pressable>
  );
}

function Avatar({ name }: { name: string }) {
  const c = useColors();
  return (
    <View style={[styles.avatar, { backgroundColor: c.raised }]} accessibilityElementsHidden>
      <Text style={[styles.avatarText, { color: c.text }]}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

/** The big card: full-width frame on phones, as on the YouTube home feed. */
export function VideoCard({ video: v, reason, grid }: { video: Video; reason?: string; grid?: boolean }) {
  const c = useColors();
  useMetaVersion();
  return (
    <Pressable style={[styles.card, grid && styles.cardGrid]} onPress={() => openVideo(v.vid)} accessibilityRole="button" accessibilityLabel={v.title}>
      <Frame vid={v.vid} style={grid ? styles.round : undefined} />
      <View style={[styles.info, grid && styles.infoGrid]}>
        <Avatar name={v.channel} />
        <View style={styles.text}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>{v.title}</Text>
          <Text style={[styles.sub, { color: c.muted }]} numberOfLines={1}>{v.channel} • {subline(v)}</Text>
          {reason ? <Text style={[styles.sub, { color: c.muted }]} numberOfLines={1}>{reason}</Text> : null}
        </View>
        <More video={v} />
      </View>
    </Pressable>
  );
}

/** The compact row: Up next, search, saved lists, playlists. */
export function VideoRow({ video: v, note, index, topicMatch }: { video: Video; note?: string; index?: number; topicMatch?: boolean }) {
  const c = useColors();
  useMetaVersion();
  return (
    <Pressable style={styles.row} onPress={() => openVideo(v.vid)} accessibilityRole="button" accessibilityLabel={v.title}>
      {index !== undefined ? <Text style={[styles.index, { color: c.muted }]}>{index}</Text> : null}
      <View style={styles.rowFrame}><Frame vid={v.vid} style={styles.round} /></View>
      <View style={styles.text}>
        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={3}>{v.title}</Text>
        <Text style={[styles.sub, { color: c.muted }]} numberOfLines={1}>{v.channel}</Text>
        <Text style={[styles.sub, { color: c.muted }]} numberOfLines={1}>{subline(v)}</Text>
        {topicMatch ? <Text style={[styles.sub, { color: c.link }]}>Topic match</Text> : null}
        {note ? <Text style={[styles.note, { color: c.muted }]}>{note}</Text> : null}
      </View>
      <More video={v} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: 16 / 9, overflow: "hidden" },
  round: { borderRadius: 10 },
  badge: { position: "absolute", right: 6, bottom: 6, color: "#fff", fontSize: 12, fontWeight: "600", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: "hidden" },
  later: { position: "absolute", right: 6, top: 6, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  card: { flex: 1, marginBottom: 16 },
  cardGrid: { paddingHorizontal: 8 },
  info: { flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingTop: 10 },
  infoGrid: { paddingHorizontal: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "700" },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: "600" },
  sub: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  more: { paddingLeft: 4, paddingTop: 2 },
  row: { flex: 1, flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingVertical: 7 },
  rowFrame: { width: 160 },
  rowTitle: { fontSize: 14, lineHeight: 19, fontWeight: "600" },
  index: { fontSize: 13, width: 20, textAlign: "center", paddingTop: 2 },
  note: { fontSize: 13, lineHeight: 18, marginTop: 6 },
});
