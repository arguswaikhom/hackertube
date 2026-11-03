# Parity with hackertube.org

Audited against the site's client code on 2026-11-02. Status: **Done**, **Needs metadata** (works once
`docs/DECISIONS.md` D5 is set up), **Partial**, or **Left out**.

| Site feature | Status | Where, or why not |
|---|---|---|
| Home: mixed feed, endless, rerolled each launch | Done | `feed()` in `src/picks.ts` |
| Reason for each pick | Done | Under the card; the site shows it on hover |
| Pick kinds: classics, recent, deep cuts, explore, random, similar, same people | Done | `feed()` |
| Pick kind: hidden gems | Needs metadata | Needs view counts |
| Topic area chips on Home | Done | `src/app/(tabs)/index.tsx` |
| Longs | Needs metadata | Tab is there and explains why it's empty |
| Categories page with counts and quick links | Done | `categories.tsx` |
| Area page and category page with breadcrumb | Done | `browse.tsx` |
| All videos | Done | `browse.tsx` |
| Filters: Type, Evergreen | Done | `Filters.tsx` |
| Filters: Upload date, Duration, Hidden gems | Needs metadata | Hidden until available |
| Sort: Best, Recently recommended, Most recommended | Done | `applyFilter()` |
| Sort: Upload date, Oldest, View count, Like ratio | Needs metadata | Hidden until available |
| Active filter chips | Done | `Filters.tsx` |
| Playlists: 27, in two tiers, intro and notes | Done | `playlists.tsx`, `playlist/[slug].tsx` |
| Playlist total length | Needs metadata | Shown when available |
| Search: keyword | Done | SQLite FTS5 |
| Search: by topic | Partial | Pre-built vectors (D6); no reranker |
| Search: "closest videos" note, topic match label, filters | Done | `search.tsx` |
| Search rate-limit message | Left out | Search runs on the device |
| Watch: frame first, then play | Done | `Player.tsx` |
| Own controls: seek, ±10 s, speed, captions, full screen | Done | `Player.tsx` |
| Watch: like, dislike, watch later, open in YouTube | Done | `watch/[vid].tsx` |
| Watch: recommender line | Done | `recLine` |
| Watch: type, shelf life, summary, why HN, categories, tags | Done | Description sheet |
| Watch: views and age | Needs metadata | Shows HN numbers until then |
| Watch: every comment, with author, story, stance, HN link | Done | Comments sheet |
| Up next (20) | Done | `upNext()` |
| Liked, Watch later, History | Done | `you.tsx`, `saved/[kind].tsx` |
| Clear watch history | Done | History screen |
| Play all on YouTube | Done | `PlayAll` in `Lists.tsx` |
| Watch-later clock on thumbnails | Done | `Frame` |
| Duration badge on thumbnails | Needs metadata | |
| Channel avatars on cards and the watch page | Needs metadata | `Avatar` in `VideoCard.tsx`; initial until then |
| Channel link on the watch page | Done | Opens the channel in YouTube (`channelUrl` in `meta.ts`); a name search until metadata loads |
| Settings: frames or thumbnails | Done | `settings.tsx` |
| Theme: light, dark, device | Done | `settings.tsx` |
| About: why, how, privacy, credits, stats | Done | `about.tsx` |
| Data page and downloads | Partial | About links to the site's page |
| Keyboard shortcuts | Left out | D9 |
| Shareable links | Partial | Share sends the YouTube link; the app has no web pages of its own |

## In the app but not on the site

- Works offline, apart from playback.
- Player closes at the end of a video.
- Removed videos hide themselves after a failed play.
- Three-dot menu with Not interested and Share.
