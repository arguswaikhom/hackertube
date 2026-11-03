# Decisions

Why the app is the way it is. Add new decisions at the end with the next number. If one is reversed, mark it
"Replaced by D<n>" and keep the entry, so the reasoning isn't lost.

## D1. Bundle the catalogue in the app (2026-11-02)
All browsing, search and recommendations run on the device from `assets/catalog.db`.
**Why:** hackertube.org is a personal server and its `robots.txt` disallows `/api/`, so a public app shouldn't
depend on it. It also makes everything except playback work offline.

## D2. No offline video (2026-11-02)
Videos play only through YouTube's embed.
**Why:** YouTube's Terms of Service don't allow downloading videos except where YouTube itself offers it, and its
developer policies forbid apps that save YouTube content. The user accepted this. "Offline" means browsing, search,
comments and saved lists.

## D3. Working name "Watchworthy" (2026-11-02). Replaced by D12
A placeholder used before the name was settled.

## D4. Feature parity with hackertube.org (2026-11-02)
The user asked for everything the site has. `docs/PARITY.md` is the checklist. This replaced the first version's
bounded daily "Tonight" list and its cut-down catalogue: Home is now an endless mixed feed, and all 6,454 videos and
39,834 comments are included. These stay from the original "no rabbit holes" goal: nothing autoplays, and the player
closes when a video ends so YouTube's suggestion wall never shows.

## D5. YouTube numbers come from a refreshed file (2026-11-02, needs setup)
Durations, views, likes, upload dates and removal status can't ship in the app: YouTube's terms forbid
redistribution and require stored data to stay current. So:
- `scripts/fetch_youtube_meta.py` uses the owner's API key to write `public/meta.json`.
- `.github/workflows/youtube-meta.yml` runs it weekly and publishes it to GitHub Pages, so there's no server to run.
- `src/meta.ts` downloads it from `expo.extra.metaUrl` in `app.json`, caches it, and discards it after 30 days.
- With no file, the app works without those numbers: no durations, no Longs, and those filters are hidden.
- Channels come the same way (added 2026-11-03): the script looks up each video's channel and lists
  `[channel id, avatar URL]` once per channel in `channels`, with each video pointing at one by index. Until a file has
  them, cards show the channel's initial. The images load from YouTube's servers, like thumbnails already do. Tapping the
  channel on the watch page opens it in YouTube; the app has no channel pages of its own. Without the file it opens a
  YouTube search for the channel's name.

**Why not call YouTube from the app?** One key shared by every install would run out of quota, and the key would ship
in the app. **Risk:** the file is publicly readable. Moving it behind a Cloudflare Worker is a small change if YouTube's
compliance review objects. **Status:** live since 2026-11-03 at https://arguswaikhom.github.io/hackertube/meta.json, refreshed weekly.

**The key:** Google Cloud project `watchworthy-app`, key `watchworthy-metadata`, restricted to YouTube Data API v3. No
application restriction, because GitHub Actions has no fixed IP. It lives in `.env` (git-ignored) and as the
`YOUTUBE_API_KEY` GitHub secret. Never commit it, and never put it in the app: anyone can extract keys from an app.

## D6. Topic search with vectors built ahead of time (2026-11-02)
`build_catalog.py` embeds about 21,700 words and phrases with the same bge-small model HackerTube used, and ships only
the vectors (int8, about 8 MB). A query adds up the vectors of its known terms, then merges with keyword search by
reciprocal rank fusion.
**Why not run the model on the device?** The model plus ONNX runtime would add 60 MB or more. **Limit:** single words and
known phrases work very well; long sentences are weaker than a real model. HackerTube's reranker is not included.

## D7. YouTube's look, HackerTube's marks (2026-11-02, updated 2026-11-03)
The user asked to carry YouTube's identity. Layout, navigation, card anatomy, chips, bottom sheets and neutral colors
follow the YouTube mobile app. The wordmark and orange (#ff6600) are hackertube.org's, as the user asked. Never use
YouTube's logo, name or red play icon.

## D8. Playlists saved from the site's API (2026-11-02)
The 27 playlists aren't in the data zip, so `scripts/fetch_playlists.py` saved them once to `data/playlists.json`, with
a delay between requests. Only titles, intros, order and notes are kept; YouTube numbers are stripped.
**Why it's okay, and the doubt:** the site says "Everything behind this site is yours to reuse", but `robots.txt`
disallows `/api/` and the license text names only the zip. Worth mentioning if anyone ever talks to the site's author.

## D9. Keyboard shortcuts left out (2026-11-02)
They're desktop-only on the site, and touch gestures cover the same actions. Reconsider for tablets with keyboards.

## D10. System fonts and Material icons (2026-11-02). Replaced by D14
Replaced the custom serif look from the first version, because the YouTube app uses the platform's sans-serif.

## D11. Windows build setup (2026-11-02)
Local Android builds on Windows need CMake 3.31.6 and a short folder path. See the README. The cause is ninja 1.10's path
limit, and React Native's generated paths repeat the project path.

## D12. Open source, named HackerTube (2026-11-03)
A public open source project for people to build and enjoy. The app is called HackerTube and uses the site's wordmark,
as the user asked. The About screen and README say plainly that it's unofficial and not made by hackertube.org's
author. Code is MIT; the data stays ODC-By with attribution. Android package and iOS bundle id are `org.hackertube.app`.

## D13. Nothing personal in the public repo (2026-11-03)
Commits use the owner's GitHub noreply address, not a personal email. Docs describe test devices generically. Secrets live
in `.env` (git-ignored) and GitHub secrets. Machine-specific paths and tooling live outside the repo.

## D14. A modernized YouTube look (2026-11-03)
The user found the exact YouTube copy dull and asked to keep its identity but modernize the details. Layout, navigation
and card anatomy stay as in D7. What changed:
- **Type:** Figtree for reading and Bricolage Grotesque for the wordmark, headings and video titles on the watch page.
  Both are embedded with the `expo-font` config plugin from `@expo-google-fonts`, so they're there at first launch with
  no loading step. Names live in `font` in `src/theme.ts`.
- **Shape:** rounder corners that grow with the size of the thing: thumbnails 20 in the feed and 14 in rows, pill
  chips and buttons, 20 for grouped panels, 28 for sheets. Feed cards are inset from the screen edge.
- **Icons:** Ionicons (outline when off, filled when on) instead of Material icons. Never `logo-youtube` (D7).
- **Color:** orange marks state: the selected tab's pill, Like and Watch later when on, and Home's "why this video"
  line. `accentText` is a darker orange in light theme because #FF6600 is too faint for small text on white.
- **Motion:** only in answer to a touch. Things sink slightly while pressed, sheets spring up, the tab pill grows in, a
  switched-on action pops. All of it is skipped when the system's reduce-motion setting is on. Built on React
  Native's `Animated`, so there's no new native dependency.
- **Dark by default**, as the user asked. Light and "Use device theme" stay in Settings. Installs from before this
  keep whatever theme they had saved.
**Why not Reanimated or an icon library with SVG?** Both add native code and a dependency for effects `Animated` and the
bundled icon fonts already cover.

## D15. APKs on GitHub Releases, with an in-app update prompt (2026-11-03)
Every `v*` tag builds a signed APK in GitHub Actions and attaches it to a release. On launch, Android builds ask
GitHub's API for the latest release and, if it's newer, show a dialog: Update, Later, or Skip this version. Update
downloads the APK inside the app, with a progress card, and opens Android's installer on it. The first time, Android
asks the user to allow installs from HackerTube.
- **The tag is the version.** `v1.2.3` becomes versionName 1.2.3 and versionCode 10203, so each part stays under 100.
- **Signing:** the generated Gradle project signs release builds with the debug key, so the workflow re-signs the APK
  with `apksigner` and a release key from repository secrets. No config plugin needed. Losing that key means users must
  uninstall to update, so keep a backup of it outside the repo.
- **Phones only:** the APK carries arm64-v8a and armeabi-v7a, not the x86 emulator builds.
- **Privacy:** the check sends GitHub the device's IP address once per launch, with nothing else. No accounts or IDs.
**Why not expo-updates or Play's in-app updates?** OTA updates can't change native code and need hosting such as EAS;
Play's in-app updates only work for apps installed from the Play Store. A dialog linking to the APK covers it.
**How the install works:** `expo-file-system` downloads to the cache and gives a `content://` URI through its own
FileProvider; `expo-intent-launcher` opens it with ACTION_VIEW. That needs the REQUEST_INSTALL_PACKAGES permission in
`app.json`. Android checks the signature itself, so a tampered APK can't install over the app. If the download fails,
the app offers the release page instead.

## D16. Our own player controls, under the video (2026-11-03)
The user asked for a player with more options, starting with speed. Videos still play through YouTube's embed (D2),
with YouTube's controls hidden (`controls: 0`) and ours driven through the IFrame API: play and pause, 10-second skips,
a seek bar, speed from 0.5× to 2×, captions on or off (both remembered between videos), and full screen.
**Captions** use the player's `captions` module, which YouTube uses but doesn't document, so it may break. **Quality**
isn't offered: YouTube ignores quality requests from embeds since 2019 and always picks automatically.
**Why under the video and not on it:** YouTube's Required Minimum Functionality rules forbid anything in front of the
embed, including controls. They apply to any app using the player. **Full screen** is rebuilt
as a Modal holding a fresh embed that starts where the inline one stopped, because hiding YouTube's controls also hides
its full-screen button.
