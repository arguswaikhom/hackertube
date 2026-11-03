"""Write public/meta.json: YouTube's numbers for every catalogue video, for the app to download.

Usage: YOUTUBE_API_KEY=... python scripts/fetch_youtube_meta.py <videos.jsonl or vids.txt>
Standard library only. Costs about 130 quota units for videos plus one per 50 channels (free limit: 10,000 a day).
Each video's entry ends with an index into "channels", a list of [channel id, avatar URL or ""].
Run at least every 30 days: YouTube's developer policies require stored data to stay current.
See docs/DECISIONS.md, D5.
"""
import calendar, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

DUR = re.compile(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$")


def seconds(iso):
    d, h, m, s = (int(x or 0) for x in DUR.match(iso).groups())
    return d * 86400 + h * 3600 + m * 60 + s


def entry(item):
    """[duration_s, views, likes, published_epoch_s], or None if it can't play."""
    if item is None or item["status"]["privacyStatus"] == "private" or not item["status"].get("embeddable", True):
        return None
    st = item.get("statistics", {})
    published = datetime.strptime(item["snippet"]["publishedAt"], "%Y-%m-%dT%H:%M:%SZ")
    return [seconds(item["contentDetails"]["duration"]), int(st.get("viewCount", 0)), int(st.get("likeCount", 0)),
            calendar.timegm(published.timetuple())]


def get(endpoint, ids, part, key):
    q = urllib.parse.urlencode({"part": part, "id": ",".join(ids), "key": key})
    return json.load(urllib.request.urlopen(f"https://www.googleapis.com/youtube/v3/{endpoint}?{q}"))["items"]


def avatar(channel):
    t = channel["snippet"]["thumbnails"]
    return (t.get("medium") or t["default"])["url"]


def main(path):
    key = os.environ["YOUTUBE_API_KEY"]
    text = Path(path).read_text(encoding="utf-8")
    vids = [json.loads(l)["vid"] for l in text.splitlines()] if path.endswith(".jsonl") else text.split()
    videos, gone, channel_of = {}, [], {}
    for i in range(0, len(vids), 50):
        ids = vids[i:i + 50]
        got = {it["id"]: it for it in get("videos", ids, "snippet,contentDetails,statistics,status", key)}
        for v in ids:
            e = entry(got.get(v))
            if e:
                videos[v] = e
                channel_of[v] = got[v]["snippet"]["channelId"]
            else:
                gone.append(v)
        time.sleep(0.2)
    cids = sorted(set(channel_of.values()))
    urls = {}
    for i in range(0, len(cids), 50):
        urls.update({c["id"]: avatar(c) for c in get("channels", cids[i:i + 50], "snippet", key)})
        time.sleep(0.2)
    index = {c: n for n, c in enumerate(cids)}
    channels = [[c, urls.get(c, "")] for c in cids]
    for v, c in channel_of.items():
        videos[v].append(index[c])
    Path("public").mkdir(exist_ok=True)
    Path("public/meta.json").write_text(json.dumps(
        {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "videos": videos, "gone": gone,
         "channels": channels},
        separators=(",", ":")), encoding="utf-8")
    print(len(videos), "videos,", len(gone), "gone,", len(channels), "channels")


if __name__ == "__main__":
    assert seconds("PT1H2M3S") == 3723 and seconds("PT45S") == 45 and seconds("P1DT1S") == 86401 and seconds("P0D") == 0
    ok = {"id": "x", "status": {"privacyStatus": "public"}, "statistics": {"viewCount": "5"},
          "contentDetails": {"duration": "PT1M"}, "snippet": {"publishedAt": "1970-01-02T00:00:00Z"}}
    assert entry(ok) == [60, 5, 0, 86400] and entry(None) is None
    assert avatar({"snippet": {"thumbnails": {"default": {"url": "d"}, "medium": {"url": "m"}}}}) == "m"
    assert entry({**ok, "status": {"privacyStatus": "public", "embeddable": False}}) is None
    main(sys.argv[1])
