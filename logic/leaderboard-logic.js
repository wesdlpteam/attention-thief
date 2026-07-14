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
