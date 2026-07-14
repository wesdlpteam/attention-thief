// rounds/lootcrate.js
window.Rounds = window.Rounds || {};
window.Rounds.lootcrate = (function () {
  const SKIP_COST = 3;
  const WAIT_MS = 2600;
  const RUN_MS = 1900;
  const WALK_FRAME_MS = 150;
  const JUMP_WINDOW_MS = 500;

  const COIN_PACKS = [
    { amount: 10, price: '$0.99', best: false },
    { amount: 50, price: '$3.99', best: true },
  ];

  function startRound(mountEl, onComplete, wallet) {
    let state = window.LootcrateLogic.createLootState(2);
    let walkToggle;
    let shownBuyPrompt = false;
    let jumped = false;
    let keydownHandler = null;

    mountEl.innerHTML = `
      <h2>Loot Crate Run</h2>
      <p>
        Crates left: <span id="keys-left">${state.keys}</span>
        <button id="buy-coins-btn" class="buy-coins-btn">+ Buy Coins</button>
      </p>
      <p class="jump-hint">Press SPACE to jump the rock!</p>
      <div class="runner-scene" id="runner-scene">
        <div class="parallax-sky parallax-sky1"></div>
        <div class="parallax-sky parallax-sky2"></div>
        <div class="ground"></div>
        <div class="obstacle" id="obstacle" hidden></div>
        <img class="runner-sprite" id="runner" src="assets/runner/bunny-stand.png" alt="">
        <div class="loot-crate" id="loot-crate" hidden>
          <div class="crate-lid"></div>
          <div class="crate-lock"></div>
        </div>
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

    const keysEl = mountEl.querySelector('#keys-left');
    const runnerEl = mountEl.querySelector('#runner');
    const crateEl = mountEl.querySelector('#loot-crate');
    const obstacleEl = mountEl.querySelector('#obstacle');
    const choiceArea = mountEl.querySelector('#choice-area');
    const resultEl = mountEl.querySelector('#crate-result');
    const iapModal = mountEl.querySelector('#iap-modal');

    function openIapModal() {
      iapModal.hidden = false;
    }

    function stopListeningForJump() {
      if (keydownHandler) {
        window.removeEventListener('keydown', keydownHandler);
        keydownHandler = null;
      }
    }

    mountEl.querySelector('#buy-coins-btn').addEventListener('click', openIapModal);
    mountEl.querySelector('#iap-close').addEventListener('click', () => {
      iapModal.hidden = true;
    });
    mountEl.querySelectorAll('.iap-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        wallet.earn(Number(btn.dataset.amount));
        iapModal.hidden = true;
        showChoice();
      });
    });

    function runCycle() {
      if (state.keys <= 0) {
        clearInterval(walkToggle);
        stopListeningForJump();
        setTimeout(onComplete, 700);
        return;
      }
      choiceArea.innerHTML = '';
      crateEl.hidden = true;
      crateEl.classList.remove('crate-drop');
      obstacleEl.hidden = true;
      jumped = false;

      const targetPct = 52 + Math.random() * 26; // varies each crate so the runner never stops in the same spot
      const runMs = RUN_MS + Math.round(Math.random() * 500);
      const obstaclePct = 20 + Math.random() * 20;
      const obstacleTriggerMs = runMs * (obstaclePct / targetPct);

      runnerEl.style.transition = 'none';
      runnerEl.style.left = '0%';
      runnerEl.src = 'assets/runner/bunny-walk1.png';
      runnerEl.classList.remove('runner-jump', 'runner-bump');
      void runnerEl.offsetWidth;
      runnerEl.style.transition = `left ${runMs}ms ease-in-out`;
      runnerEl.style.left = `${targetPct}%`;

      obstacleEl.style.left = `${obstaclePct}%`;
      obstacleEl.hidden = false;

      walkToggle = setInterval(() => {
        runnerEl.src = runnerEl.src.includes('walk1')
          ? 'assets/runner/bunny-walk2.png'
          : 'assets/runner/bunny-walk1.png';
      }, WALK_FRAME_MS);

      stopListeningForJump();
      keydownHandler = (e) => {
        if ((e.code === 'Space' || e.key === ' ') && !jumped) {
          e.preventDefault();
          jumped = true;
          runnerEl.classList.add('runner-jump');
          setTimeout(() => runnerEl.classList.remove('runner-jump'), 400);
        }
      };
      window.addEventListener('keydown', keydownHandler);

      setTimeout(() => {
        if (!jumped) {
          runnerEl.classList.add('runner-bump');
          setTimeout(() => runnerEl.classList.remove('runner-bump'), 300);
        }
        obstacleEl.hidden = true;
      }, obstacleTriggerMs + JUMP_WINDOW_MS);

      setTimeout(() => {
        clearInterval(walkToggle);
        stopListeningForJump();
        runnerEl.src = 'assets/runner/bunny-stand.png';
        crateEl.style.left = `${Math.min(targetPct + 10, 82)}%`;
        crateEl.hidden = false;
        crateEl.classList.add('crate-drop');
        showChoice();
      }, runMs);
    }

    function showChoice() {
      const canPay = wallet.canAfford(SKIP_COST);
      choiceArea.innerHTML = `
        <button id="continue-btn">Continue</button>
        <button id="pay-btn" ${canPay ? '' : 'disabled'}>Pay ${SKIP_COST} coins to open</button>
      `;
      choiceArea.querySelector('#continue-btn').addEventListener('click', () => {
        choiceArea.innerHTML = '<p class="wait-msg">Waiting...</p>';
        setTimeout(openCurrentCrate, WAIT_MS);
      });
      choiceArea.querySelector('#pay-btn').addEventListener('click', () => {
        if (wallet.spend(SKIP_COST)) openCurrentCrate();
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
      rewardEl.innerHTML = `${icon ? `<span class="icon-sprite ${icon}"></span>` : ''}<span>${lastReward.toUpperCase()} LOOT</span>`;
      resultEl.prepend(rewardEl);

      setTimeout(runCycle, 600);
    }

    runCycle();
  }

  return { startRound };
})();
