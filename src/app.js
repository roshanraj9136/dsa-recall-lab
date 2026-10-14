import {
  QUESTIONS, PATTERNS, TRACKS, TIERS, SOURCES, FEATURED_IDS, CURRICULUM,
  questionById, questionsByPattern, patternById, trackById
} from './data.js';
import {
  STORAGE_KEY, addSession, applyGrade, calculateStreak, createInitialState,
  dateKey, dueQuestionIds, exportState, formatDue, getReview, importState,
  learningStatus, loadState, masteryPercent, saveState, toggleBookmark,
  unseenQuestionIds, updateDraft, updateSettings
} from './store.js';

const app = document.querySelector('#app');
const searchDialog = document.querySelector('#search-dialog');
const globalSearch = document.querySelector('#global-search');
const searchResults = document.querySelector('#search-results');
const importFile = document.querySelector('#import-file');
const allQuestionIds = QUESTIONS.map((question) => question.id);
const tierOrder = Object.fromEntries(TIERS.map((tier) => [tier.id, tier.order]));
const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };

let state = loadState();
let saveDraftTimer = null;
let interviewTimer = null;
let ui = {
  library: { query: '', pattern: 'all', track: 'all', tier: 'all', status: 'all' },
  detailLevels: {},
  recall: null,
  interview: null
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function currentRoute() {
  const raw = (location.hash || '#/today').replace(/^#\/?/, '');
  const [path = 'today', query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'today', id: parts[1] || null, params: new URLSearchParams(query) };
}

function persist() {
  saveState(state);
  updateChrome();
}

function applyTheme() {
  const setting = state.settings.theme;
  const resolved = setting === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : setting;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0c1325' : '#101b35');
  const button = document.querySelector('[data-action="toggle-theme"]');
  if (button) {
    button.textContent = resolved === 'dark' ? '☀' : '☾';
    button.title = resolved === 'dark' ? 'Use light theme' : 'Use dark theme';
  }
}

function updateChrome() {
  const route = currentRoute();
  const active = route.name === 'question' ? 'library' : route.name === 'pattern' ? 'patterns' : route.name;
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const isActive = link.dataset.nav === active;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const due = dueQuestionIds(state, allQuestionIds).length;
  const dueBadge = document.querySelector('#due-badge');
  if (dueBadge) {
    dueBadge.textContent = String(due);
    dueBadge.hidden = due === 0;
  }
  const streak = calculateStreak(state);
  const streakPill = document.querySelector('#streak-pill');
  if (streakPill) {
    streakPill.querySelector('b').textContent = String(streak);
    streakPill.querySelector('span').textContent = ` day${streak === 1 ? '' : 's'} streak`;
  }
  applyTheme();
}

function toast(message, tone = 'default') {
  const region = document.querySelector('#toast-region');
  const item = document.createElement('div');
  item.className = `toast ${tone}`;
  item.textContent = message;
  region.append(item);
  requestAnimationFrame(() => item.classList.add('visible'));
  setTimeout(() => {
    item.classList.remove('visible');
    setTimeout(() => item.remove(), 250);
  }, 2800);
}

function statusMeta(questionId) {
  const review = getReview(state, questionId);
  const labels = {
    new: ['New', 'neutral'], learning: ['Learning', 'amber'], review: ['Scheduled', 'blue'],
    due: ['Due', 'red'], lapsed: ['Needs work', 'red'], mastered: ['Mastered', 'green']
  };
  const [label, tone] = labels[review.status] || labels.new;
  return { review, label, tone };
}

function pill(text, className = '') {
  return `<span class="pill ${className}">${escapeHtml(text)}</span>`;
}

function questionCard(question, compact = false) {
  const pattern = patternById[question.pattern];
  const { label, tone, review } = statusMeta(question.id);
  const bookmarked = state.bookmarks.includes(question.id);
  return `<article class="question-card ${compact ? 'compact' : ''} pattern-tone-${(pattern.order - 1) % 8}">
    <div class="question-card-top">
      <div class="card-tags">
        ${pill(question.tier, `tier-${question.tier}`)}
        ${pill(question.difficulty, `difficulty-${question.difficulty.toLowerCase()}`)}
      </div>
      <span class="status-label status-${tone}"><i></i>${label}${review.attempts ? ` · B${review.box}` : ''}</span>
    </div>
    <a class="card-title-link" href="#/question/${question.id}">
      <h3>${escapeHtml(question.title)}</h3>
      <p class="pattern-name">${String(pattern.order).padStart(2, '0')} · ${escapeHtml(pattern.name)}</p>
      ${compact ? '' : `<p class="card-trigger">${escapeHtml(question.trigger)}</p>`}
    </a>
    <div class="question-card-foot">
      <span>~${question.minutes} min</span>
      <span>${escapeHtml(question.time)}</span>
      ${bookmarked ? '<span title="Bookmarked">★ Focus</span>' : ''}
      <a href="#/recall?question=${question.id}" class="mini-link">Recall <b>→</b></a>
    </div>
  </article>`;
}

function pageHeader(eyebrow, title, description, actions = '') {
  return `<header class="page-header">
    <div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p>${description}</p></div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ''}
  </header>`;
}

function emptyState(title, body, action = '') {
  return `<div class="empty-state"><span class="empty-icon">✓</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p>${action}</div>`;
}

function dailyPlan() {
  const goal = state.settings.dailyGoal;
  const due = dueQuestionIds(state, allQuestionIds);
  const unseen = unseenQuestionIds(state, allQuestionIds);
  const preferred = [
    ...FEATURED_IDS.filter((id) => unseen.includes(id)),
    ...unseen.filter((id) => !FEATURED_IDS.includes(id))
  ];
  const ids = [...due.slice(0, goal)];
  for (const id of preferred) {
    if (ids.length >= goal) break;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids.map((id) => questionById[id]).filter(Boolean);
}

function todayView() {
  const due = dueQuestionIds(state, allQuestionIds);
  const seen = QUESTIONS.filter((question) => state.reviews[question.id]?.attempts);
  const mastered = QUESTIONS.filter((question) => getReview(state, question.id).status === 'mastered');
  const streak = calculateStreak(state);
  const todayCount = Number(state.activity[dateKey()] || 0);
  const goal = state.settings.dailyGoal;
  const plan = dailyPlan();
  const next = questionById[due[0]] || plan[0] || QUESTIONS[0];
  const totalMastery = masteryPercent(state, allQuestionIds);

  const focusCandidates = ['trees', 'dp-1d', 'dp-2d', ...PATTERNS.map((p) => p.id)];
  const uniqueFocus = [...new Set(focusCandidates)];
  const focusId = uniqueFocus.sort((a, b) =>
    masteryPercent(state, questionsByPattern[a].map((q) => q.id)) -
    masteryPercent(state, questionsByPattern[b].map((q) => q.id))
  )[0];
  const focus = patternById[focusId];

  return `<section class="page today-page">
    <div class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow"><span class="live-dot"></span>${due.length ? `${due.length} review${due.length === 1 ? '' : 's'} due` : 'Your recall loop is clear'}</p>
        <h1>Don’t memorize <em>code.</em><br>Rebuild the pattern.</h1>
        <p class="hero-lead">A focused ${CURRICULUM.questionCount}-question deck for placement interviews. Say the invariant, write from memory, then grade honestly.</p>
        <div class="hero-actions">
          <a class="button primary" href="#/recall?question=${next.id}">${due.length ? 'Start due review' : 'Start today’s recall'} <span>→</span></a>
          <a class="button ghost" href="#/patterns">Open pattern map</a>
        </div>
      </div>
      <div class="hero-ritual" aria-label="The 4-step recall ritual">
        <p class="ritual-label">Your 4-step ritual</p>
        <ol>
          <li><b>01</b><span><strong>Recognize</strong><small>Read constraints. Name the pattern.</small></span></li>
          <li><b>02</b><span><strong>State</strong><small>Say the invariant out loud.</small></span></li>
          <li><b>03</b><span><strong>Reconstruct</strong><small>Write anchors, then connect them.</small></span></li>
          <li><b>04</b><span><strong>Retrieve</strong><small>Repeat on the scheduled day.</small></span></li>
        </ol>
      </div>
    </div>

    <div class="stat-grid">
      <article class="stat-card"><span>Due now</span><strong>${due.length}</strong><small>${due.length ? 'Clear these first' : 'Nothing overdue'}</small></article>
      <article class="stat-card"><span>Deck seen</span><strong>${seen.length}<i>/${QUESTIONS.length}</i></strong><small>${QUESTIONS.length - seen.length} still new</small></article>
      <article class="stat-card"><span>Mastered</span><strong>${mastered.length}</strong><small>Box 5+ recall</small></article>
      <article class="stat-card accent"><span>Current streak</span><strong>${streak}<i> days</i></strong><small>${todayCount}/${goal} reviews today</small></article>
    </div>

    <div class="dashboard-grid">
      <section class="panel plan-panel">
        <div class="panel-head"><div><p class="eyebrow">Daily loop</p><h2>Today’s ${goal}-card plan</h2></div><span>${Math.min(todayCount, goal)}/${goal} done</span></div>
        <progress max="${goal}" value="${Math.min(todayCount, goal)}">${Math.round(Math.min(todayCount / goal, 1) * 100)}%</progress>
        <div class="plan-list">
          ${plan.length ? plan.map((question, index) => {
            const meta = statusMeta(question.id);
            return `<a href="#/recall?question=${question.id}" class="plan-item">
              <span class="plan-number">${String(index + 1).padStart(2, '0')}</span>
              <span><strong>${escapeHtml(question.title)}</strong><small>${escapeHtml(patternById[question.pattern].short)} · ${meta.label}</small></span>
              <b>→</b>
            </a>`;
          }).join('') : emptyState('Daily goal complete', 'Use Interview mode or explore a new pattern.')}
        </div>
      </section>

      <aside class="panel focus-panel pattern-tone-${(focus.order - 1) % 8}">
        <p class="eyebrow">Suggested focus</p>
        <span class="pattern-number">${String(focus.order).padStart(2, '0')}</span>
        <h2>${escapeHtml(focus.name)}</h2>
        <p>${escapeHtml(focus.hook)}</p>
        <div class="focus-progress"><span>Pattern mastery</span><b>${masteryPercent(state, questionsByPattern[focus.id].map((q) => q.id))}%</b></div>
        <progress max="100" value="${masteryPercent(state, questionsByPattern[focus.id].map((q) => q.id))}"></progress>
        <a href="#/pattern/${focus.id}">Study the mental model <span>→</span></a>
      </aside>
    </div>

    <section class="section-block">
      <div class="section-heading"><div><p class="eyebrow">High-yield anchors</p><h2>Repeat these until the pattern feels boring</h2></div><a href="#/library">View all ${QUESTIONS.length} <span>→</span></a></div>
      <div class="question-grid featured-grid">${FEATURED_IDS.slice(0, 4).map((id) => questionCard(questionById[id], true)).join('')}</div>
    </section>

    <div class="truth-note"><strong>Coverage note</strong><p>${escapeHtml(CURRICULUM.disclaimer)}</p></div>
  </section>`;
}

function sortedQuestions(list) {
  return [...list].sort((a, b) =>
    tierOrder[a.tier] - tierOrder[b.tier] ||
    patternById[a.pattern].order - patternById[b.pattern].order ||
    difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
  );
}

function filteredLibraryQuestions() {
  const filters = ui.library;
  const query = filters.query.trim().toLowerCase();
  return sortedQuestions(QUESTIONS.filter((question) => {
    const pattern = patternById[question.pattern];
    const searchable = `${question.title} ${question.prompt} ${question.trigger} ${question.mnemonic} ${pattern.name}`.toLowerCase();
    return (!query || searchable.includes(query)) &&
      (filters.pattern === 'all' || question.pattern === filters.pattern) &&
      (filters.track === 'all' || question.tracks.includes(filters.track)) &&
      (filters.tier === 'all' || question.tier === filters.tier) &&
      (filters.status === 'all' || learningStatus(state, question.id) === filters.status ||
        (filters.status === 'seen' && Boolean(state.reviews[question.id]?.attempts)) ||
        (filters.status === 'bookmarked' && state.bookmarks.includes(question.id)));
  }));
}

function libraryResultsMarkup() {
  const list = filteredLibraryQuestions();
  return `<div class="results-head"><p><strong>${list.length}</strong> of ${QUESTIONS.length} must-repeat questions</p><button class="text-button" data-action="clear-filters">Clear filters</button></div>
    ${list.length
      ? `<div class="question-grid">${list.map((question) => questionCard(question)).join('')}</div>`
      : emptyState('No matching question', 'Try a different keyword or clear the filters.', '<button class="button ghost" data-action="clear-filters">Clear filters</button>')}`;
}

function libraryView() {
  return `<section class="page library-page">
    ${pageHeader('Focused curriculum', 'The must-repeat library', `Only ${QUESTIONS.length} high-yield questions—small enough to revisit, broad enough to cover the patterns that transfer.`, `<a class="button primary small" href="#/recall">Start recall <span>→</span></a>`)}
    <div class="filter-panel">
      <label class="search-field"><span>⌕</span><input id="library-search" value="${escapeHtml(ui.library.query)}" placeholder="Search title, trigger, or mnemonic…"></label>
      <div class="filter-row">
        <label><span>Pattern</span><select id="filter-pattern"><option value="all">All 16 patterns</option>${PATTERNS.map((p) => `<option value="${p.id}" ${ui.library.pattern === p.id ? 'selected' : ''}>${String(p.order).padStart(2, '0')} · ${escapeHtml(p.short)}</option>`).join('')}</select></label>
        <label><span>Track affinity</span><select id="filter-track">${TRACKS.map((track) => `<option value="${track.id}" ${ui.library.track === track.id ? 'selected' : ''}>${escapeHtml(track.name)}</option>`).join('')}</select></label>
        <label><span>Priority</span><select id="filter-tier"><option value="all">All priorities</option>${TIERS.map((tier) => `<option value="${tier.id}" ${ui.library.tier === tier.id ? 'selected' : ''}>${tier.name}</option>`).join('')}</select></label>
        <label><span>Recall state</span><select id="filter-status"><option value="all">Any state</option><option value="new">New</option><option value="seen">Seen</option><option value="due">Due</option><option value="mastered">Mastered</option><option value="bookmarked">Focus list</option></select></label>
      </div>
    </div>
    <div id="library-results">${libraryResultsMarkup()}</div>
  </section>`;
}

function patternsView() {
  return `<section class="page patterns-page">
    ${pageHeader('16 mental models', 'Learn the map, not 46 isolated answers', 'Every question is attached to a trigger and invariant. Pattern recognition is what lets you reconstruct code when memory goes blank.')}
    <div class="pattern-principle">
      <span>THE INTERVIEW LOOP</span>
      <div><b>Constraint</b><i>→</i><b>Pattern</b><i>→</i><b>Invariant</b><i>→</i><b>Anchor lines</b><i>→</i><b>Full code</b></div>
    </div>
    <div class="pattern-grid">
      ${PATTERNS.map((pattern) => {
        const questions = questionsByPattern[pattern.id];
        const percent = masteryPercent(state, questions.map((q) => q.id));
        return `<a class="pattern-card pattern-tone-${(pattern.order - 1) % 8}" href="#/pattern/${pattern.id}">
          <div class="pattern-card-top"><span>${String(pattern.order).padStart(2, '0')}</span>${pill(`${questions.length} question${questions.length === 1 ? '' : 's'}`)}</div>
          <h2>${escapeHtml(pattern.name)}</h2>
          <p>${escapeHtml(pattern.hook)}</p>
          <div class="pattern-signal"><small>Trigger</small><span>${escapeHtml(pattern.signal)}</span></div>
          <div class="pattern-card-foot"><progress max="100" value="${percent}"></progress><b>${percent}%</b><i>→</i></div>
        </a>`;
      }).join('')}
    </div>
  </section>`;
}

function patternDetailView(patternId) {
  const pattern = patternById[patternId];
  if (!pattern) return notFoundView();
  const questions = questionsByPattern[pattern.id];
  const percent = masteryPercent(state, questions.map((q) => q.id));
  return `<section class="page detail-page pattern-detail pattern-tone-${(pattern.order - 1) % 8}">
    <a class="back-link" href="#/patterns">← All patterns</a>
    <header class="pattern-hero">
      <div class="pattern-index">${String(pattern.order).padStart(2, '0')}</div>
      <div><p class="eyebrow">Pattern mental model</p><h1>${escapeHtml(pattern.name)}</h1><p class="pattern-hook">“${escapeHtml(pattern.hook)}”</p></div>
      <div class="mastery-box"><strong>${percent}%</strong><span>mastery</span><progress max="100" value="${percent}"></progress></div>
    </header>
    <div class="pattern-learning-grid">
      <article class="panel"><p class="card-kicker">01 · Recognition signal</p><h2>When should this fire?</h2><p>${escapeHtml(pattern.signal)}</p></article>
      <article class="panel"><p class="card-kicker">02 · Invariant</p><h2>What must remain true?</h2><p>${escapeHtml(pattern.invariant)}</p></article>
    </div>
    <div class="pattern-body-grid">
      <section class="panel recipe-panel"><p class="card-kicker">03 · Reconstruction recipe</p><h2>Rebuild it in this order</h2><ol class="numbered-list">${pattern.recipe.map((step) => `<li><span>${escapeHtml(step)}</span></li>`).join('')}</ol>
        <h3>Anchor lines</h3><div class="anchor-list">${pattern.anchors.map((anchor) => `<code>${escapeHtml(anchor)}</code>`).join('')}</div>
      </section>
      <section class="panel code-panel"><div class="panel-head"><div><p class="card-kicker">04 · C++ skeleton</p><h2>Shape before details</h2></div><button class="icon-button bordered" data-action="copy-pattern" data-id="${pattern.id}" title="Copy skeleton">Copy</button></div><pre tabindex="0"><code>${escapeHtml(pattern.skeleton)}</code></pre></section>
    </div>
    <section class="panel mistakes-panel"><p class="card-kicker">Pressure traps</p><h2>Say these before you submit</h2><ul>${pattern.mistakes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
    <section class="section-block"><div class="section-heading"><div><p class="eyebrow">Drill set</p><h2>${questions.length} question${questions.length === 1 ? '' : 's'} using this pattern</h2></div><a href="#/recall?question=${questions[0]?.id || ''}">Recall this pattern <span>→</span></a></div><div class="question-grid">${questions.map((question) => questionCard(question)).join('')}</div></section>
  </section>`;
}

function questionDetailView(questionId) {
  const question = questionById[questionId];
  if (!question) return notFoundView();
  const pattern = patternById[question.pattern];
  const level = ui.detailLevels[question.id] || 0;
  const { review, label, tone } = statusMeta(question.id);
  const bookmarked = state.bookmarks.includes(question.id);
  return `<section class="page detail-page question-detail pattern-tone-${(pattern.order - 1) % 8}">
    <div class="detail-toolbar"><a class="back-link" href="#/library">← Library</a><div><span class="status-label status-${tone}"><i></i>${label}</span><button class="bookmark-button ${bookmarked ? 'active' : ''}" data-action="bookmark" data-id="${question.id}" aria-pressed="${bookmarked}">${bookmarked ? '★ In focus list' : '☆ Add to focus'}</button></div></div>
    <header class="question-hero">
      <div class="question-title-block"><div class="card-tags">${pill(question.tier, `tier-${question.tier}`)}${pill(question.difficulty, `difficulty-${question.difficulty.toLowerCase()}`)}${pill(`${question.minutes} min`)}</div><h1>${escapeHtml(question.title)}</h1><a href="#/pattern/${pattern.id}" class="pattern-link">Pattern ${String(pattern.order).padStart(2, '0')} · ${escapeHtml(pattern.name)} →</a></div>
      <a class="button primary" href="#/recall?question=${question.id}">Write from memory <span>→</span></a>
    </header>
    <div class="question-layout">
      <main class="question-main">
        <section class="panel prompt-panel"><p class="card-kicker">The question</p><h2>Problem</h2><p>${escapeHtml(question.prompt)}</p><div class="example-box"><span>Example</span><code>${escapeHtml(question.example)}</code></div></section>
        <section class="recall-gate">
          <div class="gate-head"><div><p class="card-kicker">Memory ladder</p><h2>Reveal one layer at a time</h2></div><span>${level}/2 revealed</span></div>
          <div class="gate-step open"><span>1</span><div><small>RECOGNIZE</small><h3>${escapeHtml(question.trigger)}</h3><p><strong>Invariant:</strong> ${escapeHtml(question.idea)}</p></div></div>
          <div class="memory-hook"><span>Memory hook</span><strong>“${escapeHtml(question.mnemonic)}”</strong></div>
          ${level >= 1 ? `<div class="gate-step open"><span>2</span><div><small>RECONSTRUCT</small><h3>Build it in this order</h3><ol>${question.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><div class="anchor-list">${question.anchors.map((anchor) => `<code>${escapeHtml(anchor)}</code>`).join('')}</div></div></div>` : `<button class="gate-button" data-action="detail-level" data-id="${question.id}" data-level="1"><span>2</span><div><small>Say the invariant first</small><strong>Then reveal reconstruction steps</strong></div><b>Unlock →</b></button>`}
          ${level >= 2 ? `<div class="gate-step open code-reveal"><span>3</span><div><div class="code-title"><div><small>REFERENCE</small><h3>C++17 solution</h3></div><button data-action="copy-question" data-id="${question.id}" class="button ghost small">Copy code</button></div><pre tabindex="0"><code>${escapeHtml(question.code)}</code></pre></div></div>` : `<button class="gate-button ${level < 1 ? 'locked' : ''}" data-action="detail-level" data-id="${question.id}" data-level="2" ${level < 1 ? 'disabled' : ''}><span>3</span><div><small>Trace the anchor lines</small><strong>Then reveal reference code</strong></div><b>${level < 1 ? 'Locked' : 'Unlock →'}</b></button>`}
        </section>
        ${level >= 2 ? `<section class="complexity-grid"><article><span>Time</span><strong>${escapeHtml(question.time)}</strong></article><article><span>Space</span><strong>${escapeHtml(question.space)}</strong></article></section><section class="panel verify-panel"><p class="card-kicker">Final verification</p><h2>Pressure traps</h2><ul>${question.traps.map((trap) => `<li>${escapeHtml(trap)}</li>`).join('')}</ul><h3>Variations to connect</h3><div class="variation-list">${question.variations.map((variation) => pill(variation)).join('')}</div></section>` : ''}
      </main>
      <aside class="question-aside">
        <section class="panel recall-status-card"><p class="card-kicker">Recall status</p><strong class="big-box">${review.attempts ? `Box ${review.box}` : 'New'}</strong><p>${review.attempts ? `${review.attempts} attempt${review.attempts === 1 ? '' : 's'} · ${formatDue(review.dueAt)}` : 'Complete one write-from-memory attempt to start scheduling.'}</p><a class="button primary full" href="#/recall?question=${question.id}">Open recall lab</a></section>
        <section class="panel track-card"><p class="card-kicker">Useful preparation affinity</p><div>${question.tracks.map((id) => pill(trackById[id].short)).join('')}</div><p class="fine-print">Affinity is directional, not a claim that these companies guarantee this question.</p></section>
        ${level >= 2 ? `<section class="panel quick-grade"><p class="card-kicker">Already recalled it?</p><p>Grade only if you attempted without looking.</p><div><button data-action="grade-detail" data-id="${question.id}" data-grade="forgot" class="grade forgot">Forgot</button><button data-action="grade-detail" data-id="${question.id}" data-grade="hard" class="grade hard">Hard</button><button data-action="grade-detail" data-id="${question.id}" data-grade="good" class="grade good">Got it</button></div></section>` : ''}
      </aside>
    </div>
  </section>`;
}

function chooseRecallQuestion(requestedId = null) {
  if (requestedId && questionById[requestedId]) return requestedId;
  const due = dueQuestionIds(state, allQuestionIds);
  if (due.length) return due[0];
  const unseen = unseenQuestionIds(state, allQuestionIds);
  const featured = FEATURED_IDS.find((id) => unseen.includes(id));
  return featured || unseen[0] || allQuestionIds
    .slice()
    .sort((a, b) => getReview(state, a).dueAt - getReview(state, b).dueAt)[0];
}

function ensureRecall(requestedId = null) {
  const id = chooseRecallQuestion(requestedId);
  if (!ui.recall || (requestedId && ui.recall.id !== requestedId)) {
    ui.recall = { id, stage: 0, plan: '', code: state.drafts[id] || '', showCue: false, showSkeleton: false };
  }
  return ui.recall;
}

function tokenizeCode(code) {
  return String(code).match(/[A-Za-z_]\w*|\d+|==|!=|<=|>=|&&|\|\||\+\+|--|->|[{}()[\];,+\-*/%=<>?:]/g) || [];
}

export function codeRecallScore(typed, reference) {
  const expected = tokenizeCode(reference);
  if (!expected.length || !String(typed).trim()) return 0;
  const available = new Map();
  for (const token of tokenizeCode(typed)) available.set(token, (available.get(token) || 0) + 1);
  let matched = 0;
  for (const token of expected) {
    const count = available.get(token) || 0;
    if (count > 0) {
      ++matched;
      available.set(token, count - 1);
    }
  }
  return Math.round((matched / expected.length) * 100);
}

function anchorRecall(question, typed) {
  const compact = String(typed).replace(/\s+/g, '');
  return question.anchors.filter((anchor) => compact.includes(anchor.replace(/\s+/g, ''))).length;
}

function recallView(params) {
  const requested = params.get('question');
  const recall = ensureRecall(requested);
  const question = questionById[recall.id];
  const pattern = patternById[question.pattern];
  const due = dueQuestionIds(state, allQuestionIds).length;
  const todayCount = Number(state.activity[dateKey()] || 0);
  const goal = state.settings.dailyGoal;

  if (recall.stage === 0) {
    return `<section class="page recall-page pattern-tone-${(pattern.order - 1) % 8}">
      ${pageHeader('Active recall · Step 1 of 3', 'Recognize before you remember', 'Do not hunt for exact code yet. Explain the approach and invariant as if an interviewer is listening.', `<span class="queue-count">${due} due · ${todayCount}/${goal} today</span>`)}
      <div class="recall-workspace">
        <main class="recall-main panel">
          <div class="recall-question-head"><div class="card-tags">${pill(question.difficulty, `difficulty-${question.difficulty.toLowerCase()}`)}${pill(`${question.minutes} min`)}</div><button class="text-button" data-action="swap-recall">Pick another</button></div>
          <h2>${escapeHtml(question.title)}</h2><p class="recall-prompt">${escapeHtml(question.prompt)}</p><div class="example-box"><span>Example</span><code>${escapeHtml(question.example)}</code></div>
          <label class="writing-field"><span>Your spoken/typed plan <small>What state will you hold? What stays true?</small></span><textarea id="recall-plan" rows="8" placeholder="I recognize this as…\nMy invariant is…\nI will initialize…\nFor each…\nFinally…">${escapeHtml(recall.plan)}</textarea></label>
          ${recall.showCue ? `<div class="cue-box"><span>Pattern cue</span><strong>${escapeHtml(pattern.name)}</strong><p>${escapeHtml(question.trigger)}</p></div>` : ''}
          <div class="workspace-actions"><button class="button ghost" data-action="toggle-recall-cue">${recall.showCue ? 'Hide cue' : 'Need one cue'}</button><button class="button primary" data-action="recall-stage" data-stage="1">My plan is ready <span>→</span></button></div>
        </main>
        <aside class="recall-rules panel"><p class="card-kicker">Before coding</p><h3>The 90-second check</h3><ol><li><b>1</b><span>Name the pattern.</span></li><li><b>2</b><span>State what your variables mean.</span></li><li><b>3</b><span>Say the loop/recursion invariant.</span></li><li><b>4</b><span>Call out one edge case.</span></li></ol><div class="no-peek">No solution is visible on this step.</div></aside>
      </div>
    </section>`;
  }

  if (recall.stage === 1) {
    return `<section class="page recall-page pattern-tone-${(pattern.order - 1) % 8}">
      ${pageHeader('Active recall · Step 2 of 3', 'Now reconstruct the C++', `Start with the ${question.anchors.length} anchor lines you remember. Connect them only after the algorithm’s shape is on screen.`, `<button class="button ghost small" data-action="recall-stage" data-stage="0">← Back to plan</button>`)}
      <div class="code-workspace">
        <main class="panel editor-panel"><div class="editor-head"><div><span class="language-dot"></span><strong>${escapeHtml(question.title)}.cpp</strong></div><span>Draft autosaved locally</span></div><textarea id="recall-code" class="code-editor" spellcheck="false" aria-label="Write C++ solution from memory" placeholder="#include <bits/stdc++.h>\nusing namespace std;\n\n// State the invariant, then code…">${escapeHtml(recall.code)}</textarea><div class="editor-actions"><button class="button ghost" data-action="toggle-skeleton">${recall.showSkeleton ? 'Hide pattern skeleton' : 'Show pattern skeleton'}</button><button class="button primary" data-action="recall-stage" data-stage="2">Reveal & compare <span>→</span></button></div></main>
        <aside class="panel code-coach"><p class="card-kicker">Your plan</p><p class="plan-preview">${recall.plan.trim() ? escapeHtml(recall.plan) : 'No written plan. Say it aloud before continuing.'}</p>${recall.showSkeleton ? `<div class="skeleton-box"><span>${escapeHtml(pattern.name)} skeleton</span><pre><code>${escapeHtml(pattern.skeleton)}</code></pre></div>` : `<div class="anchor-prompt"><strong>Blank-page rescue</strong><p>If stuck for 60 seconds, reveal the pattern skeleton—not the final answer.</p></div>`}<div class="editor-checks"><span>□ Handles empty/boundary input</span><span>□ Uses safe types</span><span>□ Complexity matches constraints</span></div></aside>
      </div>
    </section>`;
  }

  const score = codeRecallScore(recall.code, question.code);
  const anchors = anchorRecall(question, recall.code);
  return `<section class="page recall-page compare-page pattern-tone-${(pattern.order - 1) % 8}">
    ${pageHeader('Active recall · Step 3 of 3', 'Compare, repair, schedule', 'Similarity is only a memory signal—not a compiler or correctness verdict. Trace the invariant and edge cases before grading.', `<span class="coverage-badge"><strong>${score}%</strong> token recall</span>`)}
    <div class="comparison-summary"><div><span>Anchor lines recalled</span><strong>${anchors}/${question.anchors.length}</strong></div><div><span>Reference-token coverage</span><strong>${score}%</strong></div><div><span>Expected complexity</span><strong>${escapeHtml(question.time)}</strong></div></div>
    <div class="compare-grid">
      <section class="panel code-panel"><div class="code-title"><div><p class="card-kicker">Your attempt</p><h2>From memory</h2></div><button class="text-button" data-action="recall-stage" data-stage="1">Edit attempt</button></div><pre tabindex="0"><code>${escapeHtml(recall.code || '// No code written')}</code></pre></section>
      <section class="panel code-panel reference"><div class="code-title"><div><p class="card-kicker">Reference</p><h2>C++17 solution</h2></div><button class="text-button" data-action="copy-question" data-id="${question.id}">Copy</button></div><pre tabindex="0"><code>${escapeHtml(question.code)}</code></pre></section>
    </div>
    <div class="repair-grid">
      <section class="panel"><p class="card-kicker">Repair the memory</p><h2>Reconstruction order</h2><ol class="numbered-list">${question.steps.map((step) => `<li><span>${escapeHtml(step)}</span></li>`).join('')}</ol></section>
      <section class="panel"><p class="card-kicker">Check before submit</p><h2>Common traps</h2><ul class="trap-list">${question.traps.map((trap) => `<li>${escapeHtml(trap)}</li>`).join('')}</ul><div class="anchor-list">${question.anchors.map((anchor) => `<code class="${recall.code.replace(/\s+/g, '').includes(anchor.replace(/\s+/g, '')) ? 'remembered' : ''}">${escapeHtml(anchor)}</code>`).join('')}</div></section>
    </div>
    <section class="grade-panel panel"><div><p class="card-kicker">Schedule the next retrieval</p><h2>Could you rebuild it without the answer?</h2><p>Be strict. “Got it” means correct pattern, invariant, major anchor lines, and complexity—not identical formatting.</p></div><div class="grade-actions"><button class="grade forgot" data-action="grade-recall" data-grade="forgot"><strong>Forgot</strong><span>Again in 10 min</span></button><button class="grade hard" data-action="grade-recall" data-grade="hard"><strong>Hard</strong><span>Short interval</span></button><button class="grade good" data-action="grade-recall" data-grade="good"><strong>Got it</strong><span>Move forward</span></button></div></section>
  </section>`;
}

function interviewSetupView() {
  const recent = state.sessions.slice(-3).reverse();
  return `<section class="page interview-page">
    ${pageHeader('Pressure practice', 'Interview simulator', 'A quiet, timed room: no pattern labels, no hints, no reference solution until you submit.')}
    <div class="interview-intro-grid">
      <form class="panel interview-setup" id="interview-setup-form"><p class="card-kicker">Configure a round</p><h2>Build your simulation</h2>
        <label><span>Target track</span><select name="track">${TRACKS.map((track) => `<option value="${track.id}" ${state.settings.preferredTrack === track.id ? 'selected' : ''}>${escapeHtml(track.name)}</option>`).join('')}</select></label>
        <div class="form-row"><label><span>Questions</span><select name="count"><option value="1">1 focused problem</option><option value="2" selected>2-problem round</option><option value="3">3-problem round</option></select></label><label><span>Time limit</span><select name="duration"><option value="30">30 minutes</option><option value="45" selected>45 minutes</option><option value="60">60 minutes</option></select></label></div>
        <label><span>Difficulty mix</span><select name="difficulty"><option value="balanced">Balanced · Easy to Medium</option><option value="core">Core · Mostly Medium</option><option value="stretch">Stretch · Medium to Hard</option></select></label>
        <div class="simulation-rules"><span>• Pattern hidden</span><span>• Draft autosaved in session</span><span>• One visible countdown</span></div>
        <button class="button primary full" type="button" data-action="start-interview">Enter interview room <span>→</span></button>
      </form>
      <aside class="panel interviewer-note"><span class="quote-mark">“</span><h2>Practice the first 90 seconds.</h2><p>In a real interview, do not start typing immediately. Clarify input, state brute force, identify the pattern, and tell the interviewer your invariant.</p><div class="interviewer-checklist"><span><b>01</b> Clarify</span><span><b>02</b> Examples</span><span><b>03</b> Approach</span><span><b>04</b> Code</span><span><b>05</b> Test</span></div></aside>
    </div>
    <section class="section-block"><div class="section-heading"><div><p class="eyebrow">Recent rounds</p><h2>Your simulation history</h2></div></div>${recent.length ? `<div class="session-list">${recent.map((session) => `<article><span>${new Date(session.completedAt).toLocaleDateString()}</span><strong>${session.questionIds.length} questions · ${session.durationMinutes} min</strong><small>${escapeHtml(trackById[session.track]?.short || 'All')} · ${session.completed ? 'Submitted' : 'Time expired'}</small></article>`).join('')}</div>` : emptyState('No rounds yet', 'Your last three timed simulations will appear here.')}</section>
  </section>`;
}

function selectInterviewQuestions(track, count, difficulty) {
  const trackPool = QUESTIONS.filter((question) => track === 'all' || question.tracks.includes(track));
  let pool = trackPool;
  if (difficulty === 'balanced') pool = trackPool.filter((q) => q.difficulty !== 'Hard');
  if (difficulty === 'core') pool = trackPool.filter((q) => q.difficulty === 'Medium');
  if (difficulty === 'stretch') pool = trackPool.filter((q) => q.difficulty !== 'Easy');
  if (pool.length < count) pool = trackPool;
  if (pool.length < count) pool = QUESTIONS;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

function startInterview() {
  const form = document.querySelector('#interview-setup-form');
  const data = new FormData(form);
  const track = String(data.get('track'));
  const count = Number(data.get('count'));
  const duration = Number(data.get('duration'));
  const difficulty = String(data.get('difficulty'));
  const picked = selectInterviewQuestions(track, count, difficulty);
  const startedAt = Date.now();
  ui.interview = {
    id: String(startedAt), track, duration, difficulty, startedAt,
    endAt: startedAt + duration * 60 * 1000,
    questionIds: picked.map((q) => q.id), current: 0, drafts: {}, finished: false, expired: false
  };
  render();
}

function formatTimer(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function startInterviewClock() {
  clearInterval(interviewTimer);
  if (!ui.interview || ui.interview.finished) return;
  const tick = () => {
    const element = document.querySelector('#interview-time');
    const left = ui.interview.endAt - Date.now();
    if (element) {
      element.textContent = formatTimer(left);
      element.classList.toggle('urgent', left < 5 * 60 * 1000);
    }
    if (left <= 0) finishInterview(true);
  };
  tick();
  interviewTimer = setInterval(tick, 1000);
}

function finishInterview(expired = false) {
  if (!ui.interview || ui.interview.finished) return;
  clearInterval(interviewTimer);
  ui.interview.finished = true;
  ui.interview.expired = expired;
  state = addSession(state, {
    id: ui.interview.id,
    completedAt: Date.now(),
    durationMinutes: ui.interview.duration,
    questionIds: ui.interview.questionIds,
    track: ui.interview.track,
    completed: !expired
  });
  persist();
  render();
  toast(expired ? 'Time is up. Review the patterns honestly.' : 'Round submitted. Now inspect your decisions.', expired ? 'warning' : 'success');
}

function interviewRoomView() {
  const session = ui.interview;
  if (session.finished) {
    return `<section class="page interview-page results-page">
      ${pageHeader(session.expired ? 'Time expired' : 'Round complete', 'Review decisions, not just answers', 'For each problem, explain the trigger and invariant before opening its reference solution.')}
      <div class="round-summary panel"><div><span>Questions</span><strong>${session.questionIds.length}</strong></div><div><span>Planned time</span><strong>${session.duration}m</strong></div><div><span>Track</span><strong>${escapeHtml(trackById[session.track]?.short || 'All')}</strong></div></div>
      <div class="review-round-list">${session.questionIds.map((id, index) => {
        const question = questionById[id];
        const pattern = patternById[question.pattern];
        const draft = session.drafts[id] || '';
        return `<article class="panel"><span class="round-number">${String(index + 1).padStart(2, '0')}</span><div><div class="card-tags">${pill(question.difficulty)}${pill(pattern.short)}</div><h2>${escapeHtml(question.title)}</h2><p><strong>Your draft:</strong> ${draft.trim() ? `${draft.split('\n').length} lines written` : 'No code written'}</p><p class="post-trigger"><strong>Trigger:</strong> ${escapeHtml(question.trigger)}</p></div><div class="round-actions"><a class="button ghost small" href="#/question/${id}">Study solution</a><a class="button primary small" href="#/recall?question=${id}">Recall now</a></div></article>`;
      }).join('')}</div>
      <div class="center-actions"><button class="button ghost" data-action="new-interview">Configure another round</button><a class="button primary" href="#/progress">View progress <span>→</span></a></div>
    </section>`;
  }

  const question = questionById[session.questionIds[session.current]];
  return `<section class="interview-room">
    <header class="room-header"><div><span class="room-live"><i></i>INTERVIEW IN PROGRESS</span><strong>Question ${session.current + 1} of ${session.questionIds.length}</strong></div><div class="room-timer"><span>Time remaining</span><strong id="interview-time">${formatTimer(session.endAt - Date.now())}</strong></div><button class="button danger-outline" data-action="finish-interview">Submit round</button></header>
    <div class="room-tabs">${session.questionIds.map((id, index) => `<button class="${session.current === index ? 'active' : ''}" data-action="interview-tab" data-index="${index}"><span>${index + 1}</span>${session.drafts[id]?.trim() ? 'Drafted' : 'Unattempted'}</button>`).join('')}</div>
    <div class="room-layout"><section class="room-problem"><p class="eyebrow">Coding problem</p><h1>${escapeHtml(question.title)}</h1><p>${escapeHtml(question.prompt)}</p><div class="example-box"><span>Example</span><code>${escapeHtml(question.example)}</code></div><div class="interview-prompts"><h3>Talk before typing</h3><span>What are the constraints?</span><span>What is the brute-force approach?</span><span>What state/invariant will your optimal approach maintain?</span><span>Which edge case will you test first?</span></div></section><section class="room-editor"><div class="editor-head"><div><span class="language-dot"></span><strong>solution.cpp</strong></div><span>C++17 · no hints</span></div><textarea id="interview-code" class="code-editor" spellcheck="false" placeholder="#include <bits/stdc++.h>\nusing namespace std;\n\n// Explain, then implement…">${escapeHtml(session.drafts[question.id] || '')}</textarea><div class="room-editor-foot"><span>Draft stays in this browser session</span><div>${session.current > 0 ? '<button class="button ghost small" data-action="interview-prev">← Previous</button>' : ''}${session.current < session.questionIds.length - 1 ? '<button class="button primary small" data-action="interview-next">Next question →</button>' : '<button class="button primary small" data-action="finish-interview">Submit round</button>'}</div></div></section></div>
  </section>`;
}

function interviewView() {
  return ui.interview ? interviewRoomView() : interviewSetupView();
}

function heatmapMarkup() {
  const cells = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 55);
  for (let i = 0; i < 56; ++i) {
    const key = dateKey(cursor);
    const count = Number(state.activity[key] || 0);
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4;
    cells.push(`<span class="heat heat-${level}" title="${cursor.toLocaleDateString()}: ${count} review${count === 1 ? '' : 's'}" aria-label="${cursor.toLocaleDateString()}, ${count} reviews"></span>`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells.join('');
}

function progressView() {
  const seen = QUESTIONS.filter((q) => state.reviews[q.id]?.attempts);
  const mastered = QUESTIONS.filter((q) => getReview(state, q.id).status === 'mastered');
  const totalAttempts = Object.values(state.reviews).reduce((sum, item) => sum + Number(item.attempts || 0), 0);
  const totalLapses = Object.values(state.reviews).reduce((sum, item) => sum + Number(item.lapses || 0), 0);
  const percent = masteryPercent(state, allQuestionIds);
  const weak = QUESTIONS.filter((q) => state.reviews[q.id]?.attempts)
    .sort((a, b) => {
      const A = getReview(state, a.id), B = getReview(state, b.id);
      return B.lapses - A.lapses || A.box - B.box || A.successes - B.successes;
    }).slice(0, 5);

  return `<section class="page progress-page">
    ${pageHeader('Local learning record', 'Progress that measures retrieval', 'Your data stays in this browser. Mastery grows only when you successfully recall on expanding intervals.', `<button class="button ghost small" data-action="export-data">Export backup</button>`)}
    <div class="progress-overview">
      <article class="mastery-panel panel"><div class="mastery-dial"><strong>${percent}%</strong><span>deck mastery</span></div><div><p class="eyebrow">Current signal</p><h2>${percent < 20 ? 'Build the first recall layer' : percent < 60 ? 'Your patterns are taking shape' : percent < 90 ? 'Now train under pressure' : 'Keep the memory durable'}</h2><p>${seen.length} seen · ${mastered.length} mastered · ${QUESTIONS.length - seen.length} new</p><progress max="100" value="${percent}"></progress></div></article>
      <div class="mini-stat-stack"><article><span>Total recalls</span><strong>${totalAttempts}</strong></article><article><span>Memory lapses</span><strong>${totalLapses}</strong></article><article><span>Current streak</span><strong>${calculateStreak(state)}d</strong></article></div>
    </div>
    <div class="progress-grid">
      <section class="panel pattern-progress"><div class="panel-head"><div><p class="card-kicker">Pattern map</p><h2>Mastery by mental model</h2></div><a href="#/patterns">Study map →</a></div><div>${PATTERNS.map((pattern) => {
        const ids = questionsByPattern[pattern.id].map((q) => q.id);
        const value = masteryPercent(state, ids);
        return `<a href="#/pattern/${pattern.id}" class="progress-row"><span class="progress-index">${String(pattern.order).padStart(2, '0')}</span><span><strong>${escapeHtml(pattern.short)}</strong><small>${ids.length} card${ids.length === 1 ? '' : 's'}</small></span><progress max="100" value="${value}"></progress><b>${value}%</b></a>`;
      }).join('')}</div></section>
      <aside class="panel activity-panel"><p class="card-kicker">Last 8 weeks</p><h2>Recall activity</h2><div class="heatmap" role="img" aria-label="Eight week practice heatmap">${heatmapMarkup()}</div><div class="heat-legend"><span>Less</span><i class="heat heat-0"></i><i class="heat heat-1"></i><i class="heat heat-2"></i><i class="heat heat-3"></i><i class="heat heat-4"></i><span>More</span></div><div class="streak-callout"><strong>🔥 ${calculateStreak(state)} day streak</strong><span>One honest recall keeps the chain alive.</span></div></aside>
    </div>
    <section class="section-block"><div class="section-heading"><div><p class="eyebrow">Repair queue</p><h2>Questions needing more retrieval</h2></div><a href="#/recall">Open recall lab →</a></div>${weak.length ? `<div class="question-grid">${weak.map((q) => questionCard(q, true)).join('')}</div>` : emptyState('No weak cards yet', 'Complete a few recall attempts; hard and forgotten cards will collect here.')}</section>
    <div class="settings-grid">
      <section class="panel settings-panel"><p class="card-kicker">Study settings</p><h2>Shape your daily loop</h2><label><span>Daily recall goal</span><select id="setting-goal">${[3,5,8,10,15].map((value) => `<option value="${value}" ${state.settings.dailyGoal === value ? 'selected' : ''}>${value} cards / day</option>`).join('')}</select></label><label><span>Preferred interview track</span><select id="setting-track">${TRACKS.map((track) => `<option value="${track.id}" ${state.settings.preferredTrack === track.id ? 'selected' : ''}>${escapeHtml(track.name)}</option>`).join('')}</select></label><label><span>Theme</span><select id="setting-theme"><option value="system" ${state.settings.theme === 'system' ? 'selected' : ''}>Follow system</option><option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Dark</option></select></label></section>
      <section class="panel data-panel"><p class="card-kicker">Private browser data</p><h2>Backup or restore</h2><p>Reviews, code drafts, and interview history never leave this browser unless you export them.</p><div><button class="button ghost" data-action="export-data">Export JSON</button><button class="button ghost" data-action="import-data">Import JSON</button></div><button class="danger-link" data-action="reset-data">Reset all local progress</button></section>
    </div>
    <section class="panel sources-panel"><div><p class="card-kicker">Method & research</p><h2>Directional evidence, never guarantees</h2><p>The compact curriculum was calibrated against public placement/interview guides and a recognized pattern-based study list. Company processes change; these links do not prove a specific future question.</p></div><ul>${SOURCES.map((source) => `<li><a href="${source.url}" target="_blank" rel="noreferrer">${escapeHtml(source.name)} <span>↗</span></a></li>`).join('')}</ul></section>
  </section>`;
}

function notFoundView() {
  return `<section class="page"><div class="not-found"><span>404</span><h1>That recall card does not exist.</h1><p>Return to the focused question library.</p><a class="button primary" href="#/library">Open library</a></div></section>`;
}

function render() {
  const route = currentRoute();
  if (route.name !== 'interview') clearInterval(interviewTimer);
  const views = {
    today: () => todayView(),
    library: () => libraryView(),
    patterns: () => patternsView(),
    pattern: () => patternDetailView(route.id),
    question: () => questionDetailView(route.id),
    recall: () => recallView(route.params),
    interview: () => interviewView(),
    progress: () => progressView()
  };
  app.innerHTML = (views[route.name] || notFoundView)();
  updateChrome();
  if (route.name === 'interview' && ui.interview && !ui.interview.finished) startInterviewClock();
}

function refreshLibraryResults() {
  const element = document.querySelector('#library-results');
  if (element) element.innerHTML = libraryResultsMarkup();
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard.', 'success')).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);
}

function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.className = 'copy-helper';
  document.body.append(area);
  area.select();
  document.execCommand('copy');
  area.remove();
  toast('Copied to clipboard.', 'success');
}

function gradeQuestion(id, grade, fromRecall = false) {
  state = applyGrade(state, id, grade);
  persist();
  const nextReview = getReview(state, id);
  const messages = { forgot: 'Marked forgotten—repair it, then retry in 10 minutes.', hard: `Hard recall saved. ${formatDue(nextReview.dueAt)}.`, good: `Strong recall saved. ${formatDue(nextReview.dueAt)}.` };
  toast(messages[grade], grade === 'good' ? 'success' : grade === 'forgot' ? 'warning' : 'default');
  if (fromRecall) {
    ui.recall = null;
    if (location.hash.includes('?')) history.replaceState(null, '', '#/recall');
  }
  render();
}

function updateGlobalSearch() {
  const query = globalSearch.value.trim().toLowerCase();
  const found = QUESTIONS.filter((question) => {
    const pattern = patternById[question.pattern];
    return `${question.title} ${question.trigger} ${question.mnemonic} ${pattern.name}`.toLowerCase().includes(query);
  }).slice(0, 8);
  searchResults.innerHTML = found.length ? found.map((question) => {
    const pattern = patternById[question.pattern];
    return `<a class="search-result" href="#/question/${question.id}"><span class="search-result-index">${String(pattern.order).padStart(2, '0')}</span><span><strong>${escapeHtml(question.title)}</strong><small>${escapeHtml(pattern.name)} · ${question.difficulty}</small></span><b>→</b></a>`;
  }).join('') : emptyState('No result', 'Try a pattern name such as “window”, “tree”, or “DP”.');
}

function exportBackup() {
  const blob = new Blob([exportState(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `recall-loop-backup-${dateKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast('Backup exported.', 'success');
}

document.addEventListener('click', (event) => {
  const searchLink = event.target.closest('.search-result');
  if (searchLink && searchDialog.open) searchDialog.close();
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'go-today') location.hash = '#/today';
  else if (action === 'toggle-theme') {
    const current = document.documentElement.dataset.theme;
    state = updateSettings(state, { theme: current === 'dark' ? 'light' : 'dark' });
    persist();
  } else if (action === 'open-search') {
    searchDialog.showModal();
    globalSearch.value = '';
    updateGlobalSearch();
    setTimeout(() => globalSearch.focus(), 20);
  } else if (action === 'clear-filters') {
    ui.library = { query: '', pattern: 'all', track: 'all', tier: 'all', status: 'all' };
    render();
  } else if (action === 'copy-pattern') copyText(patternById[target.dataset.id]?.skeleton || '');
  else if (action === 'copy-question') copyText(questionById[target.dataset.id]?.code || '');
  else if (action === 'bookmark') {
    state = toggleBookmark(state, target.dataset.id); persist(); render();
  } else if (action === 'detail-level') {
    ui.detailLevels[target.dataset.id] = Number(target.dataset.level); render();
  } else if (action === 'grade-detail') gradeQuestion(target.dataset.id, target.dataset.grade);
  else if (action === 'toggle-recall-cue') { ui.recall.showCue = !ui.recall.showCue; render(); }
  else if (action === 'toggle-skeleton') { ui.recall.showSkeleton = !ui.recall.showSkeleton; render(); }
  else if (action === 'recall-stage') {
    if (ui.recall) ui.recall.stage = Number(target.dataset.stage);
    render();
  } else if (action === 'swap-recall') {
    const current = ui.recall?.id;
    const alternatives = dailyPlan().map((q) => q.id).filter((id) => id !== current);
    const next = alternatives[0] || QUESTIONS.find((q) => q.id !== current)?.id;
    ui.recall = null;
    history.replaceState(null, '', `#/recall?question=${next}`);
    render();
  } else if (action === 'grade-recall') gradeQuestion(ui.recall.id, target.dataset.grade, true);
  else if (action === 'start-interview') startInterview();
  else if (action === 'interview-tab') { ui.interview.current = Number(target.dataset.index); render(); }
  else if (action === 'interview-prev') { ui.interview.current -= 1; render(); }
  else if (action === 'interview-next') { ui.interview.current += 1; render(); }
  else if (action === 'finish-interview') {
    if (confirm('Submit this round? Reference patterns remain hidden until submission.')) finishInterview(false);
  } else if (action === 'new-interview') { ui.interview = null; render(); }
  else if (action === 'export-data') exportBackup();
  else if (action === 'import-data') importFile.click();
  else if (action === 'reset-data') {
    if (confirm('Reset every review, draft, bookmark, and interview session stored in this browser? This cannot be undone unless you exported a backup.')) {
      localStorage.removeItem(STORAGE_KEY);
      state = createInitialState();
      ui.recall = null; ui.interview = null;
      persist(); render(); toast('Local progress reset.');
    }
  }
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (input.id === 'library-search') {
    ui.library.query = input.value;
    refreshLibraryResults();
  } else if (input.id === 'global-search') updateGlobalSearch();
  else if (input.id === 'recall-plan' && ui.recall) ui.recall.plan = input.value;
  else if (input.id === 'recall-code' && ui.recall) {
    ui.recall.code = input.value;
    const draftId = ui.recall.id;
    const draftCode = input.value;
    clearTimeout(saveDraftTimer);
    saveDraftTimer = setTimeout(() => {
      state = updateDraft(state, draftId, draftCode);
      persist();
    }, 250);
  } else if (input.id === 'interview-code' && ui.interview) {
    const id = ui.interview.questionIds[ui.interview.current];
    ui.interview.drafts[id] = input.value;
  }
});

document.addEventListener('change', (event) => {
  const input = event.target;
  const filterMap = { 'filter-pattern': 'pattern', 'filter-track': 'track', 'filter-tier': 'tier', 'filter-status': 'status' };
  if (filterMap[input.id]) {
    ui.library[filterMap[input.id]] = input.value;
    refreshLibraryResults();
  } else if (input.id === 'setting-goal') {
    state = updateSettings(state, { dailyGoal: Number(input.value) }); persist(); render(); toast('Daily goal updated.', 'success');
  } else if (input.id === 'setting-track') {
    state = updateSettings(state, { preferredTrack: input.value }); persist(); render(); toast('Preferred track updated.', 'success');
  } else if (input.id === 'setting-theme') {
    state = updateSettings(state, { theme: input.value }); persist(); render();
  }
});

importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  try {
    const restored = importState(await file.text());
    if (!confirm('Replace current local progress with this backup?')) return;
    state = restored; persist(); render(); toast('Backup restored.', 'success');
  } catch (error) {
    toast(error.message || 'Could not import this file.', 'warning');
  } finally {
    importFile.value = '';
  }
});

window.addEventListener('hashchange', () => {
  const route = currentRoute();
  if (route.name !== 'recall') ui.recall = null;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('#main-content')?.focus({ preventScroll: true });
});

window.addEventListener('keydown', (event) => {
  const tag = document.activeElement?.tagName;
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
    event.preventDefault();
    searchDialog.showModal();
    globalSearch.value = '';
    updateGlobalSearch();
    setTimeout(() => globalSearch.focus(), 20);
  }
});

matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (state.settings.theme === 'system') applyTheme();
});

if (!location.hash) history.replaceState(null, '', '#/today');
render();
