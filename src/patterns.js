export const TRACKS = [
  { id: 'all', name: 'All tracks', short: 'All', description: 'The complete Foundation → Stretch route.' },
  { id: 'accenture-core', name: 'Accenture fundamentals', short: 'Accenture', description: 'Arrays, strings, math, loops, and clear function-level coding.' },
  { id: 'tcs-core', name: 'TCS core / NQT', short: 'TCS Core', description: 'Programming fundamentals, search/sort, arrays, strings, and basic data structures.' },
  { id: 'tcs-digital', name: 'TCS Digital / Prime', short: 'TCS D/P', description: 'Deeper optimization, common medium patterns, trees, graphs, and DP.' },
  { id: 'deloitte-tech', name: 'Deloitte technology roles', short: 'Deloitte', description: 'Core problem solving through frequently reported medium-level patterns.' },
  { id: 'saas-12-15', name: '12–15 LPA SaaS / product', short: 'SaaS 12–15', description: 'Pattern fluency, clean optimal code, edge cases, and medium-to-stretch questions.' }
];

export const TIERS = [
  { id: 'foundation', name: 'Foundation', order: 1, description: 'Do these first. They build dependable coding fluency for service-company rounds.' },
  { id: 'core', name: 'Core', order: 2, description: 'The reusable medium patterns expected for stronger technical rounds.' },
  { id: 'stretch', name: 'Stretch', order: 3, description: 'Harder extensions that separate candidates in product/SaaS interviews.' }
];

const p = (id, order, name, short, signal, invariant, hook, recipe, anchors, skeleton, mistakes) => ({
  id, order, name, short, signal, invariant, hook, recipe, anchors, skeleton, mistakes
});

export const PATTERNS = [
  p(
    'fundamentals', 1, 'Fundamentals & simulation', 'Scan / simulate',
    'The statement asks you to directly inspect, count, transform, or simulate; constraints are small enough that a clean pass or standard sort is sufficient.',
    'After processing index i, your variables exactly summarize the processed prefix.',
    'Carry a tiny scoreboard while walking left → right.',
    ['Name what each variable means before the loop.', 'Choose safe initialization for empty, negative, or duplicate values.', 'Process one item and update the summary.', 'Return only after checking boundary cases.'],
    ['for (int x : a)', 'best = max(best, x)', 'Handle n < required size first'],
`// Prefix-summary skeleton
State answer = identity;
for (Item x : input) {
    // update answer using x
}
return answer;`,
    ['Sorting when one scan is enough', 'Using 0 as an initial maximum when values may be negative', 'Forgetting duplicates or n = 0/1']
  ),
  p(
    'hashing', 2, 'Hashing & frequency', 'Remember seen facts',
    'You repeatedly ask “have I seen this?”, “how many?”, or need O(1)-average lookup by value/signature.',
    'The map/set contains exactly the useful information from elements already processed.',
    'Leave labeled sticky notes for everything you pass.',
    ['Decide whether you need existence, count, or value → index.', 'Query before insert when the same element must not match itself.', 'Store the smallest sufficient fact.', 'Account for average O(1) and worst-case/hash-space trade-offs.'],
    ['unordered_map<Key, Value> seen;', 'if (seen.count(need))', '++freq[x];'],
`unordered_map<Key, Value> memo;
for (int i = 0; i < n; ++i) {
    Key need = /* complement or signature */;
    if (memo.count(need)) return /* answer */;
    memo[/* key */] = /* useful value */;
}`,
    ['Inserting before querying in Two Sum', 'Using an unordered representation where deterministic order is required', 'Forgetting duplicate counts']
  ),
  p(
    'two-pointers', 3, 'Two pointers', 'Converge / compact',
    'The input is sorted, you compare opposite ends, form pairs/triples, or compact valid values in place.',
    'Everything outside the active pointer region is already finalized.',
    'Two guards squeeze a corridor until the answer has nowhere to hide.',
    ['Assign each pointer a sentence: what is left of it/right of it?', 'Move exactly the pointer that can improve the condition.', 'Prove discarded elements cannot be part of a better answer.', 'Handle duplicates explicitly when enumerating combinations.'],
    ['int l = 0, r = n - 1;', 'while (l < r)', 'Move based on sum/condition'],
`int l = 0, r = n - 1;
while (l < r) {
    auto value = combine(a[l], a[r]);
    if (value == target) { /* use answer */ }
    else if (value < target) ++l;
    else --r;
}`,
    ['Moving both pointers without justification', 'Using the sorted-sum rule on unsorted input', 'Skipping duplicate handling in 3Sum']
  ),
  p(
    'sliding-window', 4, 'Sliding window & deque', 'Grow, repair, record',
    'The answer is a contiguous subarray/substring and adding/removing endpoints lets you update state cheaply.',
    'The window state describes exactly [left, right], and after repair it satisfies the required condition.',
    'An elastic window grows right; when it breaks the rule, pull left.',
    ['Add the new right element.', 'While invalid, remove the left element and advance left.', 'Record the answer only when the window has the needed validity.', 'For fixed windows, remove exactly the outgoing element.'],
    ['for (int r = 0; r < n; ++r)', 'while (invalid) remove(a[l++]);', 'answer = max(answer, r - l + 1);'],
`int l = 0;
for (int r = 0; r < n; ++r) {
    add(a[r]);
    while (invalid()) remove(a[l++]);
    record(l, r);
}`,
    ['Updating the answer before restoring validity', 'Using a window when negative values destroy monotonicity', 'Off-by-one: length is r - l + 1']
  ),
  p(
    'prefix-sum', 5, 'Prefix sum & contribution', 'Store history totals',
    'Many range sums are requested, or a subarray condition can be rewritten using prefix differences.',
    'prefix[i] equals the aggregate before/through i according to one consistent convention.',
    'Put a mile marker at every point; distance is marker B − marker A.',
    ['Choose prefix length n + 1 with prefix[0] = identity.', 'Translate [l, r] to prefix[r + 1] − prefix[l].', 'For target subarrays, search for currentPrefix − target.', 'Seed frequency 0 → 1 so subarrays starting at index 0 count.'],
    ['vector<long long> pref(n + 1);', 'pref[i + 1] = pref[i] + a[i];', 'count += freq[prefix - k];'],
`long long prefix = 0, answer = 0;
unordered_map<long long, int> freq{{0, 1}};
for (int x : a) {
    prefix += x;
    answer += freq[prefix - target];
    ++freq[prefix];
}`,
    ['Forgetting the initial zero prefix', 'Using int when cumulative sums can overflow', 'Mixing inclusive and exclusive prefix conventions']
  ),
  p(
    'binary-search', 6, 'Binary search', 'Discard half safely',
    'The search domain is sorted/monotone, or the question asks for minimum feasible / maximum possible.',
    'If the answer still exists, it remains inside [lo, hi] (or the chosen half-open interval).',
    'Ask one yes/no question that burns half the map.',
    ['Define what lo and hi represent.', 'Write a monotone predicate when searching answer space.', 'Use mid = lo + (hi - lo) / 2.', 'State why one half cannot contain the answer before discarding it.'],
    ['int mid = lo + (hi - lo) / 2;', 'if (feasible(mid)) ...', 'Store candidate when seeking first/last true'],
`int lo = low, hi = high, answer = fallback;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (feasible(mid)) {
        answer = mid;
        hi = mid - 1; // minimum feasible
    } else lo = mid + 1;
}
return answer;`,
    ['Overflow in (lo + hi) / 2', 'A predicate that is not monotone', 'Infinite loops from inconsistent interval rules']
  ),
  p(
    'intervals', 7, 'Sorting & intervals', 'Sort to expose structure',
    'Objects have starts/ends, overlaps matter, or sorting makes the next decision locally obvious.',
    'The output processed so far is sorted, disjoint, and represents every interval seen so far.',
    'Line up appointments by start time; only the last merged block can collide.',
    ['Sort by the coordinate that reveals the next conflict.', 'Compare only with the last accepted/merged item.', 'Merge when starts overlap; otherwise finalize a new block.', 'State whether touching endpoints count as overlap.'],
    ['sort(v.begin(), v.end());', 'if (next.start <= current.end)', 'merged.back()[1] = max(...)'],
`sort(intervals.begin(), intervals.end());
vector<Interval> out;
for (auto cur : intervals) {
    if (out.empty() || out.back().end < cur.start)
        out.push_back(cur);
    else
        out.back().end = max(out.back().end, cur.end);
}`,
    ['Sorting only by end when merging', 'Forgetting inclusive endpoint semantics', 'Mutating the current interval before saving it']
  ),
  p(
    'stack-queue', 8, 'Stack, queue & monotonic stack', 'Resolve in order',
    'You need matching/nesting, nearest greater/smaller elements, or first-in-first-out traversal.',
    'The stack contains unresolved candidates in a deliberate monotonic or nesting order.',
    'A stack is an “unfinished business” pile; resolve from the top.',
    ['Say what every stored index/value is waiting for.', 'Pop while the current item resolves or dominates the top.', 'Use the remaining top if it answers the current query.', 'Push the current item as future unfinished business.'],
    ['while (!st.empty() && resolved(st.top(), x)) st.pop();', 'st.push(index);', 'Check empty before top()'],
`stack<int> st;
for (int i = 0; i < n; ++i) {
    while (!st.empty() && a[st.top()] < a[i]) {
        answer[st.top()] = a[i];
        st.pop();
    }
    st.push(i);
}`,
    ['Storing values when indices are needed', 'Reversing increasing vs decreasing order', 'Calling top/front on an empty container']
  ),
  p(
    'linked-list', 9, 'Linked list pointer surgery', 'Save before rewiring',
    'Nodes must be reversed, merged, removed, or compared without random access.',
    'All nodes before the current pointer are already rewired correctly; unprocessed nodes remain reachable.',
    'Never cut a train carriage before noting where the next carriage is.',
    ['Draw arrows and name prev, cur, next.', 'Save next before changing cur->next.', 'Perform one pointer mutation at a time.', 'Use a dummy node when the head may change.'],
    ['ListNode* next = cur->next;', 'cur->next = prev;', 'ListNode dummy(0, head);'],
`ListNode* prev = nullptr;
ListNode* cur = head;
while (cur) {
    ListNode* next = cur->next;
    cur->next = prev;
    prev = cur;
    cur = next;
}
return prev;`,
    ['Losing the unprocessed list', 'Dereferencing null', 'Special-casing the head instead of using a dummy']
  ),
  p(
    'trees', 10, 'Trees & BST recursion', 'Ask children, combine',
    'The structure is hierarchical and a node answer can be built from left/right subtree answers.',
    'A recursive call returns exactly the promised meaning for its subtree.',
    'Each node asks both children for one fact, combines it, and reports upward.',
    ['Write the return meaning in one sentence.', 'Handle null as the identity/base case.', 'Recurse left and right.', 'Combine locally; use a reference/global only for a cross-node best.'],
    ['if (!root) return base;', 'auto L = dfs(root->left);', 'return combine(L, R, root->val);'],
`ReturnType dfs(TreeNode* node) {
    if (!node) return base;
    auto left = dfs(node->left);
    auto right = dfs(node->right);
    return combine(node, left, right);
}`,
    ['A return value with no precise meaning', 'Counting nodes vs edges inconsistently', 'Recomputing subtree heights and causing O(n²)']
  ),
  p(
    'graphs', 11, 'Graphs: BFS, DFS & shortest path', 'Visit once, expand',
    'Entities are connected, the input is a grid/network, or you need components, reachability, ordering, or shortest paths.',
    'Visited means fully discovered; every queued BFS node has the shortest known unweighted distance.',
    'Drop paint on a node and let it spread to every connected neighbor exactly once.',
    ['Build/understand neighbors.', 'Mark visited when enqueuing, not when dequeuing.', 'Choose DFS for exhaustive reachability; BFS for unweighted shortest layers.', 'For weighted nonnegative edges, replace queue with a min-heap and relax distances.'],
    ['visited[start] = true;', 'queue<int> q; q.push(start);', 'for (auto next : adj[node])'],
`queue<int> q;
q.push(start);
visited[start] = true;
while (!q.empty()) {
    int node = q.front(); q.pop();
    for (int next : adj[node]) if (!visited[next]) {
        visited[next] = true;
        q.push(next);
    }
}`,
    ['Marking visited too late and enqueuing duplicates', 'Using BFS for arbitrary weighted shortest paths', 'Forgetting disconnected components']
  ),
  p(
    'heap-greedy', 12, 'Heap & greedy choice', 'Keep the best frontier',
    'You repeatedly need the smallest/largest remaining candidate, top K, or can prove a locally best choice leaves maximum room.',
    'The heap contains exactly the active frontier/best K; accepted greedy choices never make the remaining optimum worse.',
    'Keep only the K trophies that still deserve shelf space.',
    ['Name what the heap stores and why its top should be removed/used.', 'Push a candidate, then restore the size/order invariant.', 'For greedy, sort by the resource that should finish earliest.', 'Give an exchange argument: replacing another choice with yours cannot hurt.'],
    ['priority_queue<int, vector<int>, greater<int>> pq;', 'if (pq.size() > k) pq.pop();', 'sort by finishing time'],
`priority_queue<int, vector<int>, greater<int>> best;
for (int x : input) {
    best.push(x);
    if ((int)best.size() > k) best.pop();
}
return best.top();`,
    ['Using a max-heap when retaining K largest needs a min-heap', 'Calling a choice greedy without a proof', 'Forgetting stale heap entries in shortest-path variants']
  ),
  p(
    'backtracking', 13, 'Backtracking', 'Choose, explore, undo',
    'The task asks for all combinations/permutations/configurations under constraints.',
    'The current path is a valid partial candidate; state is exactly restored after each recursive branch.',
    'Open one door, explore the hallway, then close it before trying the next.',
    ['Define the decision at recursion level i.', 'Check completion and copy the path.', 'Choose and mutate state.', 'Recurse, then undo the exact mutation.'],
    ['path.push_back(choice);', 'dfs(nextState);', 'path.pop_back();'],
`void dfs(State state) {
    if (complete(state)) {
        answers.push_back(path);
        return;
    }
    for (Choice c : choices(state)) {
        choose(c);
        dfs(next(state, c));
        undo(c);
    }
}`,
    ['Missing the undo step', 'Adding a reference to path instead of a copy', 'Generating duplicate branches instead of sorting/skipping']
  ),
  p(
    'dp-1d', 14, 'One-dimensional DP', 'State from earlier states',
    'There are overlapping choices along one index/amount and the answer depends on a small set of earlier answers.',
    'dp[i] has one exact sentence meaning and all states it depends on are already computed.',
    'Write the answer to every smaller checkpoint so future-you never recomputes it.',
    ['Write “dp[i] means …” before the recurrence.', 'List the final choice that leads into state i.', 'Set base cases that make the sentence true.', 'Choose iteration order so dependencies already exist; then compress if safe.'],
    ['vector<int> dp(n + 1, init);', 'dp[i] = best(dp[previous] + cost);', 'Return dp[target]'],
`vector<long long> dp(n + 1, 0);
dp[0] = base;
for (int i = 1; i <= n; ++i) {
    dp[i] = combine(/* earlier dp states */);
}
return dp[n];`,
    ['Inventing a recurrence before defining the state', 'Wrong impossible-state initialization', 'Loop direction that accidentally reuses an item']
  ),
  p(
    'dp-2d', 15, 'Two-dimensional DP', 'Two coordinates define state',
    'Two strings, capacities, rows/columns, or two changing choices define the subproblem.',
    'dp[i][j] is the complete answer for exactly the two prefixes/capacities described.',
    'Pin two rulers to the problem; every cell remembers one smaller rectangle.',
    ['Define both dimensions in words.', 'Split on the final characters/item/move.', 'Initialize row 0 and column 0 from empty-prefix meaning.', 'Fill in dependency order and return the requested corner.'],
    ['vector<vector<int>> dp(n + 1, vector<int>(m + 1));', 'if (match) dp[i][j] = ...', 'else dp[i][j] = best(...)'],
`vector<vector<int>> dp(n + 1, vector<int>(m + 1, base));
for (int i = 1; i <= n; ++i) {
    for (int j = 1; j <= m; ++j) {
        dp[i][j] = transition(i, j, dp);
    }
}
return dp[n][m];`,
    ['Mixing 0-based input with 1-based DP', 'Ignoring impossible states', 'Using O(nm) memory when constraints require row compression']
  ),
  p(
    'design-advanced', 16, 'Design structures & advanced core', 'Protect an API invariant',
    'The task asks you to implement operations with strict complexity, combine data structures, or encode/decode structure.',
    'Every public operation preserves a small set of representation invariants.',
    'Build a machine from two simple tools; write the maintenance rules on its casing.',
    ['List required operations and target complexities.', 'Choose one structure per required capability.', 'Write the representation invariant.', 'For every operation: remove stale state, mutate, then restore the invariant.'],
    ['State the invariant above the class', 'Keep helper operations small', 'Test empty, duplicate, and capacity-one cases'],
`class Structure {
    // Invariant: describe synchronization between members.
public:
    ReturnType operation(Args args) {
        // query -> mutate -> restore invariant
    }
};`,
    ['Choosing structures before reading complexity requirements', 'Updating one structure but not its companion', 'Ambiguous serialization delimiters or null markers']
  )
];

export const SOURCES = [
  { name: 'GeeksforGeeks — Deloitte Coding Interview Questions', url: 'https://www.geeksforgeeks.org/dsa/deloitte-coding-interview-questions/' },
  { name: 'FACE Prep — TCS Interview Rounds 2026', url: 'https://faceprep.in/article/tcs-interview-questions-from-latest-placement-drives/' },
  { name: 'Great Learning — Accenture Coding Questions', url: 'https://www.mygreatlearning.com/blog/accenture-coding-questions-solutions/' },
  { name: 'Tech Interview Handbook — Grind 75', url: 'https://www.techinterviewhandbook.org/grind75/' }
];

export const patternById = Object.fromEntries(PATTERNS.map((pattern) => [pattern.id, pattern]));
export const trackById = Object.fromEntries(TRACKS.map((track) => [track.id, track]));
