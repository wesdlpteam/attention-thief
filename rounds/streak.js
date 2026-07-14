// rounds/streak.js
window.Rounds = window.Rounds || {};
window.Rounds.streak = (function () {
  function startRound(mountEl, onComplete) {
    let state = window.StreakLogic.createStreakState();
    let coins = 3;
    let timer;

    mountEl.innerHTML = `
      <h2>Streak Runner</h2>
      <p>Tap "Check In" once per day before time runs out!</p>
      <p>Day: <span id="streak-day">0</span> / 7</p>
      <div id="timer-bar"><div id="timer-fill"></div></div>
      <button id="checkin-btn">Check In</button>
      <div id="streak-message"></div>
    `;

    const dayEl = mountEl.querySelector('#streak-day');
    const msgEl = mountEl.querySelector('#streak-message');
    const checkinBtn = mountEl.querySelector('#checkin-btn');
    const timerFill = mountEl.querySelector('#timer-fill');

    function finish() {
      clearTimeout(timer);
      onComplete();
    }

    function startDayTimer() {
      timerFill.style.transition = 'none';
      timerFill.style.width = '100%';
      requestAnimationFrame(() => {
        timerFill.style.transition = 'width 1.5s linear';
        timerFill.style.width = '0%';
      });
      timer = setTimeout(() => {
        state = window.StreakLogic.breakStreak(state);
        dayEl.textContent = '0';
        msgEl.innerHTML = 'Streak broken! <button id="restore-btn">Pay 2 coins to restore?</button>';
        mountEl.querySelector('#restore-btn').addEventListener('click', () => {
          if (coins >= 2) {
            coins -= 2;
            state = window.StreakLogic.restoreStreak(state, 3);
            dayEl.textContent = String(state.day);
            msgEl.textContent = '';
            startDayTimer();
          }
        });
      }, 1500);
    }

    checkinBtn.addEventListener('click', () => {
      if (state.broken) return;
      clearTimeout(timer);
      state = window.StreakLogic.advanceDay(state);
      dayEl.textContent = String(state.day);
      if (state.day >= 7) {
        checkinBtn.disabled = true;
        msgEl.textContent = 'Streak complete!';
        setTimeout(finish, 1000);
        return;
      }
      startDayTimer();
    });

    startDayTimer();
  }

  return { startRound };
})();
