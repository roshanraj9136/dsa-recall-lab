# RecallLoop

**Recognize the pattern. Reconstruct the code. Recall it under pressure.**

RecallLoop is a dependency-free C++17 DSA placement-preparation app built for active recall, not passive solution reading. It contains 46 fully authored must-repeat questions across 16 reusable patterns, a spaced-review queue, write-from-memory drills, a timed interview simulator, and private browser-local progress.

## Why this is different

For every question, RecallLoop teaches:

1. **Trigger** — the words and constraints that reveal the pattern.
2. **Invariant** — the one fact that must stay true while the algorithm runs.
3. **Memory hook** — a compact image or phrase, not a memorized wall of code.
4. **Reconstruction recipe** — ordered steps for rebuilding the solution.
5. **Anchor lines** — the few C++ lines worth recalling exactly.
6. **Recall test** — write before revealing, compare, then grade honestly.

A local Leitner-style schedule returns forgotten questions quickly and expands successful reviews from 1 → 3 → 7 → 14 → 30 → 60 days.

## Coverage

- Fundamentals and matrix/array logic
- Hashing, two pointers, sliding window, prefix sum
- Binary search and answer-space search
- Sorting and intervals, stacks and monotonic structures
- Linked lists, trees/BSTs, graphs
- Heaps and greedy algorithms
- Backtracking, 1D and 2D dynamic programming
- Trie, LRU cache, disjoint set, tree serialization

Track labels are **preparation affinities**, based on public reports and common interview curricula—not guarantees that a company will ask a listed problem. The Foundation route prioritizes service-company assessments; Core and Stretch add the pattern depth typical of stronger product/SaaS interviews.

## Run locally

No install or build is required. ES modules must be served over HTTP:

```bash
python -m http.server 4173
```

Open `http://localhost:4173`.

Validation:

```bash
npm test
npm run check
```

## Deploy with Vercel CLI

```bash
vercel --prod
```

The app uses hash routing, so every view works on static hosting without server rewrites. Progress remains in `localStorage`; export it from the Progress view before clearing browser data.

## Public research used for curriculum calibration

- [GeeksforGeeks — Deloitte Coding Interview Questions](https://www.geeksforgeeks.org/dsa/deloitte-coding-interview-questions/)
- [FACE Prep — TCS Interview Rounds and track differences](https://faceprep.in/article/tcs-interview-questions-from-latest-placement-drives/)
- [Great Learning — Accenture Coding Questions and Solutions](https://www.mygreatlearning.com/blog/accenture-coding-questions-solutions/)
- [Tech Interview Handbook — Grind 75](https://www.techinterviewhandbook.org/grind75/)

These public preparation sources are directional and can change. RecallLoop does not claim access to private, leaked, or guaranteed company question banks.

## Privacy and accessibility

There is no account, analytics SDK, or backend. Drafts, reviews, settings, and session history stay in your browser and can be exported/imported as JSON. The UI supports keyboard navigation, visible focus, reduced motion, responsive layouts, and light/dark themes.
