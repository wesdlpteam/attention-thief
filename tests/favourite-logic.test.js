const test = require('node:test');
const assert = require('node:assert/strict');
const FavouriteLogic = require('../logic/favourite-logic.js');

test('MASCOTS has exactly 4 original characters', () => {
  assert.equal(FavouriteLogic.MASCOTS.length, 4);
  FavouriteLogic.MASCOTS.forEach((mascot) => {
    assert.equal(typeof mascot.id, 'string');
    assert.equal(typeof mascot.name, 'string');
    assert.equal(typeof mascot.personality, 'string');
    assert.equal(typeof mascot.color, 'string');
  });
});

test('getMascotById returns the matching mascot', () => {
  const mascot = FavouriteLogic.getMascotById('zippo');
  assert.equal(mascot.name, 'Zippo');
});

test('getMascotById throws for an unknown id', () => {
  assert.throws(() => FavouriteLogic.getMascotById('nope'));
});

test('buildLimitedOffer mentions the mascot name', () => {
  const offer = FavouriteLogic.buildLimitedOffer('mossy');
  assert.match(offer, /Mossy/);
});
