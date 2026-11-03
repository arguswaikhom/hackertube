// Feed, filters and search ranking, computed on the device. Pure, so `npm test` can check it.

export const DIM = 384;

export type Item = {
  row: number; vid: string; score: number; area: string; lastYear: number; lastMonth: string;
  type: string; shelf: string; recommenders: number;
};
/** YouTube's own numbers for one video, from the refreshed metadata file. See src/meta.ts. */
export type Meta = { duration: number; views: number; likes: number; published: number /* ms since epoch */ };
export type MetaLookup = (vid: string) => Meta | undefined;

export type Pick = { row: number; reason: string };
export type Taste = {
  likes: number[];
  dislikes: number[];
  seen: number[];
  hidden: number[];
  related: (row: number) => number[]; // rows the same HN people recommended
};

export type Filter = {
  date?: string; type?: string; dur?: string; gems?: string; evergreen?: string; sort?: string;
  area?: string;
};

const GEM_VIEWS = 100_000; // same line HackerTube draws

/** Small seeded PRNG (mulberry32): the same seed gives the same feed. */
export function rng(seed: string) {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sum of the given rows' vectors. Rows are 1-based, vectors 0-based. */
export function centroid(vectors: Int8Array, rows: number[]) {
  const c = new Float32Array(DIM);
  for (const r of rows) for (let i = 0; i < DIM; i++) c[i] += vectors[(r - 1) * DIM + i];
  return c;
}

function dot(vectors: Int8Array, row: number, c: Float32Array) {
  let s = 0;
  const off = (row - 1) * DIM;
  for (let i = 0; i < DIM; i++) s += vectors[off + i] * c[i];
  return s;
}

/** Rows closest to a query vector, closest first. */
export function nearestTo(vectors: Int8Array, count: number, c: Float32Array, n: number, bad?: Float32Array, skip?: Set<number>) {
  const out: { row: number; s: number }[] = [];
  for (let row = 1; row <= count; row++) {
    if (skip?.has(row)) continue;
    out.push({ row, s: dot(vectors, row, c) - (bad ? dot(vectors, row, bad) * 0.5 : 0) });
  }
  return out.sort((a, b) => b.s - a.s).slice(0, n).map((o) => o.row);
}

/** The rows closest to the given ones, closest first, leaving those rows out. */
export function nearest(vectors: Int8Array, count: number, rows: number[], n: number, avoid: number[] = []) {
  return nearestTo(vectors, count, centroid(vectors, rows), n, avoid.length ? centroid(vectors, avoid) : undefined, new Set(rows));
}

/** Score-weighted draw so classics turn up often and everything else sometimes. */
function draw(items: Item[], rand: () => number, weight: (i: Item) => number = (i) => i.score) {
  const total = items.reduce((t, i) => t + weight(i), 0);
  let at = rand() * total;
  for (const i of items) if ((at -= weight(i)) <= 0) return i;
  return items[items.length - 1];
}

/**
 * The Home feed: one long mixed list, stable for a seed so paging and going back keep it.
 * Mixes the same kinds of pick HackerTube's Home does.
 */
export function feed(items: Item[], vectors: Int8Array, taste: Taste, seed: string, meta: MetaLookup, areaNames: Map<string, string>, size = 240): Pick[] {
  const rand = rng(seed);
  const blocked = new Set([...taste.seen, ...taste.dislikes, ...taste.likes, ...taste.hidden]);
  // news-only and never-recommended videos stay in Browse and Search, not in Home
  const open = items.filter((i) => !blocked.has(i.row) && i.shelf !== "news" && i.recommenders > 0);
  const byRow = new Map(items.map((i) => [i.row, i]));
  const picks: Pick[] = [];
  const used = new Set<number>();
  const add = (row: number | undefined, reason: string) => {
    const it = row === undefined ? undefined : byRow.get(row);
    if (!it || used.has(it.row) || blocked.has(it.row) || picks.length >= size) return false;
    used.add(it.row);
    picks.push({ row: it.row, reason });
    return true;
  };

  const likedRecent = taste.likes.slice(-8);
  const near = likedRecent.length ? nearest(vectors, items.length, likedRecent, 60, taste.dislikes.slice(-8)) : [];
  const peers = likedRecent.flatMap(taste.related);
  const touched = new Set([...taste.seen, ...taste.likes].map((r) => byRow.get(r)?.area));
  const fresh = open.filter((i) => !touched.has(i.area));
  const year = new Date().getFullYear();
  const recent = open.filter((i) => i.lastYear >= year - 1);
  const gems = open.filter((i) => { const m = meta(i.vid); return m && m.views < GEM_VIEWS; });
  const deep = open.filter((i) => i.score < 6);
  const pick = (list: number[]) => list[Math.floor(rand() * list.length)];

  // each pass over this cycle adds a few of everything, so any screenful is a mix
  for (let round = 0; round < 200 && picks.length < size && used.size < open.length; round++) {
    for (let k = 0; near.length && k < 2; k++) add(pick(near), "Similar to what you liked");
    if (peers.length) add(pick(peers), "Recommended by the same people");
    add(draw(open, rand).row, "An HN classic");
    if (gems.length) add(draw(gems, rand).row, "Hidden gem: loved on HN, little-watched on YouTube");
    if (recent.length) add(draw(recent, rand).row, "Recent on HN");
    if (deep.length) add(draw(deep, rand, () => 1).row, "Deep cut: rarely surfaced");
    if (fresh.length) { const f = draw(fresh, rand); add(f.row, `Explore: ${areaNames.get(f.area) ?? f.area}`); }
    if (open.length) add(open[Math.floor(rand() * open.length)].row, "Random pick");
  }
  return picks;
}

const YEAR_MS = 365.25 * 864e5;
const decade = (p: number) => Math.floor(new Date(p).getUTCFullYear() / 10) * 10;

/** Filters and sorts, matching HackerTube's Filters panel. Input stays best-first. */
export function applyFilter(items: Item[], f: Filter, meta: MetaLookup, now = Date.now()) {
  const m = (i: Item) => meta(i.vid);
  let out = items.filter((i) => {
    if (f.area && i.area !== f.area) return false;
    if (f.type && i.type !== f.type) return false;
    if (f.evergreen && i.shelf !== "evergreen") return false;
    if (f.date) {
      const v = m(i);
      if (!v) return false;
      if (f.date === "year" ? now - v.published > YEAR_MS : `${decade(v.published)}s` !== f.date) return false;
    }
    if (f.dur) {
      const d = m(i)?.duration;
      if (d === undefined) return false;
      if (f.dur === "short" ? d >= 240 : f.dur === "medium" ? d < 240 || d >= 1200 : f.dur === "long" ? d < 1200 || d >= 3600 : d < 3600) return false;
    }
    if (f.gems) {
      const v = m(i);
      if (!v || v.views >= GEM_VIEWS || i.recommenders === 0) return false;
    }
    return true;
  });
  const key: Record<string, (i: Item) => number | string> = {
    recent: (i) => i.lastMonth,
    date: (i) => m(i)?.published ?? 0,
    old: (i) => -(m(i)?.published ?? Infinity),
    views: (i) => m(i)?.views ?? 0,
    liked: (i) => { const v = m(i); return v && v.views ? v.likes / v.views : 0; },
    hn: (i) => i.recommenders,
  };
  const by = f.sort ? key[f.sort] : undefined;
  if (by) out = [...out].sort((a, b) => { const x = by(a), y = by(b); return x < y ? 1 : x > y ? -1 : a.row - b.row; });
  return out;
}

/** FTS5 query from free text: words are quoted so user input can't be FTS syntax. */
export function ftsQuery(text: string) {
  return tokens(text).map((w) => `"${w}"*`).join(" ");
}

export function tokens(text: string) {
  return text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#.-]*/gu) ?? [];
}

/** Terms to look up, longest phrases first: "distributed systems" beats its two words. */
export function termsOf(text: string, known: (term: string) => boolean) {
  const w = tokens(text);
  const out: string[] = [];
  for (let i = 0; i < w.length; ) {
    let len = Math.min(3, w.length - i);
    while (len > 1 && !known(w.slice(i, i + len).join(" "))) len--;
    const term = w.slice(i, i + len).join(" ");
    if (known(term)) out.push(term);
    i += len;
  }
  return out;
}

/** Reciprocal rank fusion: merges keyword and topic rankings without comparing their scores. */
export function fuse(lists: number[][], limit: number) {
  const score = new Map<number, number>();
  for (const list of lists) list.forEach((r, i) => score.set(r, (score.get(r) ?? 0) + 1 / (60 + i)));
  return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([r]) => r);
}

export const duration = (s?: number) => {
  if (!s) return "";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(x)}` : `${m}:${p(x)}`;
};

const short = (n: number, d: number, u: string) => `${(n / d).toFixed(1).replace(/\.0$/, "")}${u}`;
export const views = (n?: number) =>
  n == null ? "" : n >= 1e9 ? `${short(n, 1e9, "B")} views` : n >= 1e6 ? `${short(n, 1e6, "M")} views`
    : n >= 1e3 ? `${Math.round(n / 1e3)}K views` : `${n} views`;

export function ago(ms?: number, now = Date.now()) {
  if (!ms) return "";
  const s = (now - ms) / 1000;
  for (const [u, sec] of [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400]] as const) {
    const n = Math.floor(s / sec);
    if (n >= 1) return `${n} ${u}${n > 1 ? "s" : ""} ago`;
  }
  return "today";
}

export const hours = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`);

/** True when version `a` ("1.10.0" or "v1.10.0") is later than `b`. */
export function isNewer(a: string, b: string) {
  const n = (v: string) => v.replace(/^v/, "").split(".").map((x) => parseInt(x, 10) || 0);
  const [x, y] = [n(a), n(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
}
