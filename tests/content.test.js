import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, PATTERNS, TRACKS, questionById, questionsByPattern } from '../src/data.js';

const REQUIRED_FIELDS = [
  'id', 'title', 'pattern', 'difficulty', 'tier', 'minutes', 'tracks',
  'prompt', 'example', 'trigger', 'idea', 'mnemonic', 'steps', 'anchors',
  'code', 'time', 'space', 'traps', 'variations'
];

test('live curriculum is the intentionally compact 46-question deck', () => {
  assert.equal(QUESTIONS.length, 46);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  assert.equal(Object.keys(questionById).length, QUESTIONS.length);
});

test('every question has complete active-recall content and valid enums', () => {
  const patternIds = new Set(PATTERNS.map((pattern) => pattern.id));
  const trackIds = new Set(TRACKS.map((track) => track.id));
  for (const question of QUESTIONS) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(question[field] !== undefined, `${question.id} is missing ${field}`);
    }
    assert.ok(patternIds.has(question.pattern), `${question.id} has unknown pattern`);
    assert.ok(['Easy', 'Medium', 'Hard'].includes(question.difficulty));
    assert.ok(['foundation', 'core', 'stretch'].includes(question.tier));
    assert.ok(question.tracks.length > 0);
    question.tracks.forEach((track) => assert.ok(trackIds.has(track), `${question.id}: ${track}`));
    assert.ok(question.steps.length >= 4, `${question.id} needs reconstruction steps`);
    assert.ok(question.anchors.length >= 3, `${question.id} needs anchor lines`);
    assert.ok(question.traps.length >= 3, `${question.id} needs traps`);
    assert.ok(question.variations.length >= 3, `${question.id} needs variations`);
    assert.match(question.code, /#include <bits\/stdc\+\+\.h>/);
    for (const anchor of question.anchors) {
      assert.ok(question.code.includes(anchor), `${question.id} anchor missing from code: ${anchor}`);
    }
  }
});

test('all 16 patterns are represented, with extra tree/DP depth and limited graphs', () => {
  for (const pattern of PATTERNS) {
    assert.ok(questionsByPattern[pattern.id].length >= 1, `${pattern.id} has no live question`);
  }
  assert.equal(questionsByPattern.trees.length, 6);
  assert.equal(questionsByPattern.graphs.length, 3);
  assert.equal(questionsByPattern['dp-1d'].length, 4);
  assert.equal(questionsByPattern['dp-2d'].length, 3);
});

test('content avoids guaranteed company-question claims', () => {
  const text = JSON.stringify(QUESTIONS).toLowerCase();
  assert.doesNotMatch(text, /guaranteed company|always asked by|confirmed question/);
});
