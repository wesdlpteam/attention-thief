// rounds/favourite.js
window.Rounds = window.Rounds || {};
window.Rounds.favourite = (function () {
  function startRound(mountEl, onComplete) {
    mountEl.innerHTML = `
      <h2>My Favourite</h2>
      <p>Pick your favourite!</p>
      <div id="mascot-grid"></div>
      <div id="offer" hidden></div>
    `;

    const grid = mountEl.querySelector('#mascot-grid');
    const offerEl = mountEl.querySelector('#offer');

    window.FavouriteLogic.MASCOTS.forEach((mascot) => {
      const card = document.createElement('button');
      card.className = 'mascot-card';
      card.style.setProperty('--mascot-color', mascot.color);
      card.innerHTML = `<h3>${mascot.name}</h3><p>${mascot.personality}</p>`;
      card.addEventListener('click', () => {
        grid.querySelectorAll('.mascot-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        offerEl.hidden = false;
        offerEl.innerHTML = `<p>${window.FavouriteLogic.buildLimitedOffer(mascot.id)}</p><button id="continue-btn">Continue</button>`;
        mountEl.querySelector('#continue-btn').addEventListener('click', onComplete);
      });
      grid.appendChild(card);
    });
  }

  return { startRound };
})();
