import { useMemo, useState } from "react";
import { FlatList, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { search } from "../catalog";
import { FilterChips } from "../components/Filters";
import { Empty, IconButton } from "../components/ui";
import { VideoMenuProvider, VideoRow } from "../components/VideoCard";
import type { Filter } from "../picks";
import { font, columnsFor, useColors } from "../theme";

export default function Search() {
  const c = useColors();
  const top = useSafeAreaInsets().top;
  const columns = columnsFor(useWindowDimensions().width);
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [text, setText] = useState(q ?? "");
  const [query, setQuery] = useState(q ?? "");
  const [filter, setFilter] = useState<Filter>({});
  const { results, weak } = useMemo(() => search(query, filter), [query, filter]);

  return (
    <VideoMenuProvider>
      <View style={{ flex: 1, paddingTop: top }}>
        <View style={styles.bar}>
          <IconButton name="arrow-back" label="Back" onPress={() => router.back()} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => setQuery(text)}
            autoFocus={!q}
            placeholder="Search videos"
            placeholderTextColor={c.muted}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search videos"
            style={[styles.input, { color: c.text, backgroundColor: c.raised }]}
          />
          {text ? <IconButton name="close" label="Clear search" onPress={() => { setText(""); setQuery(""); }} /> : null}
        </View>
        {query ? <FilterChips filter={filter} onChange={setFilter} /> : null}
        {weak && results.length ? <Empty text={`No strong matches for “${query}”. Here are the closest videos.`} /> : null}
        <FlatList
          key={columns}
          numColumns={columns}
          data={results}
          keyExtractor={(v) => v.vid}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <VideoRow video={item} topicMatch={item.topicMatch} />}
          ListEmptyComponent={query ? <Empty text={`No videos match “${query}”. Try a broader word or fewer filters.`} /> : undefined}
        />
      </View>
    </VideoMenuProvider>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, height: 56 },
  input: { fontFamily: font.body, flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 18, fontSize: 16 },
});
