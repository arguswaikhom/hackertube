import { AccessibilityInfo, Dimensions, useColorScheme } from "react-native";
import { useStore } from "./store";

// YouTube's neutral palette with HackerTube's orange (#ff6600, from hackertube.org). See docs/DECISIONS.md, D7 and D14.
// accentText is the orange for small text: #FF6600 on white is too faint to read.
const dark = {
  bg: "#0F0F0F", raised: "#222222", sheet: "#1C1C1C", line: "#2E2E2E",
  text: "#F1F1F1", muted: "#AAAAAA", accent: "#FF6600", accentText: "#FF8A3D", accentSoft: "rgba(255,102,0,0.18)",
  link: "#3EA6FF", chipOn: "#F1F1F1", chipOnText: "#0F0F0F", badge: "rgba(0,0,0,0.72)",
};
const light: typeof dark = {
  bg: "#FFFFFF", raised: "#F2F2F2", sheet: "#FFFFFF", line: "#E8E8E8",
  text: "#0F0F0F", muted: "#606060", accent: "#FF6600", accentText: "#C24E00", accentSoft: "rgba(255,102,0,0.16)",
  link: "#065FD4", chipOn: "#0F0F0F", chipOnText: "#FFFFFF", badge: "rgba(0,0,0,0.72)",
};

export function useColors() {
  const system = useColorScheme();
  const { theme } = useStore();
  return (theme === "system" ? system : theme) === "dark" ? dark : light;
}

/** Embedded with the expo-font plugin in app.json: Figtree for reading, Bricolage Grotesque for the wordmark and headings. */
export const font = { body: "Figtree", display: "Bricolage Grotesque" } as const;

/** Columns for a video grid: one on phones, more on tablets. */
export const columnsFor = (width: number) => (width >= 1100 ? 3 : width >= 680 ? 2 : 1);

/** Shortest side of 600 dp or more: Android's own cutoff for tablets. Doesn't change with rotation. */
const screen = Dimensions.get("screen");
export const tablet = Math.min(screen.width, screen.height) >= 600;

export const hit = 12; // extra touch area around small icons

// Read once at launch; animations check it so "Remove animations" in system settings is respected.
export let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled().then((on) => { reduceMotion = on; });
AccessibilityInfo.addEventListener("reduceMotionChanged", (on) => { reduceMotion = on; });
