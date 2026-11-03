import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { font, useColors } from "../theme";
import { hide, markSeen } from "../store";
import { Frame } from "./VideoCard";

// YouTube rejects embeds with no identity (error 153); this sets the Referer it needs.
const ORIGIN = `https://${Constants.expoConfig?.android?.package ?? "org.hackertube.app"}`;

const page = (vid: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body,#p{margin:0;width:100%;height:100%;background:#000}</style></head><body><div id="p"></div>
<script>
const say = (m) => window.ReactNativeWebView.postMessage(m);
window.onYouTubeIframeAPIReady = () => new YT.Player("p", {
  host: "https://www.youtube-nocookie.com", videoId: ${JSON.stringify(vid)}, width: "100%", height: "100%",
  playerVars: { autoplay: 1, playsinline: 1, rel: 0, origin: ${JSON.stringify(ORIGIN)} },
  events: {
    onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) say("ended"); },
    onError: (e) => say("error:" + e.data),
  },
});
</script>
<script src="https://www.youtube.com/iframe_api" onerror="say('offline')"></script></body></html>`;

type Status = "ready" | "playing" | "ended" | "offline" | "removed" | "blocked";

const NOTE: Partial<Record<Status, string>> = {
  offline: "You're offline. Videos need a connection, but everything else here still works.",
  removed: "This video was removed from YouTube, so it won't appear in your lists again.",
  blocked: "This video's owner doesn't allow it to play here.",
};

export function Player({ vid, title }: { vid: string; title: string }) {
  const c = useColors();
  const [status, setStatus] = useState<Status>("ready");

  const onMessage = (e: WebViewMessageEvent) => {
    const m = e.nativeEvent.data;
    if (m === "ended") setStatus("ended"); // closing the player skips YouTube's wall of suggestions
    else if (m === "offline") setStatus("offline");
    else if (m === "error:100") { hide(vid); setStatus("removed"); }
    else if (m.startsWith("error:")) setStatus("blocked");
  };

  if (status === "playing") {
    return (
      <View style={styles.box}>
        <WebView
          source={{ html: page(vid), baseUrl: ORIGIN }}
          onMessage={onMessage}
          onError={() => setStatus("offline")}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          style={styles.web}
        />
      </View>
    );
  }

  const note = NOTE[status];
  return (
    <View>
      <Pressable
        onPress={() => { markSeen(vid); setStatus("playing"); }}
        accessibilityRole="button"
        accessibilityLabel={`${status === "ended" ? "Watch again" : "Play"}: ${title}`}
      >
        <Frame vid={vid} badge={false} />
        <View style={styles.center}>
          <View style={styles.play}>
            <Ionicons name={status === "ended" ? "refresh" : "play"} size={30} color="#fff" style={status === "ended" ? undefined : styles.nudge} />
          </View>
        </View>
      </Pressable>
      {note ? <Text style={[styles.note, { color: c.muted }]}>{note}</Text> : null}
      {status === "blocked" ? (
        <Pressable onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${vid}`)} hitSlop={8}>
          <Text style={[styles.link, { color: c.accent }]}>Open in YouTube</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  web: { flex: 1, backgroundColor: "#000" },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  play: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" },
  nudge: { marginLeft: 4 }, // the play triangle looks off-centre without it
  note: { fontFamily: font.body, fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingTop: 10 },
  link: { fontFamily: font.body, fontSize: 14, fontWeight: "600", paddingHorizontal: 12, paddingTop: 6 },
});
