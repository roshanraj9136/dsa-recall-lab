import { FOUNDATION_QUESTIONS } from './questions-foundation.js';
import { CORE_A_QUESTIONS } from './questions-core-a.js';
import { CORE_B_QUESTIONS } from './questions-core-b.js';
import { DP_QUESTIONS } from './questions-dp.js';
import { PATTERNS, TRACKS, TIERS, SOURCES, patternById, trackById } from './patterns.js';

// The source modules contain a few useful extensions. Keep the live deck deliberately
// small: these three are represented by nearby core patterns/variations and are omitted
// so the learner repeats the highest-yield set rather than chasing volume.
const DEFERRED_IDS = new Set([
  'prime-check-sqrt',
  'container-most-water',
  'sliding-window-maximum'
]);

export const QUESTIONS = Object.freeze([
  ...FOUNDATION_QUESTIONS.filter((question) => !DEFERRED_IDS.has(question.id)),
  ...CORE_A_QUESTIONS,
  ...CORE_B_QUESTIONS,
  ...DP_QUESTIONS
]);

export const questionById = Object.freeze(
  Object.fromEntries(QUESTIONS.map((question) => [question.id, question]))
);

export const questionsByPattern = Object.freeze(
  Object.fromEntries(PATTERNS.map((pattern) => [
    pattern.id,
    QUESTIONS.filter((question) => question.pattern === pattern.id)
  ]))
);

export const questionsByTier = Object.freeze(
  Object.fromEntries(TIERS.map((tier) => [
    tier.id,
    QUESTIONS.filter((question) => question.tier === tier.id)
  ]))
);

export const FEATURED_IDS = Object.freeze([
  'two-sum',
  'longest-substring-no-repeat',
  'first-last-position',
  'reverse-linked-list',
  'maximum-depth-tree',
  'diameter-binary-tree',
  'number-of-islands',
  'house-robber',
  'coin-change-minimum',
  'longest-common-subsequence'
]);

export const CURRICULUM = Object.freeze({
  questionCount: QUESTIONS.length,
  patternCount: PATTERNS.length,
  focus: 'A compact must-repeat deck: expanded trees and DP, only essential graph coverage.',
  disclaimer: 'Track labels show preparation affinity based on common public patterns—not a guarantee that any company will ask a specific question.'
});

export { PATTERNS, TRACKS, TIERS, SOURCES, patternById, trackById };
