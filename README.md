# FunZone: Attention Trick Trainer

A short browser game for a Wesley College classroom lesson. Students play 5 mini-games,
each one built around a real design trick used by games and apps to hook attention
(loot boxes, streaks/loss aversion, leaderboards, emotional attachment, frictionless
auto-play). Each mini-game ends with a reveal card naming the trick and explaining the
psychology behind it, followed by a debrief recap once all 5 are done.

## Playing it

No install needed. Open `index.html` directly in any browser (double-click it), or use
the hosted GitHub Pages link once this repo is published.

## Running the tests

Pure-logic files under `logic/` have unit tests under `tests/`, run with Node's built-in
test runner (Node 18+, no npm install required):

```
node --test
```

## Project structure

- `index.html`, `style.css`, `script.js` — hub navigation, screens, shared wiring.
- `logic/` — pure game logic (loot odds, streak state, leaderboard ranking, mascot data,
  feed captions). Fully unit tested.
- `rounds/` — one file per mini-game, wiring the logic above to the DOM.
- `assets/` — CC0 game art (Kenney.nl UI/icon/character packs — see `CREDITS.md`).
- `tests/` — unit tests for everything in `logic/`.

## Privacy

No accounts, no login, no data collected, stored, or transmitted anywhere. Refreshing the
page restarts the game from the beginning.
