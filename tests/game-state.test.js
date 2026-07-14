// tests/game-state.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const GameState = require('../logic/game-state.js');

test('createGameState starts with START_COINS', () => {
  const state = GameState.createGameState();
  assert.equal(state.coins, GameState.START_COINS);
});

test('addCoins increases the balance', () => {
  const state = GameState.createGameState();
  const next = GameState.addCoins(state, 10);
  assert.equal(next.coins, GameState.START_COINS + 10);
});

test('canAfford is true only when balance covers the amount', () => {
  const state = GameState.createGameState();
  assert.equal(GameState.canAfford(state, GameState.START_COINS), true);
  assert.equal(GameState.canAfford(state, GameState.START_COINS + 1), false);
});

test('spendCoins deducts when affordable', () => {
  const state = GameState.createGameState();
  const next = GameState.spendCoins(state, 5);
  assert.equal(next.coins, GameState.START_COINS - 5);
});

test('spendCoins is a no-op when not affordable', () => {
  const state = GameState.createGameState();
  const next = GameState.spendCoins(state, GameState.START_COINS + 1);
  assert.deepEqual(next, state);
});
