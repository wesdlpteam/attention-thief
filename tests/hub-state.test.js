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
