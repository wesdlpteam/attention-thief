// rounds/streak.js
window.Rounds = window.Rounds || {};
window.Rounds.streak = (function () {
  const DAY_MS = 1800;

  function startRound(mountEl, onComplete) {
    let state = window.StreakLogic.createStreakState();
    let coins = 3;
    let timer;

    const dayTiles = Array.from({ length: 7 }, (_, i) => `<div class="day-tile" data-day="${i + 1}">${i + 1}</div>`).join('');

    mountEl.innerHTML = `
      <h2>Streak Runner</h2>
      <p>Tap "Check In" once per day before the flame burns out!</p>
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
      const tile = stripEl.querySelector(`[data-day="${Math.max(day, 1)}"]`);
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
      clearTimeout(timer);
      onComplete();
    }

    function startDayTimer() {
      positionFlame(state.day + 1);
      flameEl.classList.remove('flame-out');
      flameEl.style.transition = 'none';
      flameEl.style.transform = 'rotate(45deg) scale(1)';
      requestAnimationFrame(() => {
        flameEl.style.transition = `transform ${DAY_MS}ms linear`;
        flameEl.style.transform = 'rotate(45deg) scale(0.15)';
      });
      timer = setTimeout(() => {
        state = window.StreakLogic.breakStreak(state);
        flameEl.style.transition = 'transform 0.4s ease';
        flameEl.style.transform = 'rotate(45deg) scale(0.2)';
        flameEl.classList.add('flame-out');
        stripEl.classList.add('shake');
        setTimeout(() => stripEl.classList.remove('shake'), 400);
        lightTiles(0);
        msgEl.innerHTML = 'Streak broken! <button id="restore-btn">Pay 2 coins to restore?</button>';
        mountEl.querySelector('#restore-btn').addEventListener('click', () => {
          if (coins >= 2) {
            coins -= 2;
            state = window.StreakLogic.restoreStreak(state, 3);
            lightTiles(state.day);
            msgEl.textContent = '';
            startDayTimer();
          }
        });
      }, DAY_MS);
    }

    checkinBtn.addEventListener('click', () => {
      if (state.broken) return;
      clearTimeout(timer);
      state = window.StreakLogic.advanceDay(state);
      lightTiles(state.day);
      if (state.day >= 7) {
        checkinBtn.disabled = true;
        flameEl.style.transition = 'transform 0.4s ease';
        flameEl.style.transform = 'rotate(45deg) scale(1.3)';
        msgEl.textContent = 'Streak complete!';
        setTimeout(finish, 900);
        return;
      }
      startDayTimer();
    });

    lightTiles(0);
    startDayTimer();
  }

  return { startRound };
})();
