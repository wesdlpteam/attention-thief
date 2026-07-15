// rounds/favourite.js
window.Rounds = window.Rounds || {};
window.Rounds.favourite = (function () {
  const COSTUMES = [
    { id: 'classic', name: 'Classic', cost: 0, filter: 'none' },
    { id: 'neon', name: 'Neon Glow', cost: 4, filter: 'hue-rotate(120deg) saturate(1.6)' },
    { id: 'golden', name: 'Golden', cost: 6, filter: 'sepia(1) saturate(3) hue-rotate(-10deg)' },
  ];

  const HOMES = [
    { id: 'cottage', name: 'Cozy Cottage', cost: 5, bg: 'linear-gradient(180deg, #FFDAB5 0%, #F37024 100%)' },
    { id: 'beach', name: 'Beach House', cost: 8, bg: 'linear-gradient(180deg, #CBDAFF 0%, #2F60C7 100%)' },
    { id: 'castle', name: 'Castle', cost: 12, bg: 'linear-gradient(180deg, #DFAB57 0%, #4F2759 100%)' },
  ];

  const BUY_MORE_AMOUNT = 5;
  const BUY_MORE_PRICE = '$0.99';

  function iapModalMarkup() {
    return `
      <div class="iap-modal" id="iap-modal" hidden>
        <div class="iap-card">
          <h3>Need more coins?</h3>
          <div class="iap-options">
            <button class="iap-option" id="iap-buy-btn">
              <img class="coin-icon" src="assets/runner/coin.png" alt="">
              <span>${BUY_MORE_AMOUNT} Coins</span>
              <span class="iap-price">${BUY_MORE_PRICE}</span>
            </button>
          </div>
          <button id="iap-close">No thanks</button>
        </div>
      </div>
    `;
  }

  function startRound(mountEl, onComplete, wallet) {
    showSplash();

    function wireIapModal(onBought) {
      const modal = mountEl.querySelector('#iap-modal');
      modal.querySelector('#iap-buy-btn').addEventListener('click', () => {
        wallet.earn(BUY_MORE_AMOUNT);
        modal.hidden = true;
        onBought();
      });
      modal.querySelector('#iap-close').addEventListener('click', () => {
        modal.hidden = true;
      });
      return modal;
    }

    function showSplash() {
      mountEl.innerHTML = `
        <div class="splash-screen">
          <h2>My Favourite</h2>
          <p>Pick a favourite character, dress them up, and buy them a home!</p>
          <button id="start-btn">Start</button>
        </div>
      `;
      mountEl.querySelector('#start-btn').addEventListener('click', showMascotPick);
    }

    function showMascotPick() {
      mountEl.innerHTML = `
        <h2>My Favourite</h2>
        <p>Pick your favourite!</p>
        <div id="mascot-grid" class="mascot-grid"></div>
      `;
      const grid = mountEl.querySelector('#mascot-grid');
      window.FavouriteLogic.MASCOTS.forEach((mascot) => {
        const card = document.createElement('button');
        card.className = 'mascot-card';
        card.style.setProperty('--mascot-color', mascot.color);
        card.innerHTML = `<img class="mascot-avatar" src="assets/emotes/${mascot.id}.png" alt=""><h3>${mascot.name}</h3><p>${mascot.personality}</p>`;
        card.addEventListener('click', () => showOffer(mascot));
        grid.appendChild(card);
      });
    }

    function showOffer(mascot) {
      mountEl.innerHTML = `
        <h2>My Favourite</h2>
        <div class="mascot-preview"><img class="mascot-avatar-large" src="assets/emotes/${mascot.id}.png" alt=""></div>
        <p>${window.FavouriteLogic.buildLimitedOffer(mascot.id)}</p>
        <button id="continue-btn">Continue</button>
      `;
      mountEl.querySelector('#continue-btn').addEventListener('click', () => showCostumes(mascot));
    }

    function showCostumes(mascot) {
      mountEl.innerHTML = `
        <h2>Choose a Costume</h2>
        <div class="mascot-preview"><img class="mascot-avatar-large" id="preview-img" src="assets/emotes/${mascot.id}.png" alt=""></div>
        <div id="costume-grid" class="costume-grid"></div>
        <p id="fund-msg" class="wait-msg"></p>
        <button id="confirm-costume-btn" disabled>Confirm Costume</button>
        ${iapModalMarkup()}
      `;
      const previewImg = mountEl.querySelector('#preview-img');
      const costumeGrid = mountEl.querySelector('#costume-grid');
      const confirmBtn = mountEl.querySelector('#confirm-costume-btn');
      const fundMsg = mountEl.querySelector('#fund-msg');
      let selectedCostume = null;

      const iapModal = wireIapModal(() => {
        fundMsg.textContent = 'Got 5 more coins! Try again.';
      });

      COSTUMES.forEach((costume) => {
        const card = document.createElement('button');
        card.className = 'costume-card';
        card.innerHTML = `<span>${costume.name}</span><span class="costume-cost">${costume.cost === 0 ? 'Free' : costume.cost + ' coins'}</span>`;
        card.addEventListener('click', () => {
          costumeGrid.querySelectorAll('.costume-card').forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
          previewImg.style.filter = costume.filter;
          selectedCostume = costume;
          confirmBtn.disabled = false;
          fundMsg.textContent = '';
        });
        costumeGrid.appendChild(card);
      });

      confirmBtn.addEventListener('click', () => {
        if (selectedCostume.cost > 0 && !wallet.spend(selectedCostume.cost)) {
          fundMsg.textContent = 'Not enough coins for that costume!';
          iapModal.hidden = false;
          return;
        }
        showHomes(mascot, selectedCostume);
      });
    }

    function showHomes(mascot, costume) {
      mountEl.innerHTML = `
        <h2>Buy a Home</h2>
        <div id="home-grid" class="home-grid"></div>
        <p id="fund-msg" class="wait-msg"></p>
        <button id="confirm-home-btn" disabled>Confirm Home</button>
        ${iapModalMarkup()}
      `;
      const homeGrid = mountEl.querySelector('#home-grid');
      const confirmBtn = mountEl.querySelector('#confirm-home-btn');
      const fundMsg = mountEl.querySelector('#fund-msg');
      let selectedHome = null;

      const iapModal = wireIapModal(() => {
        fundMsg.textContent = 'Got 5 more coins! Try again.';
      });

      HOMES.forEach((home) => {
        const card = document.createElement('button');
        card.className = 'home-card';
        card.style.background = home.bg;
        card.innerHTML = `<span>${home.name}</span><span class="home-cost">${home.cost} coins</span>`;
        card.addEventListener('click', () => {
          homeGrid.querySelectorAll('.home-card').forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedHome = home;
          confirmBtn.disabled = false;
          fundMsg.textContent = '';
        });
        homeGrid.appendChild(card);
      });

      confirmBtn.addEventListener('click', () => {
        if (!wallet.spend(selectedHome.cost)) {
          fundMsg.textContent = 'Not enough coins for that home!';
          iapModal.hidden = false;
          return;
        }
        showFinalConfirm(mascot, costume, selectedHome);
      });
    }

    function showFinalConfirm(mascot, costume, home) {
      mountEl.innerHTML = `
        <h2>Confirm Your Character</h2>
        <div class="mascot-preview" style="background:${home.bg}">
          <img class="mascot-avatar-large" src="assets/emotes/${mascot.id}.png" style="filter:${costume.filter}" alt="">
        </div>
        <p>${mascot.name} in ${home.name}, wearing the ${costume.name} costume.</p>
        <button id="confirm-character-btn">Confirm Character</button>
      `;
      mountEl.querySelector('#confirm-character-btn').addEventListener('click', onComplete);
    }
  }

  return { startRound };
})();
