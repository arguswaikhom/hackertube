import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DIM, ago, applyFilter, duration, feed, ftsQuery, fuse, hours, nearest, termsOf, views,
  type Item, type Meta, type Taste,
} from "./picks.ts";

const AREAS = ["a", "b", "c", "d", "e"];
const items: Item[] = Array.from({ length: 400 }, (_, i) => ({
  row: i + 1, vid: `v${i + 1}`, score: 1 + (i % 9), area: AREAS[i % 5], lastYear: 2015 + (i % 12),
  lastMonth: `20${10 + (i % 16)}-01`, type: i % 2 ? "talk" : "demo", shelf: i % 10 === 0 ? "news" : "evergreen",
  recommenders: i % 7 === 0 ? 0 : 3,
}));
// each area points along its own axis, so "similar" means "same area"
const vectors = new Int8Array(400 * DIM);
items.forEach((it, i) => { vectors[i * DIM + AREAS.indexOf(it.area)] = 100; });
const blank: Taste = { likes: [], dislikes: [], seen: [], hidden: [], related: () => [] };
const none = () => undefined;
const names = new Map(AREAS.map((a) => [a, a.toUpperCase()]));
const f = (t: Taste, seed: string, meta: (v: string) => Meta | undefined = none) => feed(items, vectors, t, seed, meta, names);

test("same seed, same feed; new seed, new feed", () => {
  assert.deepEqual(f(blank, "d1"), f(blank, "d1"));
  assert.notDeepEqual(f(blank, "d1"), f(blank, "d2"));
});

test("feed has no repeats and no news-only or never-recommended videos", () => {
  const p = f(blank, "x");
  assert.equal(new Set(p.map((x) => x.row)).size, p.length);
  assert.ok(p.length > 100);
  for (const x of p) {
    assert.notEqual(items[x.row - 1].shelf, "news");
    assert.ok(items[x.row - 1].recommenders > 0);
  }
});

test("feed never repeats seen, liked, disliked or hidden videos", () => {
  const t = { ...blank, seen: [2, 3], likes: [4], dislikes: [5], hidden: [6] };
  const rows = f(t, "a").map((p) => p.row);
  for (const r of [2, 3, 4, 5, 6]) assert.ok(!rows.includes(r));
});

test("likes pull in similar videos", () => {
  const similar = f({ ...blank, likes: [2] }, "s").filter((x) => x.reason === "Similar to what you liked");
  assert.ok(similar.length >= 3);
  for (const x of similar) assert.equal(items[x.row - 1].area, "b");
});

test("hidden gems need view counts", () => {
  const low = (): Meta => ({ duration: 60, views: 500, likes: 1, published: 0 });
  assert.ok(!f(blank, "g").some((p) => p.reason.startsWith("Hidden gem")));
  assert.ok(f(blank, "g", low).some((p) => p.reason.startsWith("Hidden gem")));
});

test("nearest skips its inputs and pushes away from dislikes", () => {
  const n = nearest(vectors, 400, [1], 5, [2]);
  assert.ok(!n.includes(1));
  for (const r of n) assert.equal(items[r - 1].area, "a");
});

test("empty catalogue returns nothing", () => {
  assert.deepEqual(feed([], vectors, blank, "s", none, names), []);
});

const meta = (v: string): Meta | undefined => {
  const n = Number(v.slice(1));
  return n > 100 ? undefined : { duration: n * 60, views: n * 10000, likes: n, published: Date.UTC(2000 + (n % 25), 0, 1) };
};

test("filters: type, evergreen, area", () => {
  assert.ok(applyFilter(items, { type: "talk" }, none).every((i) => i.type === "talk"));
  assert.ok(applyFilter(items, { evergreen: "1" }, none).every((i) => i.shelf === "evergreen"));
  assert.ok(applyFilter(items, { area: "c" }, none).every((i) => i.area === "c"));
});

test("filters: duration bands match the site and need metadata", () => {
  const len = (dur: string) => applyFilter(items, { dur }, meta).map((i) => meta(i.vid)!.duration);
  assert.ok(len("short").every((d) => d < 240));
  assert.ok(len("medium").every((d) => d >= 240 && d < 1200));
  assert.ok(len("long").every((d) => d >= 1200 && d < 3600));
  assert.ok(len("xlong").length && len("xlong").every((d) => d >= 3600));
  assert.deepEqual(applyFilter(items, { dur: "xlong" }, none), []);
});

test("filters: decades, past year and hidden gems", () => {
  const d = applyFilter(items, { date: "2010s" }, meta);
  assert.ok(d.length && d.every((i) => new Date(meta(i.vid)!.published).getUTCFullYear() < 2020));
  const now = Date.UTC(2021, 6, 1);
  assert.ok(applyFilter(items, { date: "year" }, meta, now).every((i) => now - meta(i.vid)!.published < 366 * 864e5));
  assert.ok(applyFilter(items, { gems: "1" }, meta).every((i) => meta(i.vid)!.views < 100000 && i.recommenders > 0));
});

test("sorting", () => {
  const v = applyFilter(items, { sort: "views" }, meta);
  assert.equal(v[0].vid, "v100");
  assert.equal(applyFilter(items, { sort: "hn" }, none)[0].recommenders, 3);
  assert.equal(applyFilter(items, {}, none)[0].row, 1);
  assert.ok(applyFilter(items, { sort: "recent" }, none)[0].lastMonth >= "2025");
  const old = applyFilter(items, { sort: "old" }, meta);
  assert.equal(new Date(meta(old[0].vid)!.published).getUTCFullYear(), 2000);
});

test("search text cannot inject FTS syntax", () => {
  assert.equal(ftsQuery(`rust" OR (x*`), `"rust"* "or"* "x"*`);
  assert.equal(ftsQuery("!!!"), "");
});

test("phrases win over their words, unknown words drop out", () => {
  const known = (t: string) => ["distributed systems", "bridges", "systems"].includes(t);
  assert.deepEqual(termsOf("How distributed systems and bridges fail", known), ["distributed systems", "bridges"]);
});

test("fusion favours rows both lists agree on", () => {
  assert.equal(fuse([[1, 2, 3], [9, 2, 8]], 10)[0], 2);
  assert.equal(fuse([[1, 2, 3]], 2).length, 2);
});

test("formatting matches the site", () => {
  assert.equal(duration(3769), "1:02:49");
  assert.equal(duration(65), "1:05");
  assert.equal(views(877000), "877K views");
  assert.equal(views(1200000), "1.2M views");
  assert.equal(ago(Date.UTC(2020, 0, 1), Date.UTC(2023, 0, 2)), "3 years ago");
  assert.equal(hours(392), "6 hr 32 min");
});
