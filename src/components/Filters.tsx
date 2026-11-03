// HackerTube's Filters panel as a YouTube-style bottom sheet, plus the chips for active filters.
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { hasMeta } from "../meta";
import type { Filter } from "../picks";
import { useColors } from "../theme";
import { Chip, ChipRow, Sheet } from "./ui";

type Option = [key: keyof Filter, value: string, label: string, needsMeta?: boolean];

const GROUPS: [string, Option[]][] = [
  ["Upload date", [["date", "year", "Past year", true], ["date", "2020s", "2020s", true], ["date", "2010s", "2010s", true], ["date", "2000s", "2000s", true]]],
  ["Type", [["type", "talk", "Talk"], ["type", "lecture", "Lecture"], ["type", "explainer", "Explainer"], ["type", "tutorial", "Tutorial"],
    ["type", "documentary", "Documentary"], ["type", "interview", "Interview"], ["type", "demo", "Demo"], ["type", "commentary", "Commentary"],
    ["type", "comedy", "Comedy"], ["type", "music", "Music"]]],
  ["Duration", [["dur", "short", "Under 4 minutes", true], ["dur", "medium", "4–20 minutes", true], ["dur", "long", "20–60 minutes", true], ["dur", "xlong", "Over 1 hour", true]]],
  ["Features", [["gems", "1", "Hidden gems", true], ["evergreen", "1", "Evergreen only"]]],
  ["Sort by", [["sort", "recent", "Recently recommended"], ["sort", "date", "Upload date", true], ["sort", "old", "Oldest first", true],
    ["sort", "views", "View count", true], ["sort", "liked", "Like ratio", true], ["sort", "hn", "Most recommended"]]],
];

export function filterFrom(params: Record<string, string | string[] | undefined>): Filter {
  const out: Filter = {};
  for (const k of ["date", "type", "dur", "gems", "evergreen", "sort", "area"] as const) {
    const v = params[k];
    if (typeof v === "string" && v) out[k] = v;
  }
  return out;
}

export function FilterChips({ filter, onChange, fixed = [] }: {
  filter: Filter; onChange: (f: Filter) => void; fixed?: (keyof Filter)[];
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const toggle = (k: keyof Filter, v: string) => {
    setOpen(false); // choosing an option closes the panel, as on YouTube
    onChange({ ...filter, [k]: filter[k] === v ? undefined : v });
  };
  const all = GROUPS.flatMap(([, o]) => o);
  const active = all.filter(([k, v]) => filter[k] === v && !fixed.includes(k));
  const meta = hasMeta();
  return (
    <>
      <ChipRow>
        <Chip icon="tune" label="Filters" onPress={() => setOpen(true)} />
        {active.map(([k, v, label]) => <Chip key={k + v} label={`${label}  ×`} on onPress={() => toggle(k, v)} />)}
      </ChipRow>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filters" tall>
        <ScrollView contentContainerStyle={styles.body}>
          {GROUPS.map(([title, options]) => {
            const shown = options.filter(([k, , , needs]) => !fixed.includes(k) && (!needs || meta));
            return shown.length ? (
              <View key={title}>
                <Text style={[styles.h, { color: c.text }]}>{title}</Text>
                <View style={styles.wrap}>
                  {shown.map(([k, v, label]) => <Chip key={k + v} label={label} on={filter[k] === v} onPress={() => toggle(k, v)} />)}
                </View>
              </View>
            ) : null;
          })}
          {meta ? null : <Text style={[styles.note, { color: c.muted }]}>Date, length and view filters appear once YouTube details are available.</Text>}
        </ScrollView>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 18 },
  h: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  note: { fontSize: 14, lineHeight: 20 },
});
