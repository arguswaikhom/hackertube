// Small shared pieces: pressable with feedback, top bar, chips, bottom sheet.
import { useEffect, useState, type ReactNode } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { font, hit, reduceMotion, useColors } from "../theme";

export type IconName = keyof typeof Ionicons.glyphMap;

/** A Pressable that sinks slightly while held, so every tap visibly lands. */
export function Press({ style, scale = 0.97, children, ...rest }: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>; scale?: number; children?: ReactNode;
}) {
  const [s] = useState(() => new Animated.Value(1));
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: v === 1 ? 6 : 0 }).start();
  return (
    <AnimatedPressable {...rest} style={[style, { transform: [{ scale: s }] }]}
      onPressIn={(e) => { if (!reduceMotion) to(scale); rest.onPressIn?.(e); }} onPressOut={(e) => { to(1); rest.onPressOut?.(e); }}>
      {children}
    </AnimatedPressable>
  );
}
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({ name, label, onPress, color, size = 24, filled }: {
  name: IconName; label: string; onPress: () => void; color?: string; size?: number; filled?: boolean;
}) {
  const c = useColors();
  return (
    <Press onPress={onPress} hitSlop={hit} scale={0.9} accessibilityRole="button" accessibilityLabel={label}
      style={[styles.icon, filled && { backgroundColor: c.raised }]}>
      <Ionicons name={name} size={size} color={color ?? c.text} />
    </Press>
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
        {title ? <Text style={[styles.barTitle, { color: c.text }]} numberOfLines={1} accessibilityRole="header">{title}</Text> : back ? <View style={styles.grow} /> : null}
        {right ?? <IconButton name="search" label="Search" size={22} filled onPress={() => router.push("/search")} />}
      </View>
    </View>
  );
}

/** A page heading in the display face, for tabs that have one. */
export function Heading({ children, sub }: { children: string; sub?: string }) {
  const c = useColors();
  return (
    <View style={styles.heading}>
      <Text style={[styles.h1, { color: c.text }]} accessibilityRole="header">{children}</Text>
      {sub ? <Text style={[styles.h1Sub, { color: c.muted }]}>{sub}</Text> : null}
    </View>
  );
}

export function Chip({ label, on, onPress, icon }: { label?: string; on?: boolean; onPress: () => void; icon?: IconName }) {
  const c = useColors();
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} accessibilityLabel={label}
      style={[styles.chip, { backgroundColor: on ? c.chipOn : c.raised }]}>
      {icon ? <Ionicons name={icon} size={17} color={on ? c.chipOnText : c.text} /> : null}
      {label ? <Text style={[styles.chipText, { color: on ? c.chipOnText : c.text }]}>{label}</Text> : null}
    </Press>
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

/** Bottom sheet: the scrim fades while the panel springs up, and both reverse on close. */
export function Sheet({ open, onClose, title, children, tall }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; tall?: boolean;
}) {
  const c = useColors();
  const bottom = useSafeAreaInsets().bottom;
  const [shown, setShown] = useState(open);
  const [t] = useState(() => new Animated.Value(0));
  // Opening mounts the Modal during render, then the effect animates in. Closing animates out, then unmounts.
  if (open && !shown) setShown(true);
  if (!open && shown && reduceMotion) setShown(false);
  useEffect(() => {
    if (!shown) return;
    if (reduceMotion) { t.setValue(1); return; }
    (open
      ? Animated.spring(t, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.8 })
      : Animated.timing(t, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true })
    ).start(({ finished }) => { if (finished && !open) setShown(false); });
  }, [open, shown, t]);
  const rise = t.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });
  return (
    <Modal visible={shown} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Animated.View style={[styles.scrim, { opacity: t }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.sheet, tall && styles.sheetTall, { backgroundColor: c.sheet, paddingBottom: bottom + 8, transform: [{ translateY: rise }] }]}>
        <View style={[styles.grab, { backgroundColor: c.line }]} />
        {title ? (
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: c.text }]} accessibilityRole="header">{title}</Text>
            <IconButton name="close" label="Close" onPress={onClose} />
          </View>
        ) : null}
        {children}
      </Animated.View>
    </Modal>
  );
}

export function MenuItem({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menu, pressed && { backgroundColor: c.raised }]} accessibilityRole="button">
      <Ionicons name={icon} size={22} color={c.text} />
      <Text style={[styles.menuText, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Empty({ text }: { text: string }) {
  const c = useColors();
  return <Text style={[styles.empty, { color: c.muted }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  logo: { flexDirection: "row", alignItems: "center", paddingLeft: 10, flex: 1 },
  logoText: { fontFamily: font.display, fontSize: 24, fontWeight: "800", letterSpacing: -1 },
  bar: { zIndex: 2 },
  barRow: { height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 4 },
  barTitle: { flex: 1, fontFamily: font.display, fontSize: 20, fontWeight: "600", letterSpacing: -0.3, paddingLeft: 4 },
  grow: { flex: 1 },
  heading: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, gap: 2 },
  h1: { fontFamily: font.display, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  h1Sub: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
  chipScroll: { flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12, alignItems: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 15, borderRadius: 18 },
  chipText: { fontFamily: font.body, fontSize: 14, fontWeight: "600" },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "85%", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10 },
  sheetTall: { height: "85%" },
  grab: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 20, paddingRight: 10 },
  sheetTitle: { fontFamily: font.display, fontSize: 20, fontWeight: "600", letterSpacing: -0.3, flexShrink: 1 },
  menu: { flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 22, paddingVertical: 14, marginHorizontal: 8, borderRadius: 14 },
  menuText: { fontFamily: font.body, fontSize: 16, fontWeight: "500", flexShrink: 1 },
  empty: { fontFamily: font.body, fontSize: 15, lineHeight: 22, padding: 20, textAlign: "center" },
});
