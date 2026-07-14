const test = require('node:test');
const assert = require('node:assert/strict');
const FeedLogic = require('../logic/feed-logic.js');

test('nextFeedItem cycles through captions by index', () => {
  const total = FeedLogic.CAPTIONS.length;
  const first = FeedLogic.nextFeedItem(0, () => 0);
  const wrapped = FeedLogic.nextFeedItem(total, () => 0);
  assert.equal(first.caption, wrapped.caption);
});

test('nextFeedItem likes are within the 1000-9999 range', () => {
  const low = FeedLogic.nextFeedItem(0, () => 0);
  const high = FeedLogic.nextFeedItem(0, () => 0.999999);
  assert.equal(low.likes, 1000);
  assert.ok(high.likes >= 1000 && high.likes <= 9999);
});

test('CAPTIONS has at least 5 pre-written captions', () => {
  assert.ok(FeedLogic.CAPTIONS.length >= 5);
});
