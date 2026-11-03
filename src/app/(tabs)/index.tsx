import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { browse, homeFeed, topics } from "../../catalog";
import { VideoGrid } from "../../components/Lists";
import { Chip, ChipRow, TopBar } from "../../components/ui";
import { useMetaVersion } from "../../meta";

// A fresh seed each launch: reopening rerolls Home, while scrolling and going back keep it.
const seed = String(Math.floor(Math.random() * 1e9));

export default function Home() {
  const [area, setArea] = useState<string | null>(null);
  const version = useMetaVersion();
  const areas = useMemo(topics, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const picks = useMemo(() => homeFeed(seed), [version]);
  const rows = useMemo(() => (area ? browse({ area, evergreen: "1" }) : picks.map((p) => p.row)), [area, picks]);
  const reasons = useMemo(() => (area ? undefined : new Map(picks.map((p) => [p.row, p.reason]))), [area, picks]);

  return (
    <View style={{ flex: 1 }}>
      <TopBar back={false} />
      <ChipRow>
        <Chip icon="options-outline" label="Filters" onPress={() => router.push("/browse")} />
        <Chip label="All" on={!area} onPress={() => setArea(null)} />
        {areas.map((a) => <Chip key={a.id} label={a.name} on={area === a.id} onPress={() => setArea(a.id)} />)}
      </ChipRow>
      <VideoGrid key={area ?? "all"} rows={rows} reasons={reasons} empty="You've seen everything here. Clear your history in You to start over." />
    </View>
  );
}
