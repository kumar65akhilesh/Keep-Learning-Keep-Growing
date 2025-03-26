package kumar.lc.design;

import java.util.HashMap;
import java.util.Map;

/*
146. LRU Cache
Solved
Medium
Topics
Companies
Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:

LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
int get(int key) Return the value of the key if the key exists, otherwise return -1.
void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.
The functions get and put must each run in O(1) average time complexity.

 

Example 1:

Input
["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
Output
[null, null, null, 1, null, -1, null, -1, 3, 4]

Explanation
LRUCache lRUCache = new LRUCache(2);
lRUCache.put(1, 1); // cache is {1=1}
lRUCache.put(2, 2); // cache is {1=1, 2=2}
lRUCache.get(1);    // return 1
lRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}
lRUCache.get(2);    // returns -1 (not found)
lRUCache.put(4, 4); // LRU key was 1, evicts key 1, cache is {4=4, 3=3}
lRUCache.get(1);    // return -1 (not found)
lRUCache.get(3);    // return 3
lRUCache.get(4);    // return 4
 

Constraints:

1 <= capacity <= 3000
0 <= key <= 104
0 <= value <= 105
At most 2 * 105 calls will be made to get and put.
Time - get O(1), O(1)
Space O(n)

 */
public class LRUCache146 {
    private class ListNode {
        int key;
        int value;
        ListNode prev, next;

        ListNode(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private ListNode head, tail;
    Map<Integer, ListNode> map;
    int capacity;

    public LRUCache146(int capacity) {
        this.capacity = capacity;
        map = new HashMap<>();
    }

    public int get(int key) {
        if (!map.containsKey(key)) {
            return -1;
        }
        ListNode node = map.get(key);
        removeNode(node); // potentially update head and tail
        addToTail(node);// update head and tail
        return node.value;
    }

    private void addToTail(ListNode node) {
        if (tail == null) {
            tail = node;
            head = node;
        } else {
            tail.next = node;
            node.prev = tail;
            tail = node;
        }
    }

    private void removeNode(ListNode node) {
        if (node == null) {
            return;
        }
        ListNode prev = node.prev;
        ListNode next = node.next;
        if (prev == null) {
            head = next;
            if(head != null)
                head.prev = null;
        } else {
            prev.next = next;
        }
        if (next == null) {
            tail = prev;
            if(tail != null)
                tail.next = null;
        } else {
            next.prev = prev;
        }
        node.next = null;
        node.prev = null;
    }

    public void put(int key, int value) {
        if (!map.containsKey(key)) {
            map.put(key, new ListNode(key, value));
            addToTail(map.get(key));
            removeAndUpdateHeadAndTail();
            return;
        }
        ListNode node = map.get(key);
        node.value = value;
        removeNode(node);
        addToTail(node);
        removeAndUpdateHeadAndTail();
    }

    private void removeAndUpdateHeadAndTail() {
        if (map.size() > capacity) {
            ListNode node = head;
            removeNode(node);
            map.remove(node.key);
        }
    }
}
