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
