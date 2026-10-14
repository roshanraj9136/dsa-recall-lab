import { q, ALL_TRACKS, UPPER_TRACKS, PRODUCT_TRACKS } from './question-helpers.js';

export const CORE_A_QUESTIONS = [
  q({
    id: 'subarray-sum-k', title: 'Subarray sum equals K', pattern: 'prefix-sum', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Count contiguous subarrays whose elements sum exactly to k. Values may be negative, so a shrinking window is not reliable.',
    example: '[1, 1, 1], k=2 → 2',
    trigger: 'Count subarrays with an exact sum and negatives are allowed: prefix sum + frequency of earlier prefixes.',
    idea: 'A subarray ending now sums to k whenever an earlier prefix equals currentPrefix − k; its frequency is the number of valid starts.',
    mnemonic: 'Current mile marker minus k tells you which old mile marker to count.',
    steps: ['Seed freq[0] = 1 for subarrays beginning at index 0.', 'Add the current value to prefix.', 'Add freq[prefix − k] to the answer.', 'Only then increment freq[prefix].'],
    anchors: ['unordered_map<long long, int> freq{{0, 1}};', 'answer += freq[prefix - k];', '++freq[prefix];'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

long long subarraySum(const vector<int>& nums, long long k) {
    unordered_map<long long, int> freq{{0, 1}};
    long long prefix = 0, answer = 0;
    for (int x : nums) {
        prefix += x;
        answer += freq[prefix - k];
        ++freq[prefix];
    }
    return answer;
}`,
    time: 'O(n) expected', space: 'O(n)',
    traps: ['A sliding window fails with negative values.', 'Incrementing the current prefix before querying can count an empty subarray when k=0.', 'Forgetting prefix 0 misses ranges starting at index 0.'],
    variations: ['Longest subarray with sum k', 'Equal number of 0s and 1s', 'Subarrays divisible by k']
  }),
  q({
    id: 'product-except-self', title: 'Product of array except self', pattern: 'prefix-sum', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Return an array where answer[i] is the product of every input value except nums[i], without division and with O(1) auxiliary space beyond output.',
    example: '[1,2,3,4] → [24,12,8,6]',
    trigger: 'Each answer needs everything left and right of an index; build prefix contribution, then multiply suffix contribution.',
    idea: 'After the first pass answer[i] holds the product strictly left of i; the reverse pass supplies the product strictly right of i.',
    mnemonic: 'Left hand writes first; right hand multiplies on the walk back.',
    steps: ['Set prefix = 1.', 'Write answer[i] = prefix, then multiply prefix by nums[i].', 'Walk right-to-left with suffix = 1.', 'Multiply answer[i] by suffix, then update suffix.'],
    anchors: ['answer[i] = prefix;', 'prefix *= nums[i];', 'answer[i] *= suffix;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<long long> productExceptSelf(const vector<int>& nums) {
    int n = static_cast<int>(nums.size());
    vector<long long> answer(n, 1);
    long long prefix = 1;
    for (int i = 0; i < n; ++i) {
        answer[i] = prefix;
        prefix *= nums[i];
    }
    long long suffix = 1;
    for (int i = n - 1; i >= 0; --i) {
        answer[i] *= suffix;
        suffix *= nums[i];
    }
    return answer;
}`,
    time: 'O(n)', space: 'O(1) auxiliary excluding output',
    traps: ['Division breaks when zeroes exist.', 'Updating prefix/suffix before using it includes nums[i].', 'Products may overflow the requested type; follow constraints.'],
    variations: ['Prefix/suffix maximum arrays', 'Trapping rain water with left/right maxima', 'Range product queries']
  }),

  q({
    id: 'first-last-position', title: 'First and last position in sorted array', pattern: 'binary-search', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: ALL_TRACKS,
    prompt: 'In a sorted array, return the first and last index of target in O(log n), or [-1, -1] when absent.',
    example: '[5,7,7,8,8,10], target 8 → [3,4]',
    trigger: 'Sorted duplicates plus first/last occurrence: run boundary binary search twice.',
    idea: 'When target is found, save it but keep searching toward the requested boundary.',
    mnemonic: 'Finding the shop is not enough—walk left for opening door and right for closing door.',
    steps: ['Write one helper with a findFirst flag.', 'On equality, save mid.', 'For first, continue left; for last, continue right.', 'Return both helper results.'],
    anchors: ['if (a[mid] == target) {', 'answer = mid;', 'if (findFirst) hi = mid - 1;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int boundary(const vector<int>& a, int target, bool findFirst) {
    int lo = 0, hi = static_cast<int>(a.size()) - 1, answer = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) {
            answer = mid;
            if (findFirst) hi = mid - 1;
            else lo = mid + 1;
        } else if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return answer;
}

vector<int> searchRange(const vector<int>& a, int target) {
    return {boundary(a, target, true), boundary(a, target, false)};
}`,
    time: 'O(log n)', space: 'O(1)',
    traps: ['Returning immediately on equality.', 'Using linear scans after binary search violates worst-case O(log n).', 'Mixing lower_bound insertion position with confirmed occurrence.'],
    variations: ['Count occurrences', 'Lower/upper bound', 'First bad version']
  }),
  q({
    id: 'search-rotated-array', title: 'Search in rotated sorted array', pattern: 'binary-search', difficulty: 'Medium', tier: 'core', minutes: 30,
    tracks: UPPER_TRACKS,
    prompt: 'A strictly increasing array was rotated once. Return the index of target in O(log n), or -1.',
    example: '[4,5,6,7,0,1,2], target 0 → 4',
    trigger: 'Rotated sorted array without duplicates: at least one half around mid is still normally sorted.',
    idea: 'Identify the sorted half, then test whether target lies inside its closed value range; discard the other half.',
    mnemonic: 'One side of the broken ruler is always straight—use that side to locate the target.',
    steps: ['Compute mid and check equality.', 'If a[lo] ≤ a[mid], the left half is sorted.', 'Test whether target lies in that half; otherwise choose right.', 'Mirror the logic when the right half is sorted.'],
    anchors: ['if (a[lo] <= a[mid])', 'if (a[lo] <= target && target < a[mid])', 'else lo = mid + 1;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int searchRotated(const vector<int>& a, int target) {
    int lo = 0, hi = static_cast<int>(a.size()) - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[lo] <= a[mid]) {
            if (a[lo] <= target && target < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (a[mid] < target && target <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}`,
    time: 'O(log n)', space: 'O(1)',
    traps: ['The inequalities around mid must not overlap.', 'With duplicates, identifying the sorted side can be ambiguous and may degrade to O(n).', 'Comparing target only with endpoints without first identifying a sorted half.'],
    variations: ['Find minimum in rotated array', 'Rotation count', 'Search with duplicates']
  }),
  q({
    id: 'allocate-books', title: 'Allocate books — binary search on answer', pattern: 'binary-search', difficulty: 'Medium', tier: 'core', minutes: 35,
    tracks: ['tcs-digital', 'deloitte-tech', 'saas-12-15'],
    prompt: 'Split consecutive book pages among m students so every book is assigned and the maximum pages assigned to one student is minimized. Return -1 if m > n.',
    example: '[12,34,67,90], m=2 → 113',
    trigger: 'Minimize the maximum under contiguous allocation: guess a capacity and test feasibility greedily.',
    idea: 'If capacity X is feasible, every larger capacity is feasible; this monotonicity permits binary search.',
    mnemonic: 'Guess a backpack limit; greedily open a new backpack only when the next book overflows it.',
    steps: ['Search from max(single book) to sum(all books).', 'For a capacity, greedily count required students.', 'If students ≤ m, save capacity and search smaller.', 'Otherwise search larger.'],
    anchors: ['long long lo = *max_element(pages.begin(), pages.end());', 'if (used > students) return false;', 'answer = mid; hi = mid - 1;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

bool canAllocate(const vector<int>& pages, int students, long long cap) {
    int used = 1;
    long long current = 0;
    for (int book : pages) {
        if (current + book > cap) {
            ++used;
            current = book;
            if (used > students) return false;
        } else current += book;
    }
    return true;
}

long long allocateBooks(const vector<int>& pages, int students) {
    if (students > static_cast<int>(pages.size()) || pages.empty()) return -1;
    long long lo = *max_element(pages.begin(), pages.end());
    long long hi = accumulate(pages.begin(), pages.end(), 0LL), answer = hi;
    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;
        if (canAllocate(pages, students, mid)) {
            answer = mid; hi = mid - 1;
        } else lo = mid + 1;
    }
    return answer;
}`,
    time: 'O(n log(sum − max))', space: 'O(1)',
    traps: ['The lower bound must be the largest single book.', 'Assignment must stay contiguous.', 'Checking exactly m groups is unnecessary; ≤m groups can be split further when m≤n.'],
    variations: ['Painter partition', 'Ship packages within D days', 'Aggressive cows (maximize minimum)']
  }),

  q({
    id: 'merge-intervals', title: 'Merge overlapping intervals', pattern: 'intervals', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Merge all overlapping inclusive intervals and return sorted, non-overlapping intervals covering the same ranges.',
    example: '[[1,3],[2,6],[8,10],[15,18]] → [[1,6],[8,10],[15,18]]',
    trigger: 'Overlapping ranges: sort starts so only the most recent merged interval can overlap next.',
    idea: 'The output is always sorted and disjoint; after processing the next sorted interval, either extend the last range or append a new one.',
    mnemonic: 'Sort appointments by start; compare the newcomer only with the last calendar block.',
    steps: ['Sort intervals lexicographically by start.', 'If output is empty or last end < current start, append.', 'Otherwise extend last end to max(last end, current end).', 'Return the maintained disjoint list.'],
    anchors: ['sort(intervals.begin(), intervals.end());', 'merged.back()[1] < current[0]', 'merged.back()[1] = max(merged.back()[1], current[1]);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> mergeIntervals(vector<vector<int>> intervals) {
    sort(intervals.begin(), intervals.end());
    vector<vector<int>> merged;
    for (const auto& current : intervals) {
        if (merged.empty() || merged.back()[1] < current[0]) {
            merged.push_back(current);
        } else {
            merged.back()[1] = max(merged.back()[1], current[1]);
        }
    }
    return merged;
}`,
    time: 'O(n log n)', space: 'O(n) for output',
    traps: ['For inclusive ranges, [1,4] and [4,5] overlap.', 'Comparing with every prior interval is unnecessary.', 'Empty input should naturally return empty.'],
    variations: ['Insert interval', 'Meeting rooms', 'Minimum arrows to burst balloons']
  }),
  q({
    id: 'meeting-rooms-two', title: 'Minimum meeting rooms', pattern: 'intervals', difficulty: 'Medium', tier: 'core', minutes: 30,
    tracks: PRODUCT_TRACKS,
    prompt: 'Given meeting start/end times, return the minimum rooms needed so no meetings assigned to one room overlap. A meeting ending at t frees a room for one starting at t.',
    example: '[[0,30],[5,10],[15,20]] → 2',
    trigger: 'Minimum simultaneous intervals: process sorted starts and track the earliest room end.',
    idea: 'The min-heap contains end times of rooms currently allocated; its top is the first room that can become free.',
    mnemonic: 'The receptionist only checks the room whose meeting ends soonest.',
    steps: ['Sort meetings by start.', 'Before assigning, if earliest end ≤ start, reuse that room by popping.', 'Push the current end.', 'The maximum/current heap size is the rooms needed.'],
    anchors: ['priority_queue<int, vector<int>, greater<int>> ends;', 'if (!ends.empty() && ends.top() <= meeting[0]) ends.pop();', 'ends.push(meeting[1]);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int minMeetingRooms(vector<vector<int>> meetings) {
    sort(meetings.begin(), meetings.end());
    priority_queue<int, vector<int>, greater<int>> ends;
    for (const auto& meeting : meetings) {
        if (!ends.empty() && ends.top() <= meeting[0]) ends.pop();
        ends.push(meeting[1]);
    }
    return static_cast<int>(ends.size());
}`,
    time: 'O(n log n)', space: 'O(n)',
    traps: ['Pop only one room per meeting; one room is all the current meeting needs.', 'Using < rather than ≤ wastes a room when endpoints touch.', 'Returning the heap size is valid here because starts are processed in order and reuse pops before each push.'],
    variations: ['Can attend all meetings', 'Maximum concurrent events', 'Car pooling with a sweep line']
  }),

  q({
    id: 'valid-parentheses', title: 'Valid parentheses', pattern: 'stack-queue', difficulty: 'Easy', tier: 'foundation', minutes: 15,
    tracks: ALL_TRACKS,
    prompt: 'Determine whether a string of (), {}, and [] is correctly nested and every opener is closed by the matching type.',
    example: '"{[()]}" → true; "([)]" → false',
    trigger: 'Nested matching where the most recent opener must close first: stack.',
    idea: 'The stack contains unmatched opening brackets in nesting order; a closer must match the top.',
    mnemonic: 'The last door opened must be the first door closed.',
    steps: ['Push opening brackets.', 'For a closer, fail if stack is empty.', 'Check the top forms the expected pair, then pop.', 'At the end, require an empty stack.'],
    anchors: ['if (c == \'(\' || c == \'[\' || c == \'{\') st.push(c);', 'if (st.empty()) return false;', 'return st.empty();'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

bool validParentheses(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') st.push(c);
        else {
            if (st.empty()) return false;
            char open = st.top(); st.pop();
            if ((c == ')' && open != '(') ||
                (c == ']' && open != '[') ||
                (c == '}' && open != '{')) return false;
        }
    }
    return st.empty();
}`,
    time: 'O(n)', space: 'O(n)',
    traps: ['Checking only total counts ignores nesting.', 'Calling top before checking empty.', 'For general input, decide how non-bracket characters should be handled.'],
    variations: ['Minimum additions to make valid', 'Longest valid parentheses', 'Decode nested strings']
  }),
  q({
    id: 'largest-rectangle-histogram', title: 'Largest rectangle in histogram', pattern: 'stack-queue', difficulty: 'Hard', tier: 'stretch', minutes: 40,
    tracks: PRODUCT_TRACKS,
    prompt: 'Given bar heights of width 1, return the largest rectangular area contained in the histogram.',
    example: '[2,1,5,6,2,3] → 10',
    trigger: 'For each bar, need nearest smaller boundaries; a monotonic increasing stack resolves bars when a shorter bar arrives.',
    idea: 'Stack indices have increasing heights and await their first smaller bar on the right; after popping, the new stack top is the smaller boundary on the left.',
    mnemonic: 'A shorter building ends the skyline rights of every taller building waiting behind it.',
    steps: ['Scan through n plus one sentinel height 0.', 'While top height > current, pop it as rectangle height.', 'Right boundary is i; left boundary is new top, so width is i−left−1.', 'Push the current index.'],
    anchors: ['int current = (i == n ? 0 : heights[i]);', 'int width = st.empty() ? i : i - st.top() - 1;', 'best = max(best, 1LL * height * width);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

long long largestRectangle(const vector<int>& heights) {
    stack<int> st;
    long long best = 0;
    int n = static_cast<int>(heights.size());
    for (int i = 0; i <= n; ++i) {
        int current = (i == n ? 0 : heights[i]);
        while (!st.empty() && heights[st.top()] > current) {
            int height = heights[st.top()]; st.pop();
            int width = st.empty() ? i : i - st.top() - 1;
            best = max(best, 1LL * height * width);
        }
        st.push(i);
    }
    return best;
}`,
    time: 'O(n)', space: 'O(n)',
    traps: ['Width is not simply i−poppedIndex.', 'Without a sentinel, remaining bars need a second cleanup loop.', 'Using ≥ instead of > is possible but changes duplicate handling; stay consistent.'],
    variations: ['Maximal rectangle in a binary matrix', 'Next smaller element', 'Sum of subarray minimums']
  })
];
