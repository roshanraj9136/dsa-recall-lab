import { q, ALL_TRACKS, SERVICE_TRACKS, UPPER_TRACKS, PRODUCT_TRACKS } from './question-helpers.js';

export const FOUNDATION_QUESTIONS = [
  q({
    id: 'second-largest-distinct', title: 'Second largest distinct element', pattern: 'fundamentals', difficulty: 'Easy', tier: 'foundation', minutes: 12,
    tracks: ALL_TRACKS,
    prompt: 'Given an integer array, return its second largest distinct value in one pass. Return -1 if fewer than two distinct values exist.',
    example: '[10, 5, 10, 8] → 8',
    trigger: '“Second best/distinct maximum” plus an O(n) expectation means keep the best two values; sorting is unnecessary.',
    idea: 'After each element, first and second are the largest and second-largest distinct values in the processed prefix.',
    mnemonic: 'Two podium steps: a new champion pushes the old champion to silver.',
    steps: ['Reject arrays with fewer than two elements.', 'If x beats first, demote first to second, then install x as first.', 'Otherwise update second only when first > x > second.', 'If silver was never filled, return -1.'],
    anchors: ['if (x > first)', 'second = first;', 'else if (x < first && x > second)'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int secondLargestDistinct(const vector<int>& a) {
    long long first = LLONG_MIN, second = LLONG_MIN;
    for (int x : a) {
        if (x > first) {
            second = first;
            first = x;
        } else if (x < first && x > second) {
            second = x;
        }
    }
    return second == LLONG_MIN ? -1 : static_cast<int>(second);
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Using >= incorrectly lets a duplicate maximum become “second”.', 'Initializing to 0 fails for all-negative arrays.', 'Sorting works but costs O(n log n).'],
    variations: ['Second smallest distinct', 'Kth largest with a heap', 'Top two maximum product']
  }),
  q({
    id: 'missing-number-xor', title: 'Missing number from 0…n', pattern: 'fundamentals', difficulty: 'Easy', tier: 'foundation', minutes: 12,
    tracks: ALL_TRACKS,
    prompt: 'An array of length n contains distinct values from 0 through n with one value missing. Find the missing value using O(1) extra space.',
    example: '[3, 0, 1] → 2',
    trigger: 'Exactly one missing value from a complete known range suggests cancellation with XOR (or a carefully sized arithmetic sum).',
    idea: 'Every present number and every matching index cancels because x ^ x = 0; only the missing value remains.',
    mnemonic: 'Invite both guest lists to a dance: every matching pair leaves, the no-show remains.',
    steps: ['Start answer at n, the only range value not used as an index.', 'For each index i, XOR i and nums[i] into answer.', 'Equal index/value contributions cancel regardless of order.', 'Return the uncancelled number.'],
    anchors: ['int missing = static_cast<int>(nums.size());', 'missing ^= i ^ nums[i];', 'return missing;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int missingNumber(const vector<int>& nums) {
    int missing = static_cast<int>(nums.size());
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        missing ^= i ^ nums[i];
    }
    return missing;
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Starting at 0 forgets to include n.', 'The XOR argument depends on values being distinct and exactly one missing.', 'n(n+1)/2 can overflow if int is used.'],
    variations: ['Missing value from 1…n', 'One repeated and one missing', 'Single number where all others appear twice']
  }),
  q({
    id: 'prime-check-sqrt', title: 'Prime check in √n', pattern: 'fundamentals', difficulty: 'Easy', tier: 'foundation', minutes: 10,
    tracks: SERVICE_TRACKS,
    prompt: 'Return whether an integer n is prime. Avoid checking every value up to n and handle small inputs correctly.',
    example: '29 → true; 1 → false',
    trigger: 'A divisibility test for one number asks for factor pairs; one factor in every pair is at most √n.',
    idea: 'If no divisor exists up to √n, a larger divisor cannot exist without a smaller paired factor.',
    mnemonic: 'Factor pairs meet at the square root—check only until the partners cross.',
    steps: ['Reject n < 2.', 'Handle 2 directly; reject other even numbers.', 'Try only odd divisors from 3.', 'Use d <= n / d to avoid d*d overflow.'],
    anchors: ['if (n < 2) return false;', 'if (n % 2 == 0) return n == 2;', 'for (long long d = 3; d <= n / d; d += 2)'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

bool isPrime(long long n) {
    if (n < 2) return false;
    if (n % 2 == 0) return n == 2;
    for (long long d = 3; d <= n / d; d += 2) {
        if (n % d == 0) return false;
    }
    return true;
}`,
    time: 'O(√n)', space: 'O(1)',
    traps: ['Treating 1 as prime.', 'Using d*d <= n can overflow for large long long values.', 'Incrementing by 1 after already rejecting evens.'],
    variations: ['List primes with the Sieve of Eratosthenes', 'Count prime factors', 'Greatest common divisor with Euclid']
  }),
  q({
    id: 'quicksort-partition', title: 'Quicksort with Lomuto partition', pattern: 'fundamentals', difficulty: 'Medium', tier: 'foundation', minutes: 25,
    tracks: ['tcs-core', 'tcs-digital', 'deloitte-tech', 'saas-12-15'],
    prompt: 'Implement in-place quicksort. Be able to explain the partition invariant and average versus worst-case complexity.',
    example: '[4, 1, 7, 3, 2] → [1, 2, 3, 4, 7]',
    trigger: 'An interviewer asks you to implement/explain a comparison sort using partitioning and recursion.',
    idea: 'During partition, a[lo…i] is ≤ pivot and a[i+1…j-1] is > pivot; the final swap puts the pivot between them.',
    mnemonic: 'The pivot is a bouncer: i marks the end of the approved side.',
    steps: ['Choose the last value as pivot and set i before the range.', 'Scan j; when a[j] ≤ pivot, grow the approved region and swap.', 'Swap the pivot into i+1 and return that fixed index.', 'Recurse strictly left and right of the pivot.'],
    anchors: ['int i = lo - 1;', 'if (a[j] <= pivot) swap(a[++i], a[j]);', 'swap(a[i + 1], a[hi]);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int partitionRange(vector<int>& a, int lo, int hi) {
    int pivot = a[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; ++j) {
        if (a[j] <= pivot) swap(a[++i], a[j]);
    }
    swap(a[i + 1], a[hi]);
    return i + 1;
}

void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partitionRange(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
}`,
    time: 'Average O(n log n), worst O(n²)', space: 'Average O(log n) recursion; worst O(n)',
    traps: ['Recursing on p again causes infinite recursion.', 'Calling quicksort stable—it is not.', 'A fixed end pivot degrades on already sorted input; randomized pivoting helps.'],
    variations: ['Hoare partition', 'Randomized quickselect', 'Mergesort and its stability trade-off']
  }),

  q({
    id: 'two-sum', title: 'Two Sum', pattern: 'hashing', difficulty: 'Easy', tier: 'foundation', minutes: 15,
    tracks: ALL_TRACKS,
    prompt: 'Return indices of two different array elements whose sum equals target. Exactly one answer may be assumed.',
    example: '[2, 7, 11, 15], target 9 → [0, 1]',
    trigger: 'Need a pair with a target sum and the unsorted input must stay O(n): remember value → earlier index.',
    idea: 'Before index i is inserted, the map contains every earlier value, so finding target − nums[i] always gives a different index.',
    mnemonic: 'At each number ask: “Has my partner already entered the room?”',
    steps: ['Create value → index map.', 'Compute need = target − nums[i].', 'Query need before inserting the current value.', 'If absent, store current value and index.'],
    anchors: ['int need = target - nums[i];', 'if (seen.count(need))', 'seen[nums[i]] = i;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int need = target - nums[i];
        if (seen.count(need)) return {seen[need], i};
        seen[nums[i]] = i;
    }
    return {};
}`,
    time: 'O(n) average', space: 'O(n)',
    traps: ['Inserting first can match an element with itself when target = 2*x.', 'Returning values when indices were requested.', 'A two-pointer solution requires sorting and loses original indices unless preserved.'],
    variations: ['Two Sum in a sorted array', 'Count pairs with a sum', '3Sum']
  }),
  q({
    id: 'valid-anagram', title: 'Valid anagram', pattern: 'hashing', difficulty: 'Easy', tier: 'foundation', minutes: 12,
    tracks: ALL_TRACKS,
    prompt: 'Determine whether two lowercase English strings contain exactly the same characters with the same multiplicities.',
    example: '"listen", "silent" → true',
    trigger: 'Equality independent of order but dependent on multiplicity means compare frequency signatures.',
    idea: 'The 26 counters represent frequency(s) − frequency(t); all zeros means perfect cancellation.',
    mnemonic: 'One word deposits letters, the other withdraws them; every account must end at zero.',
    steps: ['Reject different lengths.', 'Use one fixed-size frequency array.', 'Increment for s[i] and decrement for t[i] in the same pass.', 'Verify every counter is zero.'],
    anchors: ['array<int, 26> count{};', '++count[s[i] - \'a\'];', '--count[t[i] - \'a\'];'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

bool isAnagram(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    array<int, 26> count{};
    for (int i = 0; i < static_cast<int>(s.size()); ++i) {
        ++count[s[i] - 'a'];
        --count[t[i] - 'a'];
    }
    return all_of(count.begin(), count.end(), [](int x) { return x == 0; });
}`,
    time: 'O(n)', space: 'O(1) for a fixed alphabet',
    traps: ['A set loses multiplicity.', 'For Unicode/general text, fixed 26 counters are insufficient.', 'Sorting is simpler but O(n log n).'],
    variations: ['Find all anagrams in a string', 'Ransom note', 'Group anagrams by signature']
  }),
  q({
    id: 'group-anagrams', title: 'Group anagrams', pattern: 'hashing', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Group strings so that each group contains words that are anagrams of one another. Group order does not matter.',
    example: '["eat","tea","tan","ate"] → [["eat","tea","ate"],["tan"]]',
    trigger: 'Group objects by an equivalence relation: build one canonical key for every anagram family.',
    idea: 'Sorting a word produces the same canonical key exactly when its character multiset matches.',
    mnemonic: 'Alphabetize each word’s fingerprint, then file matching fingerprints in one folder.',
    steps: ['For every word, copy it into key.', 'Sort key to create a canonical signature.', 'Append the original word to groups[key].', 'Move each map bucket into the answer.'],
    anchors: ['string key = word;', 'sort(key.begin(), key.end());', 'groups[key].push_back(word);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<vector<string>> groupAnagrams(const vector<string>& words) {
    unordered_map<string, vector<string>> groups;
    for (const string& word : words) {
        string key = word;
        sort(key.begin(), key.end());
        groups[key].push_back(word);
    }
    vector<vector<string>> answer;
    answer.reserve(groups.size());
    for (auto& [key, group] : groups) answer.push_back(move(group));
    return answer;
}`,
    time: 'O(n · k log k), k = max word length', space: 'O(nk)',
    traps: ['Using the original word as the key.', 'Returning map iteration order as if it were guaranteed.', 'A count-signature key needs separators to avoid ambiguity.'],
    variations: ['Use a 26-count signature in O(nk)', 'Group shifted strings', 'Find anagram windows']
  }),
  q({
    id: 'longest-consecutive', title: 'Longest consecutive sequence', pattern: 'hashing', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Given an unsorted integer array, return the length of the longest run of consecutive values in expected O(n) time.',
    example: '[100, 4, 200, 1, 3, 2] → 4',
    trigger: 'Unsorted consecutive values with an O(n) requirement: set lookup plus start only at sequence heads.',
    idea: 'A value begins a sequence only if x − 1 is absent. Each run is then walked exactly once from its unique head.',
    mnemonic: 'Count a train only from the engine—the carriage with no predecessor.',
    steps: ['Insert all numbers into a set.', 'Skip x when x − 1 exists.', 'From each head, advance while next values exist.', 'Keep the maximum run length.'],
    anchors: ['if (x != INT_MIN && values.count(x - 1)) continue;', 'while (current != INT_MAX && values.count(current + 1))', 'best = max(best, length);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int longestConsecutive(const vector<int>& nums) {
    unordered_set<int> values(nums.begin(), nums.end());
    int best = 0;
    for (int x : values) {
        if (x != INT_MIN && values.count(x - 1)) continue;
        int current = x, length = 1;
        while (current != INT_MAX && values.count(current + 1)) {
            ++current;
            ++length;
        }
        best = max(best, length);
    }
    return best;
}`,
    time: 'O(n) expected', space: 'O(n)',
    traps: ['Expanding from every value makes repeated O(n²) work.', 'Duplicates should not increase length.', 'x−1 and x+1 can overflow at integer limits.'],
    variations: ['Longest consecutive after online inserts', 'Longest harmonious subsequence', 'Union-find formulation']
  }),

  q({
    id: 'valid-palindrome-clean', title: 'Valid palindrome with ignored symbols', pattern: 'two-pointers', difficulty: 'Easy', tier: 'foundation', minutes: 15,
    tracks: ALL_TRACKS,
    prompt: 'Check whether a string is a palindrome after ignoring non-alphanumeric characters and letter case.',
    example: '"A man, a plan, a canal: Panama" → true',
    trigger: 'Compare a sequence from both ends while skipping irrelevant characters.',
    idea: 'Characters outside [left, right] have already matched; skipping cannot remove a relevant comparison.',
    mnemonic: 'Two proofreaders walk inward and ignore punctuation on their path.',
    steps: ['Place pointers at both ends.', 'Advance left and retreat right past non-alphanumeric characters.', 'Compare lowercase forms; fail on mismatch.', 'Move both after a successful match.'],
    anchors: ['while (l < r && !isalnum(static_cast<unsigned char>(s[l]))) ++l;', 'if (tolower(static_cast<unsigned char>(s[l])) !=', '++l; --r;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

bool isCleanPalindrome(const string& s) {
    int l = 0, r = static_cast<int>(s.size()) - 1;
    while (l < r) {
        while (l < r && !isalnum(static_cast<unsigned char>(s[l]))) ++l;
        while (l < r && !isalnum(static_cast<unsigned char>(s[r]))) --r;
        if (tolower(static_cast<unsigned char>(s[l])) !=
            tolower(static_cast<unsigned char>(s[r]))) return false;
        ++l; --r;
    }
    return true;
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Passing a negative signed char directly to isalnum/tolower is undefined behavior.', 'Reading s[r] when the string is empty without setting r safely.', 'Building a cleaned copy uses O(n) extra space.'],
    variations: ['Valid palindrome after one deletion', 'Longest palindromic substring', 'Palindrome linked list']
  }),
  q({
    id: 'move-zeroes', title: 'Move zeroes in place', pattern: 'two-pointers', difficulty: 'Easy', tier: 'foundation', minutes: 12,
    tracks: ALL_TRACKS,
    prompt: 'Move all zeroes to the end of an array in place while preserving the relative order of non-zero values.',
    example: '[0, 1, 0, 3, 12] → [1, 3, 12, 0, 0]',
    trigger: 'Stable in-place compaction: one pointer writes the next valid value while another scans.',
    idea: 'Before scan index i, [0, write) contains all non-zero values seen so far in original order.',
    mnemonic: 'Write is the next empty seat reserved for a non-zero passenger.',
    steps: ['Initialize write = 0.', 'Scan every value.', 'When non-zero, swap it into write and advance write.', 'The displaced/untouched suffix naturally contains zeroes.'],
    anchors: ['int write = 0;', 'if (nums[read] != 0)', 'swap(nums[write++], nums[read]);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

void moveZeroes(vector<int>& nums) {
    int write = 0;
    for (int read = 0; read < static_cast<int>(nums.size()); ++read) {
        if (nums[read] != 0) {
            swap(nums[write++], nums[read]);
        }
    }
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Sorting destroys non-zero order.', 'Erasing from a vector repeatedly becomes O(n²).', 'A two-pass overwrite is valid but performs more writes.'],
    variations: ['Remove a value in place', 'Partition negatives and positives', 'Deduplicate a sorted array']
  }),
  q({
    id: 'container-most-water', title: 'Container with most water', pattern: 'two-pointers', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Given vertical line heights, choose two lines that hold the maximum water. Width is index distance and height is the shorter line.',
    example: '[1,8,6,2,5,4,8,3,7] → 49',
    trigger: 'A pair score uses far-apart indices and is limited by the smaller endpoint.',
    idea: 'Moving the taller line inward cannot improve the limiting height and always shrinks width, so only the shorter line may lead to improvement.',
    mnemonic: 'The shorter wall leaks; replace that wall, never the taller one.',
    steps: ['Start at the widest pair.', 'Record width × min(height[left], height[right]).', 'Move the pointer at the shorter wall.', 'Repeat until pointers meet.'],
    anchors: ['long long area = 1LL * (r - l) * min(height[l], height[r]);', 'if (height[l] < height[r]) ++l;', 'else --r;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

long long maxWater(const vector<int>& height) {
    int l = 0, r = static_cast<int>(height.size()) - 1;
    long long best = 0;
    while (l < r) {
        long long area = 1LL * (r - l) * min(height[l], height[r]);
        best = max(best, area);
        if (height[l] < height[r]) ++l;
        else --r;
    }
    return best;
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Moving the taller pointer has no dominance proof.', 'Using max instead of min for water height.', 'Area can overflow int for large constraints.'],
    variations: ['Trapping rain water', 'Maximum distance under constraints', 'Two Sum in sorted input']
  }),
  q({
    id: 'three-sum', title: '3Sum without duplicate triples', pattern: 'two-pointers', difficulty: 'Medium', tier: 'core', minutes: 30,
    tracks: UPPER_TRACKS,
    prompt: 'Return all unique triples whose values sum to zero. The output must not contain duplicate triples.',
    example: '[-1,0,1,2,-1,-4] → [[-1,-1,2],[-1,0,1]]',
    trigger: 'Unique triples with a target sum: sort, fix one value, then solve a two-pointer pair problem.',
    idea: 'For a fixed i, sorted endpoints let the sum decide which pointer moves; skipping equal values chooses each value combination once.',
    mnemonic: 'Pin one number to the board; let two guards find its opposite.',
    steps: ['Sort the array.', 'Fix i and skip duplicate fixed values.', 'Run left/right on the suffix.', 'On a match, record, move both, and skip repeated endpoint values.'],
    anchors: ['if (i > 0 && nums[i] == nums[i - 1]) continue;', 'long long sum = 1LL * nums[i] + nums[l] + nums[r];', 'while (l < r && nums[l] == nums[l - 1]) ++l;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> threeSum(vector<int> nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> answer;
    for (int i = 0; i + 2 < static_cast<int>(nums.size()); ++i) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        int l = i + 1, r = static_cast<int>(nums.size()) - 1;
        while (l < r) {
            long long sum = 1LL * nums[i] + nums[l] + nums[r];
            if (sum < 0) ++l;
            else if (sum > 0) --r;
            else {
                answer.push_back({nums[i], nums[l], nums[r]});
                ++l; --r;
                while (l < r && nums[l] == nums[l - 1]) ++l;
                while (l < r && nums[r] == nums[r + 1]) --r;
            }
        }
    }
    return answer;
}`,
    time: 'O(n²)', space: 'O(1) excluding output (plus sort stack)',
    traps: ['Skipping duplicates only after matches still repeats fixed i triples.', 'Using a hash set can complicate uniqueness.', 'Sum may overflow int.'],
    variations: ['3Sum closest', '4Sum', 'Count triples below a target']
  }),

  q({
    id: 'maximum-sum-window-k', title: 'Maximum sum window of size k', pattern: 'sliding-window', difficulty: 'Easy', tier: 'foundation', minutes: 15,
    tracks: ALL_TRACKS,
    prompt: 'Return the maximum sum among all contiguous subarrays of exactly k elements. Assume 1 ≤ k ≤ n.',
    example: '[2,1,5,1,3,2], k=3 → 9',
    trigger: 'Contiguous plus an exact fixed length: update by adding one incoming and removing one outgoing value.',
    idea: 'window always equals the sum of the last k processed elements; adjacent windows differ by exactly two values.',
    mnemonic: 'A k-seat bus: one enters at the front exactly when one exits at the back.',
    steps: ['Sum the first k values.', 'Initialize best from that full window—not zero.', 'For each next index, add incoming and subtract i−k.', 'Update best.'],
    anchors: ['long long window = accumulate(a.begin(), a.begin() + k, 0LL);', 'window += a[i] - a[i - k];', 'best = max(best, window);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

long long maxWindowSum(const vector<int>& a, int k) {
    long long window = accumulate(a.begin(), a.begin() + k, 0LL);
    long long best = window;
    for (int i = k; i < static_cast<int>(a.size()); ++i) {
        window += a[i] - a[i - k];
        best = max(best, window);
    }
    return best;
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Initializing best to 0 fails when all sums are negative.', 'Using i−k+1 as the outgoing index.', 'Not validating k in a general-purpose API.'],
    variations: ['Average of every size-k window', 'First negative in every window', 'Variable window with sum at least target']
  }),
  q({
    id: 'longest-substring-no-repeat', title: 'Longest substring without repeating characters', pattern: 'sliding-window', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Return the length of the longest contiguous substring containing no repeated character.',
    example: '"abcabcbb" → 3',
    trigger: 'Longest contiguous region under a uniqueness rule: sliding window with last-seen positions.',
    idea: 'left is always one past the latest conflicting occurrence inside the current window; [left, right] is unique.',
    mnemonic: 'When a guest repeats, move the door just past their previous seat—never move it backward.',
    steps: ['Initialize all last positions to −1.', 'At right, raise left to max(left, last[c]+1).', 'Record last[c] = right.', 'Update length right−left+1.'],
    anchors: ['array<int, 256> last;', 'left = max(left, last[c] + 1);', 'last[c] = right;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int longestUniqueSubstring(const string& s) {
    array<int, 256> last;
    last.fill(-1);
    int left = 0, best = 0;
    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        unsigned char c = static_cast<unsigned char>(s[right]);
        left = max(left, last[c] + 1);
        last[c] = right;
        best = max(best, right - left + 1);
    }
    return best;
}`,
    time: 'O(n)', space: 'O(1) for byte characters',
    traps: ['Setting left = last[c]+1 can move it backward.', 'A set-based window is valid but must erase until the duplicate leaves.', 'Byte indexing is not full Unicode handling.'],
    variations: ['At most k distinct characters', 'Longest repeating-character replacement', 'Minimum window substring']
  }),
  q({
    id: 'minimum-window-substring', title: 'Minimum window substring', pattern: 'sliding-window', difficulty: 'Hard', tier: 'stretch', minutes: 40,
    tracks: PRODUCT_TRACKS,
    prompt: 'Return the shortest substring of s containing every character of t with multiplicity. Return an empty string if impossible.',
    example: 's="ADOBECODEBANC", t="ABC" → "BANC"',
    trigger: 'Smallest contiguous cover with required multiplicities: grow until valid, then shrink while valid.',
    idea: 'missing counts how many required character instances are still absent; missing==0 exactly means the window covers t.',
    mnemonic: 'Collect every item on the shopping list, then squeeze the bag until removing one item breaks the list.',
    steps: ['Count required characters and set missing=t.size().', 'Grow right; a character reduces missing only if it was still needed.', 'After decrementing need[c], shrink while missing==0.', 'Record the shortest valid window; restoring left may increase missing.'],
    anchors: ['int missing = static_cast<int>(t.size());', 'if (need[c]-- > 0) --missing;', 'if (++need[out] > 0) ++missing;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

string minWindow(const string& s, const string& t) {
    if (t.empty()) return "";
    array<int, 256> need{};
    for (unsigned char c : t) ++need[c];
    int missing = static_cast<int>(t.size());
    int left = 0, bestStart = 0, bestLen = INT_MAX;

    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        unsigned char c = static_cast<unsigned char>(s[right]);
        if (need[c]-- > 0) --missing;
        while (missing == 0) {
            if (right - left + 1 < bestLen) {
                bestStart = left;
                bestLen = right - left + 1;
            }
            unsigned char out = static_cast<unsigned char>(s[left++]);
            if (++need[out] > 0) ++missing;
        }
    }
    return bestLen == INT_MAX ? "" : s.substr(bestStart, bestLen);
}`,
    time: 'O(|s| + |t|)', space: 'O(1) for byte characters',
    traps: ['Counting distinct matched characters instead of required instances.', 'Using a boolean presence set loses multiplicity.', 'Updating the best before the window becomes valid.'],
    variations: ['Smallest window containing all distinct pattern chars', 'Find all anagram starts', 'Minimum-size subarray sum']
  }),
  q({
    id: 'sliding-window-maximum', title: 'Sliding window maximum', pattern: 'sliding-window', difficulty: 'Hard', tier: 'stretch', minutes: 35,
    tracks: PRODUCT_TRACKS,
    prompt: 'For every contiguous window of size k, return its maximum in overall O(n) time.',
    example: '[1,3,-1,-3,5,3,6,7], k=3 → [3,3,5,5,6,7]',
    trigger: 'Maximum for every overlapping fixed window with O(n), not O(nk): monotonic deque of useful indices.',
    idea: 'Deque indices are inside the window and values strictly decrease; the front is therefore the maximum.',
    mnemonic: 'A VIP line: expired guests leave the front; weaker guests behind a newcomer leave the back.',
    steps: ['Remove front indices that are left of the window.', 'Pop back while its value is ≤ the incoming value.', 'Push the incoming index.', 'Once a full window exists, output nums[dq.front()].'],
    anchors: ['if (!dq.empty() && dq.front() <= i - k) dq.pop_front();', 'while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();', 'answer.push_back(nums[dq.front()]);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<int> maxSlidingWindow(const vector<int>& nums, int k) {
    deque<int> dq;
    vector<int> answer;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();
        while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k - 1) answer.push_back(nums[dq.front()]);
    }
    return answer;
}`,
    time: 'O(n)', space: 'O(k)',
    traps: ['Storing only values makes expiration ambiguous with duplicates.', 'Removing expired indices from the back.', 'Each index is pushed and popped once—that is the O(n) proof.'],
    variations: ['Sliding window minimum', 'Shortest subarray with sum at least K', 'Next greater element']
  })
];
