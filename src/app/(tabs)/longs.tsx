import { useMemo, useState } from "react";
import { View } from "react-native";
import { browse } from "../../catalog";
import { FilterChips } from "../../components/Filters";
import { VideoGrid } from "../../components/Lists";
import { Empty, Heading, TopBar } from "../../components/ui";
import { hasMeta, useMetaVersion } from "../../meta";
import type { Filter } from "../../picks";

export default function Longs() {
  const version = useMetaVersion();
  const [filter, setFilter] = useState<Filter>({ dur: "xlong" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => browse(filter), [filter, version]);
  return (
    <View style={{ flex: 1 }}>
      <TopBar back={false} />
      <Heading sub="Every video over an hour. The opposite of Shorts.">Longs</Heading>
      {hasMeta() ? (
        <>
          <FilterChips filter={filter} onChange={(f) => setFilter({ ...f, dur: "xlong" })} fixed={["dur"]} />
          <VideoGrid rows={rows} empty="No videos match these filters." />
        </>
      ) : <Empty text="Longs needs video lengths from YouTube, which haven't downloaded yet. Connect to the internet and reopen the app." />}
    </View>
  );
}
