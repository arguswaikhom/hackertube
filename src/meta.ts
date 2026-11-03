// YouTube's numbers (duration, views, likes, upload date, removed videos, channel avatars). They can't ship inside
// the app, so scripts/fetch_youtube_meta.py publishes a file that the app downloads and caches.
// No file configured or none reachable: the app still works, without those numbers.
import { useSyncExternalStore } from "react";
import Storage from "expo-sqlite/kv-store";
import Constants from "expo-constants";
import type { Meta, MetaLookup } from "./picks";

// The fifth number, when present, indexes `channels` ([channel id, avatar URL or ""]). Older files have neither.
type MetaFile = { generated: string; videos: Record<string, number[]>; gone: string[]; channels?: [string, string][] };

const KEY = "youtube-meta";
const DAY = 864e5;
const MAX_AGE = 30 * DAY; // YouTube's developer policies: stored API data must not go staler than this

const url = (Constants.expoConfig?.extra as { metaUrl?: string } | undefined)?.metaUrl;

let file: MetaFile | null = null;
const listeners = new Set<() => void>();
let version = 0;

const usable = (f: MetaFile | null) => !!f && Date.now() - Date.parse(f.generated) < MAX_AGE;

function set(f: MetaFile) {
  file = f;
  version++;
  listeners.forEach((l) => l());
}

export function loadMeta() {
  try {
    const raw = Storage.getItemSync(KEY);
    const cached: MetaFile | null = raw ? JSON.parse(raw) : null;
    if (usable(cached)) file = cached;
    else if (raw) Storage.removeItemSync(KEY);
  } catch {
    Storage.removeItemSync(KEY);
  }
  if (!url || (file && Date.now() - Date.parse(file.generated) < DAY)) return;
  fetch(url)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((f: MetaFile) => {
      if (!usable(f)) return;
      Storage.setItemSync(KEY, JSON.stringify(f));
      set(f);
    })
    .catch(() => {}); // offline: keep what's cached
}

export const hasMeta = () => !!file;

export const metaOf: MetaLookup = (vid) => {
  const v = file?.videos[vid];
  if (!v) return undefined;
  const m: Meta = { duration: v[0], views: v[1], likes: v[2], published: v[3] * 1000 };
  return m;
};

const channelOf = (vid: string) => {
  const i = file?.videos[vid]?.[4];
  return i === undefined ? undefined : file?.channels?.[i];
};

export const avatarOf = (vid: string) => channelOf(vid)?.[1] || undefined;

/** The channel on YouTube, or a YouTube search for its name until the metadata file says which channel it is. */
export const channelUrl = (vid: string, name: string) => {
  const id = channelOf(vid)?.[0];
  return id ? `https://www.youtube.com/channel/${id}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`;
};

export const goneVideos = () => file?.gone ?? [];

/** Re-renders when fresh numbers arrive. */
export const useMetaVersion = () =>
  useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => version);
