// rounds/feed.js
window.Rounds = window.Rounds || {};
window.Rounds.feed = (function () {
  const CHECKPOINT_INTERVAL = 4;
  const LIKE_BONUS_CHANCE = 0.3;
  const LIKE_BONUS_COINS = 1;

  function startRound(mountEl, onComplete, wallet) {
    let index = 0;
    let cardsThisSession = 0;

    mountEl.innerHTML = `
      <h2>The Feed</h2>
      <div id="feed-card" class="feed-card"></div>
      <div id="feed-actions" class="feed-actions"></div>
    `;

    const cardEl = mountEl.querySelector('#feed-card');
    const actionsEl = mountEl.querySelector('#feed-actions');

    function renderCard() {
      const item = window.FeedLogic.nextFeedItem(index, Math.random);
      index += 1;
      cardEl.innerHTML = `<p class="feed-caption">${item.caption}</p><p class="feed-likes">${item.likes} likes</p>`;
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
        <button id="like-btn">❤️ Like</button>
      `;
      actionsEl.querySelector('#skip-btn').addEventListener('click', () => nextCard());
      actionsEl.querySelector('#like-btn').addEventListener('click', () => {
        burstHeart();
        if (Math.random() < LIKE_BONUS_CHANCE) {
          wallet.earn(LIKE_BONUS_COINS);
        }
        nextCard();
      });
    }

    function nextCard() {
      cardsThisSession += 1;
      if (cardsThisSession % CHECKPOINT_INTERVAL === 0) {
        showCheckpoint();
      } else {
        renderCard();
      }
    }

    function showCheckpoint() {
      cardEl.innerHTML = `<p class="feed-caption">You've been scrolling for a bit...</p><p class="feed-likes">Keep going or stop here?</p>`;
      actionsEl.innerHTML = `
        <button id="stop-btn">I'm done</button>
        <button id="keep-btn">Keep scrolling</button>
      `;
      actionsEl.querySelector('#stop-btn').addEventListener('click', onComplete);
      actionsEl.querySelector('#keep-btn').addEventListener('click', () => {
        bindActions();
        renderCard();
      });
    }

    bindActions();
    renderCard();
  }

  return { startRound };
})();
