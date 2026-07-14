(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreakLogic = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function createStreakState() {
    return { day: 0, broken: false };
  }

  function advanceDay(state) {
    if (state.broken) return state;
    return { day: Math.min(state.day + 1, 7), broken: false };
  }

  function breakStreak() {
    return { day: 0, broken: true };
  }

  function restoreStreak(state, dayToRestore) {
    return { day: dayToRestore, broken: false };
  }

  return { createStreakState, advanceDay, breakStreak, restoreStreak };
});
