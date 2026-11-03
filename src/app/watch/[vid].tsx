import { useMemo, useState } from "react";
import { FlatList, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mentions, upNext, video, videoCategories, type Mention, type Video } from "../../catalog";
import { Player } from "../../components/Player";
import { Chip, ChipRow, Empty, IconButton, Sheet, TopBar, type IconName } from "../../components/ui";
import { VideoMenuProvider, VideoRow, subline } from "../../components/VideoCard";
import { useMetaVersion } from "../../meta";
import { toggleDislike, toggleLater, toggleLike, useStore } from "../../store";
import { useColors } from "../../theme";

const STANCE: Record<string, string> = {
  strong_rec: "Strongly recommends", rec: "Recommends", reference: "Cites", joke: "Joke", critical: "Critical",
};

const recLine = (v: Video) =>
  v.recommenders
    ? `${v.recommenders} HN recommender${v.recommenders === 1 ? "" : "s"} • recommended in ${v.rec_months} month${v.rec_months === 1 ? "" : "s"}, ${v.first_year}–${v.last_year}`
    : `Cited ${v.mentions}× on HN, ${v.first_year}–${v.last_year}`;

function Action({ icon, label, on, onPress }: { icon: IconName; label: string; on?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} accessibilityLabel={label}
      style={[styles.action, { backgroundColor: on ? c.chipOn : c.raised }]}>
      <MaterialIcons name={icon} size={19} color={on ? c.chipOnText : c.text} />
      <Text style={[styles.actionText, { color: on ? c.chipOnText : c.text }]}>{label}</Text>
    </Pressable>
  );
}

function Comment({ m }: { m: Mention }) {
  const c = useColors();
  const strong = m.stance === "strong_rec" || m.stance === "rec";
  return (
    <View style={styles.comment}>
      <Text style={[styles.meta, { color: c.muted }]}>@{m.author} • {m.month.slice(0, 4)} • in “{m.story}”</Text>
      <Text style={[styles.commentText, { color: c.text }]}>
        {m.text.replaceAll("[VIDEO]", "▶ this video").replaceAll("[LINK]", "(link)")}
      </Text>
      <View style={styles.commentFoot}>
        <Text style={[styles.stance, { color: strong ? c.accent : c.muted }]}>{STANCE[m.stance] ?? m.stance}</Text>
        <Text style={[styles.hn, { color: c.link }]} accessibilityRole="link"
          onPress={() => Linking.openURL(`https://news.ycombinator.com/item?id=${m.id}`)}>View on HN</Text>
      </View>
    </View>
  );
}

function Header({ v, said }: { v: Video; said: Mention[] }) {
  const c = useColors();
  const { likes, dislikes, later } = useStore();
  useMetaVersion();
  const [sheet, setSheet] = useState<"about" | "comments" | null>(null);
  const cats = useMemo(() => videoCategories(v.row), [v.row]);
  const tags: string[] = useMemo(() => JSON.parse(v.tags), [v.tags]);
  const liked = likes.includes(v.vid), disliked = dislikes.includes(v.vid), saved = later.includes(v.vid);
  const url = `https://www.youtube.com/watch?v=${v.vid}`;
  const first = said[0];
  return (
    <View>
      <Pressable style={styles.block} onPress={() => setSheet("about")} accessibilityRole="button" accessibilityHint="Shows the description">
        <Text style={[styles.title, { color: c.text }]}>{v.title}</Text>
        <Text style={[styles.meta, { color: c.muted }]}>
          {subline(v)} • {v.content_type} • {v.shelf_life}  <Text style={{ color: c.text }}>...more</Text>
        </Text>
      </Pressable>

      <View style={styles.channel}>
        <View style={[styles.avatar, { backgroundColor: c.raised }]}>
          <Text style={[styles.avatarText, { color: c.text }]}>{v.channel.trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.channelText}>
          <Text style={[styles.channelName, { color: c.text }]} numberOfLines={1}>{v.channel}</Text>
          <Text style={[styles.meta, { color: c.muted }]} numberOfLines={2}>{recLine(v)}</Text>
        </View>
      </View>

      <ChipRow>
        <Action icon={liked ? "thumb-up" : "thumb-up-off-alt"} label="Like" on={liked} onPress={() => toggleLike(v.vid)} />
        <Action icon={disliked ? "thumb-down" : "thumb-down-off-alt"} label="Not for me" on={disliked} onPress={() => toggleDislike(v.vid)} />
        <Action icon={saved ? "check" : "schedule"} label={saved ? "Saved" : "Watch later"} on={saved} onPress={() => toggleLater(v.vid)} />
        <Action icon="share" label="Share" onPress={() => Share.share({ message: `${v.title} ${url}` })} />
        <Action icon="open-in-new" label="YouTube" onPress={() => Linking.openURL(url)} />
      </ChipRow>

      {first ? (
        <Pressable style={[styles.teaser, { backgroundColor: c.raised }]} onPress={() => setSheet("comments")} accessibilityRole="button">
          <Text style={[styles.teaserHead, { color: c.text }]}>
            {said.length} comment{said.length === 1 ? "" : "s"} from Hacker News
          </Text>
          <Text style={[styles.meta, { color: c.text }]} numberOfLines={2}>
            {first.text.replaceAll("[VIDEO]", "▶ this video").replaceAll("[LINK]", "(link)")}
          </Text>
        </Pressable>
      ) : null}

      <Sheet open={sheet === "about"} onClose={() => setSheet(null)} title="Description" tall>
        <ScrollView contentContainerStyle={styles.sheetBody}>
          <Text style={[styles.title, { color: c.text }]}>{v.title}</Text>
          <Text style={[styles.meta, { color: c.muted }]}>{subline(v)} • {v.content_type} • {v.shelf_life}</Text>
          <Text style={[styles.body, { color: c.text }]}>{v.summary}</Text>
          <Text style={[styles.body, { color: c.muted }]}>{v.why_hn}</Text>
          <View style={styles.wrap}>
            {cats.map((k) => <Chip key={k.id} label={k.name} onPress={() => { setSheet(null); router.push({ pathname: "/browse", params: { cat: k.id, title: k.name } }); }} />)}
            {tags.map((t) => <Chip key={t} label={`#${t.replace(/\s+/g, "")}`} onPress={() => { setSheet(null); router.push({ pathname: "/search", params: { q: t } }); }} />)}
          </View>
        </ScrollView>
      </Sheet>

      <Sheet open={sheet === "comments"} onClose={() => setSheet(null)} title={`${said.length} comments from Hacker News`} tall>
        <FlatList data={said} keyExtractor={(m) => String(m.id)} renderItem={({ item }) => <Comment m={item} />} contentContainerStyle={styles.sheetBody} />
      </Sheet>
    </View>
  );
}

export default function Watch() {
  const c = useColors();
  const { vid } = useLocalSearchParams<{ vid: string }>();
  const top = useSafeAreaInsets().top;
  const width = useWindowDimensions().width;
  const wide = width >= 900;
  const v = useMemo(() => video(vid), [vid]);
  const said = useMemo(() => (v ? mentions(v.row) : []), [v]);
  const next = useMemo(() => (v ? upNext(v.row) : []), [v]);

  if (!v) return <View style={{ flex: 1 }}><TopBar /><Empty text="This video isn't in the catalogue anymore." /></View>;

  const up = <Text style={[styles.upNext, { color: c.text }]} accessibilityRole="header">Up next</Text>;
  return (
    <VideoMenuProvider>
      <View style={{ flex: 1, paddingTop: top, backgroundColor: c.bg }}>
        {/* above the player, never on it: YouTube's policies don't allow covering the embed */}
        <View style={styles.close}>
          <IconButton name="keyboard-arrow-down" label="Close video" size={26} onPress={() => router.back()} />
        </View>
        {wide ? (
          <View style={styles.wide}>
            <ScrollView style={styles.main}>
              <Player key={vid} vid={v.vid} title={v.title} />
              <Header v={v} said={said} />
            </ScrollView>
            <FlatList style={styles.side} data={next} keyExtractor={(n) => n.vid} ListHeaderComponent={up} renderItem={({ item }) => <VideoRow video={item} />} />
          </View>
        ) : (
          <>
            <Player key={vid} vid={v.vid} title={v.title} />
            <FlatList data={next} keyExtractor={(n) => n.vid} ListHeaderComponent={<><Header v={v} said={said} />{up}</>} renderItem={({ item }) => <VideoRow video={item} />} />
          </>
        )}
      </View>
    </VideoMenuProvider>
  );
}

const styles = StyleSheet.create({
  wide: { flex: 1, flexDirection: "row", gap: 16, paddingHorizontal: 16 },
  main: { flex: 3 },
  side: { flex: 2 },
  close: { height: 40, justifyContent: "center", paddingLeft: 4 },
  block: { paddingHorizontal: 12, paddingTop: 12 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
  meta: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  channel: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "700" },
  channelText: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: "600" },
  action: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 13, borderRadius: 18 },
  actionText: { fontSize: 14, fontWeight: "600" },
  teaser: { marginHorizontal: 12, marginTop: 2, marginBottom: 6, padding: 12, borderRadius: 12 },
  teaserHead: { fontSize: 14, fontWeight: "700" },
  upNext: { fontSize: 16, fontWeight: "700", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  sheetBody: { padding: 16, gap: 10 },
  body: { fontSize: 15, lineHeight: 22 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  comment: { paddingBottom: 18 },
  commentText: { fontSize: 15, lineHeight: 22, marginTop: 4 },
  commentFoot: { flexDirection: "row", gap: 16, marginTop: 6 },
  stance: { fontSize: 13, fontWeight: "600" },
  hn: { fontSize: 13, fontWeight: "600" },
});
