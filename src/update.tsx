// Android copies installed from GitHub Releases: on launch, offer the newer APK if one is out, download it in the app
// and hand it to Android's installer. The workflow in .github/workflows/android-release.yml publishes a release for
// every `v*` tag. Android itself checks the new APK is signed with the same key before it installs over this one.
import { useSyncExternalStore } from "react";
import { Alert, Linking, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
import { startActivityAsync } from "expo-intent-launcher";
import Storage from "expo-sqlite/kv-store";
import { isNewer } from "./picks";
import { font, useColors } from "./theme";

type Release = { tag_name: string; html_url: string; assets: { name: string; browser_download_url: string }[] };

const SKIP = "update-skipped";
const FLAG_GRANT_READ_URI_PERMISSION = 1;
const extra = Constants.expoConfig?.extra as { releasesUrl?: string } | undefined;

// Download progress from 0 to 1, or null when nothing is downloading.
let progress: number | null = null;
const listeners = new Set<() => void>();
const setProgress = (p: number | null) => { progress = p; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function checkForUpdate() {
  const current = Constants.expoConfig?.version;
  if (Platform.OS !== "android" || __DEV__ || !current || !extra?.releasesUrl) return;
  fetch(extra.releasesUrl)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((rel: Release) => {
      const latest = rel.tag_name.replace(/^v/, "");
      const apk = rel.assets.find((a) => a.name.endsWith(".apk"));
      if (!apk || !isNewer(latest, current) || Storage.getItemSync(SKIP) === latest) return;
      Alert.alert("Update available", `HackerTube ${latest} is out. You have ${current}.`, [
        { text: "Skip this version", onPress: () => Storage.setItemSync(SKIP, latest) },
        { text: "Later", style: "cancel" },
        { text: "Update", onPress: () => install(apk.browser_download_url, latest, rel.html_url) },
      ]);
    })
    .catch(() => {}); // offline or rate-limited: ask again next launch
}

async function install(url: string, version: string, page: string) {
  if (progress !== null) return;
  setProgress(0);
  try {
    const file = await File.downloadFileAsync(url, new File(Paths.cache, `HackerTube-${version}.apk`), {
      idempotent: true,
      onProgress: ({ bytesWritten, totalBytes }) => totalBytes > 0 && setProgress(bytesWritten / totalBytes),
    });
    setProgress(null);
    // The first time, Android asks the user to allow installs from HackerTube, then shows its installer.
    await startActivityAsync("android.intent.action.VIEW", {
      data: file.contentUri, type: "application/vnd.android.package-archive", flags: FLAG_GRANT_READ_URI_PERMISSION,
    });
  } catch {
    setProgress(null);
    Alert.alert("Update didn't download", "Check your connection and try again, or get it from the release page.", [
      { text: "Close", style: "cancel" },
      { text: "Open release page", onPress: () => Linking.openURL(page) },
    ]);
  }
}

/** A floating card with the download's progress. Renders nothing when no update is downloading. */
export function UpdateProgress() {
  const p = useSyncExternalStore(subscribe, () => progress);
  const c = useColors();
  const { top } = useSafeAreaInsets();
  if (p === null) return null;
  return (
    <View style={[styles.card, { top: top + 8, backgroundColor: c.raised }]} accessibilityLiveRegion="polite">
      <Text style={[styles.label, { color: c.text }]}>Downloading update… {Math.round(p * 100)}%</Text>
      <View style={[styles.track, { backgroundColor: c.line }]}>
        <View style={[styles.fill, { width: `${p * 100}%`, backgroundColor: c.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: "absolute", left: 16, right: 16, borderRadius: 20, padding: 16, gap: 10, elevation: 6 },
  label: { fontFamily: font.body, fontWeight: "600", fontSize: 15 },
  track: { height: 4, borderRadius: 2, overflow: "hidden" },
  fill: { height: 4 },
});
