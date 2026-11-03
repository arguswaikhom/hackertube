import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mentions, upNext, video, videoCategories, type Mention, type Video } from "../../catalog";
import { Player } from "../../components/Player";
import { Chip, ChipRow, Empty, IconButton, Press, Sheet, TopBar, type IconName } from "../../components/ui";
import { VideoMenuProvider, VideoRow, subline } from "../../components/VideoCard";
import { useMetaVersion } from "../../meta";
import { toggleDislike, toggleLater, toggleLike, useStore } from "../../store";
import { font, reduceMotion, useColors } from "../../theme";

const STANCE: Record<string, string> = {
  strong_rec: "Strongly recommends", rec: "Recommends", reference: "Cites", joke: "Joke", critical: "Critical",
};

const recLine = (v: Video) =>
  v.recommenders
    ? `${v.recommenders} HN recommender${v.recommenders === 1 ? "" : "s"} • recommended in ${v.rec_months} month${v.rec_months === 1 ? "" : "s"}, ${v.first_year}–${v.last_year}`
    : `Cited ${v.mentions}× on HN, ${v.first_year}–${v.last_year}`;

function Action({ icon, label, on, onPress }: { icon: IconName; label: string; on?: boolean; onPress: () => void }) {
  const c = useColors();
  // The icon pops when the action switches on, so the change is noticed.
  const [pop] = useState(() => new Animated.Value(1));
  const was = useRef(on);
  useEffect(() => {
    if (on && !was.current && !reduceMotion) {
      pop.setValue(0.6);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 14 }).start();
    }
    was.current = on;
  }, [on, pop]);
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} accessibilityLabel={label}
      style={[styles.action, { backgroundColor: on ? c.accent : c.raised }]}>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Ionicons name={icon} size={18} color={on ? "#fff" : c.text} />
      </Animated.View>
      <Text style={[styles.actionText, { color: on ? "#fff" : c.text }]}>{label}</Text>
    </Press>
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
        <Action icon={liked ? "thumbs-up" : "thumbs-up-outline"} label="Like" on={liked} onPress={() => toggleLike(v.vid)} />
        <Action icon={disliked ? "thumbs-down" : "thumbs-down-outline"} label="Not for me" on={disliked} onPress={() => toggleDislike(v.vid)} />
        <Action icon={saved ? "checkmark" : "time-outline"} label={saved ? "Saved" : "Watch later"} on={saved} onPress={() => toggleLater(v.vid)} />
        <Action icon="share-social-outline" label="Share" onPress={() => Share.share({ message: `${v.title} ${url}` })} />
        <Action icon="open-outline" label="YouTube" onPress={() => Linking.openURL(url)} />
      </ChipRow>

      {first ? (
        <Press scale={0.98} style={[styles.teaser, { backgroundColor: c.raised }]} onPress={() => setSheet("comments")} accessibilityRole="button">
          <Text style={[styles.teaserHead, { color: c.text }]}>
            {said.length} comment{said.length === 1 ? "" : "s"} from Hacker News
          </Text>
          <Text style={[styles.meta, { color: c.text }]} numberOfLines={2}>
            {first.text.replaceAll("[VIDEO]", "▶ this video").replaceAll("[LINK]", "(link)")}
          </Text>
        </Press>
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
          <IconButton name="chevron-down" label="Close video" size={26} onPress={() => router.back()} />
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
  close: { height: 48, justifyContent: "center", paddingLeft: 6 },
  block: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontFamily: font.display, fontSize: 21, lineHeight: 26, fontWeight: "600", letterSpacing: -0.3 },
  meta: { fontFamily: font.body, fontSize: 13, lineHeight: 18, marginTop: 3 },
  channel: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: font.display, fontSize: 16, fontWeight: "800" },
  channelText: { flex: 1 },
  channelName: { fontFamily: font.body, fontSize: 15, fontWeight: "600" },
  action: { flexDirection: "row", alignItems: "center", gap: 7, height: 38, paddingHorizontal: 16, borderRadius: 19 },
  actionText: { fontFamily: font.body, fontSize: 14, fontWeight: "600" },
  teaser: { marginHorizontal: 16, marginTop: 2, marginBottom: 6, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, gap: 4 },
  teaserHead: { fontFamily: font.body, fontSize: 14, fontWeight: "700" },
  upNext: { fontFamily: font.display, fontSize: 18, fontWeight: "600", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  sheetBody: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  comment: { paddingBottom: 18 },
  commentText: { fontFamily: font.body, fontSize: 15, lineHeight: 22, marginTop: 4 },
  commentFoot: { flexDirection: "row", gap: 16, marginTop: 6 },
  stance: { fontFamily: font.body, fontSize: 13, fontWeight: "600" },
  hn: { fontFamily: font.body, fontSize: 13, fontWeight: "600" },
});
