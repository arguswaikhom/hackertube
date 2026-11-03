"""Save HackerTube's curated playlists to data/playlists.json (they aren't in the data zip).

Run rarely and by hand. Keeps only titles, intros, order and notes: the API's YouTube
metadata (views, durations, dates) is dropped because it can't be redistributed.
"""
import json, time, urllib.request

BASE = "https://hackertube.org/api"
UA = {"User-Agent": "hackertube-mobile-build (one-off playlist export)"}


def get(path):
    req = urllib.request.Request(BASE + path, headers=UA)
    return json.load(urllib.request.urlopen(req, timeout=30))


out = []
for p in get("/playlists"):
    time.sleep(1)  # be polite: this is someone's personal server
    d = get("/playlist?slug=" + p["slug"])
    out.append({"slug": d["slug"], "title": d["title"], "tier": d.get("tier") or "deep", "pitch": d["pitch"],
                "intro": d["intro"], "videos": [{"vid": v["vid"], "note": v.get("note", "")} for v in d["videos"]]})
with open("data/playlists.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print(len(out), "playlists,", sum(len(p["videos"]) for p in out), "entries")
