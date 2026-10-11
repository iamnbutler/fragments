---
title: "Twelve Dollars a Week"
slug: open-remote
date: 2026-10-10
kicker: Open Remote
dek: "TV remote apps on the App Store look free and charge $12 a week. [Open Remote](https://github.com/iamnbutler/open-tv-remote) does the same job for nothing, and it took a day to build."
draft: true
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
  - label: Built
    value: October 10, 2026, from 08:39 to about 20:00
  - label: History
    value: 15 commits on main, 9 merged pull requests
  - label: Size
    value: About 6,300 lines of Swift, no dependencies
  - label: Runs on
    value: iPhone, iPad and Mac
  - label: TVs
    value: Google TV and Android TV, Roku, Samsung, LG
images:
  - src: drafts/open-remote/fig-1-meter
    alt: "A step chart of one year. A staircase climbs fifty-two steps, one per week, from twelve dollars in the first week to six hundred and twenty-four dollars at the end of the year, with the first month marked at fifty-two dollars. A flat line along the bottom is labeled Open Remote, zero dollars."
    caption: "Fig. 1. A year of the remote, a week at a time. Twelve dollars a week is $624 a year."
  - src: drafts/open-remote/fig-2-wire
    alt: "Line drawing of a phone on the left sending to four TVs on the right across a dashed band labeled your Wi-Fi. Each TV is labeled with how it listens: Google TV and Android TV on TLS ports 6467 for pairing and 6466 for the remote, with protobuf; Roku on HTTP port 8060; Samsung on a WebSocket, port 8002, with a token; LG on a WebSocket, port 3001, with a client key. A crossed-out cloud above reads no servers."
    caption: "Fig. 2. Everything the app sends. Four ways of talking to a TV, all on your own network."
  - src: drafts/open-remote/fig-3-subject
    alt: "Line drawing in two halves. Before: a phone and a Mac both present certificates whose subject reads CN equals FreeRemote. The TV has one row in its table for that subject; the Mac's pairing overwrites the phone's, and the phone is asked for a code again. After: the subjects read FreeRemote 3FA9C2E1 and FreeRemote 7B04D96A, and the TV keeps two rows."
    caption: "Fig. 3. The display name was never the key. The TV appears to keep one pairing per certificate subject."
  - src: drafts/open-remote/fig-4-camera
    alt: "Line drawing of a living room seen from above. The TV on one wall shows a pairing request with the code 9F8ECF. Across the room a laptop's camera points at it. Arrows run from the laptop to a note labeled a frame, to Claude reading the code, to a file at /tmp/atv-code, to the harness, which polls the file and sends the code to the TV."
    caption: "Fig. 4. Closing the loop. The MacBook's camera faced the TV, so the agent could read its own pairing codes."
  - src: drafts/open-remote/fig-5-playnow
    alt: "A timeline from zero to forty-five seconds. A tap on a pinned show starts it. The phone finds the TV's Jellyfin session by matching its IP address, launches Jellyfin only if nothing is playing, and sends PlayNow. PlayNow repeats every eight seconds, at 0, 8, 16 and 24, until the server reports the asked-for item as now playing, which ends the line with a check. A wall at 45 seconds is labeled give up and say so."
    caption: "Fig. 5. Play, and keep asking. The TV's Jellyfin app only hears commands while it's in front, so the phone repeats itself until the server shows the right thing playing."
---

One Saturday morning in October, I found out what TV remote apps on the App Store cost. The one I looked at is free to download. Then comes the paywall, and then the price, set so it doesn't look like much: $12 a week. That's $624 a year for an app that sends a few bytes over Wi-Fi to a TV you already own.

So I asked Claude to build one we could give away. No in-app purchases, no paywalls, iPhone and Mac. By 09:23 it was on my phone through TestFlight, and it worked great. By the end of the day it was [Open Remote](https://github.com/iamnbutler/open-tv-remote), open source and on its way to the App Store.

"Free" grew over the day. It ended up meaning no purchases, no ads, no analytics, no accounts, no third-party code and no servers. The app talks to the TVs and the media server on your network and to nothing else, and that's written into the repo's rules. Making it open source came about an hour in, and it's part of the point: you can read the code and see that it doesn't phone home.

## Nothing on the TV

At 08:39 Claude started looking around my network. It found a Sony XR-55A80J Google TV in the living room, a 32-inch Samsung Frame, and Lula, our Jellyfin media server.

The Sony was busy. My kids were watching it, so I said: "family is using the tv so don't put up any prompts on screen or anything right now." That became the first rule in the repo and the strictest one. Nothing may appear on the TV unless someone asked for it, and nothing gets paired, pressed or launched without asking first. Discovery is built around it. It listens for Bonjour and SSDP, and when it probes a port it connects and drops without sending a byte a TV would show.

The TV stayed a shared, live thing all day: a family's TV that an agent was writing a remote for, mostly without being allowed to touch it.

## The easy part

TV protocols sound like the hard part. They aren't big:

- Google TV and Android TV (Sony, TCL, Chromecast) speak Android TV Remote v2. Pairing is on port 6467 and the remote on 6466, both over mutual TLS with a self-signed client certificate, and the messages are protobuf.
- Roku takes plain HTTP on port 8060.
- Samsung's Tizen TVs take a WebSocket on 8002 with a token, and LG's webOS a WebSocket on 3001 with a client key.

There are no dependencies. Instead of pulling in libraries, Claude wrote a small protobuf reader and writer and an ASN.1 encoder that mints X.509 certificates, on top of Apple's Network and Security frameworks. All four TV drivers together are 1,134 lines. By 08:56 both apps built and the remote was running in the iPhone simulator.

Pairing is the clever bit. The TV shows a six-character code. The client proves it saw the code by hashing both certificates' RSA modulus and exponent together with it, and the first byte of that hash has to match the code's first byte, which is how the TV catches a typo. At 09:00 a command-line harness paired with the Sony and opened YouTube.

The protocol also tells the client which app is in front. That's how the harness's logs knew the TV was on the Projectivy launcher, and when the pairing dialog was up.

## Three or four codes

At 12:15 I reported the first real bug: "I've needed to put codes in 3-4 times." Every time another device paired with the TV, the ones before it had to pair again.

The first diagnosis was partly right. Every install sent the TV the same client name, and another open-source project had hit the same wall, in an issue that says the client name needs to be unique. So the name got a short tag from each device's certificate. That pass also fixed a real problem: any TLS error, even a Wi-Fi blip, was being read as "the TV forgot us" and the pairing thrown away. Now only a real certificate rejection counts. And some of my code-typing was self-inflicted: Claude's own debug builds on the Mac kept their keys in different places, so each one needed its own code.

The next TestFlight build had the same bug. I said so: "I downloded the most recet test flight and I'm still seeing it."

The real cause was in the reference library. [androidtvremote2](https://github.com/tronikos/androidtvremote2) uses the client name as the certificate's common name, so in the other project, "make the client name unique" also quietly made the certificate's subject unique. Ours was the constant "FreeRemote" on every install. The TV appears to keep one pairing per certificate subject, so a unique display name did nothing. The fix gives each install a certificate named "FreeRemote" plus eight random hex digits.

On the TV: client A pairs, client B pairs, and A reconnects without a code. Claude tried to reproduce the old failure with two clients sharing a subject, set the test up wrong, and dropped it rather than spend more pairing prompts on my TV. So the cause is inferred, from my report, the fix working and what the reference library does. The lesson I'd keep is that a fix from someone else's bug report can work for a reason nobody wrote down. Read the implementation, not just the thread.

## A camera across the room

Pairing needs someone to read a code off the TV, and I wasn't always there. Late in the day I pointed Claude at a skill for reading from a camera. The iPhone's frames came back black or blurry. The MacBook's camera, it turned out, faced the TV from across the room.

So Claude grabbed a full-resolution frame, read the code, and wrote it to a file the harness polls. That made the test that settled the pairing bug run on its own: pair, pair again, reconnect, read the next code. It also found that a client which disconnects mid-pairing leaves the code dialog on the TV. Claude cleared it by pressing Back from a client that was already paired, then took another frame to check the TV was home again.

## Paw Patrol, now

We have small kids. Pinning Paw Patrol and Miffy so they play from our Jellyfin server in one tap was a real requirement, not a demo.

Jellyfin's server can tell a running client to play something. Three bug reports came back: with Jellyfin closed, the app spun forever; with it open, it worked; with an episode playing, the TV went to Jellyfin's home screen and never played anything.

The answers were in [Jellyfin's Android TV app](https://github.com/jellyfin/jellyfin-androidtv). It only listens for remote commands while it's in front. The server keeps listing its session for a while after it's gone to the background, so "a session exists" proves nothing. Relaunching it while it's playing drops it to its home screen. And our app had been guessing which session was the TV, a guess that failed as soon as other Jellyfin clients were around.

The fix matches the TV's session by IP address, launches the app only when nothing is playing, and repeats the play command every eight seconds until the server reports the right item playing, giving up with a clear message after 45.

## Papercuts

The protocols took the first twenty minutes. Most of the rest of the day went to things that weren't the TV.

Claude can't click around App Store Connect from a terminal, so every step there was a prompt I pasted into Claude in Chrome. The first one failed because the bundle ID had never been registered: the build was signed with Xcode's wildcard profile, so Apple had no record of the app. Xcode's sign-in expired while I was away, and every upload failed with "Failed to Use Accounts". The test harness looked new to macOS after every rebuild, so the keychain asked for access each time until the harness was signed properly. One upload was lost because piping the release script through `head` killed the Mac export when the pipe closed. iCloud sync needs an entitlement, the entitlement needs a provisioning profile, and the profile didn't list this Mac, so local builds failed to launch with POSIX error 163. And every TestFlight build said 1.0, because the build number was bumped and the version never was. Releases now start at 1.1.0, and tagging one uploads it to TestFlight from CI.

None of that is about TVs. Most of what makes an app an app is the paperwork around it.

## Three agents, one repo

For a while in the evening three agents worked in the repo at once. Claude, in the main session, built iCloud sync. A Claude sub-agent it forked built hardware volume buttons and live typing in its own worktree. Codex, separately, added app logos and more streaming shortcuts.

It was uneventful, which is worth a sentence. Main is locked: changes need a pull request, both platforms have to build, merges are squashed, and the rules apply to me too. Each task gets its own worktree, and notes attached to the code keep the non-obvious things, like the TV keying pairings by certificate subject. CI caught the one real collision: the sync change broke the harness, which compiles some of the app's files on its own, so the harness is built in CI now.

## Still to try

Some of this has only been tested on paper. The Roku and LG drivers follow their documented protocols and have never met real hardware. Wake-on-LAN for the Samsung Frame has only been checked against a local listener, and a Frame's power button toggles Art Mode, so turning it fully off takes a three-second hold, like the physical remote. On the first test, volume up and down didn't move the Sony's speaker level, probably because the sound goes to a soundbar.

If you have one of those TVs, try it and tell me. It's free, and it's going to stay free.
