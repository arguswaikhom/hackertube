import { useMemo } from "react";
import { FlatList, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { videosFor } from "../../catalog";
import { PlayAll } from "../../components/Lists";
import { Chip, ChipRow, Empty, TopBar } from "../../components/ui";
import { VideoMenuProvider, VideoRow } from "../../components/VideoCard";
import { update, useStore } from "../../store";
import { columnsFor } from "../../theme";

const VIEWS = {
  history: { title: "History", key: "seen", empty: "Videos you open will show up here." },
  later: { title: "Watch later", key: "later", empty: "Save videos with the clock button on a thumbnail or on a video's page." },
  liked: { title: "Liked videos", key: "likes", empty: "Videos you like show up here, and shape your Home feed." },
} as const;

export default function Saved() {
  const { kind } = useLocalSearchParams<{ kind: keyof typeof VIEWS }>();
  const view = VIEWS[kind] ?? VIEWS.history;
  const state = useStore();
  const columns = columnsFor(useWindowDimensions().width);
  const list = state[view.key];
  const data = useMemo(() => videosFor([...list].reverse()), [list]);
  return (
    <VideoMenuProvider>
      <View style={{ flex: 1 }}>
        <TopBar title={view.title} />
        <FlatList
          key={columns}
          numColumns={columns}
          data={data}
          keyExtractor={(v) => v.vid}
          renderItem={({ item }) => <VideoRow video={item} />}
          ListHeaderComponent={data.length ? (
            <View>
              <PlayAll vids={data.map((v) => v.vid)} />
              {kind === "history" ? <ChipRow><Chip icon="delete-outline" label="Clear all watch history" onPress={() => update({ seen: [] })} /></ChipRow> : null}
            </View>
          ) : undefined}
          ListEmptyComponent={<Empty text={view.empty} />}
        />
      </View>
    </VideoMenuProvider>
  );
}
