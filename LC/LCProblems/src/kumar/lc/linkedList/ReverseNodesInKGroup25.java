package kumar.lc.linkedList;
/*
25. Reverse Nodes in k-Group
Solved
Hard
Topics
Companies
Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list.

k is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of k then left-out nodes, in the end, should remain as it is.

You may not alter the values in the list's nodes, only nodes themselves may be changed.

 

Example 1:


Input: head = [1,2,3,4,5], k = 2
Output: [2,1,4,3,5]
Example 2:


Input: head = [1,2,3,4,5], k = 3
Output: [3,2,1,4,5]
 

Constraints:

The number of nodes in the list is n.
1 <= k <= n <= 5000
0 <= Node.val <= 1000
 

Follow-up: Can you solve the problem in O(1) extra memory space?
Time - O(n)
Space - O(1)
 */
public class ReverseNodesInKGroup25 {
	public class ListNode {
		int val;
		ListNode next;
		ListNode() {}
		ListNode(int val) { this.val = val; }
		ListNode(int val, ListNode next) { this.val = val; this.next = next; }
	}
	private class HeadTailNext {
		ListNode head, tail, headNextGroup;
		int size = 0;

		HeadTailNext(ListNode head, ListNode tail, ListNode headNextGroup, int size) {
			this.head = head;
			this.tail = tail;
			this.headNextGroup = headNextGroup;
			this.size = size;
		}
	}

	public ListNode reverseKGroup(ListNode head, int k) {
		ListNode dummy = null;
		ListNode curr = head;
		ListNode prev = null;
		while (curr != null) {
			HeadTailNext temp = reverse(curr, k);
			ListNode tempHead = temp.head;
			ListNode tempTail = temp.tail;
			ListNode nextGroupHead = temp.headNextGroup;
			if (dummy == null) {
				dummy = tempHead;
			}
			if (temp.size < k) {
				temp = reverse(tempHead, k);
				tempHead = temp.head;
				tempTail = temp.tail;
				nextGroupHead = temp.headNextGroup;
			}
			if (prev != null) {
				prev.next = tempHead;
			}
			prev = tempTail;
			curr = nextGroupHead;
		}
		return dummy;
	}

	private HeadTailNext reverse(ListNode head, int k) {
		ListNode prev = null;
		ListNode curr = head;
		ListNode prevHead = head;
		int total = 0;
		for (int i = 0; i < k && curr != null; i++) {
			total++;
			ListNode next = curr.next;
			curr.next = prev;
			prev = curr;
			curr = next;
		}
		return new HeadTailNext(prev, prevHead, curr, total);
	}
}
