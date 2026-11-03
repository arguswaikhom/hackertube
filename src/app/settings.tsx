import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Chip, TopBar } from "../components/ui";
import { update, useStore, type State } from "../store";
import { useColors } from "../theme";

const THEMES: [State["theme"], string][] = [["system", "Use device theme"], ["light", "Light"], ["dark", "Dark"]];

export default function Settings() {
  const c = useColors();
  const { frames, theme } = useStore();
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Settings" right={<View />} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={[styles.h, { color: c.text }]}>Appearance</Text>
        <View style={styles.wrap}>
          {THEMES.map(([t, label]) => <Chip key={t} label={label} on={theme === t} onPress={() => update({ theme: t })} />)}
        </View>
        <View style={styles.row}>
          <View style={styles.text}>
            <Text style={[styles.h, { color: c.text }]}>Show video frames instead of thumbnails</Text>
            <Text style={[styles.p, { color: c.muted }]}>
              YouTube thumbnails are designed by uploaders to grab your attention: big faces, arrows, shouting text.
              With this on, every video is shown with a frame from the middle of the video, so you see what it actually
              looks like. Turn it off to see the original thumbnails.
            </Text>
          </View>
          <Switch value={frames} onValueChange={(v) => update({ frames: v })} accessibilityLabel="Show video frames instead of thumbnails" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  h: { fontSize: 16, fontWeight: "600" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 16 },
  text: { flex: 1, gap: 4 },
  p: { fontSize: 14, lineHeight: 20 },
});
