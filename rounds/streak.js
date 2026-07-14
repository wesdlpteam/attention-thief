// rounds/streak.js
window.Rounds = window.Rounds || {};
window.Rounds.streak = (function () {
  const FORCE_BREAK_DAY = 3;
  const BREAK_DELAY_MS = 700;
  const RESULT_HOLD_MS = 1200;

  function startRound(mountEl, onComplete) {
    let state = window.StreakLogic.createStreakState();
    let coins = 3;

    const dayTiles = Array.from({ length: FORCE_BREAK_DAY }, (_, i) => `<div class="day-tile" data-day="${i + 1}">${i + 1}</div>`).join('');

    mountEl.innerHTML = `
      <h2>Streak Runner</h2>
      <p>Tap "Check In" to build your streak!</p>
      <div class="day-strip" id="day-strip">${dayTiles}</div>
      <div class="flame-track"><div class="flame" id="flame"></div></div>
      <button id="checkin-btn">Check In</button>
      <div id="streak-message"></div>
    `;

    const stripEl = mountEl.querySelector('#day-strip');
    const flameEl = mountEl.querySelector('#flame');
    const msgEl = mountEl.querySelector('#streak-message');
    const checkinBtn = mountEl.querySelector('#checkin-btn');

    function positionFlame(day) {
      const tile = stripEl.querySelector(`[data-day="${Math.max(Math.min(day, FORCE_BREAK_DAY), 1)}"]`);
      if (!tile) return;
      const stripRect = stripEl.getBoundingClientRect();
      const tileRect = tile.getBoundingClientRect();
      flameEl.style.left = `${tileRect.left - stripRect.left + tileRect.width / 2}px`;
    }

    function lightTiles(day) {
      stripEl.querySelectorAll('.day-tile').forEach((tile) => {
        tile.classList.toggle('day-lit', Number(tile.dataset.day) <= day);
      });
    }

    function finish() {
      onComplete();
    }

    function forceBreak() {
      checkinBtn.disabled = true;
      state = window.StreakLogic.breakStreak(state);
      flameEl.style.transition = 'transform 0.4s ease';
      flameEl.style.transform = 'rotate(45deg) scale(0.2)';
      flameEl.classList.add('flame-out');
      stripEl.classList.add('shake');
      setTimeout(() => stripEl.classList.remove('shake'), 400);
      lightTiles(0);
      msgEl.innerHTML = `
        <p class="wait-msg">Your 3-day streak is gone. Games do this on purpose.</p>
        <button id="restore-btn">Pay 2 coins to restore</button>
        <button id="accept-btn">Accept the loss</button>
      `;
      msgEl.querySelector('#restore-btn').addEventListener('click', () => {
        if (coins < 2) return;
        coins -= 2;
        state = window.StreakLogic.restoreStreak(state, FORCE_BREAK_DAY);
        lightTiles(state.day);
        flameEl.classList.remove('flame-out');
        flameEl.style.transition = 'transform 0.4s ease';
        flameEl.style.transform = 'rotate(45deg) scale(1.3)';
        msgEl.innerHTML = '<p class="wait-msg">Restored — but it cost you.</p>';
        setTimeout(finish, RESULT_HOLD_MS);
      });
      msgEl.querySelector('#accept-btn').addEventListener('click', finish);
    }

    checkinBtn.addEventListener('click', () => {
      state = window.StreakLogic.advanceDay(state);
      lightTiles(state.day);
      positionFlame(state.day);
      flameEl.style.transition = 'transform 0.25s cubic-bezier(.34, 1.56, .64, 1)';
      flameEl.style.transform = 'rotate(45deg) scale(1.25)';
      setTimeout(() => {
        flameEl.style.transform = 'rotate(45deg) scale(1)';
      }, 250);

      if (state.day >= FORCE_BREAK_DAY) {
        checkinBtn.disabled = true;
        setTimeout(forceBreak, BREAK_DELAY_MS);
      }
    });

    lightTiles(0);
    positionFlame(1);
    flameEl.style.transform = 'rotate(45deg) scale(1)';
  }

  return { startRound };
})();
