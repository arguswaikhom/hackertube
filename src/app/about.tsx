import { useMemo } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { stats } from "../catalog";
import { TopBar } from "../components/ui";
import { font, useColors } from "../theme";

const LINKS = [
  ["hackertube.org", "https://hackertube.org"],
  ["Source code", "https://github.com/arguswaikhom/hackertube"],
  ["Download the data", "https://hackertube.org/data"],
  ["open-index/hacker-news dataset", "https://huggingface.co/datasets/open-index/hacker-news"],
  ["ODC-By 1.0 license", "https://opendatacommons.org/licenses/by/1-0/"],
  ["YouTube Terms of Service", "https://www.youtube.com/t/terms"],
  ["Google Privacy Policy", "https://policies.google.com/privacy"],
];

const n = (x: number) => x.toLocaleString("en-US");

export default function About() {
  const c = useColors();
  const s = useMemo(stats, []);
  const body = [styles.body, { color: c.text }];
  const h = [styles.h, { color: c.text }];
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="About" right={<View />} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={body}>The YouTube videos that Hacker News keeps telling each other to watch.</Text>
        <Text style={body}>
          An unofficial, open source mobile app for hackertube.org, built from its public data.
        </Text>
        <Text style={[styles.stats, { color: c.muted }]}>
          {n(s.videos)} videos, {n(s.comments)} HN comments, {s.categories} topics in {s.areas} areas, 2007 to 2026
        </Text>

        <Text style={h}>Why</Text>
        <Text style={body}>
          YouTube's recommendations are tuned for watch time. For nearly two decades, Hacker News commenters have been
          pointing each other at the talk you'll still be thinking about next year. This app collects those
          recommendations and makes them browsable, searchable and personal.
        </Text>

        <Text style={h}>How it was built</Text>
        <Text style={body}>
          Every HN comment from 2007 to 2026 was scanned for YouTube links. A video counts if at least three people linked
          it, in at least three different months. Claude then read each comment to judge whether it recommended the video,
          cited it, joked about it or criticized it, and wrote a summary for each video. Videos rank by how many separate
          months people recommended them in.
        </Text>

        <Text style={h}>Privacy</Text>
        <Text style={body}>
          There are no accounts and no tracking. Your likes, history and Watch later list stay on this device. Videos play
          through YouTube's privacy-enhanced embed, and YouTube's terms and privacy policy apply to playback.
        </Text>

        <Text style={h}>Credits</Text>
        <Text style={body}>
          Built on the data and playlists from hackertube.org, by Andrej Karpathy and Claude, and the open-index/hacker-news
          dataset, used under the Open Data Commons Attribution License. Hacker News data is provided by Y Combinator, and
          comments remain the work of their authors. Summaries, labels and playlists were written by AI and can be wrong.
          Video details come from the YouTube Data API.
        </Text>
        {LINKS.map(([label, url]) => (
          <Text key={url} style={[styles.link, { color: c.link }]} accessibilityRole="link" onPress={() => Linking.openURL(url)}>{label}</Text>
        ))}
        <Text style={[styles.body, { color: c.muted, marginTop: 12 }]}>
          Not made by or affiliated with hackertube.org, YouTube, Google, Hacker News or Y Combinator.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32, gap: 8, maxWidth: 680 },
  h: { fontFamily: font.display, fontSize: 18, fontWeight: "700", marginTop: 12 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22 },
  stats: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
  link: { fontFamily: font.body, fontSize: 15, lineHeight: 24 },
});
