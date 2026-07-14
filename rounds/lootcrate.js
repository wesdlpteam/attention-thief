// rounds/lootcrate.js
window.Rounds = window.Rounds || {};
window.Rounds.lootcrate = (function () {
  function startRound(mountEl, onComplete) {
    let state = window.LootcrateLogic.createLootState(6);
    mountEl.innerHTML = `
      <h2>Loot Crate Clicker</h2>
      <p>Keys left: <span id="keys-left">${state.keys}</span></p>
      <button id="open-crate-btn">Open Crate</button>
      <div id="crate-result"></div>
    `;

    const keysEl = mountEl.querySelector('#keys-left');
    const resultEl = mountEl.querySelector('#crate-result');
    const btn = mountEl.querySelector('#open-crate-btn');

    btn.addEventListener('click', () => {
      if (state.keys <= 0) return;
      state = window.LootcrateLogic.openCrate(state, Math.random);
      keysEl.textContent = state.keys;
      const lastReward = state.opened[state.opened.length - 1];
      const rewardEl = document.createElement('div');
      rewardEl.className = `reward reward-${lastReward}`;
      const icon = lastReward === 'legendary' ? 'icon-star' : lastReward === 'rare' ? 'icon-medal2' : '';
      rewardEl.innerHTML = `${icon ? `<span class="icon-sprite ${icon}"></span>` : ''}<span>${lastReward.toUpperCase()}</span>`;
      resultEl.prepend(rewardEl);

      if (state.keys <= 0) {
        btn.disabled = true;
        setTimeout(onComplete, 1200);
      }
    });
  }

  return { startRound };
})();
