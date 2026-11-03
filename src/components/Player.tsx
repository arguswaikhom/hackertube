import { useRef, useState, type ComponentRef } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { font, useColors } from "../theme";
import { hide, markSeen, update, useStore } from "../store";
import { Frame } from "./VideoCard";
import { Chip, IconButton, Press, Sheet } from "./ui";

// YouTube rejects embeds with no identity (error 153); this sets the Referer it needs.
const ORIGIN = `https://${Constants.expoConfig?.android?.package ?? "org.hackertube.app"}`;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const BAR = 88; // height of the controls under the video
const INSET = 100; // ponytail: rough room for the status bar and the close button above the player

// YouTube's own controls are hidden (controls: 0) and ours sit under the video, never on it:
// YouTube's policies don't allow anything in front of the embed.
const page = (vid: string, start: number, rate: number, cc: boolean) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body,#p{margin:0;width:100%;height:100%;background:#000}</style></head><body><div id="p"></div>
<script>
const say = (m) => window.ReactNativeWebView.postMessage(m);
let p, last = "";
// Not in YouTube's documented API, but widely used; the only way to switch captions from outside the player.
const cc = (on) => on ? (p.loadModule("captions"), p.setOption("captions", "reload", true)) : p.unloadModule("captions");
const tick = () => {
  const m = "t:" + p.getCurrentTime().toFixed(1) + ":" + p.getDuration() + ":" + p.getPlayerState();
  if (m !== last) say(last = m);
};
window.onYouTubeIframeAPIReady = () => p = new YT.Player("p", {
  host: "https://www.youtube-nocookie.com", videoId: ${JSON.stringify(vid)}, width: "100%", height: "100%",
  playerVars: { autoplay: 1, playsinline: 1, rel: 0, controls: 0, iv_load_policy: 3, start: ${Math.floor(start)}, origin: ${JSON.stringify(ORIGIN)} },
  events: {
    onReady: () => { p.setPlaybackRate(${rate}); cc(${cc}); setInterval(tick, 250); },
    onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) say("ended"); else tick(); },
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

export const clock = (s: number) => {
  const t = Math.max(0, Math.floor(s)), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, ss = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

function Seek({ pos, dur, onSeek }: { pos: number; dur: number; onSeek: (t: number) => void }) {
  const c = useColors();
  const [w, setW] = useState(1);
  const [drag, setDragState] = useState<number | null>(null);
  const last = useRef<number | null>(null); // a quick tap releases before the drag state re-renders
  const setDrag = (t: number | null) => { last.current = t; setDragState(t); };
  const at = (x: number) => Math.min(1, Math.max(0, x / w)) * dur;
  const shown = drag ?? pos, f = dur ? shown / dur : 0;
  return (
    <View style={styles.seek} onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => dur > 0} onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => setDrag(at(e.nativeEvent.locationX))}
      onResponderMove={(e) => setDrag(at(e.nativeEvent.locationX))}
      onResponderRelease={() => { if (last.current !== null) onSeek(last.current); setDrag(null); }}
      accessible accessibilityRole="adjustable" accessibilityLabel="Position"
      accessibilityValue={{ text: `${clock(shown)} of ${clock(dur)}` }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => onSeek(pos + (e.nativeEvent.actionName === "increment" ? 10 : -10))}>
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: `${f * 100}%`, backgroundColor: c.accent }]} />
      </View>
      <View pointerEvents="none" style={[styles.knob, { left: f * w - (drag === null ? 6 : 9), backgroundColor: c.accent }, drag !== null && styles.knobBig]} />
    </View>
  );
}

/** One YouTube embed with our controls under it. Mounted fresh for fullscreen, starting where the other left off. */
function Screen({ vid, start, width, full, onFull, onStatus, onTime }: {
  vid: string; start: number; width: number; full: boolean; onFull: () => void;
  onStatus: (s: Status) => void; onTime: (t: number) => void;
}) {
  const { speed, captions } = useStore();
  // fixed per mount: changing the page's HTML would reload the video
  const [rate] = useState(speed), [cc] = useState(captions);
  const web = useRef<ComponentRef<typeof WebView>>(null);
  const [t, setT] = useState({ pos: start, dur: 0, state: -1 });
  const [speeds, setSpeeds] = useState(false);
  const run = (js: string) => web.current?.injectJavaScript(`${js};true;`);
  const seek = (s: number) => { const to = Math.min(Math.max(0, s), t.dur || s); run(`p.seekTo(${to},true)`); setT({ ...t, pos: to }); };
  const playing = t.state === 1 || t.state === 3;

  const onMessage = (e: WebViewMessageEvent) => {
    const m = e.nativeEvent.data;
    if (m.startsWith("t:")) {
      const [, pos, dur, state] = m.split(":").map(Number);
      setT({ pos, dur, state });
      onTime(pos);
    } else if (m === "ended") onStatus("ended"); // closing the player skips YouTube's wall of suggestions
    else if (m === "offline") onStatus("offline");
    else if (m === "error:100") { hide(vid); onStatus("removed"); }
    else if (m.startsWith("error:")) onStatus("blocked");
  };

  return (
    <View style={{ width, alignSelf: "center" }}>
      <View style={[styles.box, { width }]}>
        <WebView
          ref={web}
          source={{ html: page(vid, start, rate, cc), baseUrl: ORIGIN }}
          onMessage={onMessage}
          onError={() => onStatus("offline")}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          style={styles.web}
        />
      </View>
      <View style={styles.bar}>
        <Seek pos={t.pos} dur={t.dur} onSeek={seek} />
        <View style={styles.row}>
          <IconButton name={playing ? "pause" : "play"} label={playing ? "Pause" : "Play"} color="#fff" size={26}
            onPress={() => run(playing ? "p.pauseVideo()" : "p.playVideo()")} />
          <IconButton name="play-back" label="Back 10 seconds" color="#fff" onPress={() => seek(t.pos - 10)} />
          <IconButton name="play-forward" label="Forward 10 seconds" color="#fff" onPress={() => seek(t.pos + 10)} />
          <Text style={styles.time}>{clock(t.pos)}{t.dur ? ` / ${clock(t.dur)}` : ""}</Text>
          <Press onPress={() => { update({ captions: !captions }); run(`cc(${!captions})`); }} style={[styles.speed, captions && styles.on]}
            accessibilityRole="switch" accessibilityState={{ checked: captions }} accessibilityLabel="Captions">
            <Text style={[styles.speedText, captions && styles.onText]}>CC</Text>
          </Press>
          <Press onPress={() => setSpeeds(true)} style={styles.speed} accessibilityRole="button" accessibilityLabel={`Speed ${speed}×`}>
            <Text style={styles.speedText}>{speed}×</Text>
          </Press>
          <IconButton name={full ? "contract" : "expand"} label={full ? "Exit full screen" : "Full screen"} color="#fff" onPress={onFull} />
        </View>
      </View>
      <Sheet open={speeds} onClose={() => setSpeeds(false)} title="Playback speed">
        <View style={styles.speeds}>
          {SPEEDS.map((s) => (
            <Chip key={s} label={s === 1 ? "Normal" : `${s}×`} on={s === speed}
              onPress={() => { update({ speed: s }); run(`p.setPlaybackRate(${s})`); setSpeeds(false); }} />
          ))}
        </View>
      </Sheet>
    </View>
  );
}

export function Player({ vid, title }: { vid: string; title: string }) {
  const c = useColors();
  const win = useWindowDimensions();
  const [status, setStatus] = useState<Status>("ready");
  const [full, setFull] = useState(false);
  const [width, setWidth] = useState(0);
  const pos = useRef(0);
  const [start, setStart] = useState(0); // where a newly mounted embed begins
  const toggle = () => { setStart(pos.current); setFull((f) => !f); };
  const onStatus = (s: Status) => { setStatus(s); setFull(false); };

  if (status === "playing") {
    // In full screen the video takes the largest 16:9 box that leaves room for the controls.
    const fw = Math.min(win.width, ((win.height - BAR) * 16) / 9);
    return (
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {full ? (
          <View style={{ height: (width * 9) / 16 + BAR, backgroundColor: "#000" }} />
        ) : width ? (
          <Screen vid={vid} start={start} width={Math.min(width, ((win.height - BAR - INSET) * 16) / 9)} full={false} onFull={toggle} onStatus={onStatus} onTime={(t) => (pos.current = t)} />
        ) : null}
        {full ? (
          <Modal visible onRequestClose={toggle} supportedOrientations={["portrait", "landscape"]} statusBarTranslucent navigationBarTranslucent>
            <StatusBar hidden />
            <View style={styles.full}>
              <Screen vid={vid} start={start} width={fw} full onFull={toggle} onStatus={onStatus} onTime={(t) => (pos.current = t)} />
            </View>
          </Modal>
        ) : null}
      </View>
    );
  }

  const note = NOTE[status];
  return (
    <View style={{ width: "100%", maxWidth: ((win.height - BAR - INSET) * 16) / 9, alignSelf: "center" }}>
      <Pressable
        onPress={() => { markSeen(vid); pos.current = 0; setStart(0); setStatus("playing"); }}
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
  box: { aspectRatio: 16 / 9, backgroundColor: "#000" },
  web: { flex: 1, backgroundColor: "#000" },
  full: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  bar: { height: BAR, backgroundColor: "#000", paddingHorizontal: 4 },
  seek: { height: 28, justifyContent: "center", marginHorizontal: 12 },
  track: { height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  fill: { height: 3 },
  knob: { position: "absolute", width: 12, height: 12, borderRadius: 6 },
  knobBig: { width: 18, height: 18, borderRadius: 9 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  time: { flex: 1, color: "#fff", fontFamily: font.body, fontSize: 13, marginLeft: 6, fontVariant: ["tabular-nums"] },
  speed: { paddingHorizontal: 12, height: 30, borderRadius: 15, justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
  on: { backgroundColor: "#fff" },
  onText: { color: "#000" },
  speedText: { color: "#fff", fontFamily: font.body, fontSize: 13, fontWeight: "700" },
  speeds: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  play: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" },
  nudge: { marginLeft: 4 }, // the play triangle looks off-centre without it
  note: { fontFamily: font.body, fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingTop: 10 },
  link: { fontFamily: font.body, fontSize: 14, fontWeight: "600", paddingHorizontal: 12, paddingTop: 6 },
});
