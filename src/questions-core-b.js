import { q, ALL_TRACKS, UPPER_TRACKS, PRODUCT_TRACKS } from './question-helpers.js';

export const CORE_B_QUESTIONS = [
  q({
    id: 'reverse-linked-list', title: 'Reverse a linked list', pattern: 'linked-list', difficulty: 'Easy', tier: 'foundation', minutes: 18,
    tracks: ALL_TRACKS,
    prompt: 'Reverse a singly linked list in place and return the new head.',
    example: '1 → 2 → 3 → null becomes 3 → 2 → 1 → null',
    trigger: 'Reverse arrows in a singly linked chain: prev, current, and a saved next pointer.',
    idea: 'Before each iteration, prev is the correctly reversed processed prefix and current still reaches the untouched suffix.',
    mnemonic: 'Save the next train carriage before turning the current coupling backward.',
    steps: ['Start prev=null and current=head.', 'Save current->next before changing any link.', 'Point current->next to prev.', 'Advance prev and current; return prev.'],
    anchors: ['ListNode* next = current->next;', 'current->next = prev;', 'return prev;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x, ListNode* n = nullptr) : val(x), next(n) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* current = head;
    while (current) {
        ListNode* next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    return prev;
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['Rewiring before saving next loses the remaining list.', 'Returning current gives null after the loop.', 'The recursive version uses O(n) call-stack space.'],
    variations: ['Reverse a sublist', 'Reverse nodes in k groups', 'Palindrome linked list']
  }),
  q({
    id: 'linked-list-cycle', title: 'Detect a linked-list cycle', pattern: 'linked-list', difficulty: 'Easy', tier: 'foundation', minutes: 18,
    tracks: ALL_TRACKS,
    prompt: 'Return whether a singly linked list contains a cycle using O(1) extra space.',
    example: '3 → 2 → 0 → −4, with −4 linking back to 2 → true',
    trigger: 'Cycle detection with constant space: slow advances one edge, fast advances two.',
    idea: 'Inside a cycle, fast gains one node per step on slow, so their cyclic distance must eventually become zero.',
    mnemonic: 'On a circular track, the faster runner must lap the slower runner.',
    steps: ['Initialize slow and fast at head.', 'Continue only while fast and fast->next exist.', 'Advance slow once and fast twice.', 'Return true on pointer equality; false if fast reaches null.'],
    anchors: ['while (fast && fast->next)', 'slow = slow->next;', 'fast = fast->next->next;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

bool hasCycle(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`,
    time: 'O(n)', space: 'O(1)',
    traps: ['The guard must check both fast and fast->next.', 'Compare node pointers, not values.', 'A hash set is simpler but costs O(n) space.'],
    variations: ['Find cycle entry', 'Find the middle node', 'Happy number']
  }),
  q({
    id: 'merge-two-sorted-lists', title: 'Merge two sorted linked lists', pattern: 'linked-list', difficulty: 'Easy', tier: 'foundation', minutes: 20,
    tracks: ALL_TRACKS,
    prompt: 'Merge two ascending singly linked lists by relinking existing nodes and return the merged head.',
    example: '1→2→4 and 1→3→4 becomes 1→1→2→3→4→4',
    trigger: 'Merge two sorted streams where the head may change: dummy node plus a tail pointer.',
    idea: 'dummy->next through tail is the fully sorted prefix; list1 and list2 point to the smallest unmerged candidates.',
    mnemonic: 'A zipper: tail always clips on the smaller of the two next teeth.',
    steps: ['Create dummy and tail=&dummy.', 'While both lists exist, attach the smaller front node.', 'Advance the chosen list and tail.', 'Attach the entire non-empty remainder and return dummy.next.'],
    anchors: ['ListNode dummy(0);', 'tail->next = a;', 'tail->next = a ? a : b;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x, ListNode* n = nullptr) : val(x), next(n) {}
};

ListNode* mergeTwoLists(ListNode* a, ListNode* b) {
    ListNode dummy(0);
    ListNode* tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) {
            tail->next = a;
            a = a->next;
        } else {
            tail->next = b;
            b = b->next;
        }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}`,
    time: 'O(n + m)', space: 'O(1)',
    traps: ['Forgetting to advance tail.', 'Allocating duplicate nodes is unnecessary.', 'Returning &dummy is invalid because dummy is local.'],
    variations: ['Merge k sorted lists with a heap', 'Sort a linked list', 'Remove nth node using a dummy']
  }),

  q({
    id: 'maximum-depth-tree', title: 'Maximum depth of a binary tree', pattern: 'trees', difficulty: 'Easy', tier: 'foundation', minutes: 15,
    tracks: ALL_TRACKS,
    prompt: 'Return the number of nodes on the longest root-to-leaf path in a binary tree.',
    example: '[3,9,20,null,null,15,7] → 3',
    trigger: 'A tree quantity for a node depends on the same quantity from its children: postorder recursion.',
    idea: 'depth(node) means the longest node-count path beginning at node; null contributes 0.',
    mnemonic: 'Ask both children their tallest tower, choose taller, add this floor.',
    steps: ['Define null depth as 0.', 'Recursively obtain left depth.', 'Recursively obtain right depth.', 'Return 1 + max(left, right).'],
    anchors: ['if (!root) return 0;', 'int left = maxDepth(root->left);', 'return 1 + max(left, right);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

int maxDepth(TreeNode* root) {
    if (!root) return 0;
    int left = maxDepth(root->left);
    int right = maxDepth(root->right);
    return 1 + max(left, right);
}`,
    time: 'O(n)', space: 'O(h) recursion stack',
    traps: ['Mixing node-count and edge-count definitions.', 'A skewed tree has O(n) stack depth.', 'Recomputing depth inside another traversal can create O(n²).'],
    variations: ['Minimum depth', 'Check balanced tree by returning height or −1', 'Maximum path sum']
  }),
  q({
    id: 'binary-tree-level-order', title: 'Binary tree level-order traversal', pattern: 'trees', difficulty: 'Medium', tier: 'core', minutes: 22,
    tracks: ALL_TRACKS,
    prompt: 'Return binary-tree values grouped by depth from top to bottom and left to right.',
    example: '[3,9,20,null,null,15,7] → [[3],[9,20],[15,7]]',
    trigger: 'Grouped by distance/depth from a source: breadth-first search with queue-level size.',
    idea: 'At the start of each outer loop, the queue contains exactly the nodes in the next level; its current size freezes that boundary.',
    mnemonic: 'Take a class photo one row at a time; count the row before inviting its children.',
    steps: ['Return empty for null root; otherwise enqueue root.', 'Capture levelSize = queue.size().', 'Pop exactly levelSize nodes into one row.', 'Enqueue each popped node’s children, then save the row.'],
    anchors: ['int levelSize = static_cast<int>(q.size());', 'while (levelSize--)', 'answer.push_back(move(level));'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

vector<vector<int>> levelOrder(TreeNode* root) {
    if (!root) return {};
    queue<TreeNode*> q;
    q.push(root);
    vector<vector<int>> answer;
    while (!q.empty()) {
        int levelSize = static_cast<int>(q.size());
        vector<int> level;
        while (levelSize--) {
            TreeNode* node = q.front(); q.pop();
            level.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        answer.push_back(move(level));
    }
    return answer;
}`,
    time: 'O(n)', space: 'O(w), maximum tree width',
    traps: ['Using q.size() directly in a changing for-loop mixes levels.', 'Enqueuing null children complicates processing.', 'DFS can group by depth too, but BFS is the natural layer invariant.'],
    variations: ['Zigzag traversal', 'Right-side view', 'Average of each level', 'Preorder/inorder/postorder DFS']
  }),
  q({
    id: 'validate-binary-search-tree', title: 'Validate a binary search tree', pattern: 'trees', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Return whether a binary tree is a valid strict BST: every left-subtree value is smaller and every right-subtree value is larger than the node.',
    example: '[5,1,4,null,null,3,6] → false',
    trigger: 'BST validity applies against all ancestors, not just parent-child comparisons: carry an allowed range.',
    idea: 'Each recursive call receives the exclusive lower and upper bounds imposed by every ancestor.',
    mnemonic: 'Every ancestor narrows the doorway; each node must fit through its inherited bounds.',
    steps: ['Start root with (−∞, +∞).', 'Fail unless low < node->val < high.', 'Left child inherits (low, node value).', 'Right child inherits (node value, high).'],
    anchors: ['if (node->val <= low || node->val >= high) return false;', 'valid(node->left, low, node->val)', 'valid(node->right, node->val, high)'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

bool valid(TreeNode* node, long long low, long long high) {
    if (!node) return true;
    if (node->val <= low || node->val >= high) return false;
    return valid(node->left, low, node->val) &&
           valid(node->right, node->val, high);
}

bool isValidBST(TreeNode* root) {
    return valid(root, LLONG_MIN, LLONG_MAX);
}`,
    time: 'O(n)', space: 'O(h)',
    traps: ['Checking only node > left child and node < right child misses deep violations.', 'int bounds fail when a node equals INT_MIN/INT_MAX.', 'Strict BST rules reject duplicates; clarify if the convention differs.'],
    variations: ['Inorder traversal must be strictly increasing', 'Kth smallest in BST', 'Recover swapped BST']
  }),
  q({
    id: 'diameter-binary-tree', title: 'Diameter of a binary tree', pattern: 'trees', difficulty: 'Medium', tier: 'core', minutes: 28,
    tracks: UPPER_TRACKS,
    prompt: 'Return the maximum number of edges on any path between two nodes in a binary tree. The path need not pass through the root.',
    example: '[1,2,3,4,5] → 3',
    trigger: 'A best path may pass through each node and needs heights from both children: postorder plus a global/reference maximum.',
    idea: 'height returns node-count downward; leftHeight + rightHeight is exactly the edge-count path through the current node.',
    mnemonic: 'Each node joins its two tallest child ladders and reports that bridge before sending one ladder upward.',
    steps: ['Return height 0 for null.', 'Get left and right heights.', 'Update diameter with left + right.', 'Return 1 + max(left, right) to the parent.'],
    anchors: ['int left = height(node->left, diameter);', 'diameter = max(diameter, left + right);', 'return 1 + max(left, right);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

int height(TreeNode* node, int& diameter) {
    if (!node) return 0;
    int left = height(node->left, diameter);
    int right = height(node->right, diameter);
    diameter = max(diameter, left + right);
    return 1 + max(left, right);
}

int treeDiameter(TreeNode* root) {
    int diameter = 0;
    height(root, diameter);
    return diameter;
}`,
    time: 'O(n)', space: 'O(h)',
    traps: ['Returning the diameter where the parent expects height.', 'Running maxDepth separately at every node becomes O(n²).', 'Clarify whether diameter counts edges or nodes.'],
    variations: ['Check balanced tree in one pass', 'Binary tree maximum path sum', 'N-ary tree diameter']
  }),
  q({
    id: 'lowest-common-ancestor-tree', title: 'Lowest common ancestor in a binary tree', pattern: 'trees', difficulty: 'Medium', tier: 'core', minutes: 28,
    tracks: UPPER_TRACKS,
    prompt: 'Given a binary tree and two existing node pointers p and q, return their lowest common ancestor.',
    example: 'In [3,5,1,6,2,0,8], LCA(5,1) → 3',
    trigger: 'Find where two targets split in a general binary tree: recurse; a non-null return reports a found target/ancestor.',
    idea: 'A call returns null if neither target is in its subtree, one target/answer if exactly one side finds it, or the node when both sides find something.',
    mnemonic: 'Send search parties left and right; if both return with news, their commander is the meeting point.',
    steps: ['Return root if null, p, or q.', 'Search left and right subtrees.', 'If both results are non-null, current root is the LCA.', 'Otherwise propagate whichever result is non-null.'],
    anchors: ['if (!root || root == p || root == q) return root;', 'if (left && right) return root;', 'return left ? left : right;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;
    TreeNode* left = lowestCommonAncestor(root->left, p, q);
    TreeNode* right = lowestCommonAncestor(root->right, p, q);
    if (left && right) return root;
    return left ? left : right;
}`,
    time: 'O(n)', space: 'O(h)',
    traps: ['This assumes both targets exist; otherwise add found-count validation.', 'BST LCA has a simpler ordering solution.', 'Compare pointers when p and q are nodes, not only values.'],
    variations: ['LCA in a BST', 'LCA with parent pointers', 'Distance between two nodes']
  }),
  q({
    id: 'serialize-binary-tree', title: 'Serialize and deserialize a binary tree', pattern: 'trees', difficulty: 'Hard', tier: 'stretch', minutes: 40,
    tracks: PRODUCT_TRACKS,
    prompt: 'Convert a binary tree to a string and reconstruct the identical structure. Values may be negative; preserve null positions.',
    example: '[1,2,3,null,null,4,5] ↔ "1 2 # # 3 4 # # 5 # #"',
    trigger: 'Preserve arbitrary tree structure: preorder values plus explicit null markers is self-delimiting.',
    idea: 'Preorder consumes one token per node position; # closes a null branch, so decoding in the same order reconstructs uniquely.',
    mnemonic: 'Record every doorway in preorder, writing # even for a locked door.',
    steps: ['Encode null as “# ”.', 'Encode value, then left subtree, then right subtree.', 'Decode one token; # returns null.', 'Otherwise create a node and recursively fill left then right.'],
    anchors: ['if (!node) { out << "# "; return; }', 'encode(node->left, out);', 'if (token == "#") return nullptr;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

void encode(TreeNode* node, ostringstream& out) {
    if (!node) { out << "# "; return; }
    out << node->val << ' ';
    encode(node->left, out);
    encode(node->right, out);
}

TreeNode* decode(istringstream& in) {
    string token;
    if (!(in >> token)) return nullptr;
    if (token == "#") return nullptr;
    TreeNode* node = new TreeNode(stoi(token));
    node->left = decode(in);
    node->right = decode(in);
    return node;
}

string serialize(TreeNode* root) {
    ostringstream out;
    encode(root, out);
    return out.str();
}

TreeNode* deserialize(const string& data) {
    istringstream in(data);
    return decode(in);
}`,
    time: 'O(n) encode and decode', space: 'O(n) output + O(h) stack',
    traps: ['Omitting null markers loses shape.', 'Splitting on a delimiter that can occur ambiguously.', 'Production code should define ownership and free allocated nodes.'],
    variations: ['Level-order serialization', 'Serialize a BST without nulls using bounds', 'Construct tree from preorder and inorder']
  }),

  q({
    id: 'number-of-islands', title: 'Number of islands', pattern: 'graphs', difficulty: 'Medium', tier: 'core', minutes: 25,
    tracks: UPPER_TRACKS,
    prompt: 'Count connected components of land cells (\'1\') in a 2D grid using four-directional adjacency. The grid may be modified.',
    example: 'A grid with two disconnected land regions → 2',
    trigger: 'Count connected regions in a grid: every unvisited land cell starts one DFS/BFS flood.',
    idea: 'When a new land cell is found, one traversal erases/marks its entire component, so it is counted exactly once.',
    mnemonic: 'Every time you find dry land, spill ink across its whole island, then add one.',
    steps: ['Scan every grid cell.', 'On land, increment islands and start DFS.', 'DFS stops out of bounds or on non-land.', 'Mark land as water before exploring four neighbors.'],
    anchors: ['if (grid[r][c] != \'1\') return;', 'grid[r][c] = \'0\';', '++islands; flood(grid, r, c);'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

void flood(vector<vector<char>>& grid, int r, int c) {
    int rows = static_cast<int>(grid.size());
    int cols = static_cast<int>(grid[0].size());
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    if (grid[r][c] != '1') return;
    grid[r][c] = '0';
    flood(grid, r + 1, c);
    flood(grid, r - 1, c);
    flood(grid, r, c + 1);
    flood(grid, r, c - 1);
}

int numIslands(vector<vector<char>>& grid) {
    if (grid.empty()) return 0;
    int islands = 0;
    for (int r = 0; r < static_cast<int>(grid.size()); ++r) {
        for (int c = 0; c < static_cast<int>(grid[0].size()); ++c) {
            if (grid[r][c] == '1') {
                ++islands; flood(grid, r, c);
            }
        }
    }
    return islands;
}`,
    time: 'O(rows · cols)', space: 'O(rows · cols) worst-case recursion',
    traps: ['Mark before recursing or cycles revisit forever.', 'Check grid.empty() before grid[0].', 'Use BFS if recursion depth can overflow.'],
    variations: ['Flood fill', 'Max island area', 'Surrounded regions']
  }),
  q({
    id: 'course-schedule', title: 'Course schedule / cycle in directed graph', pattern: 'graphs', difficulty: 'Medium', tier: 'core', minutes: 30,
    tracks: UPPER_TRACKS,
    prompt: 'Given numCourses and prerequisite pairs [course, prerequisite], return whether all courses can be completed.',
    example: '2, [[1,0]] → true; 2, [[1,0],[0,1]] → false',
    trigger: 'Dependencies require an ordering; completing all nodes is possible exactly when the directed graph has no cycle.',
    idea: 'Kahn’s BFS repeatedly removes zero-indegree nodes. A cycle keeps every remaining node’s indegree positive.',
    mnemonic: 'Take every course with no locked prerequisite; if courses remain but no door is unlocked, there is a loop.',
    steps: ['Build edges prerequisite → course and indegrees.', 'Enqueue every zero-indegree course.', 'Pop, count it, and decrement neighbors.', 'Enqueue neighbors reaching zero; succeed if count == n.'],
    anchors: ['graph[prerequisite].push_back(course);', 'if (--indegree[next] == 0) ready.push(next);', 'return completed == numCourses;'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

bool canFinish(int numCourses, const vector<vector<int>>& prerequisites) {
    vector<vector<int>> graph(numCourses);
    vector<int> indegree(numCourses, 0);
    for (const auto& edge : prerequisites) {
        int course = edge[0], prerequisite = edge[1];
        graph[prerequisite].push_back(course);
        ++indegree[course];
    }
    queue<int> ready;
    for (int i = 0; i < numCourses; ++i)
        if (indegree[i] == 0) ready.push(i);
    int completed = 0;
    while (!ready.empty()) {
        int node = ready.front(); ready.pop();
        ++completed;
        for (int next : graph[node])
            if (--indegree[next] == 0) ready.push(next);
    }
    return completed == numCourses;
}`,
    time: 'O(V + E)', space: 'O(V + E)',
    traps: ['Reverse edge direction consistently with indegree.', 'A visited boolean alone does not detect a directed DFS cycle; use three colors.', 'Disconnected DAG components are handled by seeding all zero-indegree nodes.'],
    variations: ['Return a topological order', 'Alien dictionary', 'Detect cycle with DFS colors']
  }),
  q({
    id: 'dijkstra-shortest-path', title: 'Dijkstra shortest paths', pattern: 'graphs', difficulty: 'Medium', tier: 'core', minutes: 35,
    tracks: PRODUCT_TRACKS,
    prompt: 'Given an adjacency list of directed edges (neighbor, nonnegative weight), return shortest distances from source. Unreachable nodes remain infinity.',
    example: '0→1 (4), 0→2 (1), 2→1 (2) gives dist[1]=3',
    trigger: 'Shortest paths with nonnegative weights: min-heap ordered by best tentative distance and edge relaxation.',
    idea: 'The first non-stale heap entry popped for a node is its shortest distance; relaxation publishes improved candidates.',
    mnemonic: 'Always expand the cheapest unfinished route; discard old price tags when a cheaper tag already exists.',
    steps: ['Initialize all distances to infinity and source to 0.', 'Push (0, source) into a min-heap.', 'Pop; skip when popped distance differs from current dist.', 'Relax every outgoing edge and push each improvement.'],
    anchors: ['priority_queue<State, vector<State>, greater<State>> pq;', 'if (distance != dist[node]) continue;', 'if (distance + weight < dist[next])'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<long long> dijkstra(
    int n, const vector<vector<pair<int, int>>>& graph, int source) {
    const long long INF = LLONG_MAX / 4;
    vector<long long> dist(n, INF);
    using State = pair<long long, int>;
    priority_queue<State, vector<State>, greater<State>> pq;
    dist[source] = 0;
    pq.push({0, source});

    while (!pq.empty()) {
        auto [distance, node] = pq.top(); pq.pop();
        if (distance != dist[node]) continue;
        for (auto [next, weight] : graph[node]) {
            if (distance + weight < dist[next]) {
                dist[next] = distance + weight;
                pq.push({dist[next], next});
            }
        }
    }
    return dist;
}`,
    time: 'O((V + E) log V)', space: 'O(V + E)',
    traps: ['Negative edges invalidate Dijkstra; use Bellman–Ford.', 'Without the stale-entry check, correctness remains but extra work grows.', 'Use long long and a safe infinity to avoid overflow.'],
    variations: ['Unweighted shortest path with BFS', 'Network delay time', 'Cheapest flight with stop limit']
  }),

  q({
    id: 'kth-largest-element', title: 'Kth largest element', pattern: 'heap-greedy', difficulty: 'Medium', tier: 'core', minutes: 22,
    tracks: UPPER_TRACKS,
    prompt: 'Return the kth largest value in an unsorted array. Duplicates count as separate positions in sorted order.',
    example: '[3,2,1,5,6,4], k=2 → 5',
    trigger: 'Retain the best k values from a stream: a size-k min-heap ejects the smallest retained value.',
    idea: 'After every element, the heap contains the k largest values seen so far; its top is the kth largest among them.',
    mnemonic: 'A k-seat winners’ bench: whenever crowded, remove the weakest winner.',
    steps: ['Create a min-heap.', 'Push each value.', 'If size exceeds k, pop the minimum.', 'The final minimum is kth largest.'],
    anchors: ['priority_queue<int, vector<int>, greater<int>> best;', 'if (static_cast<int>(best.size()) > k) best.pop();', 'return best.top();'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

int kthLargest(const vector<int>& nums, int k) {
    priority_queue<int, vector<int>, greater<int>> best;
    for (int x : nums) {
        best.push(x);
        if (static_cast<int>(best.size()) > k) best.pop();
    }
    return best.top();
}`,
    time: 'O(n log k)', space: 'O(k)',
    traps: ['A max-heap of all n values costs more space.', 'Distinct kth largest is a different problem.', 'Quickselect gives average O(n) but has a trickier worst case.'],
    variations: ['Kth smallest', 'Streaming kth largest', 'Quickselect partition']
  }),
  q({
    id: 'top-k-frequent', title: 'Top K frequent elements', pattern: 'heap-greedy', difficulty: 'Medium', tier: 'core', minutes: 28,
    tracks: UPPER_TRACKS,
    prompt: 'Return any ordering of the k values occurring most frequently in an integer array.',
    example: '[1,1,1,2,2,3], k=2 → [1,2]',
    trigger: 'Frequency ranking plus only top k needed: frequency map then size-k min-heap.',
    idea: 'The heap stores the k highest-frequency candidates seen; the smallest frequency among winners is removed on overflow.',
    mnemonic: 'Count votes first, then keep only k candidates on the smallest-first podium.',
    steps: ['Build value → count map.', 'Push (count, value) for each distinct value.', 'Pop whenever heap size exceeds k.', 'Extract the remaining values.'],
    anchors: ['unordered_map<int, int> frequency;', 'heap.push({count, value});', 'if (static_cast<int>(heap.size()) > k) heap.pop();'],
    code: String.raw`#include <bits/stdc++.h>
using namespace std;

vector<int> topKFrequent(const vector<int>& nums, int k) {
    unordered_map<int, int> frequency;
    for (int x : nums) ++frequency[x];
    using Entry = pair<int, int>;
    priority_queue<Entry, vector<Entry>, greater<Entry>> heap;
    for (auto [value, count] : frequency) {
        heap.push({count, value});
        if (static_cast<int>(heap.size()) > k) heap.pop();
    }
    vector<int> answer;
    while (!heap.empty()) {
        answer.push_back(heap.top().second);
        heap.pop();
    }
    return answer;
}`,
    time: 'O(n + u log k), u distinct values', space: 'O(u + k)',
    traps: ['Pair order is (count, value), not the map’s (value, count).', 'Output order is unspecified unless requested.', 'Bucket sort can achieve O(n) when counts are bounded by n.'],
    variations: ['Top K words with tie-breaking', 'K closest points', 'Frequency sort']
  })
];
