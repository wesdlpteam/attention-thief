// rounds/lootcrate.js
window.Rounds = window.Rounds || {};
window.Rounds.lootcrate = (function () {
  const SKIP_COST = 3;
  const START_COINS = 5;
  const WAIT_MS = 2600;
  const RUN_MS = 1600;

  const WALK_FRAME_MS = 150;

  const COIN_PACKS = [
    { amount: 10, price: '$0.99', best: false },
    { amount: 50, price: '$3.99', best: true },
  ];

  function startRound(mountEl, onComplete) {
    let state = window.LootcrateLogic.createLootState(2);
    let coins = START_COINS;
    let walkToggle;
    let shownBuyPrompt = false;

    mountEl.innerHTML = `
      <h2>Loot Crate Run</h2>
      <p>
        <img class="coin-icon" src="assets/runner/coin.png" alt="">Coins: <span id="coin-count">${coins}</span>
        &middot; Crates left: <span id="keys-left">${state.keys}</span>
        <button id="buy-coins-btn" class="buy-coins-btn">+ Buy Coins</button>
      </p>
      <div class="runner-scene" id="runner-scene">
        <div class="parallax-sky parallax-sky1"></div>
        <div class="parallax-sky parallax-sky2"></div>
        <div class="ground"></div>
        <img class="runner-sprite" id="runner" src="assets/runner/bunny-stand.png" alt="">
        <div class="loot-crate" id="loot-crate" hidden></div>
      </div>
      <div id="choice-area"></div>
      <div id="crate-result"></div>
      <div class="iap-modal" id="iap-modal" hidden>
        <div class="iap-card">
          <h3>Need more coins?</h3>
          <div class="iap-options">
            ${COIN_PACKS.map((pack) => `
              <button class="iap-option ${pack.best ? 'iap-best' : ''}" data-amount="${pack.amount}">
                ${pack.best ? '<span class="iap-badge">BEST VALUE</span>' : ''}
                <img class="coin-icon" src="assets/runner/coin.png" alt="">
                <span>${pack.amount} Coins</span>
                <span class="iap-price">${pack.price}</span>
              </button>
            `).join('')}
          </div>
          <button id="iap-close">No thanks</button>
        </div>
      </div>
    `;

    const coinEl = mountEl.querySelector('#coin-count');
    const keysEl = mountEl.querySelector('#keys-left');
    const runnerEl = mountEl.querySelector('#runner');
    const crateEl = mountEl.querySelector('#loot-crate');
    const choiceArea = mountEl.querySelector('#choice-area');
    const resultEl = mountEl.querySelector('#crate-result');
    const iapModal = mountEl.querySelector('#iap-modal');

    function openIapModal() {
      iapModal.hidden = false;
    }

    mountEl.querySelector('#buy-coins-btn').addEventListener('click', openIapModal);
    mountEl.querySelector('#iap-close').addEventListener('click', () => {
      iapModal.hidden = true;
    });
    mountEl.querySelectorAll('.iap-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        coins += Number(btn.dataset.amount);
        coinEl.textContent = coins;
        iapModal.hidden = true;
        showChoice();
      });
    });

    function runCycle() {
      if (state.keys <= 0) {
        clearInterval(walkToggle);
        setTimeout(onComplete, 700);
        return;
      }
      choiceArea.innerHTML = '';
      crateEl.hidden = true;
      crateEl.classList.remove('crate-drop');

      const targetPct = 52 + Math.random() * 26; // varies each crate so the runner never stops in the same spot
      const runMs = RUN_MS + Math.round(Math.random() * 500);

      runnerEl.style.transition = 'none';
      runnerEl.style.left = '0%';
      runnerEl.src = 'assets/runner/bunny-walk1.png';
      void runnerEl.offsetWidth;
      runnerEl.style.transition = `left ${runMs}ms ease-in-out`;
      runnerEl.style.left = `${targetPct}%`;

      walkToggle = setInterval(() => {
        runnerEl.src = runnerEl.src.includes('walk1')
          ? 'assets/runner/bunny-walk2.png'
          : 'assets/runner/bunny-walk1.png';
      }, WALK_FRAME_MS);

      setTimeout(() => {
        clearInterval(walkToggle);
        runnerEl.src = 'assets/runner/bunny-stand.png';
        crateEl.style.left = `${Math.min(targetPct + 10, 82)}%`;
        crateEl.hidden = false;
        crateEl.classList.add('crate-drop');
        showChoice();
      }, runMs);
    }

    function showChoice() {
      const canPay = coins >= SKIP_COST;
      choiceArea.innerHTML = `
        <button id="continue-btn">Continue</button>
        <button id="pay-btn" ${canPay ? '' : 'disabled'}>Pay ${SKIP_COST} coins to open</button>
      `;
      choiceArea.querySelector('#continue-btn').addEventListener('click', () => {
        choiceArea.innerHTML = '<p class="wait-msg">Waiting...</p>';
        setTimeout(openCurrentCrate, WAIT_MS);
      });
      choiceArea.querySelector('#pay-btn').addEventListener('click', () => {
        if (coins < SKIP_COST) return;
        coins -= SKIP_COST;
        coinEl.textContent = coins;
        openCurrentCrate();
      });

      if (!canPay && !shownBuyPrompt) {
        shownBuyPrompt = true;
        openIapModal();
      }
    }

    function openCurrentCrate() {
      choiceArea.innerHTML = '';
      state = window.LootcrateLogic.openCrate(state, Math.random);
      keysEl.textContent = state.keys;
      const lastReward = state.opened[state.opened.length - 1];
      const rewardEl = document.createElement('div');
      rewardEl.className = `reward reward-${lastReward}`;
      const icon = lastReward === 'legendary' ? 'icon-star' : lastReward === 'rare' ? 'icon-medal2' : '';
      rewardEl.innerHTML = `${icon ? `<span class="icon-sprite ${icon}"></span>` : ''}<span>${lastReward.toUpperCase()}</span>`;
      resultEl.prepend(rewardEl);

      setTimeout(runCycle, 600);
    }

    runCycle();
  }

  return { startRound };
})();
