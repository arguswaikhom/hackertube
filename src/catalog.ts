// Read-only access to the bundled catalogue (see scripts/build_catalog.py).
import type { SQLiteDatabase } from "expo-sqlite";
import { goneVideos, metaOf } from "./meta";
import {
  DIM, applyFilter, feed, ftsQuery, fuse, nearest, nearestTo, termsOf, type Filter, type Item, type Pick,
} from "./picks";
import { getState } from "./store";

export type Video = {
  row: number; vid: string; title: string; channel: string; summary: string; why_hn: string;
  content_type: string; level: string; shelf_life: string; area: string; tags: string; quote: string | null;
  recommenders: number; rec_months: number; mentions: number; first_year: number; last_year: number;
  last_month: string; score: number;
};
export type Mention = { id: number; author: string; month: string; story: string; stance: string; text: string };
export type Category = { id: string; name: string; n: number };
export type Area = { id: string; name: string; n: number; categories: Category[] };
export type Playlist = { slug: string; title: string; tier: string; pitch: string; intro: string; count: number; cover: string[] };
export type PlaylistEntry = Video & { note: string };

let db: SQLiteDatabase;
let items: Item[] = [];
let vectors: Int8Array = new Int8Array(0);
let termVectors: Int8Array = new Int8Array(0);
let lexicon = new Map<string, number>();
let rowOf = new Map<string, number>();
let areaNames = new Map<string, string>();

const blob = (id: number) => {
  const b = db.getFirstSync<{ data: Uint8Array }>("SELECT data FROM vectors WHERE id = ?", [id])!.data;
  return new Int8Array(b.buffer, b.byteOffset, b.length);
};

export function openCatalog(database: SQLiteDatabase) {
  db = database;
  const rows = db.getAllSync<{
    row: number; vid: string; score: number; area: string; last_year: number; last_month: string;
    content_type: string; shelf_life: string; recommenders: number;
  }>("SELECT row, vid, score, area, last_year, last_month, content_type, shelf_life, recommenders FROM videos ORDER BY row");
  items = rows.map((r) => ({
    row: r.row, vid: r.vid, score: r.score, area: r.area, lastYear: r.last_year, lastMonth: r.last_month,
    type: r.content_type, shelf: r.shelf_life, recommenders: r.recommenders,
  }));
  rowOf = new Map(rows.map((r) => [r.vid, r.row]));
  vectors = blob(1);
  if (vectors.length !== items.length * DIM) throw new Error("Catalogue vectors don't match its videos");
  termVectors = blob(2);
  lexicon = new Map(db.getAllSync<{ term: string; idx: number }>("SELECT term, idx FROM lexicon").map((l) => [l.term, l.idx]));
  areaNames = new Map(db.getAllSync<{ id: string; name: string }>("SELECT id, name FROM areas").map((a) => [a.id, a.name]));
}

const toRows = (vids: string[]) => vids.flatMap((v) => rowOf.get(v) ?? []);

/** Removed from YouTube, as reported by the metadata file or a failed play on this device. */
const hiddenRows = () => new Set(toRows([...goneVideos(), ...getState().hidden]));

export const byRows = (rows: number[]): Video[] => {
  if (!rows.length) return [];
  const found = db.getAllSync<Video>(`SELECT * FROM videos WHERE row IN (${rows.map(Number).join(",")})`);
  const at = new Map(found.map((v) => [v.row, v]));
  return rows.flatMap((r) => at.get(r) ?? []);
};

export const videosFor = (vids: string[]) => byRows(toRows(vids));

export const video = (vid: string) => db.getFirstSync<Video>("SELECT * FROM videos WHERE vid = ?", [vid]);

export const mentions = (row: number) =>
  db.getAllSync<Mention>("SELECT id, author, month, story, stance, text FROM mentions WHERE row = ? ORDER BY stance = 'strong_rec' DESC, stance = 'rec' DESC, month DESC", [row]);

export const videoCategories = (row: number) =>
  db.getAllSync<{ id: string; name: string }>(
    "SELECT c.id, c.name FROM video_categories v JOIN categories c ON c.id = v.cat WHERE v.row = ? ORDER BY v.rank", [row]);

const related = (row: number) =>
  db.getAllSync<{ other: number }>("SELECT other FROM related WHERE row = ? ORDER BY shared DESC", [row]).map((r) => r.other);

export function homeFeed(seed: string): Pick[] {
  const s = getState();
  return feed(items, vectors, {
    likes: toRows(s.likes), dislikes: toRows(s.dislikes), seen: toRows(s.seen), hidden: [...hiddenRows()], related,
  }, seed, metaOf, areaNames);
}

/** Up next: what the same HN people recommended, then the closest videos. */
export function upNext(row: number, n = 20) {
  const skip = hiddenRows();
  const out = new Set(related(row).slice(0, 8));
  for (const r of nearest(vectors, items.length, [row], n + 8)) out.add(r);
  return byRows([...out].filter((r) => !skip.has(r)).slice(0, n));
}

export function search(text: string, filter: Filter = {}, limit = 40) {
  const all = ftsQuery(text);
  if (!all) return { results: [] as (Video & { topicMatch: boolean })[], weak: false };
  const sql = `SELECT rowid AS row FROM search WHERE search MATCH ? ORDER BY bm25(search, 10, 4, 6, 2, 1) LIMIT ${limit}`;
  const run = (q: string) => db.getAllSync<{ row: number }>(sql, [q]).map((r) => r.row);
  let keyword = run(all);
  if (!keyword.length) keyword = run(all.replaceAll(" ", " OR "));

  // Topic matches: add up the vectors of the query's known terms, built at catalogue time.
  const terms = termsOf(text, (t) => lexicon.has(t));
  let topic: number[] = [];
  if (terms.length) {
    const q = new Float32Array(DIM);
    for (const t of terms) {
      const off = lexicon.get(t)! * DIM;
      for (let i = 0; i < DIM; i++) q[i] += termVectors[off + i];
    }
    topic = nearestTo(vectors, items.length, q, limit);
  }

  const skip = hiddenRows();
  const matched = new Set(keyword);
  const allowed = new Set(applyFilter(items, filter, metaOf).map((i) => i.row));
  const rows = fuse([keyword, topic], limit * 2).filter((r) => allowed.has(r) && !skip.has(r)).slice(0, limit);
  const sorted = filter.sort ? applyFilter(rows.map((r) => items[r - 1]), { sort: filter.sort }, metaOf).map((i) => i.row) : rows;
  return {
    results: byRows(sorted).map((v) => ({ ...v, topicMatch: !matched.has(v.row) })),
    weak: keyword.length === 0,
  };
}

/** Every matching row, best first. Screens page through this with byRows. */
export function browse(filter: Filter & { cat?: string }) {
  const skip = hiddenRows();
  let pool = items.filter((i) => !skip.has(i.row));
  if (filter.cat) {
    const inCat = new Set(db.getAllSync<{ row: number }>("SELECT row FROM video_categories WHERE cat = ?", [filter.cat]).map((r) => r.row));
    pool = pool.filter((i) => inCat.has(i.row));
  }
  return applyFilter(pool, filter, metaOf).map((i) => i.row);
}

export function topics(): Area[] {
  const cats = db.getAllSync<Category & { area: string }>(
    `SELECT c.id, c.name, c.area, count(*) AS n FROM categories c JOIN video_categories vc ON vc.cat = c.id
     GROUP BY c.id ORDER BY n DESC`);
  return db.getAllSync<{ id: string; name: string; n: number }>(
    "SELECT a.id, a.name, count(*) AS n FROM areas a JOIN videos v ON v.area = a.id GROUP BY a.id ORDER BY n DESC")
    .map((a) => ({ ...a, categories: cats.filter((c) => c.area === a.id) }));
}

export const categoryName = (id: string) =>
  db.getFirstSync<{ name: string; area: string; area_name: string }>(
    "SELECT c.name, c.area, a.name AS area_name FROM categories c JOIN areas a ON a.id = c.area WHERE c.id = ?", [id]);

export function playlists(): Playlist[] {
  const rows = db.getAllSync<Omit<Playlist, "count" | "cover">>("SELECT slug, title, tier, pitch, intro FROM playlists ORDER BY position");
  return rows.map((p) => {
    const vids = db.getAllSync<{ vid: string }>(
      "SELECT v.vid FROM playlist_videos p JOIN videos v ON v.row = p.row WHERE p.slug = ? ORDER BY p.position", [p.slug]);
    return { ...p, count: vids.length, cover: vids.slice(0, 4).map((v) => v.vid) };
  });
}

export const playlist = (slug: string) => playlists().find((p) => p.slug === slug);

export const playlistVideos = (slug: string) =>
  db.getAllSync<PlaylistEntry>(
    "SELECT v.*, p.note FROM playlist_videos p JOIN videos v ON v.row = p.row WHERE p.slug = ? ORDER BY p.position", [slug]);

export const stats = () => ({
  videos: items.length,
  comments: db.getFirstSync<{ n: number }>("SELECT count(*) AS n FROM mentions")!.n,
  categories: db.getFirstSync<{ n: number }>("SELECT count(*) AS n FROM categories")!.n,
  areas: areaNames.size,
});
