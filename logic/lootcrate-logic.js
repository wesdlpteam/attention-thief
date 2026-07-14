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
