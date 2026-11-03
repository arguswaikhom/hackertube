# Status

Update this at the end of each session. Last updated: 2026-11-03.

## Where things stand

The YouTube-style redesign and site parity work are built and committed on `main`. There is no GitHub remote yet.
The app works today without YouTube numbers; Longs, durations and date, length and view filters wait on step 1 below.

## Latest change (2026-11-03): modernized look

New fonts, rounder shapes, Ionicons, touch animations and dark as the default theme. See D14. Checked on the Android 10
phone with a release build: Home, the three-dot sheet, the watch page with Like switched on, You, Categories,
Settings, light and dark, and tab labels fitting. Not yet seen on the redesign: Playlists, a playlist page, Search,
Filters sheet, Longs, About, tablet layouts, and the reduce-motion setting. New installs starting in dark wasn't tried,
because that means clearing the test phone's data.

## Verified

Tested on 2026-11-02 and 03 with a release build.

On an Android 10 phone:
- First launch after clearing data, playback through the YouTube embed
- Home feed, topic chips, Categories, category breadcrumb, All videos, Playlists and a playlist page
- Three-dot menu, description sheet, comments sheet, Filters sheet, active filter chip
- Topic search ("distributed systems"), You tab, Settings, dark theme

On the emulator: two and three column tablet layouts, side-by-side video page, landscape, dark theme.

Automated: 15 logic tests in `src/picks.test.ts`, type check, `expo-doctor`, self-checks in the Python scripts.

Checked earlier, before the redesign, and not repeated since: offline mode, and the player closing when a video ends.
The player code for that is unchanged.

The metadata workflow ran on GitHub Actions on 2026-11-03 (6,454 videos, 0 gone) and the app downloaded the result.

## Not verified

- iOS has never been built or run.
- Not tried on the redesign: Play all on YouTube, Share, clearing history, the frames switch, "Not interested" changing
  the feed, full-screen video, and rotating during playback.
- Two frames looked blank in one emulator screenshot. Their images exist on YouTube, so slow loading is the likely
  cause, but that wasn't confirmed.
- Date, length and view filters and sorting were tested on a device only with invented numbers. Home, Longs and
  durations have been checked with the real downloaded file.

## Next steps, in order

1. Done 2026-11-03: the weekly workflow runs on GitHub, publishes `meta.json` to Pages, and an Android 10 phone showed
   the downloaded durations, views and Longs.
2. Retest the screens that depend on metadata against real numbers: filters by date, length and views, and sorting.
3. Done 2026-11-03 (D15): `v1.0.0` and `v1.0.1` were built by the workflow and published on GitHub Releases. On an
   Android 10 phone (Xiaomi), 1.0.0 showed the update dialog, downloaded 1.0.1 in the app with the progress card, and
   Android installed it over 1.0.0. Not merged into `main` yet; the tags point at branch `apk-releases`.
4. Build iOS on a Mac.

## Known limits

- The first in-app install on the Xiaomi phone failed with "App not installed" (code -22, verification failure) after
  Google Play Protect's "Install without scanning". Tapping Update again worked. People who hit this can retry.
- Phones that ran a locally built copy are signed with the debug key; they must uninstall once before the release APK
  installs.

- Catalogue is frozen at the 2026-10-31 export. New data means a rebuild and an app update.
- Old catalogue files stay on the device after a version bump (a few tens of MB).
- The app is large: the catalogue is 52 MB uncompressed.
