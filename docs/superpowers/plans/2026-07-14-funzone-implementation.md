# FunZone Attention Trick Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 5-round browser game ("FunZone") that lets 13 year olds feel five real attention-hooking game/app tricks (loot boxes, loss aversion, leaderboard pressure, emotional attachment, frictionless auto-play) before revealing the psychology behind each, wrapped in a fake app-hub UI, playable in 15-20 minutes with no login and no data collection.

**Architecture:** Pure logic (reward randomisation, streak state, leaderboard ranking, mascot data, feed cycling, hub unlock state) lives in small standalone files under `logic/`, each written as a tiny dual-environment module (works as a browser global AND as a `require`-able Node module) so it can be unit tested with Node's built-in test runner with zero installs. DOM/animation code per round lives in `rounds/`, wired together by `script.js`, which also owns hub navigation, the reveal-card screen, and the debrief screen.

**Tech Stack:** Plain HTML, CSS, JavaScript (ES2015+ syntax, classic `<script>` tags, no `type="module"`). Node's built-in `node:test` + `node:assert/strict` for logic unit tests (Node is only needed on the dev machine to run tests, never at runtime in the browser). No npm, no `package.json`, no bundler, no external libraries, no CDN links, no video/audio/image files, no web fonts.

## Global Constraints

These apply to every task below; treat them as always-on requirements.

- No accounts, no login, no persisted/saved state across page loads, no data sent over the network at any point. (Spec §2, §3.4)
- No build step, no package manager, no bundler — plain files a browser reads directly, playable by double-clicking `index.html` (no local server required, since classic `<script>` tags don't hit the ES-module CORS/file:// restriction). (Spec §7)
- No real video/audio files, no real celebrities/streamers/existing franchise characters. Round 5 "clips" are CSS/SVG loops with pre-written captions; Round 4 uses an original invented mascot cast; all sound is synthesised at runtime via the Web Audio API. (Spec §5)
- No external libraries, fonts, or CDN calls of any kind, including web fonts — **do not** bundle or link Graphik (desktop-licensed font, breaches EULA if served from a public repo); use the system font stack fallback only (`"Segoe UI", system-ui, sans-serif`).
- Round order is fixed and sequential: `lootcrate -> streak -> leaderboard -> favourite -> feed -> debrief`. Round *n+1* stays locked until round *n* is completed. (Spec §3, §7)
- Wesley brand tokens are used **only** for the FunZone hub/menu chrome (header, tile grid, locked/done states); mini-game screens use a separate bold arcade palette on purpose. (Spec §6) Hub tokens:
  ```css
  --wes-purple: #4F2759;      /* primary interactive: unlocked tile border, buttons, focus */
  --wes-gold:   #C59F40;      /* sparing accent, e.g. progress dots */
  --wes-neutral-100: #EFEDED; /* hub background */
  --wes-neutral-300: #DAD7D1; /* locked tile background */
  --wes-success: #58C337;     /* done-tile checkmark accent only, never large fill */
  --wes-font-ui: "Segoe UI", system-ui, sans-serif;
  ```
- Hosting target is GitHub Pages from a **public** repo (safe, since nothing sensitive is ever stored). Pushing to GitHub requires the user's explicit go-ahead before it happens — do not push without asking. (Spec §8, user's standing safety rule)
- Every pure-logic file must be requireable from a Node test file with zero config: no `package.json`, no `.mjs`, no transpilation. Use the dual-environment wrapper shown in Task 1.

---

### Task 1: Repo scaffold + hub navigation logic

**Files:**
- Create: `logic/hub-state.js`
- Create: `tests/hub-state.test.js`
- Create: `.gitignore`

**Interfaces:**
- Produces: `HubState.ROUND_ORDER` (array of 5 round id strings), `HubState.createHubState(order?)` -> `{order: string[], completed: string[]}`, `HubState.isUnlocked(state, roundId)` -> boolean, `HubState.completeRound(state, roundId)` -> new state, `HubState.allComplete(state)` -> boolean. Consumed by `script.js` in Task 8.

- [ ] **Step 1: Write the failing tests**

```js
// tests/hub-state.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const HubState = require('../logic/hub-state.js');

test('first round is always unlocked', () => {
  const state = HubState.createHubState(['a', 'b', 'c']);
  assert.equal(HubState.isUnlocked(state, 'a'), true);
});

test('second round locked until first is completed', () => {
  const state = HubState.createHubState(['a', 'b', 'c']);
  assert.equal(HubState.isUnlocked(state, 'b'), false);
  const updated = HubState.completeRound(state, 'a');
  assert.equal(HubState.isUnlocked(updated, 'b'), true);
});

test('completeRound does not duplicate entries', () => {
  const state = HubState.createHubState(['a', 'b']);
  const once = HubState.completeRound(state, 'a');
  const twice = HubState.completeRound(once, 'a');
  assert.deepEqual(twice.completed, ['a']);
});

test('allComplete is true only when every round is completed', () => {
  let state = HubState.createHubState(['a', 'b']);
  assert.equal(HubState.allComplete(state), false);
  state = HubState.completeRound(state, 'a');
  state = HubState.completeRound(state, 'b');
  assert.equal(HubState.allComplete(state), true);
});

test('ROUND_ORDER has the 5 rounds in spec order', () => {
  assert.deepEqual(HubState.ROUND_ORDER, ['lootcrate', 'streak', 'leaderboard', 'favourite', 'feed']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/hub-state.test.js`
Expected: FAIL — `Cannot find module '../logic/hub-state.js'`

- [ ] **Step 3: Write the implementation**

```js
// logic/hub-state.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HubState = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const ROUND_ORDER = ['lootcrate', 'streak', 'leaderboard', 'favourite', 'feed'];

  function createHubState(order = ROUND_ORDER) {
    return { order: [...order], completed: [] };
  }

  function isUnlocked(state, roundId) {
    const index = state.order.indexOf(roundId);
    if (index === -1) return false;
    if (index === 0) return true;
    return state.completed.includes(state.order[index - 1]);
  }

  function completeRound(state, roundId) {
    if (state.completed.includes(roundId)) return state;
    return { order: state.order, completed: [...state.completed, roundId] };
  }

  function allComplete(state) {
    return state.order.every((id) => state.completed.includes(id));
  }

  return { ROUND_ORDER, createHubState, isUnlocked, completeRound, allComplete };
});
```

- [ ] **Step 4: Create `.gitignore`**

```
# .gitignore
.DS_Store
Thumbs.db
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/hub-state.test.js`
Expected: PASS — 5 tests passing

- [ ] **Step 6: Commit**

```bash
git add logic/hub-state.js tests/hub-state.test.js .gitignore
git commit -m "feat: add hub navigation state logic with tests"
```

---

### Task 2: Reveal card & debrief content logic

**Files:**
- Create: `logic/reveals-data.js`
- Create: `tests/reveals-data.test.js`

**Interfaces:**
- Consumes: nothing (static data module).
- Produces: `RevealsData.getReveal(roundId)` -> `{title, body, seenIn}` (throws if unknown id), `RevealsData.getDebriefList(order)` -> array of `{id, title, body, seenIn}` in given order, `RevealsData.DISCUSSION_QUESTIONS` (array of 3 strings). Consumed by `script.js` in Task 8.

- [ ] **Step 1: Write the failing tests**

```js
// tests/reveals-data.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const RevealsData = require('../logic/reveals-data.js');

test('getReveal returns title/body/seenIn for a known round', () => {
  const reveal = RevealsData.getReveal('lootcrate');
  assert.equal(typeof reveal.title, 'string');
  assert.equal(typeof reveal.body, 'string');
  assert.equal(typeof reveal.seenIn, 'string');
});

test('getReveal throws for an unknown round id', () => {
  assert.throws(() => RevealsData.getReveal('not-a-round'));
});

test('getDebriefList returns entries in the given order', () => {
  const list = RevealsData.getDebriefList(['streak', 'lootcrate']);
  assert.deepEqual(list.map((entry) => entry.id), ['streak', 'lootcrate']);
  assert.equal(list[0].title, RevealsData.getReveal('streak').title);
});

test('DISCUSSION_QUESTIONS has exactly 3 questions', () => {
  assert.equal(RevealsData.DISCUSSION_QUESTIONS.length, 3);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/reveals-data.test.js`
Expected: FAIL — `Cannot find module '../logic/reveals-data.js'`

- [ ] **Step 3: Write the implementation**

```js
// logic/reveals-data.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RevealsData = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const REVEALS = {
    lootcrate: {
      title: 'Loot Box',
      body: "You just experienced a loot box. Random rewards keep your brain guessing — same trick as a slot machine.",
      seenIn: 'Genshin Impact, Fortnite, Roblox item crates',
    },
    streak: {
      title: 'Loss Aversion',
      body: "That panic when it reset? That's loss aversion — games use it to make you come back even when you don't want to.",
      seenIn: 'Snapchat streaks, Duolingo streaks, daily login bonuses',
    },
    leaderboard: {
      title: 'Leaderboard Pressure',
      body: 'Leaderboards drive competition, but they can also make people at the bottom feel bad or chase rank instead of fun.',
      seenIn: 'Mobile game rankings, class quiz leaderboards',
    },
    favourite: {
      title: 'Emotional Attachment',
      body: 'Games attach real feelings — favourite characters, streamers, friends — to a purchase button.',
      seenIn: 'Character skins, streamer merch, franchise tie-ins',
    },
    feed: {
      title: 'Frictionless Auto-Play',
      body: "Notice there was no natural stopping point? That's on purpose.",
      seenIn: 'TikTok, YouTube Shorts, Instagram Reels',
    },
  };

  const DISCUSSION_QUESTIONS = [
    'Which of these have you noticed in a game you play?',
    'Which trick do you think is the most convincing? Why?',
    'What could a game do instead that would still be fun but not manipulative?',
  ];

  function getReveal(roundId) {
    const reveal = REVEALS[roundId];
    if (!reveal) throw new Error(`No reveal found for round: ${roundId}`);
    return reveal;
  }

  function getDebriefList(order) {
    return order.map((id) => ({ id, ...getReveal(id) }));
  }

  return { getReveal, getDebriefList, DISCUSSION_QUESTIONS };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/reveals-data.test.js`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add logic/reveals-data.js tests/reveals-data.test.js
git commit -m "feat: add reveal card and debrief content logic with tests"
```

---

### Task 3: Loot Crate logic (Round 1)

**Files:**
- Create: `logic/lootcrate-logic.js`
- Create: `tests/lootcrate-logic.test.js`

**Interfaces:**
- Produces: `LootcrateLogic.pickLootReward(rng)` -> `'common' | 'rare' | 'legendary'` where `rng` is a `() => number in [0,1)` function; `LootcrateLogic.createLootState(keys?)` -> `{keys: number, opened: string[]}`; `LootcrateLogic.openCrate(state, rng)` -> new state (no-op if `keys <= 0`). Consumed by `rounds/lootcrate.js` in Task 8.

- [ ] **Step 1: Write the failing tests**

```js
// tests/lootcrate-logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const LootcrateLogic = require('../logic/lootcrate-logic.js');

test('pickLootReward: low roll is common', () => {
  assert.equal(LootcrateLogic.pickLootReward(() => 0), 'common');
  assert.equal(LootcrateLogic.pickLootReward(() => 0.69), 'common');
});

test('pickLootReward: mid roll is rare', () => {
  assert.equal(LootcrateLogic.pickLootReward(() => 0.70), 'rare');
  assert.equal(LootcrateLogic.pickLootReward(() => 0.94), 'rare');
});

test('pickLootReward: high roll is legendary', () => {
  assert.equal(LootcrateLogic.pickLootReward(() => 0.95), 'legendary');
  assert.equal(LootcrateLogic.pickLootReward(() => 0.999999), 'legendary');
});

test('createLootState defaults to 6 keys and no opened rewards', () => {
  const state = LootcrateLogic.createLootState();
  assert.equal(state.keys, 6);
  assert.deepEqual(state.opened, []);
});

test('openCrate decrements keys and records the reward', () => {
  const state = LootcrateLogic.createLootState(1);
  const next = LootcrateLogic.openCrate(state, () => 0);
  assert.equal(next.keys, 0);
  assert.deepEqual(next.opened, ['common']);
});

test('openCrate is a no-op when out of keys', () => {
  const state = LootcrateLogic.createLootState(0);
  const next = LootcrateLogic.openCrate(state, () => 0);
  assert.deepEqual(next, state);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/lootcrate-logic.test.js`
Expected: FAIL — `Cannot find module '../logic/lootcrate-logic.js'`

- [ ] **Step 3: Write the implementation**

```js
// logic/lootcrate-logic.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LootcrateLogic = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const TIERS = [
    { id: 'common', max: 0.70 },
    { id: 'rare', max: 0.95 },
    { id: 'legendary', max: 1.0 },
  ];

  function pickLootReward(rng) {
    const roll = rng();
    const tier = TIERS.find((t) => roll < t.max);
    return tier ? tier.id : 'legendary';
  }

  function createLootState(keys = 6) {
    return { keys, opened: [] };
  }

  function openCrate(state, rng) {
    if (state.keys <= 0) return state;
    const reward = pickLootReward(rng);
    return { keys: state.keys - 1, opened: [...state.opened, reward] };
  }

  return { pickLootReward, createLootState, openCrate };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/lootcrate-logic.test.js`
Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add logic/lootcrate-logic.js tests/lootcrate-logic.test.js
git commit -m "feat: add loot crate reward logic with tests"
```

---

### Task 4: Streak logic (Round 2)

**Files:**
- Create: `logic/streak-logic.js`
- Create: `tests/streak-logic.test.js`

**Interfaces:**
- Produces: `StreakLogic.createStreakState()` -> `{day: number, broken: boolean}`; `StreakLogic.advanceDay(state)` -> new state (day capped at 7, no-op if broken); `StreakLogic.breakStreak(state)` -> `{day: 0, broken: true}`; `StreakLogic.restoreStreak(state, dayToRestore)` -> `{day: dayToRestore, broken: false}`. Consumed by `rounds/streak.js` in Task 8.

- [ ] **Step 1: Write the failing tests**

```js
// tests/streak-logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const StreakLogic = require('../logic/streak-logic.js');

test('createStreakState starts at day 0, not broken', () => {
  const state = StreakLogic.createStreakState();
  assert.deepEqual(state, { day: 0, broken: false });
});

test('advanceDay increments day by 1', () => {
  const state = StreakLogic.createStreakState();
  const next = StreakLogic.advanceDay(state);
  assert.equal(next.day, 1);
  assert.equal(next.broken, false);
});

test('advanceDay caps at day 7', () => {
  let state = StreakLogic.createStreakState();
  for (let i = 0; i < 10; i += 1) {
    state = StreakLogic.advanceDay(state);
  }
  assert.equal(state.day, 7);
});

test('advanceDay is a no-op once broken', () => {
  const broken = StreakLogic.breakStreak(StreakLogic.createStreakState());
  const next = StreakLogic.advanceDay(broken);
  assert.deepEqual(next, broken);
});

test('breakStreak resets day to 0 and sets broken true', () => {
  const state = StreakLogic.advanceDay(StreakLogic.advanceDay(StreakLogic.createStreakState()));
  const broken = StreakLogic.breakStreak(state);
  assert.deepEqual(broken, { day: 0, broken: true });
});

test('restoreStreak sets day and clears broken flag', () => {
  const broken = StreakLogic.breakStreak(StreakLogic.createStreakState());
  const restored = StreakLogic.restoreStreak(broken, 3);
  assert.deepEqual(restored, { day: 3, broken: false });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/streak-logic.test.js`
Expected: FAIL — `Cannot find module '../logic/streak-logic.js'`

- [ ] **Step 3: Write the implementation**

```js
// logic/streak-logic.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreakLogic = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function createStreakState() {
    return { day: 0, broken: false };
  }

  function advanceDay(state) {
    if (state.broken) return state;
    return { day: Math.min(state.day + 1, 7), broken: false };
  }

  function breakStreak() {
    return { day: 0, broken: true };
  }

  function restoreStreak(state, dayToRestore) {
    return { day: dayToRestore, broken: false };
  }

  return { createStreakState, advanceDay, breakStreak, restoreStreak };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/streak-logic.test.js`
Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add logic/streak-logic.js tests/streak-logic.test.js
git commit -m "feat: add streak/loss-aversion state logic with tests"
```

---

### Task 5: Leaderboard logic (Round 3)

**Files:**
- Create: `logic/leaderboard-logic.js`
- Create: `tests/leaderboard-logic.test.js`

**Interfaces:**
- Produces: `LeaderboardLogic.computeStandings(playerScore, botScores)` -> array of `{name, score, isPlayer, rank}` sorted descending by score, rank 1-indexed. Consumed by `rounds/leaderboard.js` in Task 8.

- [ ] **Step 1: Write the failing tests**

```js
// tests/leaderboard-logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const LeaderboardLogic = require('../logic/leaderboard-logic.js');

test('computeStandings sorts descending by score', () => {
  const standings = LeaderboardLogic.computeStandings(5, [10, 2]);
  assert.deepEqual(standings.map((s) => s.name), ['Bot 1', 'You', 'Bot 2']);
});

test('computeStandings assigns 1-indexed ranks', () => {
  const standings = LeaderboardLogic.computeStandings(5, [10, 2]);
  assert.deepEqual(standings.map((s) => s.rank), [1, 2, 3]);
});

test('computeStandings flags the player entry', () => {
  const standings = LeaderboardLogic.computeStandings(5, [10, 2]);
  const player = standings.find((s) => s.name === 'You');
  assert.equal(player.isPlayer, true);
  assert.equal(player.score, 5);
});

test('bot entries are numbered in the order given', () => {
  const standings = LeaderboardLogic.computeStandings(0, [1, 2, 3]);
  const botNames = standings.filter((s) => !s.isPlayer).map((s) => s.name);
  assert.deepEqual(botNames.sort(), ['Bot 1', 'Bot 2', 'Bot 3']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/leaderboard-logic.test.js`
Expected: FAIL — `Cannot find module '../logic/leaderboard-logic.js'`

- [ ] **Step 3: Write the implementation**

```js
// logic/leaderboard-logic.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LeaderboardLogic = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function computeStandings(playerScore, botScores) {
    const entries = [
      { name: 'You', score: playerScore, isPlayer: true },
      ...botScores.map((score, i) => ({ name: `Bot ${i + 1}`, score, isPlayer: false })),
    ];
    entries.sort((a, b) => b.score - a.score);
    return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  return { computeStandings };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/leaderboard-logic.test.js`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add logic/leaderboard-logic.js tests/leaderboard-logic.test.js
git commit -m "feat: add leaderboard ranking logic with tests"
```

---

### Task 6: Favourite/mascot logic (Round 4)

**Files:**
- Create: `logic/favourite-logic.js`
- Create: `tests/favourite-logic.test.js`

**Interfaces:**
- Produces: `FavouriteLogic.MASCOTS` (array of 4 `{id, name, personality, color}`, all original characters, no real people/franchises); `FavouriteLogic.getMascotById(id)` (throws if unknown); `FavouriteLogic.buildLimitedOffer(mascotId)` -> string. Consumed by `rounds/favourite.js` in Task 8.

- [ ] **Step 1: Write the failing tests**

```js
// tests/favourite-logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const FavouriteLogic = require('../logic/favourite-logic.js');

test('MASCOTS has exactly 4 original characters', () => {
  assert.equal(FavouriteLogic.MASCOTS.length, 4);
  FavouriteLogic.MASCOTS.forEach((mascot) => {
    assert.equal(typeof mascot.id, 'string');
    assert.equal(typeof mascot.name, 'string');
    assert.equal(typeof mascot.personality, 'string');
    assert.equal(typeof mascot.color, 'string');
  });
});

test('getMascotById returns the matching mascot', () => {
  const mascot = FavouriteLogic.getMascotById('zippo');
  assert.equal(mascot.name, 'Zippo');
});

test('getMascotById throws for an unknown id', () => {
  assert.throws(() => FavouriteLogic.getMascotById('nope'));
});

test('buildLimitedOffer mentions the mascot name', () => {
  const offer = FavouriteLogic.buildLimitedOffer('mossy');
  assert.match(offer, /Mossy/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/favourite-logic.test.js`
Expected: FAIL — `Cannot find module '../logic/favourite-logic.js'`

- [ ] **Step 3: Write the implementation**

```js
// logic/favourite-logic.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FavouriteLogic = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const MASCOTS = [
    { id: 'zippo', name: 'Zippo', personality: 'Hyper and loud, loves speed.', color: '#FF6B35' },
    { id: 'mossy', name: 'Mossy', personality: 'Chill and sleepy, always snacking.', color: '#4CAF50' },
    { id: 'blitz', name: 'Blitz', personality: 'Competitive, hates losing.', color: '#3D5AFE' },
    { id: 'nomi', name: 'Nomi', personality: 'Curious, collects shiny things.', color: '#FFC107' },
  ];

  function getMascotById(id) {
    const mascot = MASCOTS.find((m) => m.id === id);
    if (!mascot) throw new Error(`No mascot found for id: ${id}`);
    return mascot;
  }

  function buildLimitedOffer(mascotId) {
    const mascot = getMascotById(mascotId);
    return `Only for ${mascot.name} fans! Get the Legendary ${mascot.name} outfit — today only.`;
  }

  return { MASCOTS, getMascotById, buildLimitedOffer };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/favourite-logic.test.js`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add logic/favourite-logic.js tests/favourite-logic.test.js
git commit -m "feat: add original mascot cast and offer logic with tests"
```

---

### Task 7: Feed logic (Round 5)

**Files:**
- Create: `logic/feed-logic.js`
- Create: `tests/feed-logic.test.js`

**Interfaces:**
- Produces: `FeedLogic.CAPTIONS` (array of pre-written strings); `FeedLogic.nextFeedItem(index, rng)` -> `{caption, likes}` where `rng` is `() => number in [0,1)`. Consumed by `rounds/feed.js` in Task 8.

- [ ] **Step 1: Write the failing tests**

```js
// tests/feed-logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const FeedLogic = require('../logic/feed-logic.js');

test('nextFeedItem cycles through captions by index', () => {
  const total = FeedLogic.CAPTIONS.length;
  const first = FeedLogic.nextFeedItem(0, () => 0);
  const wrapped = FeedLogic.nextFeedItem(total, () => 0);
  assert.equal(first.caption, wrapped.caption);
});

test('nextFeedItem likes are within the 1000-9999 range', () => {
  const low = FeedLogic.nextFeedItem(0, () => 0);
  const high = FeedLogic.nextFeedItem(0, () => 0.999999);
  assert.equal(low.likes, 1000);
  assert.ok(high.likes >= 1000 && high.likes <= 9999);
});

test('CAPTIONS has at least 5 pre-written captions', () => {
  assert.ok(FeedLogic.CAPTIONS.length >= 5);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/feed-logic.test.js`
Expected: FAIL — `Cannot find module '../logic/feed-logic.js'`

- [ ] **Step 3: Write the implementation**

```js
// logic/feed-logic.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FeedLogic = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const CAPTIONS = [
    'POV: your dog judges your life choices',
    'Wait for it...',
    'This one trick will not fix your day',
    'Tell me you relate without telling me',
    'Rating school lunches out of 10',
    'When the bell rings 2 minutes early',
  ];

  function nextFeedItem(index, rng) {
    const caption = CAPTIONS[index % CAPTIONS.length];
    const likes = Math.floor(1000 + rng() * 9000);
    return { caption, likes };
  }

  return { CAPTIONS, nextFeedItem };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/feed-logic.test.js`
Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add logic/feed-logic.js tests/feed-logic.test.js
git commit -m "feat: add feed caption cycling logic with tests"
```

---

### Task 8: Wire the full playable game (HTML shell, hub, 5 rounds, reveal, debrief)

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `script.js`
- Create: `rounds/lootcrate.js`
- Create: `rounds/streak.js`
- Create: `rounds/leaderboard.js`
- Create: `rounds/favourite.js`
- Create: `rounds/feed.js`

**Interfaces:**
- Consumes: `HubState`, `RevealsData`, `LootcrateLogic`, `StreakLogic`, `LeaderboardLogic`, `FavouriteLogic`, `FeedLogic` (all `window.*` globals from Tasks 1-7).
- Produces: `window.Rounds.<id>.startRound(mountEl, onComplete)` for each of `lootcrate`, `streak`, `leaderboard`, `favourite`, `feed` — mounts the mini-game into `mountEl` and calls `onComplete()` exactly once when the round naturally finishes. This is the contract `script.js` relies on.

This task has no automated test (it's DOM/animation-heavy, not pure logic) — verification is a manual browser playthrough, called out explicitly in Step 9.

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FunZone</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <header id="progress-header">
      <div class="dots" id="progress-dots"></div>
    </header>

    <section id="screen-hub" class="screen">
      <h1>FunZone</h1>
      <div class="tile-grid" id="tile-grid"></div>
    </section>

    <section id="screen-round" class="screen" hidden>
      <div id="round-mount"></div>
    </section>

    <section id="screen-reveal" class="screen" hidden>
      <div class="reveal-card">
        <h2 id="reveal-title"></h2>
        <p id="reveal-body"></p>
        <p id="reveal-seen-in"></p>
        <button id="reveal-back-btn">Back to FunZone</button>
      </div>
    </section>

    <section id="screen-debrief" class="screen" hidden>
      <h1>Debrief</h1>
      <div id="debrief-list"></div>
      <div id="debrief-questions"></div>
    </section>
  </div>

  <script src="logic/hub-state.js"></script>
  <script src="logic/reveals-data.js"></script>
  <script src="logic/lootcrate-logic.js"></script>
  <script src="logic/streak-logic.js"></script>
  <script src="logic/leaderboard-logic.js"></script>
  <script src="logic/favourite-logic.js"></script>
  <script src="logic/feed-logic.js"></script>
  <script src="rounds/lootcrate.js"></script>
  <script src="rounds/streak.js"></script>
  <script src="rounds/leaderboard.js"></script>
  <script src="rounds/favourite.js"></script>
  <script src="rounds/feed.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `style.css`**

```css
/* style.css */
:root {
  --wes-purple: #4F2759;
  --wes-gold: #C59F40;
  --wes-neutral-100: #EFEDED;
  --wes-neutral-300: #DAD7D1;
  --wes-success: #58C337;
  --wes-font-ui: "Segoe UI", system-ui, sans-serif;

  --arcade-bg: #1B0E3D;
  --arcade-pink: #FF2E88;
  --arcade-blue: #2EC4FF;
  --arcade-yellow: #FCEE21;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--wes-font-ui);
  background: var(--wes-neutral-100);
  color: #222;
}

.screen { padding: 24px; max-width: 720px; margin: 0 auto; }
.screen[hidden] { display: none; }

#progress-header {
  background: var(--wes-purple);
  padding: 8px 16px;
}
.dots { display: flex; gap: 8px; justify-content: center; }
.dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: rgba(255,255,255,0.3);
}
.dot.dot-done { background: var(--wes-gold); }

#screen-hub h1 { color: var(--wes-purple); }

.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}
.tile {
  padding: 20px 12px;
  border-radius: 12px;
  border: 3px solid var(--wes-purple);
  background: #fff;
  color: var(--wes-purple);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(.34,1.56,.64,1);
}
.tile:hover:not(:disabled) { transform: translateY(-4px) scale(1.03); }
.tile:disabled {
  border-color: var(--wes-neutral-300);
  background: var(--wes-neutral-300);
  color: #888;
  cursor: not-allowed;
}
.tile-done { box-shadow: 0 0 0 3px var(--wes-success) inset; }
.tile-debrief { border-color: var(--wes-gold); }

/* Mini-game screens use a separate bold arcade palette on purpose */
#screen-round {
  background: var(--arcade-bg);
  color: #fff;
  border-radius: 16px;
}
#screen-round button {
  background: var(--arcade-pink);
  color: #fff;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s cubic-bezier(.34,1.56,.64,1);
}
#screen-round button:active { transform: scale(0.94); }
#screen-round button:disabled { opacity: 0.5; cursor: not-allowed; }

.reward { padding: 10px; border-radius: 8px; margin-bottom: 6px; font-weight: 700; }
.reward-common { background: #444; }
.reward-rare { background: var(--arcade-blue); color: #1B0E3D; }
.reward-legendary { background: var(--arcade-yellow); color: #1B0E3D; animation: pulse 0.6s ease-in-out; }

@keyframes pulse {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

#timer-bar { background: rgba(255,255,255,0.2); border-radius: 6px; overflow: hidden; height: 10px; margin: 12px 0; }
#timer-fill { background: var(--arcade-pink); height: 100%; width: 100%; }

.rank-row { padding: 6px 10px; border-radius: 6px; margin-bottom: 4px; background: rgba(255,255,255,0.08); }
.rank-player { background: var(--arcade-pink); font-weight: 700; }

.mascot-card {
  border: 3px solid var(--mascot-color, #fff);
  border-radius: 12px;
  padding: 12px;
  margin: 6px;
  background: rgba(255,255,255,0.05);
  color: #fff;
  cursor: pointer;
}
.mascot-card.selected { background: var(--mascot-color); color: #1B0E3D; }

.feed-caption { font-size: 1.2rem; font-weight: 700; }
.feed-likes { color: var(--arcade-yellow); }

.reveal-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  border: 4px solid var(--wes-gold);
}
.reveal-card h2 { color: var(--wes-purple); }

.debrief-item { border-bottom: 1px solid var(--wes-neutral-300); padding: 12px 0; }
```

- [ ] **Step 3: Write `rounds/lootcrate.js`**

```js
// rounds/lootcrate.js
window.Rounds = window.Rounds || {};
window.Rounds.lootcrate = (function () {
  function startRound(mountEl, onComplete) {
    let state = window.LootcrateLogic.createLootState(6);
    mountEl.innerHTML = `
      <h2>Loot Crate Clicker</h2>
      <p>Keys left: <span id="keys-left">${state.keys}</span></p>
      <button id="open-crate-btn">Open Crate</button>
      <div id="crate-result"></div>
    `;

    const keysEl = mountEl.querySelector('#keys-left');
    const resultEl = mountEl.querySelector('#crate-result');
    const btn = mountEl.querySelector('#open-crate-btn');

    btn.addEventListener('click', () => {
      if (state.keys <= 0) return;
      state = window.LootcrateLogic.openCrate(state, Math.random);
      keysEl.textContent = state.keys;
      const lastReward = state.opened[state.opened.length - 1];
      const rewardEl = document.createElement('div');
      rewardEl.className = `reward reward-${lastReward}`;
      rewardEl.textContent = lastReward.toUpperCase();
      resultEl.prepend(rewardEl);

      if (state.keys <= 0) {
        btn.disabled = true;
        setTimeout(onComplete, 1200);
      }
    });
  }

  return { startRound };
})();
```

- [ ] **Step 4: Write `rounds/streak.js`**

```js
// rounds/streak.js
window.Rounds = window.Rounds || {};
window.Rounds.streak = (function () {
  function startRound(mountEl, onComplete) {
    let state = window.StreakLogic.createStreakState();
    let coins = 3;
    let timer;

    mountEl.innerHTML = `
      <h2>Streak Runner</h2>
      <p>Tap "Check In" once per day before time runs out!</p>
      <p>Day: <span id="streak-day">0</span> / 7</p>
      <div id="timer-bar"><div id="timer-fill"></div></div>
      <button id="checkin-btn">Check In</button>
      <div id="streak-message"></div>
    `;

    const dayEl = mountEl.querySelector('#streak-day');
    const msgEl = mountEl.querySelector('#streak-message');
    const checkinBtn = mountEl.querySelector('#checkin-btn');
    const timerFill = mountEl.querySelector('#timer-fill');

    function finish() {
      clearTimeout(timer);
      onComplete();
    }

    function startDayTimer() {
      timerFill.style.transition = 'none';
      timerFill.style.width = '100%';
      requestAnimationFrame(() => {
        timerFill.style.transition = 'width 1.5s linear';
        timerFill.style.width = '0%';
      });
      timer = setTimeout(() => {
        state = window.StreakLogic.breakStreak(state);
        dayEl.textContent = '0';
        msgEl.innerHTML = 'Streak broken! <button id="restore-btn">Pay 2 coins to restore?</button>';
        mountEl.querySelector('#restore-btn').addEventListener('click', () => {
          if (coins >= 2) {
            coins -= 2;
            state = window.StreakLogic.restoreStreak(state, 3);
            dayEl.textContent = String(state.day);
            msgEl.textContent = '';
            startDayTimer();
          }
        });
      }, 1500);
    }

    checkinBtn.addEventListener('click', () => {
      if (state.broken) return;
      clearTimeout(timer);
      state = window.StreakLogic.advanceDay(state);
      dayEl.textContent = String(state.day);
      if (state.day >= 7) {
        checkinBtn.disabled = true;
        msgEl.textContent = 'Streak complete!';
        setTimeout(finish, 1000);
        return;
      }
      startDayTimer();
    });

    startDayTimer();
  }

  return { startRound };
})();
```

- [ ] **Step 5: Write `rounds/leaderboard.js`**

```js
// rounds/leaderboard.js
window.Rounds = window.Rounds || {};
window.Rounds.leaderboard = (function () {
  function startRound(mountEl, onComplete) {
    let playerScore = 0;
    let botScores = [3, 5, 2];
    let ticks = 0;
    const maxTicks = 15;

    mountEl.innerHTML = `
      <h2>Top Rank</h2>
      <p>Tap fast to climb the board!</p>
      <button id="tap-btn">Tap!</button>
      <div id="standings"></div>
    `;

    const standingsEl = mountEl.querySelector('#standings');
    const tapBtn = mountEl.querySelector('#tap-btn');

    function render() {
      const standings = window.LeaderboardLogic.computeStandings(playerScore, botScores);
      standingsEl.innerHTML = standings
        .map((e) => `<div class="rank-row ${e.isPlayer ? 'rank-player' : ''}">#${e.rank} ${e.name} — ${e.score}</div>`)
        .join('');
    }

    const botInterval = setInterval(() => {
      botScores = botScores.map((s) => s + Math.floor(Math.random() * 2));
      ticks += 1;
      render();
      if (ticks >= maxTicks) {
        clearInterval(botInterval);
        tapBtn.disabled = true;
        setTimeout(onComplete, 1000);
      }
    }, 400);

    tapBtn.addEventListener('click', () => {
      playerScore += 1;
      render();
    });

    render();
  }

  return { startRound };
})();
```

- [ ] **Step 6: Write `rounds/favourite.js`**

```js
// rounds/favourite.js
window.Rounds = window.Rounds || {};
window.Rounds.favourite = (function () {
  function startRound(mountEl, onComplete) {
    mountEl.innerHTML = `
      <h2>My Favourite</h2>
      <p>Pick your favourite!</p>
      <div id="mascot-grid"></div>
      <div id="offer" hidden></div>
    `;

    const grid = mountEl.querySelector('#mascot-grid');
    const offerEl = mountEl.querySelector('#offer');

    window.FavouriteLogic.MASCOTS.forEach((mascot) => {
      const card = document.createElement('button');
      card.className = 'mascot-card';
      card.style.setProperty('--mascot-color', mascot.color);
      card.innerHTML = `<h3>${mascot.name}</h3><p>${mascot.personality}</p>`;
      card.addEventListener('click', () => {
        grid.querySelectorAll('.mascot-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        offerEl.hidden = false;
        offerEl.innerHTML = `<p>${window.FavouriteLogic.buildLimitedOffer(mascot.id)}</p><button id="continue-btn">Continue</button>`;
        mountEl.querySelector('#continue-btn').addEventListener('click', onComplete);
      });
      grid.appendChild(card);
    });
  }

  return { startRound };
})();
```

- [ ] **Step 7: Write `rounds/feed.js`**

```js
// rounds/feed.js
window.Rounds = window.Rounds || {};
window.Rounds.feed = (function () {
  function startRound(mountEl, onComplete) {
    mountEl.innerHTML = `
      <h2>The Feed</h2>
      <div id="feed-card"></div>
      <button id="feed-done-btn">I've seen enough</button>
    `;

    const cardEl = mountEl.querySelector('#feed-card');
    const doneBtn = mountEl.querySelector('#feed-done-btn');
    let index = 0;

    function renderNext() {
      const item = window.FeedLogic.nextFeedItem(index, Math.random);
      index += 1;
      cardEl.innerHTML = `<p class="feed-caption">${item.caption}</p><p class="feed-likes">${item.likes} likes</p>`;
    }

    renderNext();
    const feedInterval = setInterval(renderNext, 2000);

    doneBtn.addEventListener('click', () => {
      clearInterval(feedInterval);
      onComplete();
    });
  }

  return { startRound };
})();
```

- [ ] **Step 8: Write `script.js`**

```js
// script.js
(function () {
  const ROUND_LABELS = {
    lootcrate: 'Loot Crate Clicker',
    streak: 'Streak Runner',
    leaderboard: 'Top Rank',
    favourite: 'My Favourite',
    feed: 'The Feed',
  };

  let hubState = window.HubState.createHubState();

  const screens = {
    hub: document.getElementById('screen-hub'),
    round: document.getElementById('screen-round'),
    reveal: document.getElementById('screen-reveal'),
    debrief: document.getElementById('screen-debrief'),
  };

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
  }

  function renderProgressDots() {
    const dotsEl = document.getElementById('progress-dots');
    dotsEl.innerHTML = hubState.order
      .map((id) => `<span class="dot ${hubState.completed.includes(id) ? 'dot-done' : ''}"></span>`)
      .join('');
  }

  function renderHub() {
    const grid = document.getElementById('tile-grid');
    grid.innerHTML = '';
    hubState.order.forEach((roundId) => {
      const tile = document.createElement('button');
      tile.className = 'tile';
      tile.textContent = ROUND_LABELS[roundId];
      const unlocked = window.HubState.isUnlocked(hubState, roundId);
      const done = hubState.completed.includes(roundId);
      tile.disabled = !unlocked;
      if (done) tile.classList.add('tile-done');
      tile.addEventListener('click', () => openRound(roundId));
      grid.appendChild(tile);
    });

    if (window.HubState.allComplete(hubState)) {
      const debriefTile = document.createElement('button');
      debriefTile.className = 'tile tile-debrief';
      debriefTile.textContent = 'Debrief';
      debriefTile.addEventListener('click', openDebrief);
      grid.appendChild(debriefTile);
    }

    renderProgressDots();
    showScreen('hub');
  }

  function openRound(roundId) {
    const mount = document.getElementById('round-mount');
    mount.innerHTML = '';
    showScreen('round');
    window.Rounds[roundId].startRound(mount, () => showReveal(roundId));
  }

  function showReveal(roundId) {
    const reveal = window.RevealsData.getReveal(roundId);
    document.getElementById('reveal-title').textContent = reveal.title;
    document.getElementById('reveal-body').textContent = reveal.body;
    document.getElementById('reveal-seen-in').textContent = `Seen in: ${reveal.seenIn}`;
    showScreen('reveal');

    const backBtn = document.getElementById('reveal-back-btn');
    backBtn.onclick = () => {
      hubState = window.HubState.completeRound(hubState, roundId);
      renderHub();
    };
  }

  function openDebrief() {
    const list = document.getElementById('debrief-list');
    list.innerHTML = '';
    window.RevealsData.getDebriefList(hubState.order).forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'debrief-item';
      item.innerHTML = `<h3>${entry.title}</h3><p>${entry.body}</p>`;
      list.appendChild(item);
    });

    const questions = document.getElementById('debrief-questions');
    questions.innerHTML = `<h2>Discuss as a class</h2><ul>${window.RevealsData.DISCUSSION_QUESTIONS.map((q) => `<li>${q}</li>`).join('')}</ul>`;

    showScreen('debrief');
  }

  renderHub();
})();
```

- [ ] **Step 9: Manual browser verification (this task's "test", since it's DOM/UI code, not pure logic)**

Open `index.html` directly in a browser (double-click it, no server needed) and confirm:
1. Only the first tile ("Loot Crate Clicker") is clickable; the other 4 are visibly disabled.
2. Playing Round 1 to the end (opening all 6 crates) shows a reveal card with the Loot Box explanation, and returns to the hub with tile 1 checked and tile 2 unlocked.
3. Repeat through rounds 2-5 in order, confirming each unlocks the next and each reveal card shows the correct trick text from `logic/reveals-data.js`.
4. After round 5, a "Debrief" tile appears; opening it lists all 5 tricks and the 3 discussion questions.
5. Refresh the page — hub resets to only round 1 unlocked (confirms no state is persisted, per spec §3.4).

If any of these don't hold, fix the relevant file before moving on — do not proceed to Task 9 on a broken playthrough.

- [ ] **Step 10: Commit**

```bash
git add index.html style.css script.js rounds/
git commit -m "feat: wire full FunZone playthrough (hub, 5 rounds, reveal, debrief)"
```

---

### Task 9: Visual & audio polish pass ("juice")

**Files:**
- Create: `logic/sound-notes.js`
- Create: `tests/sound-notes.test.js`
- Create: `logic/confetti-particles.js`
- Create: `tests/confetti-particles.test.js`
- Create: `sound.js`
- Create: `confetti.js`
- Modify: `style.css` (append idle-animation and toast keyframes)
- Modify: `rounds/lootcrate.js` (trigger confetti + sound on legendary pulls)
- Modify: `rounds/streak.js` (trigger haptic buzz on streak break)

**Interfaces:**
- Produces: `SoundNotes.noteToFrequency(note)` -> number (Hz) for `'A4'`-style note names; `ConfettiParticles.generateParticles(count, rng)` -> array of `{x, y, vx, vy, color}` with values in documented ranges; `window.playChime(noteNames)` (DOM/Web Audio, not unit tested); `window.burstConfetti(canvasEl, rng?)` (DOM/canvas, not unit tested); `window.vibrateIfSupported(pattern)`.
- Consumes: `LootcrateLogic`, `StreakLogic` outputs already wired in Task 8.

- [ ] **Step 1: Write the failing test for note frequencies**

```js
// tests/sound-notes.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const SoundNotes = require('../logic/sound-notes.js');

test('noteToFrequency returns 440 for A4', () => {
  assert.equal(SoundNotes.noteToFrequency('A4'), 440);
});

test('noteToFrequency returns known value for C5', () => {
  assert.ok(Math.abs(SoundNotes.noteToFrequency('C5') - 523.25) < 0.1);
});

test('noteToFrequency throws for an unknown note', () => {
  assert.throws(() => SoundNotes.noteToFrequency('Z9'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sound-notes.test.js`
Expected: FAIL — `Cannot find module '../logic/sound-notes.js'`

- [ ] **Step 3: Write `logic/sound-notes.js`**

```js
// logic/sound-notes.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SoundNotes = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const FREQUENCIES = {
    A4: 440,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    G5: 783.99,
  };

  function noteToFrequency(note) {
    const freq = FREQUENCIES[note];
    if (!freq) throw new Error(`Unknown note: ${note}`);
    return freq;
  }

  return { FREQUENCIES, noteToFrequency };
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/sound-notes.test.js`
Expected: PASS — 3 tests passing

- [ ] **Step 5: Write the failing test for confetti particle generation**

```js
// tests/confetti-particles.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const ConfettiParticles = require('../logic/confetti-particles.js');

test('generateParticles returns the requested count', () => {
  const particles = ConfettiParticles.generateParticles(20, () => 0.5);
  assert.equal(particles.length, 20);
});

test('generateParticles keeps velocities within -3..3 range', () => {
  const particles = ConfettiParticles.generateParticles(10, () => 0);
  particles.forEach((p) => {
    assert.ok(p.vx >= -3 && p.vx <= 3);
    assert.ok(p.vy >= -3 && p.vy <= 3);
  });
});

test('generateParticles assigns a colour from the palette', () => {
  const particles = ConfettiParticles.generateParticles(5, () => 0);
  particles.forEach((p) => assert.ok(ConfettiParticles.PALETTE.includes(p.color)));
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `node --test tests/confetti-particles.test.js`
Expected: FAIL — `Cannot find module '../logic/confetti-particles.js'`

- [ ] **Step 7: Write `logic/confetti-particles.js`**

```js
// logic/confetti-particles.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ConfettiParticles = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const PALETTE = ['#FF2E88', '#2EC4FF', '#FCEE21', '#C59F40'];

  function generateParticles(count, rng) {
    const particles = [];
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: 0.5,
        y: 0.5,
        vx: (rng() - 0.5) * 6,
        vy: (rng() - 0.5) * 6,
        color: PALETTE[Math.floor(rng() * PALETTE.length) % PALETTE.length],
      });
    }
    return particles;
  }

  return { PALETTE, generateParticles };
});
```

- [ ] **Step 8: Run test to verify it passes**

Run: `node --test tests/confetti-particles.test.js`
Expected: PASS — 3 tests passing

- [ ] **Step 9: Write `sound.js` (Web Audio playback, not unit tested — browser-only API)**

```js
// sound.js
window.playChime = function playChime(noteNames) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  noteNames.forEach((note, i) => {
    const freq = window.SoundNotes.noteToFrequency(note);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.3);
  });
};

window.vibrateIfSupported = function vibrateIfSupported(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
};
```

- [ ] **Step 10: Write `confetti.js` (canvas rendering, not unit tested — DOM/canvas API)**

```js
// confetti.js
window.burstConfetti = function burstConfetti(canvasEl, rng) {
  const ctx = canvasEl.getContext('2d');
  const particles = window.ConfettiParticles.generateParticles(30, rng || Math.random).map((p) => ({
    ...p,
    x: p.x * canvasEl.width,
    y: p.y * canvasEl.height,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    particles.forEach((p) => {
      p.x += p.vx * 4;
      p.y += p.vy * 4 + frame * 0.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 6, 6);
    });
    frame += 1;
    if (frame < 40) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  }
  draw();
};
```

- [ ] **Step 11: Wire polish into `index.html` (add script tags + confetti canvas)**

Add before the `rounds/*.js` script tags in `index.html`:
```html
<script src="logic/sound-notes.js"></script>
<script src="logic/confetti-particles.js"></script>
<script src="sound.js"></script>
<script src="confetti.js"></script>
```
Add inside `#screen-round` in `index.html`, just before `#round-mount`:
```html
<canvas id="confetti-canvas" width="400" height="300" style="position:absolute; pointer-events:none;"></canvas>
```

- [ ] **Step 12: Modify `rounds/lootcrate.js` — trigger confetti + chime on legendary pulls**

In the `btn.addEventListener('click', ...)` handler, right after `resultEl.prepend(rewardEl);`, add:
```js
      if (lastReward === 'legendary') {
        window.playChime(['C5', 'E5', 'G5']);
        window.burstConfetti(document.getElementById('confetti-canvas'));
      }
```

- [ ] **Step 13: Modify `rounds/streak.js` — trigger haptic buzz on streak break**

In `startDayTimer`'s `setTimeout` callback, right after `state = window.StreakLogic.breakStreak(state);`, add:
```js
        window.vibrateIfSupported([80, 40, 80]);
```

- [ ] **Step 14: Append idle-life and toast keyframes to `style.css`**

```css
@keyframes idle-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
.tile:not(:disabled) { animation: idle-breathe 3s ease-in-out infinite; }

@keyframes toast-in {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.reward { animation: toast-in 0.3s cubic-bezier(.34,1.56,.64,1); }
```

- [ ] **Step 15: Manual browser verification**

Open `index.html`, play Round 1 until a "LEGENDARY" reward appears (may need several opens since it's a 5% chance — reload the page and retry if a full 6-key run doesn't produce one) and confirm: a chime plays, a confetti burst appears over the round screen, and the reward card slides in rather than snapping into place. Play Round 2 to a streak break and confirm the browser attempts a vibration on a mobile device or emulator (desktop browsers silently ignore `navigator.vibrate`, that's expected). Confirm hub tiles gently pulse while idle.

- [ ] **Step 16: Run the full test suite to confirm nothing broke**

Run: `node --test tests/`
Expected: PASS — all tests across all `tests/*.test.js` files passing

- [ ] **Step 17: Commit**

```bash
git add logic/sound-notes.js tests/sound-notes.test.js logic/confetti-particles.js tests/confetti-particles.test.js sound.js confetti.js style.css index.html rounds/lootcrate.js rounds/streak.js
git commit -m "feat: add sound, confetti, haptics, and idle-animation polish"
```

---

### Task 10: GitHub Pages deployment prep

**Files:**
- Create: `README.md`

**Interfaces:** none (documentation + deployment readiness only).

- [ ] **Step 1: Write `README.md`**

```markdown
# FunZone: Attention Trick Trainer

A short browser game for a Wesley College classroom lesson. Students play 5 mini-games,
each one built around a real design trick used by games and apps to hook attention
(loot boxes, streaks/loss aversion, leaderboards, emotional attachment, frictionless
auto-play). Each mini-game ends with a reveal card naming the trick and explaining the
psychology, followed by a class debrief screen.

## Running it

No install needed. Open `index.html` directly in any browser (double-click it), or visit
the hosted GitHub Pages link once this repo is published.

## Running the tests

Pure-logic files under `logic/` have unit tests under `tests/`, run with Node's built-in
test runner (Node 18+, no npm install required):

```
node --test tests/
```

## Project structure

- `index.html`, `style.css`, `script.js` — hub navigation, screens, shared wiring.
- `logic/` — pure game logic (loot odds, streak state, leaderboard ranking, mascot data,
  feed captions, sound notes, confetti particles). Fully unit tested.
- `rounds/` — one file per mini-game, wiring the logic above to the DOM.
- `sound.js`, `confetti.js` — Web Audio and canvas polish, browser-only (not unit tested).
- `tests/` — unit tests for everything in `logic/`.

## Privacy

No accounts, no login, no data collected, stored, or transmitted anywhere. Refreshing the
page restarts the game from the beginning.
```

- [ ] **Step 2: Run the full test suite one last time**

Run: `node --test tests/`
Expected: PASS — all tests passing

- [ ] **Step 3: Manual full playthrough**

Open `index.html` and play start to finish (all 5 rounds + debrief) one more time to confirm the whole game holds together after Tasks 9's changes.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with run instructions and project structure"
```

- [ ] **Step 5: Stop and check in with the user before touching GitHub**

Do **not** create a GitHub repo or push at this point. Tell the user the game is complete,
tested, and committed locally, and ask them to confirm: (a) they want it pushed to GitHub
now, and (b) they're OK with the repo being public (required for free GitHub Pages
hosting, and safe here since no student data is involved). Only proceed with
`gh repo create` / `git push` after they explicitly say go ahead.

---

## Self-Review Notes

**Spec coverage:** §2 (success criteria) covered by Tasks 8 & 10's manual verification steps. §3 (structure/flow) covered by Task 1 (hub-state) + Task 8 (wiring). §4 (5 rounds) covered by Tasks 3-7 (logic) + Task 8 (DOM). §5 (content sourcing rules) covered by Task 6 (original mascots) and Task 8/9 (no video/audio files, synthesised sound only). §6 (visual polish) covered by Task 9. §7 (tech architecture) covered by Tasks 1-8 (file structure matches spec, adjusted from ES modules to classic-script globals to honor the "no build step, no package manager" constraint literally — this is a deliberate, documented deviation from the spec's exact file list, not a gap). §8 (hosting) covered by Task 10. §9 (out of scope) — no tasks violate it (no accounts, no analytics, no native app, no licensed media).

**Type/interface consistency check:** `startRound(mountEl, onComplete)` signature is identical across all 5 round files and matches what `script.js` calls in `openRound`. All `window.*` globals referenced in Task 8/9 (`HubState`, `RevealsData`, `LootcrateLogic`, `StreakLogic`, `LeaderboardLogic`, `FavouriteLogic`, `FeedLogic`, `Rounds`, `SoundNotes`, `ConfettiParticles`) are each produced by exactly one earlier task and consumed correctly downstream.
