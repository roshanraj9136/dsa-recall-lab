export const STORAGE_KEY = 'recall-loop.state.v1';
export const STATE_VERSION = 1;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60];

export function dateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createInitialState() {
  return {
    version: STATE_VERSION,
    reviews: {},
    drafts: {},
    bookmarks: [],
    activity: {},
    sessions: [],
    settings: {
      theme: 'system',
      dailyGoal: 5,
      preferredTrack: 'all'
    }
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function sanitizeState(value) {
  const base = createInitialState();
  if (!isPlainObject(value)) return base;
  const reviews = isPlainObject(value.reviews) ? value.reviews : {};
  const drafts = isPlainObject(value.drafts) ? value.drafts : {};
  const settings = isPlainObject(value.settings) ? value.settings : {};
  return {
    version: STATE_VERSION,
    reviews,
    drafts,
    bookmarks: Array.isArray(value.bookmarks) ? [...new Set(value.bookmarks.filter((x) => typeof x === 'string'))] : [],
    activity: isPlainObject(value.activity) ? value.activity : {},
    sessions: Array.isArray(value.sessions) ? value.sessions.slice(-50) : [],
    settings: {
      theme: ['light', 'dark', 'system'].includes(settings.theme) ? settings.theme : base.settings.theme,
      dailyGoal: [3, 5, 8, 10, 15].includes(Number(settings.dailyGoal)) ? Number(settings.dailyGoal) : base.settings.dailyGoal,
      preferredTrack: typeof settings.preferredTrack === 'string' ? settings.preferredTrack : base.settings.preferredTrack
    }
  };
}

export function loadState(storage = globalThis.localStorage) {
  if (!storage) return createInitialState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  if (!storage) return state;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state)));
  } catch {
    // The app remains usable when storage is blocked or full.
  }
  return state;
}

function reviewStatus(record, now = Date.now()) {
  if (!record?.attempts) return 'new';
  if (record.lastGrade === 'forgot') return 'lapsed';
  if (record.box >= 5) return 'mastered';
  if (record.box <= 1) return 'learning';
  if (Number(record.dueAt) <= now) return 'due';
  return 'review';
}

export function getReview(state, questionId, now = Date.now()) {
  const record = state.reviews[questionId];
  if (!record) {
    return {
      questionId,
      box: 0,
      attempts: 0,
      successes: 0,
      lapses: 0,
      dueAt: 0,
      lastReviewedAt: null,
      lastGrade: null,
      status: 'new'
    };
  }
  return { ...record, status: reviewStatus(record, now) };
}

export function applyGrade(state, questionId, grade, now = Date.now()) {
  if (!['forgot', 'hard', 'good'].includes(grade)) {
    throw new Error(`Unknown recall grade: ${grade}`);
  }
  const next = sanitizeState(structuredClone(state));
  const previous = getReview(next, questionId, now);
  let box = previous.box;
  let dueAt;

  if (grade === 'forgot') {
    box = 0;
    dueAt = now + 10 * 60 * 1000;
  } else if (grade === 'hard') {
    box = Math.max(1, box);
    const hardDays = box >= 4 ? 3 : box >= 2 ? 1 : 0.5;
    dueAt = now + hardDays * DAY_MS;
  } else {
    box = Math.min(REVIEW_INTERVAL_DAYS.length - 1, box + 1);
    dueAt = now + REVIEW_INTERVAL_DAYS[box] * DAY_MS;
  }

  next.reviews[questionId] = {
    questionId,
    box,
    attempts: previous.attempts + 1,
    successes: previous.successes + (grade === 'good' ? 1 : 0),
    lapses: previous.lapses + (grade === 'forgot' ? 1 : 0),
    dueAt,
    lastReviewedAt: now,
    lastGrade: grade
  };

  const key = dateKey(new Date(now));
  next.activity[key] = (Number(next.activity[key]) || 0) + 1;
  return next;
}

export function dueQuestionIds(state, questionIds, now = Date.now()) {
  return questionIds
    .filter((id) => {
      const review = getReview(state, id, now);
      return review.attempts > 0 && review.dueAt <= now;
    })
    .sort((a, b) => getReview(state, a, now).dueAt - getReview(state, b, now).dueAt);
}

export function unseenQuestionIds(state, questionIds) {
  return questionIds.filter((id) => !state.reviews[id]?.attempts);
}

export function learningStatus(state, questionId, now = Date.now()) {
  return getReview(state, questionId, now).status;
}

export function calculateStreak(state, now = new Date()) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today = dateKey(cursor);
  if (!state.activity[today]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (state.activity[dateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function masteryPercent(state, questionIds) {
  if (!questionIds.length) return 0;
  const earned = questionIds.reduce((sum, id) => sum + Math.min(getReview(state, id).box, 5), 0);
  return Math.round((earned / (questionIds.length * 5)) * 100);
}

export function updateDraft(state, questionId, code) {
  const next = sanitizeState(structuredClone(state));
  if (code) next.drafts[questionId] = String(code).slice(0, 30000);
  else delete next.drafts[questionId];
  return next;
}

export function toggleBookmark(state, questionId) {
  const next = sanitizeState(structuredClone(state));
  const set = new Set(next.bookmarks);
  if (set.has(questionId)) set.delete(questionId);
  else set.add(questionId);
  next.bookmarks = [...set];
  return next;
}

export function updateSettings(state, patch) {
  const next = sanitizeState(structuredClone(state));
  next.settings = { ...next.settings, ...patch };
  return sanitizeState(next);
}

export function addSession(state, session) {
  const next = sanitizeState(structuredClone(state));
  next.sessions.push({
    id: String(session.id || Date.now()),
    completedAt: Number(session.completedAt || Date.now()),
    durationMinutes: Number(session.durationMinutes || 0),
    questionIds: Array.isArray(session.questionIds) ? session.questionIds : [],
    track: String(session.track || 'all'),
    completed: Boolean(session.completed)
  });
  next.sessions = next.sessions.slice(-50);
  return next;
}

export function formatDue(timestamp, now = Date.now()) {
  const delta = Number(timestamp) - now;
  if (delta <= 0) return 'Due now';
  const minutes = Math.ceil(delta / 60000);
  if (minutes < 60) return `In ${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `In ${hours}h`;
  const days = Math.ceil(hours / 24);
  return `In ${days}d`;
}

export function exportState(state) {
  return JSON.stringify({
    app: 'RecallLoop',
    exportedAt: new Date().toISOString(),
    data: sanitizeState(state)
  }, null, 2);
}

export function importState(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!isPlainObject(parsed) || parsed.app !== 'RecallLoop' || !isPlainObject(parsed.data)) {
    throw new Error('This is not a valid RecallLoop backup.');
  }
  return sanitizeState(parsed.data);
}
