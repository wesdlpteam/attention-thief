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
