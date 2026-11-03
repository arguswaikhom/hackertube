import { useColorScheme } from "react-native";
import { useStore } from "./store";

// YouTube's neutral palette with HackerTube's orange (#ff6600, from hackertube.org). See docs/DECISIONS.md, D7.
const dark = {
  bg: "#0F0F0F", raised: "#272727", sheet: "#212121", line: "#3F3F3F",
  text: "#F1F1F1", muted: "#AAAAAA", accent: "#FF6600", link: "#3EA6FF",
  chipOn: "#F1F1F1", chipOnText: "#0F0F0F", badge: "rgba(0,0,0,0.8)",
};
const light: typeof dark = {
  bg: "#FFFFFF", raised: "#F2F2F2", sheet: "#FFFFFF", line: "#E5E5E5",
  text: "#0F0F0F", muted: "#606060", accent: "#FF6600", link: "#065FD4",
  chipOn: "#0F0F0F", chipOnText: "#FFFFFF", badge: "rgba(0,0,0,0.8)",
};

export function useColors() {
  const system = useColorScheme();
  const { theme } = useStore();
  return (theme === "system" ? system : theme) === "dark" ? dark : light;
}

/** Columns for a video grid: one on phones, more on tablets. */
export const columnsFor = (width: number) => (width >= 1100 ? 3 : width >= 680 ? 2 : 1);

export const hit = 12; // extra touch area around small icons
