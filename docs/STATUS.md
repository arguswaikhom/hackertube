# Status

Update this at the end of each session. Last updated: 2026-11-03.

## Where things stand

The YouTube-style redesign and site parity work are built and committed on `main`. There is no GitHub remote yet.
The app works today without YouTube numbers; Longs, durations and date, length and view filters wait on step 1 below.

## Latest change (2026-11-03): own player controls (branch `custom-player`)

YouTube's controls are hidden and ours sit under the video: play/pause, 10-second skips, seek bar, speed (saved) and
captions and full screen. See D15. On a Pixel 7 (Android 17) with a release build: play/pause, skips, tapping the
seek bar, 2× speed (21 s of video in about 10 s), captions on and off, full screen keeping the position, and rotating
in and out of landscape while playing. The watch page now keeps the player in one place in both layouts, which fixed
rotation restarting the video. In landscape the two-column page now sizes the player column from the screen width
and caps the player's height, so the whole video, its controls and the Up next titles fit. Tapping the video itself
shows YouTube's own overlay (title, channel, a link button and a suggested video) until playback resumes; pausing with
our button doesn't. Not tried: dragging the seek bar, TalkBack, a tablet, and iOS.

Seen while testing, not caused by this change: tapping a video card in the first seconds after a fresh install crashed
the app ("The imperative router is unavailable before the first render has finished").

## Earlier change (2026-11-03): modernized look

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
3. Offer an Android APK on GitHub Releases. That needs a release signing key kept outside the repo, so updates install
   over older versions.
4. Build iOS on a Mac.

## Known limits

- Catalogue is frozen at the 2026-10-31 export. New data means a rebuild and an app update.
- Old catalogue files stay on the device after a version bump (a few tens of MB).
- The app is large: the catalogue is 52 MB uncompressed.
