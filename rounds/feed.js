// rounds/feed.js
window.Rounds = window.Rounds || {};
window.Rounds.feed = (function () {
  const LIKE_BONUS_CHANCE = 0.3;
  const LIKE_BONUS_COINS = 1;
  const X_APPEAR_MS = 10000;
  const AUTO_CUT_MS = 90000;

  function startRound(mountEl, onComplete, wallet) {
    let index = 0;
    let xTimer;
    let cutTimer;

    showSplash();

    function showSplash() {
      mountEl.innerHTML = `
        <div class="splash-screen">
          <h2>The Feed</h2>
          <p>Scroll, like, or skip. See how long you last before you stop yourself.</p>
          <button id="start-btn">Start</button>
        </div>
      `;
      mountEl.querySelector('#start-btn').addEventListener('click', beginFeed);
    }

    function beginFeed() {
      mountEl.innerHTML = `
        <h2 class="feed-title">The Feed</h2>
        <div id="feed-card" class="feed-card">
          <button id="close-x" class="feed-close-x" hidden>✕</button>
        </div>
        <div id="feed-actions" class="feed-actions"></div>
      `;

      const cardEl = mountEl.querySelector('#feed-card');
      const actionsEl = mountEl.querySelector('#feed-actions');
      let xVisible = false;

      function renderCard() {
        const item = window.FeedLogic.nextFeedItem(index, Math.random);
        index += 1;
        cardEl.innerHTML = `<button id="close-x" class="feed-close-x" ${xVisible ? '' : 'hidden'}>✕</button><p class="feed-caption">${item.caption}</p><p class="feed-likes">${item.likes} likes</p>`;
        mountEl.querySelector('#close-x').addEventListener('click', () => endFeed(true));
      }

      function burstHeart() {
        const heart = document.createElement('div');
        heart.className = 'heart-burst';
        heart.textContent = '❤️';
        cardEl.appendChild(heart);
        setTimeout(() => heart.remove(), 600);
      }

      function bindActions() {
        actionsEl.innerHTML = `
          <button id="skip-btn">➡️ Skip</button>
          <button id="like-btn" class="like-btn">❤️ Like</button>
        `;
        actionsEl.querySelector('#skip-btn').addEventListener('click', renderCard);
        actionsEl.querySelector('#like-btn').addEventListener('click', () => {
          burstHeart();
          if (Math.random() < LIKE_BONUS_CHANCE) {
            wallet.earn(LIKE_BONUS_COINS);
          }
          renderCard();
        });
      }

      function endFeed(userStopped) {
        clearTimeout(xTimer);
        clearTimeout(cutTimer);
        actionsEl.innerHTML = '';
        cardEl.innerHTML = userStopped
          ? '<p class="feed-caption">You stopped the scroll!</p>'
          : '<p class="feed-caption">You have been timed out by DLP controls!</p>';
        actionsEl.innerHTML = '<button id="continue-btn">Continue</button>';
        actionsEl.querySelector('#continue-btn').addEventListener('click', onComplete);
      }

      xTimer = setTimeout(() => {
        xVisible = true;
        const xBtn = mountEl.querySelector('#close-x');
        if (xBtn) xBtn.hidden = false;
      }, X_APPEAR_MS);
      cutTimer = setTimeout(() => endFeed(false), AUTO_CUT_MS);

      bindActions();
      renderCard();
    }
  }

  return { startRound };
})();
