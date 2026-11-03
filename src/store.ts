// What the viewer did, kept on the device only. Stored by YouTube id, not row,
// so it survives a catalogue update.
import { useSyncExternalStore } from "react";
import Storage from "expo-sqlite/kv-store";

export type State = {
  likes: string[];
  dislikes: string[];
  later: string[];
  seen: string[]; // oldest first
  hidden: string[]; // videos YouTube reports as removed
  frames: boolean; // show a frame from the video instead of the uploader's thumbnail
  theme: "system" | "light" | "dark";
};

const KEY = "state-v2";
const empty: State = { likes: [], dislikes: [], later: [], seen: [], hidden: [], frames: true, theme: "system" };

const load = (): State => {
  try {
    return { ...empty, ...JSON.parse(Storage.getItemSync(KEY) ?? "{}") };
  } catch {
    return empty;
  }
};

let state = load();
const listeners = new Set<() => void>();

export function update(patch: Partial<State>) {
  state = { ...state, ...patch };
  Storage.setItemSync(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export const getState = () => state;

export const useStore = () =>
  useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), getState);

const toggled = (list: string[], vid: string) =>
  list.includes(vid) ? list.filter((v) => v !== vid) : [...list, vid];

export const toggleLater = (vid: string) => update({ later: toggled(state.later, vid) });

export const toggleLike = (vid: string) =>
  update({ likes: toggled(state.likes, vid), dislikes: state.dislikes.filter((v) => v !== vid) });

export const toggleDislike = (vid: string) =>
  update({ dislikes: toggled(state.dislikes, vid), likes: state.likes.filter((v) => v !== vid) });

export const markSeen = (vid: string) => update({ seen: [...state.seen.filter((v) => v !== vid), vid].slice(-500) });

export const hide = (vid: string) => {
  if (!state.hidden.includes(vid)) update({ hidden: [...state.hidden, vid] });
};
