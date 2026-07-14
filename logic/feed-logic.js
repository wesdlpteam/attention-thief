(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FeedLogic = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const CAPTIONS = [
    'POV: your dog judges your life choices',
    'Wait for it...',
    'This one trick will not fix your day',
    'Tell me you relate without telling me',
    'Rating school lunches out of 10',
    'When the bell rings 2 minutes early',
  ];

  function nextFeedItem(index, rng) {
    const caption = CAPTIONS[index % CAPTIONS.length];
    const likes = Math.floor(1000 + rng() * 9000);
    return { caption, likes };
  }

  return { CAPTIONS, nextFeedItem };
});
