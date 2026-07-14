# FunZone: Attention Trick Trainer — Design Spec

**Date:** 2026-07-14
**Audience:** 13 year olds, Wesley College classroom lesson
**Status:** Approved by user, ready for implementation planning

## 1. Purpose

Teach 13 year olds to recognise the specific design tricks games and apps use to hook attention and spending, by letting them *feel* each trick working on them in a safe fictional context, then immediately revealing the psychology behind it. Built for a single classroom lesson with a teacher-led discussion afterward.

Research basis:
- ABC News/Four Corners, "Are You Being Played?" (2021) — loot boxes, microtransactions, predatory design in games.
- University of Wollongong, "The design tricks keeping your kids hooked on games and apps" (2024) — reward systems, streaks, leaderboards, loot boxes, emotional connections.
- PocketGamer.biz, "Let's Go Whaling" (industry talk) — 20 named monetisation/engagement tactics from the developer side, including anchoring, loss aversion, IKEA effect, whale targeting.

## 2. Success criteria

- Runs entirely in a browser, no install, playable on school Chromebooks/phones.
- Fits a 15-20 minute classroom slot (5 rounds x ~2.5 min + reveal, plus a debrief screen).
- No accounts, no login, no data collected, stored, or transmitted anywhere. Refreshing the page restarts the experience from the top.
- Each of the 5 rounds makes its trick genuinely felt (not just described) before naming it.
- Visuals and interactions feel lively and game-like to a 13 year old, not like a flat corporate quiz.
- Hosted for free on GitHub Pages from a public repo.

## 3. Structure & flow

1. **Home screen ("FunZone" hub):** 5 app tiles representing 5 fake mini-games. Tiles unlock in order (tile 2 locked until round 1 is complete, etc.) to keep pacing predictable for a teacher running a live class. Progress dots at the top show round X of 5.
2. **Each round:** tap tile -> ~2-3 min mini-game -> instant **reveal card** (trick name, one-line psychology explanation, one line naming where students have likely seen it, e.g. Roblox, Genshin Impact, mobile games in general) -> "Back to FunZone" button -> tile shows a checkmark.
3. **After round 5:** a 6th tile, "Debrief," unlocks. It shows all 5 tricks recapped on one scrollable screen, plus 2-3 discussion questions for the teacher to read aloud (e.g. "Which of these have you noticed in a game you play?").
4. No accounts, no save/login, no backend, no network calls. All state lives in memory for the current page load only.

## 4. The 5 rounds

### Round 1 — Loot Crate Clicker (loot box / gacha)
Student taps to open crates using a small pile of free "keys." Rewards are randomised: mostly junk, occasionally a "legendary" item with outsized visual/audio fanfare. Keys run out quickly.
**Reveal:** "You just experienced a loot box. Random rewards keep your brain guessing — same trick as a slot machine."

### Round 2 — Streak Runner (loss aversion)
A fake "Day 1 to Day 7" login streak plays out compressed into real seconds (one tap = one day). Missing a tap in time visibly resets the streak to zero with a guilt-trip popup offering to "pay" fake coins to restore it.
**Reveal:** "That panic when it reset? That's loss aversion — games use it to make you come back even when you don't want to."

### Round 3 — Top Rank (leaderboard)
Student plays a trivial tapping challenge against fake bot names that visibly climb past them in real time.
**Reveal:** explains leaderboards drive competition but can also make people at the bottom feel bad or chase rank instead of fun.

### Round 4 — My Favourite (emotional attachment)
Student picks a "favourite character" from a small original cast of invented mascots (not real celebrities or existing game/franchise characters, to avoid likeness/copyright issues). The game then offers a "limited outfit" for that exact character with urgency framing.
**Reveal:** "Games attach real feelings — favourite characters, streamers, friends — to a purchase button."

### Round 5 — The Feed (frictionless auto-play)
An endless auto-scrolling feed of short fake animated "clips" (CSS/SVG animation loops with a caption and rising fake like-count, not real video) with no visible stop button, next one always queued before the last finishes.
**Reveal:** "Notice there was no natural stopping point? That's on purpose."

## 5. Content sourcing rules (no external assets)

- No real video/audio files. Round 5's "clips" are hand-built CSS/SVG animation loops with pre-written captions.
- No real celebrities, streamers, or existing franchise characters anywhere. Round 4 uses a small original invented cast (4-5 simple flat-style mascots, own names, own one-line personalities).
- No sound files. All audio (chimes, whooshes, dings) is synthesised at runtime via the Web Audio API.
- No external libraries, fonts, or CDN calls. Everything ships as local files so the whole game works offline once loaded and has no network dependency at runtime.

## 6. Visual & interaction polish ("juice")

Achieved entirely through animation and code, no extra libraries or assets:
- Punchy motion: crate shake/wobble before opening, numbers counting up quickly, buttons that squash/bounce on tap, cards flying in/out.
- Payoff contrast: rare pulls trigger a screen flash, hand-rolled canvas confetti burst, and a synthesised "ding"; ordinary pulls stay quick and low-key so rare ones feel special.
- Idle life: mascot icons on the hub do a subtle breathing/bounce loop; background has a slow drifting gradient, so the hub never looks static.
- Micro-copy personality: short reactive one-liners ("Ouch, that stings," "Not today, streak") pulled from a small pre-written pool.
- Bouncy easing curves (`cubic-bezier`) on interactive elements instead of linear motion, for a "premium" rather than "cheap" feel.
- Pointer-tilt effect on cards (loot crate, character card) that subtly tilt toward the mouse/finger.
- Haptic buzz on mobile (`navigator.vibrate`, browser-native, not an external service) on big moments like a rare pull or streak break.
- Toast/badge pop-ins for milestone moments ("First Legendary!"), pure CSS animation.
- Bold, saturated, high-energy colour palette and playful chunky type for gameplay screens (this is a game aimed at 13 year olds, so it intentionally sits outside Wesley's usual document palette); Wesley brand colours anchor the FunZone hub chrome/menu so it still feels tied to school-provided material.

## 7. Technical architecture

**Stack:** plain HTML, CSS, JavaScript. No build step, no package manager, no bundler.

**File structure:**
```
funzone/
  index.html          hub screen, loads everything
  style.css           all styling, animations, palette
  script.js           shared navigation: hub <-> rounds <-> debrief
  rounds/
    lootcrate.js       round 1 logic
    streak.js          round 2 logic
    leaderboard.js     round 3 logic
    favourite.js       round 4 logic + mascot data
    feed.js            round 5 logic
  reveals.js          all 5 reveal-card texts + debrief recap content, centralised for easy editing
```
Each round file is self-contained: it shows/hides its own screen and runs its own mini-game, then hands off to a shared reveal-card display function. This keeps files short and means editing one round can't accidentally break another.

## 8. Hosting & deployment

- Hosted on **GitHub Pages**, free static hosting direct from the repo.
- **Public repository** — safe because there is no login, no data collection, and no student data involved anywhere in the app.
- Once pushed, the game is reachable at a `github.io` link that can be shared directly with students, no install needed on their end.
- Note for the user: a public repo means the source code itself is visible to anyone, which is normal for GitHub Pages projects and not a privacy concern here since nothing sensitive is ever stored or transmitted.

## 9. Out of scope

- No accounts, save data, or cross-session progress.
- No teacher-facing analytics or reporting dashboard.
- No mobile app store build (web-only).
- No real licensed media (video, audio, characters) of any kind.
