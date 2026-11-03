# Status

Update this at the end of each session. Last updated: 2026-11-03.

## Where things stand

The YouTube-style redesign and site parity work are built and committed on `main`. There is no GitHub remote yet.
The app works today without YouTube numbers; Longs, durations and date, length and view filters wait on step 1 below.

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

The metadata script ran against the real YouTube API on 2026-11-03: 6,454 videos returned, 0 gone, 286 KB file.

## Not verified

- iOS has never been built or run.
- Not tried on the redesign: Play all on YouTube, Share, clearing history, the frames switch, "Not interested" changing
  the feed, full-screen video, and rotating during playback.
- Two frames looked blank in one emulator screenshot. Their images exist on YouTube, so slow loading is the likely
  cause, but that wasn't confirmed.
- The app hasn't shown real YouTube numbers yet, because `public/meta.json` isn't hosted. On-device metadata screens were
  tested only with invented numbers, patched into a throwaway copy. Those numbers never enter this repo.
- The GitHub Actions workflow has never run.

## Next steps, in order

1. The repo is public, the `YOUTUBE_API_KEY` secret is set, Pages is enabled and `metaUrl` points at it. The workflow
   couldn't start because the GitHub account needs a billing issue resolved. Once it is, run the workflow and check real
   numbers on a device.
3. Offer an Android APK on GitHub Releases. That needs a release signing key kept outside the repo, so updates install
   over older versions.
4. Build iOS on a Mac.

## Known limits

- Catalogue is frozen at the 2026-10-31 export. New data means a rebuild and an app update.
- Old catalogue files stay on the device after a version bump (a few tens of MB).
- The app is large: the catalogue is 52 MB uncompressed.
