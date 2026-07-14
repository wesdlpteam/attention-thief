// rounds/feed.js
window.Rounds = window.Rounds || {};
window.Rounds.feed = (function () {
  function startRound(mountEl, onComplete) {
    mountEl.innerHTML = `
      <h2>The Feed</h2>
      <div id="feed-card" class="feed-card"></div>
      <button id="feed-done-btn">I've seen enough</button>
    `;

    const cardEl = mountEl.querySelector('#feed-card');
    const doneBtn = mountEl.querySelector('#feed-done-btn');
    let index = 0;

    function renderNext() {
      const item = window.FeedLogic.nextFeedItem(index, Math.random);
      index += 1;
      cardEl.innerHTML = `<p class="feed-caption">${item.caption}</p><p class="feed-likes">${item.likes} likes</p>`;
    }

    renderNext();
    const feedInterval = setInterval(renderNext, 2000);

    doneBtn.addEventListener('click', () => {
      clearInterval(feedInterval);
      onComplete();
    });
  }

  return { startRound };
})();
