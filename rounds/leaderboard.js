// rounds/leaderboard.js
window.Rounds = window.Rounds || {};
window.Rounds.leaderboard = (function () {
  const TOTAL_SPRINTS = 3;
  const READY_MS = 900;
  const SPRINT_MS = 3000;
  const REST_MS = 1500;
  const TICK_MS = 100;

  function startRound(mountEl, onComplete, wallet) {
    let playerScore = 0;
    let botScores = [3, 5, 4];
    let sprintIndex = 0;

    showSplash();

    function showSplash() {
      mountEl.innerHTML = `
        <div class="splash-screen">
          <h2>Top Rank</h2>
          <div class="ladder">
            ${Array.from({ length: 5 }, () => '<div class="ladder-rung"></div>').join('')}
          </div>
          <p>Climb the ladder! Tap as fast as you can during each timed round to beat the bots.</p>
          <button id="start-btn">Start</button>
        </div>
      `;
      mountEl.querySelector('#start-btn').addEventListener('click', buildScene);
    }

    function buildScene() {
      mountEl.innerHTML = `
        <h2>Top Rank</h2>
        <p id="status-msg">Get ready...</p>
        <button id="tap-btn" class="tap-btn-big" disabled>Tap!</button>
        <div id="standings"></div>
      `;

      const statusEl = mountEl.querySelector('#status-msg');
      const tapBtn = mountEl.querySelector('#tap-btn');
      const standingsEl = mountEl.querySelector('#standings');

      function render() {
        const standings = window.LeaderboardLogic.computeStandings(playerScore, botScores);
        standingsEl.innerHTML = standings
          .map((e) => `<div class="rank-row ${e.isPlayer ? 'rank-player' : ''}">#${e.rank} ${e.name} — ${e.score}</div>`)
          .join('');
      }

      function runSprint() {
        sprintIndex += 1;
        statusEl.textContent = `Round ${sprintIndex} of ${TOTAL_SPRINTS}: Get ready...`;
        tapBtn.disabled = true;
        tapBtn.textContent = 'Tap!';

        setTimeout(() => {
          statusEl.textContent = 'TAP NOW!';
          statusEl.classList.add('status-live');
          tapBtn.disabled = false;
          const sprintEnd = Date.now() + SPRINT_MS;

          const sprintInterval = setInterval(() => {
            const remaining = Math.max(0, sprintEnd - Date.now());
            tapBtn.textContent = `Tap! (${(remaining / 1000).toFixed(1)}s)`;

            if (remaining <= 0) {
              clearInterval(sprintInterval);
              statusEl.classList.remove('status-live');
              tapBtn.disabled = true;
              tapBtn.textContent = 'Tap!';
              botScores = botScores.map((s) => s + 2 + Math.floor(Math.random() * 3));
              render();

              if (sprintIndex >= TOTAL_SPRINTS) {
                statusEl.textContent = 'Final standings!';
                setTimeout(onComplete, 1500);
              } else {
                statusEl.textContent = 'Rest...';
                setTimeout(runSprint, REST_MS);
              }
            }
          }, TICK_MS);
        }, READY_MS);
      }

      tapBtn.addEventListener('click', () => {
        if (tapBtn.disabled) return;
        playerScore += 1;
        render();
      });

      render();
      runSprint();
    }
  }

  return { startRound };
})();
