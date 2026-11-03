import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { browse, byRows, categoryName, topics } from "../catalog";
import { FilterChips, filterFrom } from "../components/Filters";
import { PlayAll, VideoGrid } from "../components/Lists";
import { Chip, ChipRow, TopBar } from "../components/ui";
import { useMetaVersion } from "../meta";
import type { Filter } from "../picks";
import { useColors } from "../theme";

/** Every video, one topic area, or one category: filtered and sorted. */
export default function Browse() {
  const c = useColors();
  const params = useLocalSearchParams<Record<string, string>>();
  const { cat, title } = params;
  const [filter, setFilter] = useState<Filter>(() => filterFrom(params));
  const version = useMetaVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => browse({ ...filter, cat }), [filter, cat, version]);
  const parent = useMemo(() => (cat ? categoryName(cat) : null), [cat]);
  const area = useMemo(() => (params.area ? topics().find((a) => a.id === params.area) : null), [params.area]);
  const vids = useMemo(() => byRows(rows.slice(0, 50)).map((v) => v.vid), [rows]);

  const go = (p: Record<string, string>) => router.push({ pathname: "/browse", params: p });
  return (
    <View style={{ flex: 1 }}>
      <TopBar title={title ?? "All videos"} />
      {parent ? (
        <Text style={[styles.crumb, { color: c.link }]} onPress={() => go({ area: parent.area, title: parent.area_name })} accessibilityRole="link">
          {parent.area_name}
        </Text>
      ) : null}
      {area ? (
        <ChipRow>
          {area.categories.map((k) => <Chip key={k.id} label={k.name} onPress={() => go({ cat: k.id, title: k.name })} />)}
        </ChipRow>
      ) : null}
      <FilterChips filter={filter} onChange={setFilter} fixed={params.area ? ["area"] : []} />
      <VideoGrid key={JSON.stringify(filter)} rows={rows} header={<PlayAll vids={vids} />} empty="No videos match these filters." />
    </View>
  );
}

const styles = StyleSheet.create({
  crumb: { fontSize: 14, paddingHorizontal: 14, paddingBottom: 8 },
});
