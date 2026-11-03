"""Write public/meta.json: YouTube's numbers for every catalogue video, for the app to download.

Usage: YOUTUBE_API_KEY=... python scripts/fetch_youtube_meta.py <videos.jsonl or vids.txt>
Standard library only. Costs about 130 quota units (free limit: 10,000 a day).
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


def main(path):
    key = os.environ["YOUTUBE_API_KEY"]
    text = Path(path).read_text(encoding="utf-8")
    vids = [json.loads(l)["vid"] for l in text.splitlines()] if path.endswith(".jsonl") else text.split()
    videos, gone = {}, []
    for i in range(0, len(vids), 50):
        ids = vids[i:i + 50]
        q = urllib.parse.urlencode({"part": "snippet,contentDetails,statistics,status", "id": ",".join(ids), "key": key})
        got = {it["id"]: it for it in json.load(urllib.request.urlopen(f"https://www.googleapis.com/youtube/v3/videos?{q}"))["items"]}
        for v in ids:
            e = entry(got.get(v))
            if e:
                videos[v] = e
            else:
                gone.append(v)
        time.sleep(0.2)
    Path("public").mkdir(exist_ok=True)
    Path("public/meta.json").write_text(json.dumps(
        {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "videos": videos, "gone": gone},
        separators=(",", ":")), encoding="utf-8")
    print(len(videos), "videos,", len(gone), "gone")


if __name__ == "__main__":
    assert seconds("PT1H2M3S") == 3723 and seconds("PT45S") == 45 and seconds("P1DT1S") == 86401 and seconds("P0D") == 0
    ok = {"id": "x", "status": {"privacyStatus": "public"}, "statistics": {"viewCount": "5"},
          "contentDetails": {"duration": "PT1M"}, "snippet": {"publishedAt": "1970-01-02T00:00:00Z"}}
    assert entry(ok) == [60, 5, 0, 86400] and entry(None) is None
    assert entry({**ok, "status": {"privacyStatus": "public", "embeddable": False}}) is None
    main(sys.argv[1])
