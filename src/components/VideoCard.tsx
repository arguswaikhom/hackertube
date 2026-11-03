import { createContext, useContext, useState } from "react";
import { Linking, Share, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { Video } from "../catalog";
import { avatarOf, metaOf, useMetaVersion } from "../meta";
import { ago, duration, views } from "../picks";
import { toggleDislike, toggleLater, useStore } from "../store";
import { font, hit, useColors } from "../theme";
import { MenuItem, Press, Sheet } from "./ui";

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
        <Press onPress={() => toggleLater(vid)} hitSlop={hit} scale={0.85} style={[styles.later, { backgroundColor: c.badge }]}
          accessibilityRole="button" accessibilityLabel={later.includes(vid) ? "Remove from Watch later" : "Save to Watch later"}>
          <Ionicons name={later.includes(vid) ? "checkmark" : "time-outline"} size={17} color="#fff" />
        </Press>
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
            <MenuItem icon="time-outline" label={later.includes(v.vid) ? "Remove from Watch later" : "Save to Watch later"} onPress={act(() => toggleLater(v.vid))} />
            <MenuItem icon="eye-off-outline" label={dislikes.includes(v.vid) ? "Undo Not interested" : "Not interested"} onPress={act(() => toggleDislike(v.vid))} />
            <MenuItem icon="share-social-outline" label="Share" onPress={act(() => { Share.share({ message: `${v.title} ${youtubeUrl(v.vid)}` }); })} />
            <MenuItem icon="open-outline" label="Open in YouTube" onPress={act(() => { Linking.openURL(youtubeUrl(v.vid)); })} />
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
    <Press onPress={() => open(video)} hitSlop={hit} scale={0.85} accessibilityRole="button" accessibilityLabel={`More actions for ${video.title}`} style={styles.more}>
      <Ionicons name="ellipsis-vertical" size={18} color={c.text} />
    </Press>
  );
}

/** The channel's picture from the metadata file, or its initial until that arrives or if it fails to load. */
export function Avatar({ video: v, size = 38 }: { video: Video; size?: number }) {
  const c = useColors();
  const url = avatarOf(v.vid);
  const [failed, setFailed] = useState<string>();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.raised }]} accessibilityElementsHidden>
      {url && failed !== url ? (
        <Image style={StyleSheet.absoluteFill} source={url} cachePolicy="disk" transition={100} onError={() => setFailed(url)} />
      ) : (
        <Text style={[styles.avatarText, { color: c.text }]}>{v.channel.trim().charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

/** The big card: full-width frame on phones, as on the YouTube home feed. */
export function VideoCard({ video: v, reason, grid }: { video: Video; reason?: string; grid?: boolean }) {
  const c = useColors();
  useMetaVersion();
  return (
    <Press style={[styles.card, grid && styles.cardGrid]} scale={0.98} onPress={() => openVideo(v.vid)} accessibilityRole="button" accessibilityLabel={v.title}>
      <Frame vid={v.vid} style={styles.roundBig} />
      <View style={[styles.info, grid && styles.infoGrid]}>
        <Avatar video={v} />
        <View style={styles.text}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>{v.title}</Text>
          <Text style={[styles.sub, { color: c.muted }]} numberOfLines={1}>{v.channel} • {subline(v)}</Text>
          {reason ? <Text style={[styles.reason, { color: c.accentText }]} numberOfLines={1}>{reason}</Text> : null}
        </View>
        <More video={v} />
      </View>
    </Press>
  );
}

/** The compact row: Up next, search, saved lists, playlists. */
export function VideoRow({ video: v, note, index, topicMatch }: { video: Video; note?: string; index?: number; topicMatch?: boolean }) {
  const c = useColors();
  useMetaVersion();
  return (
    <Press style={styles.row} scale={0.98} onPress={() => openVideo(v.vid)} accessibilityRole="button" accessibilityLabel={v.title}>
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
    </Press>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: 16 / 9, overflow: "hidden" },
  round: { borderRadius: 14 },
  roundBig: { borderRadius: 20 },
  badge: { position: "absolute", right: 8, bottom: 8, color: "#fff", fontFamily: font.body, fontSize: 12, fontWeight: "700", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, overflow: "hidden" },
  later: { position: "absolute", right: 8, top: 8, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  card: { flex: 1, marginBottom: 22, paddingHorizontal: 12 },
  cardGrid: { paddingHorizontal: 8 },
  info: { flexDirection: "row", gap: 12, paddingHorizontal: 4, paddingTop: 12 },
  infoGrid: { paddingHorizontal: 2 },
  avatar: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarText: { fontFamily: font.display, fontSize: 16, fontWeight: "800" },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: font.body, fontSize: 16, lineHeight: 22, fontWeight: "600" },
  sub: { fontFamily: font.body, fontSize: 13, lineHeight: 18, marginTop: 2 },
  reason: { fontFamily: font.body, fontSize: 13, lineHeight: 18, marginTop: 2, fontWeight: "600" },
  more: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: -4 },
  row: { flex: 1, flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  rowFrame: { width: 160 },
  rowTitle: { fontFamily: font.body, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  index: { fontFamily: font.display, fontSize: 15, fontWeight: "600", width: 20, textAlign: "center", paddingTop: 2 },
  note: { fontFamily: font.body, fontSize: 13, lineHeight: 18, marginTop: 6 },
});
