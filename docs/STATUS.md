# Status

Update this at the end of each session. Last updated: 2026-11-03.

## Where things stand

The YouTube-style redesign and site parity work are built and committed on `main`. `main` is pushed to the public GitHub repo.
The app works today without YouTube numbers; Longs, durations and date, length and view filters wait on step 1 below.

## Latest change (2026-11-03): choosing the player controls

Settings has a switch between our controls and YouTube's own (D17). Phones default to ours, tablets to YouTube's.
On the Android 10 phone with a release build: the switch starts on, a video plays with our controls, and after
switching it off the next video plays with YouTube's controls on tap, YouTube's full-screen button works and Back leaves
it. With YouTube's controls, captions follow YouTube's default, which showed them on the video tried. Not tried: a tablet.
## Earlier change (2026-11-03): own player controls

YouTube's controls are hidden and ours sit under the video: play/pause, 10-second skips, seek bar, speed (saved) and
captions and full screen. See D16. On a Pixel 7 (Android 17) with a release build: play/pause, skips, tapping the
seek bar, 2× speed (21 s of video in about 10 s), captions on and off, full screen keeping the position, and rotating
in and out of landscape while playing. The watch page now keeps the player in one place in both layouts, which fixed
rotation restarting the video. In landscape the two-column page now sizes the player column from the screen width
and caps the player's height, so the whole video, its controls and the Up next titles fit. Tapping the video itself
shows YouTube's own overlay (title, channel, a link button and a suggested video) until playback resumes; pausing with
our button doesn't. Rechecked on the Pixel 7 after merging the APK release work: launch, playback, speed, and
captions staying off until switched on. Not tried: dragging the seek bar, TalkBack, a tablet, and iOS.

Fixed after it (2026-11-03): tapping anything that navigates crashed the app ("The imperative router is unavailable
before the first render has finished") when Android started a second copy of the app before closing the first, which
Pixel's "app updated" screen does after an install. `useKeepRouterConnected` in `src/app/_layout.tsx` reconnects
expo-router's shared router. Reproduced twice before the fix and not after, on the Pixel 7.

## Earlier change (2026-11-03): APKs on GitHub Releases with in-app updates

A `v*` tag builds a signed APK and publishes a GitHub Release (D15). Android builds check for a newer release on launch,
download it in the app and open Android's installer. Tested end to end from 1.0.0 to 1.0.1 on the Android 10 phone.

## Earlier change (2026-11-03): channel avatars and links

Cards and the watch page show the channel's picture instead of its initial. Tapping the channel on the watch page opens
it in YouTube. The URLs come from the metadata file (D5),
so they appear only after the weekly workflow publishes a file made by the updated script. Seen on a Pixel 7
(Android 17) with a release build that bundled a locally fetched file: Home cards and the watch page show them.

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
3. Done 2026-11-03 (D15): `v1.0.0` and `v1.0.1` were built by the workflow and published on GitHub Releases. On an
   Android 10 phone (Xiaomi), 1.0.0 showed the update dialog, downloaded 1.0.1 in the app with the progress card, and
   Android installed it over 1.0.0. Merged into `main` the same day. Those two tags were cut before the channel avatars change, so the next tag ships it.
4. Build iOS on a Mac.

## Known limits

- The first in-app install on the Xiaomi phone failed with "App not installed" (code -22, verification failure) after
  Google Play Protect's "Install without scanning". Tapping Update again worked. People who hit this can retry.
- Phones that ran a locally built copy are signed with the debug key; they must uninstall once before the release APK
  installs.

- Catalogue is frozen at the 2026-10-31 export. New data means a rebuild and an app update.
- Old catalogue files stay on the device after a version bump (a few tens of MB).
- The app is large: the catalogue is 52 MB uncompressed.
