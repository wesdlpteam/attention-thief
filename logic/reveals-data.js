(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RevealsData = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const REVEALS = {
    lootcrate: {
      title: 'Loot Box Mechanic',
      body: "You just experienced a loot box. Random rewards keep your brain guessing — same trick as a slot machine.",
      seenIn: 'Genshin Impact, Fortnite, Roblox item crates',
    },
    streak: {
      title: 'Loss Aversion',
      body: "That panic when it reset? That's loss aversion — games use it to make you come back even when you don't want to.",
      seenIn: 'Snapchat streaks, Duolingo streaks, daily login bonuses',
    },
    leaderboard: {
      title: 'Leaderboard Pressure',
      body: 'Leaderboards drive competition, but they can also make people at the bottom feel bad or chase rank instead of fun.',
      seenIn: 'Mobile game rankings, class quiz leaderboards',
    },
    favourite: {
      title: 'Emotional Attachment',
      body: 'Games attach real feelings — favourite characters, streamers, friends — to a purchase button.',
      seenIn: 'Character skins, streamer merch, franchise tie-ins',
    },
    feed: {
      title: 'Frictionless Auto-Play',
      body: "Notice there was no natural stopping point? That's on purpose.",
      seenIn: 'TikTok, YouTube Shorts, Instagram Reels',
    },
  };

  const DISCUSSION_QUESTIONS = [
    'Which of these have you noticed in a game you play?',
    'Which trick do you think is the most convincing? Why?',
    'What could a game do instead that would still be fun but not manipulative?',
  ];

  function getReveal(roundId) {
    const reveal = REVEALS[roundId];
    if (!reveal) throw new Error(`No reveal found for round: ${roundId}`);
    return reveal;
  }

  function getDebriefList(order) {
    return order.map((id) => ({ id, ...getReveal(id) }));
  }

  return { getReveal, getDebriefList, DISCUSSION_QUESTIONS };
});
