import { q, ALL_TRACKS, UPPER_TRACKS, PRODUCT_TRACKS } from './question-helpers.js';

export const DP_QUESTIONS = [
  q({
    id: 'subsets-power-set', title: 'Generate all subsets', pattern: 'backtracking', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Given distinct integers, return every subset (the power set). Subset order and answer order do not matter.',
    example: '[1,2] → [[],[1],[2],[1,2]]',
    trigger: 'Generate every combination where each item may be chosen or skipped: backtracking decision tree.',
    idea: 'At recursion index i, path is one completed choice for indices before i; two branches cover include and exclude exactly once.',
    mnemonic: 'At every element, flip one yes/no switch; photograph the path at the end.',
    steps: ['When index reaches n, copy path to answers.', 'Explore the branch that skips nums[index].', 'Push nums[index] and explore the take branch.', 'Pop to restore path before returning.'],
    anchors: ['if (index == static_cast<int>(nums.size()))', 'path.push_back(nums[index]);', 'path.pop_back();'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

void buildSubsets(const vector<int>& nums, int index,
                  vector<int>& path, vector<vector<int>>& answer) {
    if (index == static_cast<int>(nums.size())) {
        answer.push_back(path);
        return;
    }
    buildSubsets(nums, index + 1, path, answer);
    path.push_back(nums[index]);
    buildSubsets(nums, index + 1, path, answer);
    path.pop_back();
}

vector<vector<int>> subsets(const vector<int>& nums) {
    vector<vector<int>> answer;
    vector<int> path;
    buildSubsets(nums, 0, path, answer);
    return answer;
}`,
    time: 'O(n · 2ⁿ) including copied output', space: 'O(n) recursion/path excluding output',
    traps: ['Forgetting pop_back leaks a choice into sibling branches.', 'Output itself has 2ⁿ subsets, so exponential time is unavoidable.', 'With duplicate inputs, sort and skip equal choices to avoid duplicate subsets.'],
    variations: ['Subsets with duplicates', 'Permutations (choose an unused item)', 'Binary strings of length n']
  }),
  q({
    id: 'combination-sum', title: 'Combination Sum', pattern: 'backtracking', difficulty: 'Medium', tier: 'core', minutes: 30,
    tracks: PRODUCT_TRACKS,
    prompt: 'Given distinct positive candidates and a target, return unique combinations summing to target. Each candidate may be reused.',
    example: '[2,3,6,7], target 7 → [[2,2,3],[7]]',
    trigger: 'Enumerate combinations under a remaining-sum constraint with reusable choices: sorted backtracking from a start index.',
    idea: 'start prevents permutations of the same combination; recurring with i (not i+1) permits reuse.',
    mnemonic: 'Choose coins from the current shelf onward; stay on the same shelf when reuse is allowed.',
    steps: ['Sort candidates for pruning.', 'If remaining is 0, copy path.', 'Loop i from start; stop when candidate > remaining.', 'Choose candidate, recurse with i and reduced remaining, then undo.'],
    anchors: ['if (remaining == 0)', 'if (candidates[i] > remaining) break;', 'search(candidates, i, remaining - candidates[i], path, answer);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

void search(const vector<int>& candidates, int start, int remaining,
            vector<int>& path, vector<vector<int>>& answer) {
    if (remaining == 0) {
        answer.push_back(path);
        return;
    }
    for (int i = start; i < static_cast<int>(candidates.size()); ++i) {
        if (candidates[i] > remaining) break;
        path.push_back(candidates[i]);
        search(candidates, i, remaining - candidates[i], path, answer);
        path.pop_back();
    }
}

vector<vector<int>> combinationSum(vector<int> candidates, int target) {
    sort(candidates.begin(), candidates.end());
    vector<vector<int>> answer;
    vector<int> path;
    search(candidates, 0, target, path, answer);
    return answer;
}`,
    time: 'Exponential in target/candidate choices', space: 'O(target / minCandidate) recursion excluding output',
    traps: ['Recursing with i+1 incorrectly forbids reuse.', 'Restarting from 0 generates permutations and duplicates.', 'The pruning assumes positive sorted candidates.'],
    variations: ['Combination Sum II without reuse and with duplicates', 'N-Queens using column/diagonal sets', 'Word search in a grid']
  }),

  q({
    id: 'climbing-stairs', title: 'Climbing stairs', pattern: 'dp-1d', difficulty: 'Easy', tier: 'foundation', minutes: 15,
    tracks: ALL_TRACKS,
    prompt: 'Count distinct ways to reach stair n when each move climbs one or two stairs.',
    example: 'n=5 → 8',
    trigger: 'Count ways along one index where the final move comes from one of a few prior positions.',
    idea: 'ways[i] = ways[i−1] + ways[i−2] because the last jump is either 1 or 2, and these cases are disjoint.',
    mnemonic: 'To enter stair i, arrive through one of exactly two doors behind it.',
    steps: ['Define ways[i] as ways to stand on i.', 'Use ways[0]=1 (one empty way) and ways[1]=1.', 'Compute current = previousOne + previousTwo.', 'Shift the two rolling states.'],
    anchors: ['long long twoBack = 1, oneBack = 1;', 'long long current = oneBack + twoBack;', 'twoBack = oneBack;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

long long climbStairs(int n) {
    if (n <= 1) return 1;
    long long twoBack = 1, oneBack = 1;
    for (int stair = 2; stair <= n; ++stair) {
        long long current = oneBack + twoBack;
        twoBack = oneBack;
        oneBack = current;
    }
    return oneBack;
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Some platforms define n=0 differently; state your base convention.', 'This is Fibonacci-shaped, but derive the recurrence instead of memorizing the name.', 'Counts can overflow; use the type/modulus required by constraints.'],
    variations: ['Min cost climbing stairs', 'Ways with jumps 1…k', 'Decode ways']
  }),
  q({
    id: 'house-robber', title: 'House Robber', pattern: 'dp-1d', difficulty: 'Medium', tier: 'core', minutes: 22,
    tracks: UPPER_TRACKS,
    prompt: 'Maximize money taken from a line of houses when adjacent houses cannot both be chosen.',
    example: '[2,7,9,3,1] → 12',
    trigger: 'Choose values along a line with an adjacent-conflict rule: at each index compare skip vs take plus i−2.',
    idea: 'best[i] is the optimum for the prefix ending at i: either skip i and keep best[i−1], or take i plus best[i−2].',
    mnemonic: 'At each house choose between yesterday’s wallet and today’s cash plus the wallet from two days ago.',
    steps: ['Let twoBack be optimum through i−2 and oneBack through i−1.', 'Compute take = twoBack + current money.', 'Compute current = max(oneBack, take).', 'Shift states and return oneBack.'],
    anchors: ['long long current = max(oneBack, twoBack + money);', 'twoBack = oneBack;', 'oneBack = current;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

long long rob(const vector<int>& houses) {
    long long twoBack = 0, oneBack = 0;
    for (int money : houses) {
        long long current = max(oneBack, twoBack + money);
        twoBack = oneBack;
        oneBack = current;
    }
    return oneBack;
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Greedily taking the larger of adjacent pairs fails globally.', 'Shift states only after computing current.', 'If negative values are allowed, clarify whether choosing no house is legal.'],
    variations: ['Circular House Robber II', 'Delete and Earn', 'Maximum sum of non-adjacent values']
  }),
  q({
    id: 'coin-change-minimum', title: 'Coin Change — minimum coins', pattern: 'dp-1d', difficulty: 'Medium', tier: 'core', minutes: 30,
    tracks: UPPER_TRACKS,
    prompt: 'Given positive coin denominations and an amount, return the minimum coins needed to form the amount, or -1 if impossible. Coins may be reused.',
    example: '[1,2,5], amount 11 → 3',
    trigger: 'Unbounded choices build an amount from smaller amounts while minimizing item count.',
    idea: 'dp[x] is the minimum coins for exactly x; choosing coin c last gives candidate dp[x−c]+1.',
    mnemonic: 'Every amount asks: “Which coin was placed last, and how cheap was the remainder?”',
    steps: ['Initialize dp[0]=0 and all other states to impossible amount+1.', 'For each value from 1 to amount, try every coin ≤ value.', 'Relax dp[value] from dp[value−coin]+1.', 'Translate the impossible sentinel to −1.'],
    anchors: ['vector<int> dp(amount + 1, amount + 1);', 'dp[0] = 0;', 'dp[value] = min(dp[value], dp[value - coin] + 1);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int coinChange(const vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int value = 1; value <= amount; ++value) {
        for (int coin : coins) {
            if (coin <= value)
                dp[value] = min(dp[value], dp[value - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}`,
    time: 'O(amount · number of coins)', space: 'O(amount)',
    traps: ['A greedy largest-coin-first rule fails for arbitrary denominations.', 'Zero/negative coins break the recurrence assumptions.', 'Counting combinations is a different DP with different loop semantics.'],
    variations: ['Count coin-change combinations', 'Perfect squares', 'Minimum ticket cost']
  }),
  q({
    id: 'longest-increasing-subsequence', title: 'Longest increasing subsequence', pattern: 'dp-1d', difficulty: 'Medium', tier: 'core', minutes: 32,
    tracks: PRODUCT_TRACKS,
    prompt: 'Return the length of the longest strictly increasing subsequence in O(n log n). Elements need not be contiguous.',
    example: '[10,9,2,5,3,7,101,18] → 4',
    trigger: 'Longest increasing subsequence with n too large for O(n²): maintain the smallest possible tail for each length.',
    idea: 'tails[len−1] is the minimum ending value among increasing subsequences of length len seen so far; smaller tails leave more future options.',
    mnemonic: 'For every length, keep only the lightest baton to hand to the future.',
    steps: ['Start an empty tails array.', 'Find the first tail ≥ x using lower_bound.', 'Replace it with x, or append when none exists.', 'The tails length—not necessarily its contents—is the LIS length.'],
    anchors: ['auto position = lower_bound(tails.begin(), tails.end(), x);', 'if (position == tails.end()) tails.push_back(x);', 'else *position = x;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int lengthOfLIS(const vector<int>& nums) {
    vector<int> tails;
    for (int x : nums) {
        auto position = lower_bound(tails.begin(), tails.end(), x);
        if (position == tails.end()) tails.push_back(x);
        else *position = x;
    }
    return static_cast<int>(tails.size());
}`,
    time: 'O(n log n)', space: 'O(n)',
    traps: ['tails is not necessarily an actual subsequence.', 'lower_bound enforces strict increase; upper_bound gives non-decreasing behavior.', 'To reconstruct the sequence, store predecessor and index arrays.'],
    variations: ['Reconstruct an LIS', 'Russian doll envelopes', 'Maximum-sum increasing subsequence']
  }),

  q({
    id: 'unique-paths-grid', title: 'Unique paths in a grid', pattern: 'dp-2d', difficulty: 'Medium', tier: 'core', minutes: 22,
    tracks: UPPER_TRACKS,
    prompt: 'Count paths from the top-left to bottom-right of an m×n grid when each move goes only right or down.',
    example: 'm=3, n=7 → 28',
    trigger: 'Grid count where each cell is entered from top or left: 2D DP, compressible to one row.',
    idea: 'During row-major iteration, dp[col] before update is paths from above and dp[col−1] is paths from left.',
    mnemonic: 'Each cell receives travelers through two doors: north and west.',
    steps: ['Initialize the first row to one path.', 'For each later row, keep dp[0]=1.', 'Update dp[col] = dp[col] + dp[col−1].', 'Return the last column.'],
    anchors: ['vector<long long> dp(cols, 1);', 'dp[col] += dp[col - 1];', 'return dp[cols - 1];'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

long long uniquePaths(int rows, int cols) {
    vector<long long> dp(cols, 1);
    for (int row = 1; row < rows; ++row) {
        for (int col = 1; col < cols; ++col) {
            dp[col] += dp[col - 1];
        }
    }
    return dp[cols - 1];
}`,
    time: 'O(rows · cols)', space: 'O(cols)',
    traps: ['Zero-sized grids need an explicit policy in production code.', 'With obstacles, blocked cells must reset to 0.', 'Combinatorics can be faster but must control overflow.'],
    variations: ['Unique paths with obstacles', 'Minimum path sum', 'Count paths modulo M']
  }),
  q({
    id: 'zero-one-knapsack', title: '0/1 Knapsack', pattern: 'dp-2d', difficulty: 'Medium', tier: 'core', minutes: 32,
    tracks: ['tcs-digital', 'deloitte-tech', 'saas-12-15'],
    prompt: 'Given item weights and values and a capacity, maximize value when each item may be chosen at most once.',
    example: 'weights [1,3,4,5], values [1,4,5,7], capacity 7 → 9',
    trigger: 'Choose/skip each item once under a capacity: 0/1 DP; descending capacities prevent reuse.',
    idea: 'Before an item, dp[c] is the best using prior items. Updating c downward ensures dp[c−weight] still excludes the current item.',
    mnemonic: 'Walk the capacity shelf backward so one item cannot chase and reuse itself.',
    steps: ['Initialize dp[0…capacity]=0.', 'For each item, loop c from capacity down to its weight.', 'Compare skip dp[c] with take value + dp[c−weight].', 'Return dp[capacity].'],
    anchors: ['for (int c = capacity; c >= weights[i]; --c)', 'dp[c] = max(dp[c], values[i] + dp[c - weights[i]]);', 'return dp[capacity];'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int knapsack01(const vector<int>& weights, const vector<int>& values,
               int capacity) {
    vector<int> dp(capacity + 1, 0);
    for (int i = 0; i < static_cast<int>(weights.size()); ++i) {
        for (int c = capacity; c >= weights[i]; --c) {
            dp[c] = max(dp[c], values[i] + dp[c - weights[i]]);
        }
    }
    return dp[capacity];
}`,
    time: 'O(items · capacity)', space: 'O(capacity)',
    traps: ['Ascending capacity turns this into unbounded knapsack.', 'Capacity DP is pseudo-polynomial, not polynomial in input bit length.', 'Ensure weights and values have matching sizes.'],
    variations: ['Subset sum', 'Partition equal subset sum', 'Unbounded knapsack / rod cutting']
  }),
  q({
    id: 'longest-common-subsequence', title: 'Longest common subsequence', pattern: 'dp-2d', difficulty: 'Medium', tier: 'core', minutes: 32,
    tracks: PRODUCT_TRACKS,
    prompt: 'Return the length of the longest sequence appearing in both strings in the same relative order, not necessarily contiguously.',
    example: '"abcde", "ace" → 3',
    trigger: 'Two strings and order-preserving skip/match choices: DP over two prefix lengths.',
    idea: 'dp[i][j] is LCS length of the first i and first j characters. Equal final chars extend both prefixes; otherwise skip one final char.',
    mnemonic: 'If the two ruler tips match, lock them together; otherwise slide back one ruler and keep the better result.',
    steps: ['Create (n+1)×(m+1) zeros for empty prefixes.', 'If a[i−1]==b[j−1], use 1+dp[i−1][j−1].', 'Otherwise use max(dp[i−1][j], dp[i][j−1]).', 'Return dp[n][m].'],
    anchors: ['if (a[i - 1] == b[j - 1])', 'dp[i][j] = 1 + dp[i - 1][j - 1];', 'dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int longestCommonSubsequence(const string& a, const string& b) {
    int n = static_cast<int>(a.size()), m = static_cast<int>(b.size());
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            if (a[i - 1] == b[j - 1])
                dp[i][j] = 1 + dp[i - 1][j - 1];
            else
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[n][m];
}`,
    time: 'O(nm)', space: 'O(nm), compressible to O(min(n,m))',
    traps: ['Substring requires contiguity and a different reset-on-mismatch recurrence.', 'Input characters use i−1/j−1 because DP includes empty row/column.', 'To print the LCS, backtrack from dp[n][m].'],
    variations: ['Print an LCS', 'Edit distance', 'Shortest common supersequence']
  }),

  q({
    id: 'lru-cache', title: 'LRU Cache', pattern: 'design-advanced', difficulty: 'Hard', tier: 'stretch', minutes: 42,
    tracks: PRODUCT_TRACKS,
    prompt: 'Implement get(key) and put(key,value) in O(1). When capacity is full, evict the least recently used key.',
    example: 'put(1,1), put(2,2), get(1), put(3,3) evicts key 2',
    trigger: 'O(1) lookup plus O(1) recency reorder/eviction: hash map + doubly linked list.',
    idea: 'List front is most recent and back least recent; map points each key directly to its list node. Both structures always contain identical keys.',
    mnemonic: 'The map finds the card; the two-way conveyor moves it to the front; the dusty card falls off the back.',
    steps: ['Store (key,value) in a std::list with MRU at front.', 'Map key to its list iterator.', 'On get/update, splice that node to front.', 'On new overflow, erase the back key from map, then pop back.'],
    anchors: ['items.splice(items.begin(), items, it->second);', 'where[key] = items.begin();', 'where.erase(items.back().first);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

class LRUCache {
    int capacity;
    list<pair<int, int>> items; // front = most recently used
    unordered_map<int, list<pair<int, int>>::iterator> where;

    void touch(unordered_map<int, list<pair<int, int>>::iterator>::iterator it) {
        items.splice(items.begin(), items, it->second);
        it->second = items.begin();
    }

public:
    explicit LRUCache(int cap) : capacity(cap) {}

    int get(int key) {
        auto it = where.find(key);
        if (it == where.end()) return -1;
        touch(it);
        return it->second->second;
    }

    void put(int key, int value) {
        if (capacity == 0) return;
        auto it = where.find(key);
        if (it != where.end()) {
            it->second->second = value;
            touch(it);
            return;
        }
        items.push_front({key, value});
        where[key] = items.begin();
        if (static_cast<int>(items.size()) > capacity) {
            where.erase(items.back().first);
            items.pop_back();
        }
    }
};`,
    time: 'O(1) average per get/put', space: 'O(capacity)',
    traps: ['A singly linked list cannot remove an arbitrary node in O(1) without more bookkeeping.', 'Update recency on both successful get and existing-key put.', 'Erase the map entry before popping the list node whose key you need.'],
    variations: ['LFU cache', 'Insert/search a Trie', 'Design browser history']
  })
];
