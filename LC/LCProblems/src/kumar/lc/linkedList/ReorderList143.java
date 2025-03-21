package kumar.lc.linkedList;
/*
143. Reorder List
Solved
Medium
Topics
Companies
You are given the head of a singly linked-list. The list can be represented as:

L0 → L1 → … → Ln - 1 → Ln
Reorder the list to be on the following form:

L0 → Ln → L1 → Ln - 1 → L2 → Ln - 2 → …
You may not modify the values in the list's nodes. Only nodes themselves may be changed.



Example 1:


Input: head = [1,2,3,4]
Output: [1,4,2,3]
Example 2:


Input: head = [1,2,3,4,5]
Output: [1,5,2,4,3]


Constraints:

The number of nodes in the list is in the range [1, 5 * 104].
1 <= Node.val <= 1000
Time-O(n)
Space - O(1)
 */
public class ReorderList143 {
	public class ListNode {
		int val;
		ListNode next;
		ListNode() {}
		ListNode(int val) { this.val = val; }
		ListNode(int val, ListNode next) { this.val = val; this.next = next; }
	}
	public void reorderList(ListNode head) {
		if(head == null){
			return ;
		}
		//ListNode dummy = head;
		ListNode fast = head, slow = head, prev = null;
		while(fast != null && fast.next != null) {
			prev = slow;
			slow = slow.next;
			fast = fast.next.next;
		}
		if(fast != null) {
			prev = slow;
			slow = slow.next;
		}
		if(prev != null) {
			prev.next = null;
		}
		ListNode sec = reverse(slow);
		ListNode curr = head;
		ListNode dummy = new ListNode(-1);
		while(sec != null) {
			dummy.next = curr;
			curr = curr.next;
			dummy.next.next = sec;
			sec = sec.next;
			dummy = dummy.next.next;
		}
		dummy.next = curr;
		//return dummy.next;;
	}
	private ListNode reverse(ListNode node) {
		ListNode prev = null;
		ListNode curr = node;
		while(curr != null) {
			ListNode next = curr.next;
			curr.next = prev;
			prev = curr;
			curr = next;
		}
		return prev;
	}
}
