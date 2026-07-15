// rounds/lootcrate.js
window.Rounds = window.Rounds || {};
window.Rounds.lootcrate = (function () {
  const SKIP_COST = 3;
  const WAIT_MS = 2600;
  const SEGMENT_MS = 1300;
  const WALK_FRAME_MS = 150;

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
    let crateAttempt = 0;

    showSplash();

    function showSplash() {
      mountEl.innerHTML = `
        <div class="splash-screen">
          <h2>Loot Crate Run</h2>
          <p>Help the bunny run! Press <strong>SPACE</strong> to jump over rocks in the way — miss one and the bunny gets stuck until you jump.</p>
          <button id="start-btn">Start</button>
        </div>
      `;
      mountEl.querySelector('#start-btn').addEventListener('click', buildScene);
    }

    function buildScene() {
      mountEl.innerHTML = `
        <h2>Loot Crate Run</h2>
        <p>Crates left: <span id="keys-left">${state.keys}</span></p>
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

      function startWalk() {
        runnerEl.src = 'assets/runner/bunny-walk1.png';
        walkToggle = setInterval(() => {
          runnerEl.src = runnerEl.src.includes('walk1')
            ? 'assets/runner/bunny-walk2.png'
            : 'assets/runner/bunny-walk1.png';
        }, WALK_FRAME_MS);
      }

      function stopWalk() {
        clearInterval(walkToggle);
        runnerEl.src = 'assets/runner/bunny-stand.png';
      }

      function runCrateSequence() {
        if (state.keys <= 0) {
          stopListeningForJump();
          setTimeout(onComplete, 700);
          return;
        }
        choiceArea.innerHTML = '';
        crateEl.hidden = true;
        crateEl.classList.remove('crate-drop');
        runnerEl.style.transition = 'none';
        runnerEl.style.left = '0%';
        runnerEl.classList.remove('runner-jump', 'runner-bump', 'runner-stuck');
        void runnerEl.offsetWidth;

        const obstacleCount = crateAttempt === 0 ? 2 : 3;
        approachObstacle(1, obstacleCount);
      }

      function approachObstacle(index, total) {
        jumped = false;
        const segPct = (index / (total + 1)) * 70 + 8;
        obstacleEl.style.left = `${segPct}%`;
        obstacleEl.hidden = false;

        runnerEl.classList.remove('runner-stuck');
        runnerEl.style.transition = `left ${SEGMENT_MS}ms ease-in-out`;
        runnerEl.style.left = `${segPct}%`;
        startWalk();

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
          stopWalk();
          if (jumped) {
            obstacleEl.hidden = true;
            if (index < total) {
              approachObstacle(index + 1, total);
            } else {
              runToCrate(segPct);
            }
            return;
          }

          // Missed it — the bunny gets stuck at the rock until the player jumps.
          runnerEl.classList.add('runner-stuck');
          stopListeningForJump();
          const unstickHandler = (e) => {
            if (e.code === 'Space' || e.key === ' ') {
              e.preventDefault();
              window.removeEventListener('keydown', unstickHandler);
              keydownHandler = null;
              runnerEl.classList.remove('runner-stuck');
              runnerEl.classList.add('runner-jump');
              setTimeout(() => runnerEl.classList.remove('runner-jump'), 400);
              obstacleEl.hidden = true;
              if (index < total) {
                approachObstacle(index + 1, total);
              } else {
                runToCrate(segPct);
              }
            }
          };
          window.addEventListener('keydown', unstickHandler);
          keydownHandler = unstickHandler;
        }, SEGMENT_MS);
      }

      function runToCrate(fromPct) {
        const targetPct = Math.min(fromPct + 14, 84);
        runnerEl.style.transition = `left ${SEGMENT_MS}ms ease-in-out`;
        runnerEl.style.left = `${targetPct}%`;
        startWalk();
        setTimeout(() => {
          stopWalk();
          crateEl.style.left = `${Math.min(targetPct + 8, 88)}%`;
          crateEl.hidden = false;
          crateEl.classList.add('crate-drop');
          showChoice();
        }, SEGMENT_MS);
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
        crateAttempt += 1;

        setTimeout(runCrateSequence, 600);
      }

      runCrateSequence();
    }
  }

  return { startRound };
})();
