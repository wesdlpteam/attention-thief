const test = require('node:test');
const assert = require('node:assert/strict');
const RevealsData = require('../logic/reveals-data.js');

test('getReveal returns title/body/seenIn for a known round', () => {
  const reveal = RevealsData.getReveal('lootcrate');
  assert.equal(typeof reveal.title, 'string');
  assert.equal(typeof reveal.body, 'string');
  assert.equal(typeof reveal.seenIn, 'string');
});

test('getReveal throws for an unknown round id', () => {
  assert.throws(() => RevealsData.getReveal('not-a-round'));
});

test('getDebriefList returns entries in the given order', () => {
  const list = RevealsData.getDebriefList(['streak', 'lootcrate']);
  assert.deepEqual(list.map((entry) => entry.id), ['streak', 'lootcrate']);
  assert.equal(list[0].title, RevealsData.getReveal('streak').title);
});

test('DISCUSSION_QUESTIONS has exactly 3 questions', () => {
  assert.equal(RevealsData.DISCUSSION_QUESTIONS.length, 3);
});
