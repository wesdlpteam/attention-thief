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
