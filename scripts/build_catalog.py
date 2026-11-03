"""Build assets/catalog.db from the HackerTube data export.

Usage: python scripts/build_catalog.py <dir with videos.jsonl etc> [out.db]
Get the export from https://hackertube.org/download/hackertube-data.zip

Needs numpy and fastembed (fastembed downloads the same bge-small model HackerTube used).
No YouTube metadata goes in here: its terms forbid redistribution. See docs/DECISIONS.md.
"""
import json, re, sqlite3, sys
from collections import Counter
from pathlib import Path

import numpy as np

MAX_WORDS, MAX_PHRASES = 20000, 6000
WORD = re.compile(r"[a-z0-9][a-z0-9+#.-]*[a-z0-9+#]|[a-z0-9]")
STOP = set("a an and are as at be but by for from has have in into is it its of on or that the their this to was were "
           "with you your not they he she his her we our how what why when who which about over than then there".split())


def jsonl(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def words(text):
    return WORD.findall(text.lower())


def lexicon(videos):
    """Words and topic phrases worth a vector, most common first."""
    w, p = Counter(), Counter()
    for v in videos:
        w.update(words(" ".join([v["title"], v["primary_topic"], v["summary"], v["why_hn"], *v["tags"]])))
        for t in [v["primary_topic"], *v["tags"]]:
            t = " ".join(words(t))
            if " " in t and len(t.split()) <= 3:
                p[t] += 1
    keep_w = [k for k, n in w.most_common() if n >= 2 and k not in STOP and len(k) > 1][:MAX_WORDS]
    keep_p = [k for k, n in p.most_common() if n >= 2][:MAX_PHRASES]
    return keep_w + keep_p


def to_int8(m):
    """int8 instead of float16: half the size, plenty for ranking."""
    return np.clip(np.round(m * 127), -127, 127).astype(np.int8)


def main(src, out):
    src = Path(src)
    videos = jsonl(src / "videos.jsonl")  # best-scored first, so row order is "best first"
    row_of = {v["vid"]: i + 1 for i, v in enumerate(videos)}  # row-1 == vector index
    taxonomy = json.load(open(src / "taxonomy.json", encoding="utf-8"))
    cat_desc = {c["id"]: c["description"] for a in taxonomy["areas"] for c in a["categories"]}

    out = Path(out)
    out.unlink(missing_ok=True)
    db = sqlite3.connect(out)
    db.executescript("""
      PRAGMA page_size=4096;
      CREATE TABLE videos(row INTEGER PRIMARY KEY, vid TEXT NOT NULL, title TEXT NOT NULL, channel TEXT NOT NULL,
        summary TEXT NOT NULL, why_hn TEXT NOT NULL, content_type TEXT NOT NULL, level TEXT NOT NULL,
        shelf_life TEXT NOT NULL, area TEXT NOT NULL, tags TEXT NOT NULL, quote TEXT, recommenders INTEGER NOT NULL,
        rec_months INTEGER NOT NULL, mentions INTEGER NOT NULL, first_year INTEGER NOT NULL, last_year INTEGER NOT NULL,
        last_month TEXT NOT NULL, score REAL NOT NULL);
      CREATE UNIQUE INDEX videos_vid ON videos(vid);
      CREATE TABLE areas(id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE categories(id TEXT PRIMARY KEY, name TEXT NOT NULL, area TEXT NOT NULL);
      CREATE TABLE video_categories(cat TEXT NOT NULL, row INTEGER NOT NULL, rank INTEGER NOT NULL,
        PRIMARY KEY(cat, row)) WITHOUT ROWID;
      CREATE INDEX video_categories_row ON video_categories(row);
      CREATE TABLE mentions(id INTEGER NOT NULL, row INTEGER NOT NULL, author TEXT NOT NULL, month TEXT NOT NULL,
        story TEXT NOT NULL, stance TEXT NOT NULL, text TEXT NOT NULL);
      CREATE INDEX mentions_row ON mentions(row);
      CREATE TABLE related(row INTEGER NOT NULL, other INTEGER NOT NULL, shared INTEGER NOT NULL);
      CREATE INDEX related_row ON related(row);
      CREATE TABLE playlists(slug TEXT PRIMARY KEY, title TEXT NOT NULL, tier TEXT NOT NULL, pitch TEXT NOT NULL,
        intro TEXT NOT NULL, position INTEGER NOT NULL);
      CREATE TABLE playlist_videos(slug TEXT NOT NULL, position INTEGER NOT NULL, row INTEGER NOT NULL, note TEXT NOT NULL,
        PRIMARY KEY(slug, position)) WITHOUT ROWID;
      CREATE TABLE stats(key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE lexicon(term TEXT PRIMARY KEY, idx INTEGER NOT NULL) WITHOUT ROWID;
      CREATE TABLE vectors(id INTEGER PRIMARY KEY, data BLOB NOT NULL);
      CREATE VIRTUAL TABLE search USING fts5(title, channel, topic, summary, extra, tokenize='porter unicode61');
    """)

    for a in taxonomy["areas"]:
        db.execute("INSERT INTO areas VALUES(?,?)", (a["id"], a["name"]))
        for c in a["categories"]:
            db.execute("INSERT INTO categories VALUES(?,?,?)", (c["id"], c["name"], a["id"]))

    all_mentions = [m for m in jsonl(src / "mentions.jsonl") if m["vid"] in row_of]
    last = {}
    for m in all_mentions:
        last[m["vid"]] = max(last.get(m["vid"], ""), m["month"])
        db.execute("INSERT INTO mentions VALUES(?,?,?,?,?,?,?)", (
            m["hn_comment_id"], row_of[m["vid"]], m["author"], m["month"], m["story_title"], m["stance"], m["text"]))

    for v in videos:
        r, q, hn = row_of[v["vid"]], v.get("quote") or {}, v["hn"]
        db.execute("INSERT INTO videos VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            r, v["vid"], v["title"], v["channel"], v["summary"], v["why_hn"], v["content_type"], v["level"],
            v["shelf_life"], v["categories"][0]["area"], json.dumps(v["tags"], ensure_ascii=False), q.get("text"),
            hn["recommenders"], hn["rec_months"], hn["mentions"], hn["first_year"], hn["last_year"],
            last.get(v["vid"], str(hn["last_year"])), v["score"]))
        for rank, c in enumerate(v["categories"]):
            db.execute("INSERT INTO video_categories VALUES(?,?,?)", (c["id"], r, rank))
        extra = " ".join([v["why_hn"], *v["tags"], *(c["name"] + " " + cat_desc.get(c["id"], "") for c in v["categories"])])
        db.execute("INSERT INTO search(rowid,title,channel,topic,summary,extra) VALUES(?,?,?,?,?,?)",
                   (r, v["title"], v["channel"], v["primary_topic"], v["summary"], extra))

    for line in jsonl(src / "related.jsonl"):
        if line["vid"] in row_of:
            for o in line["related"]:
                if o["vid"] in row_of:
                    db.execute("INSERT INTO related VALUES(?,?,?)",
                               (row_of[line["vid"]], row_of[o["vid"]], o["shared_recommenders"]))

    playlists = json.load(open("data/playlists.json", encoding="utf-8"))
    for i, p in enumerate(playlists):
        db.execute("INSERT INTO playlists VALUES(?,?,?,?,?,?)", (p["slug"], p["title"], p["tier"], p["pitch"], p["intro"], i))
        for j, e in enumerate(x for x in p["videos"] if x["vid"] in row_of):
            db.execute("INSERT INTO playlist_videos VALUES(?,?,?,?)", (p["slug"], j, row_of[e["vid"]], e["note"]))

    emb = np.load(src / "embeddings.npy").astype(np.float32)
    ids = json.load(open(src / "embedding_ids.json"))
    idx = {v: i for i, v in enumerate(ids)}
    db.execute("INSERT INTO vectors VALUES(1,?)", (to_int8(emb[[idx[v["vid"]] for v in videos]]).tobytes(),))

    # Topic search without a model on the device: embed the vocabulary here, ship the vectors.
    from fastembed import TextEmbedding
    terms = lexicon(videos)
    model = TextEmbedding("BAAI/bge-small-en-v1.5")
    term_vectors = np.array(list(model.embed(terms, batch_size=64)), dtype=np.float32)
    for i, t in enumerate(terms):
        db.execute("INSERT INTO lexicon VALUES(?,?)", (t, i))
    db.execute("INSERT INTO vectors VALUES(2,?)", (to_int8(term_vectors).tobytes(),))

    db.execute("INSERT INTO stats VALUES('generated', ?)", (json.load(open(src / "export.json"))["generated"]
                                                            if (src / "export.json").exists() else "2026-10-31",))
    db.commit()
    db.execute("INSERT INTO search(search) VALUES('optimize')")
    db.commit()
    db.execute("VACUUM")
    print(len(videos), "videos,", len(all_mentions), "mentions,", len(terms), "terms,", round(out.stat().st_size / 1e6, 1), "MB")


if __name__ == "__main__":
    assert words("C++ and Rust's type-system") == ["c++", "and", "rust", "s", "type-system"]
    vids = [{"title": "Rust talk", "primary_topic": "memory safety", "summary": "Rust rust", "why_hn": "", "tags": ["memory safety"]}]
    assert lexicon(vids) == ["rust", "memory", "safety", "memory safety"], lexicon(vids)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "assets/catalog.db")
