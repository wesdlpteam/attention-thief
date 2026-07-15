// logic/game-state.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GameState = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const START_COINS = 10;

  function createGameState() {
    return { coins: START_COINS };
  }

  function addCoins(state, amount) {
    return { coins: state.coins + amount };
  }

  function canAfford(state, amount) {
    return state.coins >= amount;
  }

  function spendCoins(state, amount) {
    if (!canAfford(state, amount)) return state;
    return { coins: state.coins - amount };
  }

  return { START_COINS, createGameState, addCoins, spendCoins, canAfford };
});
