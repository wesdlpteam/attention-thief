// rounds/leaderboard.js
window.Rounds = window.Rounds || {};
window.Rounds.leaderboard = (function () {
  function startRound(mountEl, onComplete) {
    let playerScore = 0;
    let botScores = [3, 5, 2];
    let ticks = 0;
    const maxTicks = 15;

    mountEl.innerHTML = `
      <h2>Top Rank</h2>
      <p>Tap fast to climb the board!</p>
      <button id="tap-btn">Tap!</button>
      <div id="standings"></div>
    `;

    const standingsEl = mountEl.querySelector('#standings');
    const tapBtn = mountEl.querySelector('#tap-btn');

    function render() {
      const standings = window.LeaderboardLogic.computeStandings(playerScore, botScores);
      standingsEl.innerHTML = standings
        .map((e) => `<div class="rank-row ${e.isPlayer ? 'rank-player' : ''}">#${e.rank} ${e.name} — ${e.score}</div>`)
        .join('');
    }

    const botInterval = setInterval(() => {
      botScores = botScores.map((s) => s + Math.floor(Math.random() * 2));
      ticks += 1;
      render();
      if (ticks >= maxTicks) {
        clearInterval(botInterval);
        tapBtn.disabled = true;
        setTimeout(onComplete, 1000);
      }
    }, 400);

    tapBtn.addEventListener('click', () => {
      playerScore += 1;
      render();
    });

    render();
  }

  return { startRound };
})();
