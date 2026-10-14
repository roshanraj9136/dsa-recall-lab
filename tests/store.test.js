import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_MS, applyGrade, calculateStreak, createInitialState, dateKey,
  dueQuestionIds, exportState, getReview, importState, masteryPercent,
  sanitizeState, updateDraft
} from '../src/store.js';

const NOW = new Date(2026, 9, 15, 12, 0, 0).getTime();

test('good recall advances boxes on expanding intervals', () => {
  let state = createInitialState();
  state = applyGrade(state, 'two-sum', 'good', NOW);
  let review = getReview(state, 'two-sum', NOW);
  assert.equal(review.box, 1);
  assert.equal(review.dueAt, NOW + DAY_MS);
  assert.equal(review.status, 'learning');

  state = applyGrade(state, 'two-sum', 'good', review.dueAt);
  review = getReview(state, 'two-sum', review.dueAt);
  assert.equal(review.box, 2);
  assert.equal(review.dueAt, NOW + DAY_MS + 3 * DAY_MS);
});

test('forgot recall resets box and returns in ten minutes', () => {
  let state = applyGrade(createInitialState(), 'coin-change-minimum', 'good', NOW);
  state = applyGrade(state, 'coin-change-minimum', 'forgot', NOW + 1000);
  const review = getReview(state, 'coin-change-minimum', NOW + 1000);
  assert.equal(review.box, 0);
  assert.equal(review.lapses, 1);
  assert.equal(review.dueAt, NOW + 1000 + 10 * 60 * 1000);
  assert.equal(review.status, 'lapsed');
});

test('due queue excludes unseen and sorts overdue reviews', () => {
  let state = createInitialState();
  state = applyGrade(state, 'a', 'good', NOW - 4 * DAY_MS);
  state = applyGrade(state, 'b', 'good', NOW - 2 * DAY_MS);
  assert.deepEqual(dueQuestionIds(state, ['new', 'b', 'a'], NOW), ['a', 'b']);
});

test('streak counts through today or starts from yesterday', () => {
  const state = createInitialState();
  const today = new Date(2026, 9, 15);
  const yesterday = new Date(2026, 9, 14);
  const prior = new Date(2026, 9, 13);
  state.activity[dateKey(yesterday)] = 2;
  state.activity[dateKey(prior)] = 1;
  assert.equal(calculateStreak(state, today), 2);
  state.activity[dateKey(today)] = 1;
  assert.equal(calculateStreak(state, today), 3);
});

test('drafts are bounded and mastery derives from review boxes', () => {
  let state = updateDraft(createInitialState(), 'q', 'x'.repeat(40000));
  assert.equal(state.drafts.q.length, 30000);
  state = applyGrade(state, 'q', 'good', NOW);
  assert.equal(masteryPercent(state, ['q']), 20);
});

test('backup round trip is safe and rejects arbitrary JSON', () => {
  const state = sanitizeState({ ...createInitialState(), bookmarks: ['a', 'a'] });
  const restored = importState(exportState(state));
  assert.deepEqual(restored.bookmarks, ['a']);
  assert.throws(() => importState('{"data":{}}'), /valid RecallLoop backup/);
});
