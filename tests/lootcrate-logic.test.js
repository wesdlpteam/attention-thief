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
