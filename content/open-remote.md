---
title: "The Remote in Your Pocket"
slug: open-remote
date: 2026-10-10
kicker: Open Remote
dek: "[Open Remote](https://github.com/iamnbutler/open-tv-remote) is a good TV remote for your iPhone, iPad or Mac. It talks to your TV and nothing else, it's free and stays free, and you can read the code to check."
repo: https://github.com/iamnbutler/open-tv-remote
links:
  - label: iamnbutler/open-tv-remote
    url: https://github.com/iamnbutler/open-tv-remote
  - label: "Pairings overwrite each other (#1)"
    url: https://github.com/iamnbutler/open-tv-remote/issues/1
  - label: tronikos/androidtvremote2
    url: https://github.com/tronikos/androidtvremote2
  - label: jellyfin/jellyfin-androidtv
    url: https://github.com/jellyfin/jellyfin-androidtv
facts:
  - label: Price
    value: Free. No purchases, ads, tracking, accounts or servers
  - label: Source
    value: Open source, MIT, on GitHub
  - label: Size
    value: About 6,300 lines of Swift, no dependencies
  - label: Runs on
    value: iPhone, iPad and Mac
  - label: TVs
    value: Google TV and Android TV, Roku, Samsung, LG
images:
  - src: figs/open-remote/fig-1-code
    alt: "Diagram in two halves divided by a dashed line. On the TV, the screen shows the code 9F8ECF; the first two digits, 9F, are bracketed as the check and the last four, 8ECF, as hashed. A dashed arrow carries the code into the app, where it is typed in. 8ECF goes into a SHA-256 box along with the modulus and exponent of the app's certificate and of the TV's certificate. The first byte of the hash, 9F, and the code's first byte, 9F, meet at a decision circle marked equals. On a match the hash goes to the TV; on no match the app shows \"That code doesn't match.\", a typo caught before the TV sees it."
    caption: "Fig. 1. The code checks itself. Its first byte has to match the first byte of the hash, so the app catches a typo without asking the TV."
  - src: figs/open-remote/fig-2-subject
    alt: "Two stacked panels. First fix, a name each: an iPhone and a Mac present certificates with different names, Open Remote (iPhone 1C3B) and Open Remote (Mac AA28), but the same subject, CN=FreeRemote. Both arrows lead to a single row in the TV's pairings, FreeRemote, where iPhone is struck out and replaced by Mac; the iPhone has to pair again. Second fix, a subject each: the subjects become CN=FreeRemote 3FA9C2E1 and CN=FreeRemote 7B04D96A, and the TV keeps a row for each, so nobody is asked for a code twice."
    caption: "Fig. 2. The display name was never the key. The TV appears to keep one pairing per certificate subject."
  - src: figs/open-remote/fig-3-camera
    alt: "Plan of the living room from above, beside a loop of steps. The TV on the top wall shows the client name Open Remote (Mac AA28) and the code 9F8ECF. Across the room, past the sofa, the MacBook's camera faces the TV, shown as a dashed line of sight. An arrow carries a full-resolution frame from the MacBook to Claude, which reads the code and writes it to the file /tmp/atv-code. The harness polls that file every 300 ms. The harness has two arrows to the TV: one that starts pairing and one that submits the code."
    caption: "Fig. 3. Closing the loop. The MacBook's camera faced the TV, so the agent could read its own pairing codes."
  - src: figs/open-remote/fig-4-playnow
    alt: "Flow and timeline. A tap on a pin leads to finding the TV's Jellyfin session by its IP address, then a dashed, optional step: open Jellyfin and wait 4 seconds, only if nothing is playing. A timeline then starts at 0 seconds. Dots every 1.5 seconds show the app asking the server what is playing. PlayNow is sent at the start and again whenever more than 8 seconds pass without it playing, four sends in this example. A check marks the moment the server shows the asked-for item, which ends it. A dashed line runs on to a hatched wall at 45 seconds: give up, and say so."
    caption: "Fig. 4. Play, and keep asking. The TV's Jellyfin app only hears commands while it's in front, so the phone repeats itself until the server shows the right thing playing."
  - src: figs/open-remote/ill-1-paywall
    alt: "A phone showing a paywall: a TV remote at the top, lines of copy, a large price followed by one small word that is circled, a big Continue button and fine print. Behind it hangs a wall calendar with a coin in the same column of every week."
  - src: figs/open-remote/ill-2-pocket
    alt: "A phone tucked into the back pocket of a pair of jeans, its screen showing a remote's direction pad with the centre button picked out."
---

I went looking for a TV remote app and found one that's free to download. Then comes a paywall, with a price laid out like any other subscription until you get to the last word: $12 a week.

Nobody means to pay that for a remote, and that's how it works. Monthly and yearly are what people expect, so a weekly price slips past. It's set for the people who won't stop to read the last word: someone busy, a parent with a kid on their hip, an older person who taps Continue because they just want the TV to work. Behind the paywall is a few buttons that send a few bytes over Wi-Fi to a TV you already own. Apple [reviews every app](https://developer.apple.com/app-store/review/guidelines/) on the App Store, and catching this kind of pricing should be part of the job.

[Open Remote](https://github.com/iamnbutler/open-tv-remote) is the remote I wanted to give people instead. It runs on iPhone, iPad and Mac, and works with Google TV and Android TV (Sony, TCL, Hisense, Philips, Chromecast, Shield), Roku, Samsung and LG.

## What free means

No purchases, no ads, no analytics, no accounts, no third-party code and no servers. The app talks to the TVs and the media server on your network and to nothing else, and that rule is written into the repository. It's open source so you don't have to take my word for it: you can read the code and see that it doesn't phone home.

## What it does

It finds the TVs on your network, pairs with one the way that TV expects, and then does what a remote does: the d-pad, home and back, play and pause, power and volume. On an iPhone the hardware volume buttons control the TV while the app is open. The keyboard types straight into the TV's search box as you type. Shortcuts open the streaming apps directly.

It also knows about [Jellyfin](https://jellyfin.org/), if you run a media server at home. We have small kids, and pinning Paw Patrol and Miffy so they play on the living room TV in one tap was a real requirement, not a demo. Pick a pinned show and it starts playing on the TV.

## Nothing on the TV unless you asked

A remote shouldn't surprise anyone watching. Nothing appears on the TV unless someone asked for it, and nothing gets paired, pressed or launched without asking first. That rule came from writing the app while my kids were watching the TV it was being tested on, and it's the strictest one in the repository.

Discovery is built around it. The app listens for [Bonjour](https://developer.apple.com/bonjour/) and SSDP announcements, and when it probes a port it connects and drops without sending a byte a TV would show.

## How it works

TV protocols aren't big. Each family of TVs speaks its own, and the app speaks four. There are no dependencies: a small [protobuf](https://protobuf.dev/) reader and writer and an ASN.1 encoder that mints X.509 certificates sit on top of Apple's [Network](https://developer.apple.com/documentation/network) and [Security](https://developer.apple.com/documentation/security) frameworks. All four TV drivers together are 1,134 lines.

Google TV pairing is the clever one. The TV shows a six-character code, and the app proves it saw the code by hashing both certificates' RSA modulus and exponent together with the code's last four characters. The first two characters are a check on that hash, so a typo is caught before anything reaches the TV.

Each install has its own certificate, and the certificate's name is what matters. The TV appears to keep one pairing per certificate subject, so when every install used the same name, each new phone that paired knocked the others off and they had to pair again (Fig. 2). Now each install's certificate gets a random suffix, and a second phone pairs without disturbing the first. The fix in other projects was to make the client name unique, which worked there because the reference library, [androidtvremote2](https://github.com/tronikos/androidtvremote2), quietly uses the client name as the certificate's subject.

Playing from Jellyfin takes persistence (Fig. 4). The TV's [Jellyfin app](https://github.com/jellyfin/jellyfin-androidtv) only listens for remote commands while it's in front, the server keeps listing its session for a while after it isn't, and relaunching it mid-episode drops it to its home screen. So the app finds the TV's session by its IP address, launches Jellyfin only when nothing is playing, and repeats the play command every eight seconds until the server reports the right episode playing, giving up with a clear message after 45.

Pairing was tested against our own TV, with a camera facing it to read each code off the screen, so a test could pair, pair a second client, reconnect, and check the TV went home again afterwards (Fig. 3).

## Caveats

- **Roku and LG are untested.** Their drivers follow the documented protocols but have never met real hardware.
- **The Samsung Frame is odd.** Waking it over the network has only been checked against a local listener, and its power button toggles Art Mode, so turning it fully off is a three-second hold, like the physical remote.
- **Volume depends on your setup.** On a Sony whose sound goes to a soundbar, volume up and down didn't move anything.
- **The pairing fix is understood, not proven.** The certificate-subject explanation fits what the TV does and what the reference library does, but nobody has reproduced the old failure on purpose.
- **Jellyfin needs its Android TV app.** Play-now works through the server and the TV's own Jellyfin client.

If you have one of those TVs, try it and tell me. It's free, and it's going to stay free.
