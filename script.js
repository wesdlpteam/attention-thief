// script.js
(function () {
  const ROUND_LABELS = {
    lootcrate: 'Loot Crate Clicker',
    streak: 'Streak Runner',
    leaderboard: 'Top Rank',
    favourite: 'My Favourite',
    feed: 'The Feed',
  };

  const ROUND_ICONS = {
    lootcrate: 'icon-open',
    streak: 'icon-medal1',
    leaderboard: 'icon-leaderboard',
    favourite: 'icon-cart',
    feed: 'icon-scroll',
  };

  let hubState = window.HubState.createHubState();
  let gameState = window.GameState.createGameState();

  const wallet = {
    getCoins: () => gameState.coins,
    canAfford: (amount) => window.GameState.canAfford(gameState, amount),
    spend: (amount) => {
      if (!window.GameState.canAfford(gameState, amount)) return false;
      gameState = window.GameState.spendCoins(gameState, amount);
      renderWallet();
      return true;
    },
    earn: (amount) => {
      gameState = window.GameState.addCoins(gameState, amount);
      renderWallet();
    },
  };

  const screens = {
    hub: document.getElementById('screen-hub'),
    round: document.getElementById('screen-round'),
    reveal: document.getElementById('screen-reveal'),
    debrief: document.getElementById('screen-debrief'),
  };

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
  }

  function renderWallet() {
    document.getElementById('wallet-coins').textContent = gameState.coins;
  }

  function renderProgressDots() {
    const dotsEl = document.getElementById('progress-dots');
    dotsEl.innerHTML = hubState.order
      .map((id) => `<span class="dot ${hubState.completed.includes(id) ? 'dot-done' : ''}"></span>`)
      .join('');
  }

  function renderHub() {
    const grid = document.getElementById('tile-grid');
    grid.innerHTML = '';
    hubState.order.forEach((roundId) => {
      const tile = document.createElement('button');
      tile.className = 'tile';
      const unlocked = window.HubState.isUnlocked(hubState, roundId);
      const done = hubState.completed.includes(roundId);
      const badge = !unlocked
        ? '<span class="tile-state-badge"><span class="icon-sprite icon-locked"></span></span>'
        : done
          ? '<span class="tile-state-badge"><span class="icon-sprite icon-check"></span></span>'
          : '';
      tile.innerHTML = `${badge}<span class="icon-sprite ${ROUND_ICONS[roundId]}"></span><span>${ROUND_LABELS[roundId]}</span>`;
      tile.disabled = !unlocked;
      if (done) tile.classList.add('tile-done');
      tile.addEventListener('click', () => openRound(roundId));
      grid.appendChild(tile);
    });

    if (window.HubState.allComplete(hubState)) {
      const debriefTile = document.createElement('button');
      debriefTile.className = 'tile tile-debrief';
      debriefTile.innerHTML = '<span class="icon-sprite icon-trophy"></span><span>Debrief</span>';
      debriefTile.addEventListener('click', openDebrief);
      grid.appendChild(debriefTile);
    }

    renderProgressDots();
    renderWallet();
    showScreen('hub');
  }

  function openRound(roundId) {
    const mount = document.getElementById('round-mount');
    mount.innerHTML = '';
    showScreen('round');
    window.Rounds[roundId].startRound(mount, () => showReveal(roundId), wallet);
  }

  function showReveal(roundId) {
    const reveal = window.RevealsData.getReveal(roundId);
    const iconEl = document.querySelector('.reveal-card .reveal-icon');
    iconEl.innerHTML = `<span class="icon-sprite ${ROUND_ICONS[roundId]} icon-tint-purple"></span>`;
    document.getElementById('reveal-title').textContent = reveal.title;
    document.getElementById('reveal-body').textContent = reveal.body;
    document.getElementById('reveal-seen-in').textContent = `Seen in: ${reveal.seenIn}`;
    showScreen('reveal');

    hubState = window.HubState.completeRound(hubState, roundId);
    renderProgressDots();

    const backBtn = document.getElementById('reveal-back-btn');
    backBtn.textContent = 'Back to FunZone';
    backBtn.onclick = () => {
      renderHub();
    };
  }

  function openDebrief() {
    const list = document.getElementById('debrief-list');
    list.innerHTML = '';
    window.RevealsData.getDebriefList(hubState.order).forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'debrief-item';
      item.innerHTML = `<h3>${entry.title}</h3><p>${entry.body}</p>`;
      list.appendChild(item);
    });

    showScreen('debrief');
  }

  document.getElementById('play-again-btn').addEventListener('click', () => {
    hubState = window.HubState.createHubState();
    gameState = window.GameState.createGameState();
    renderHub();
  });

  renderHub();
})();
