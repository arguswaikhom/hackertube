// Small shared pieces: top bar, chips, bottom sheet.
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hit, useColors } from "../theme";

export type IconName = keyof typeof MaterialIcons.glyphMap;

export function IconButton({ name, label, onPress, color, size = 24 }: {
  name: IconName; label: string; onPress: () => void; color?: string; size?: number;
}) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} hitSlop={hit} accessibilityRole="button" accessibilityLabel={label} style={styles.icon}>
      <MaterialIcons name={name} size={size} color={color ?? c.text} />
    </Pressable>
  );
}

/** The HackerTube wordmark, as on hackertube.org. */
export function Logo() {
  const c = useColors();
  return (
    <View style={styles.logo} accessibilityRole="header" accessibilityLabel="HackerTube">
      <Text style={[styles.logoText, { color: c.text }]}>Hacker<Text style={{ color: c.accent }}>Tube</Text></Text>
    </View>
  );
}

export function TopBar({ title, back = true, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  const c = useColors();
  const top = useSafeAreaInsets().top;
  return (
    <View style={[styles.bar, { paddingTop: top, backgroundColor: c.bg }]}>
      <View style={styles.barRow}>
        {back ? <IconButton name="arrow-back" label="Back" onPress={() => router.back()} /> : <Logo />}
        {title ? <Text style={[styles.barTitle, { color: c.text }]} numberOfLines={1} accessibilityRole="header">{title}</Text> : <View style={styles.grow} />}
        {right ?? <IconButton name="search" label="Search" onPress={() => router.push("/search")} />}
      </View>
    </View>
  );
}

export function Chip({ label, on, onPress, icon }: { label?: string; on?: boolean; onPress: () => void; icon?: IconName }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} accessibilityLabel={label}
      style={[styles.chip, { backgroundColor: on ? c.chipOn : c.raised }]}>
      {icon ? <MaterialIcons name={icon} size={18} color={on ? c.chipOnText : c.text} /> : null}
      {label ? <Text style={[styles.chipText, { color: on ? c.chipOnText : c.text }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.chips} style={styles.chipScroll}>
      {children}
    </ScrollView>
  );
}

export function Sheet({ open, onClose, title, children, tall }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; tall?: boolean;
}) {
  const c = useColors();
  const bottom = useSafeAreaInsets().bottom;
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, tall && styles.sheetTall, { backgroundColor: c.sheet, paddingBottom: bottom + 8 }]}>
        <View style={[styles.grab, { backgroundColor: c.line }]} />
        {title ? (
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: c.text }]} accessibilityRole="header">{title}</Text>
            <IconButton name="close" label="Close" onPress={onClose} />
          </View>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

export function MenuItem({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={styles.menu} accessibilityRole="button">
      <MaterialIcons name={icon} size={24} color={c.text} />
      <Text style={[styles.menuText, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Empty({ text }: { text: string }) {
  const c = useColors();
  return <Text style={[styles.empty, { color: c.muted }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  icon: { padding: 8 },
  logo: { flexDirection: "row", alignItems: "center", paddingLeft: 10, flex: 1 },
  logoText: { fontSize: 21, fontWeight: "700", letterSpacing: -0.8 },
  bar: { zIndex: 2 },
  barRow: { height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 6, gap: 4 },
  barTitle: { flex: 1, fontSize: 18, fontWeight: "600", paddingLeft: 4 },
  grow: { flex: 1 },
  chipScroll: { flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 12, paddingTop: 3, paddingBottom: 10, alignItems: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, height: 34, paddingHorizontal: 12, borderRadius: 8 },
  chipText: { fontSize: 14, fontWeight: "600" },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "85%", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
  sheetTall: { height: "85%" },
  grab: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 6 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700", flexShrink: 1 },
  menu: { flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 18, paddingVertical: 13 },
  menuText: { fontSize: 16, flexShrink: 1 },
  empty: { fontSize: 15, lineHeight: 22, padding: 20, textAlign: "center" },
});
