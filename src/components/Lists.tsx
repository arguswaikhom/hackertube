import { useMemo, useState } from "react";
import { FlatList, Linking, useWindowDimensions, type ListRenderItem } from "react-native";
import { byRows, type Video } from "../catalog";
import { columnsFor } from "../theme";
import { Chip, ChipRow, Empty } from "./ui";
import { VideoCard, VideoMenuProvider } from "./VideoCard";

const PAGE = 24;

/** Opens up to 50 videos as a temporary playlist, on YouTube or in its app. No account or API needed. */
export const playAll = (vids: string[]) =>
  Linking.openURL(`https://www.youtube.com/watch_videos?video_ids=${vids.slice(0, 50).join(",")}`);

export const PlayAll = ({ vids }: { vids: string[] }) =>
  vids.length ? <ChipRow><Chip icon="playlist-play" label="Play all on YouTube" onPress={() => playAll(vids)} /></ChipRow> : null;

/** Infinite grid of big cards over a list of rows, loaded a page at a time. */
export function VideoGrid({ rows, header, empty, reasons }: {
  rows: number[]; header?: React.ReactElement; empty: string; reasons?: Map<number, string>;
}) {
  const columns = columnsFor(useWindowDimensions().width);
  const [count, setCount] = useState(PAGE);
  const data = useMemo(() => byRows(rows.slice(0, count)), [rows, count]);
  const render: ListRenderItem<Video> = ({ item }) => <VideoCard video={item} reason={reasons?.get(item.row)} grid={columns > 1} />;
  return (
    <VideoMenuProvider>
      <FlatList
        key={columns}
        numColumns={columns}
        data={data}
        keyExtractor={(v) => v.vid}
        renderItem={render}
        ListHeaderComponent={header}
        ListEmptyComponent={<Empty text={empty} />}
        onEndReached={() => setCount((c) => Math.min(c + PAGE, rows.length))}
        onEndReachedThreshold={1.5}
        contentContainerStyle={columns > 1 ? { paddingHorizontal: 8 } : undefined}
        windowSize={7}
      />
    </VideoMenuProvider>
  );
}
