package kumar.lc.linkedList;

import java.util.ArrayList;
import java.util.List;
/*
23. Merge k Sorted Lists
Solved
Hard
Topics
Companies
You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return it.

 

Example 1:

Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]
Explanation: The linked-lists are:
[
  1->4->5,
  1->3->4,
  2->6
]
merging them into one sorted list:
1->1->2->3->4->4->5->6
Example 2:

Input: lists = []
Output: []
Example 3:

Input: lists = [[]]
Output: []
 

Constraints:

k == lists.length
0 <= k <= 104
0 <= lists[i].length <= 500
-104 <= lists[i][j] <= 104
lists[i] is sorted in ascending order.
The sum of lists[i].length will not exceed 104.
Time - Onlogk
Space -O(n)
 */
public class MergeKSortedList23 {
	public class ListNode {
		int val;
		ListNode next;
		ListNode() {}
		ListNode(int val) { this.val = val; }
		ListNode(int val, ListNode next) { this.val = val; this.next = next; }
	}
	public ListNode mergeKLists(ListNode[] lists) {
		if(lists == null){
			return null;
		}
		List<ListNode> combined = new ArrayList<>();
		for (ListNode lst : lists) {
			if (lst != null) {
				combined.add(lst);
			}
		}
		while (combined.size() > 1) {
			List<ListNode> temp = new ArrayList<>();
			while (combined.size() > 1) {
				ListNode lst1 = combined.remove(combined.size() - 1);
				ListNode lst2 = combined.remove(combined.size() - 1);
				temp.add(merge(lst1, lst2));
			}
			combined.addAll(temp);
		}
		return combined.isEmpty() ? null : combined.get(0);
	}
	private ListNode merge(ListNode lst1, ListNode lst2) {
		ListNode dummy = new ListNode(-1);
		ListNode ret = dummy;
		while(lst1 != null && lst2 != null) {
			if(lst1.val <= lst2.val) {
				dummy.next = lst1;
				lst1 = lst1.next;
			} else {
				dummy.next = lst2;
				lst2 = lst2.next;
			}
			dummy = dummy.next;
		}
		dummy.next = lst1 == null ? lst2 : lst1;
		return ret.next;
	}
}
