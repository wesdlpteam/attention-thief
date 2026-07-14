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
