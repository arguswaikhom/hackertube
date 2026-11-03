import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { browse } from "../../catalog";
import { FilterChips } from "../../components/Filters";
import { VideoGrid } from "../../components/Lists";
import { Empty, TopBar } from "../../components/ui";
import { hasMeta, useMetaVersion } from "../../meta";
import type { Filter } from "../../picks";
import { useColors } from "../../theme";

export default function Longs() {
  const c = useColors();
  const version = useMetaVersion();
  const [filter, setFilter] = useState<Filter>({ dur: "xlong" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => browse(filter), [filter, version]);
  return (
    <View style={{ flex: 1 }}>
      <TopBar back={false} />
      <Text style={[styles.h, { color: c.text }]} accessibilityRole="header">Longs</Text>
      <Text style={[styles.sub, { color: c.muted }]}>Every video over an hour. The opposite of Shorts.</Text>
      {hasMeta() ? (
        <>
          <FilterChips filter={filter} onChange={(f) => setFilter({ ...f, dur: "xlong" })} fixed={["dur"]} />
          <VideoGrid rows={rows} empty="No videos match these filters." />
        </>
      ) : <Empty text="Longs needs video lengths from YouTube, which haven't downloaded yet. Connect to the internet and reopen the app." />}
    </View>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 24, fontWeight: "700", paddingHorizontal: 12 },
  sub: { fontSize: 14, paddingHorizontal: 12, paddingBottom: 10, paddingTop: 2 },
});
