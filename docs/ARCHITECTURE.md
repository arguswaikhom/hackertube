# Architecture

An Expo (React Native) app with file-based routes and no backend of its own.

## Data flow

    hackertube-data.zip + data/playlists.json
        → scripts/build_catalog.py → assets/catalog.db (read-only, copied to the device on first launch)

    YouTube Data API
        → scripts/fetch_youtube_meta.py, weekly on GitHub Actions → public/meta.json on GitHub Pages
        → src/meta.ts downloads and caches it on the device

    Likes, saves, history, settings → src/store.ts → key-value storage on the device

## Code map

| Path | What it does |
|---|---|
| `src/picks.ts` | Pure logic: Home feed, filters, search ranking, formatting. Tested by `src/picks.test.ts` |
| `src/catalog.ts` | All database reads. Keeps a light in-memory list of every video plus the vectors |
| `src/meta.ts` | YouTube numbers: download, cache, 30-day expiry |
| `src/store.ts` | Viewer's state. Stored by YouTube id, so it survives catalogue updates |
| `src/theme.ts` | Colors and grid columns |
| `src/components/ui.tsx` | Top bar, chips, bottom sheet, menu items |
| `src/components/VideoCard.tsx` | Frame, big card, compact row, three-dot menu |
| `src/components/Lists.tsx` | Paged video grid, Play all |
| `src/components/Filters.tsx` | Filters sheet and active filter chips |
| `src/components/Player.tsx` | YouTube embed in a WebView |
| `src/app/` | Screens. Every file is a route (Expo Router) |

## Things that will bite you

- **`init` in `src/app/_layout.tsx` must stay outside the component.** `SQLiteProvider` reopens the database when that
  function changes, which caused a "malformed" crash on first launch.
- **Row numbers are positions in `videos.jsonl` and index the vectors** (`row - 1`). They change when the catalogue is
  rebuilt, so never store them. Store YouTube ids.
- **The player's `baseUrl` sets the Referer.** Without it YouTube fails with error 153.
- **Bump `CATALOG` when the database changes**, or installed apps keep the old file.
- **YouTube metadata must never enter `assets/` or `data/`.** See D5.
- `npm test` uses Node's type stripping, which is why the test imports `./picks.ts` with the extension.
- Use `npx expo install` for packages. If `npm install` fails on `react-dom`, it must match the pinned `react` version.
