package kumar.lc.trees;

/*
230. Kth Smallest Element in a BST
Solved
Medium
Topics
Companies
Hint
Given the root of a binary search tree, and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree.

 

Example 1:


Input: root = [3,1,4,null,2], k = 1
Output: 1
Example 2:


Input: root = [5,3,6,2,4,null,null,1], k = 3
Output: 3
 

Constraints:

The number of nodes in the tree is n.
1 <= k <= n <= 104
0 <= Node.val <= 104
 TIme Complexity O(h+k)
 Space = O(h)

Follow up: If the BST is modified often (i.e., we can do insert and delete operations) and you need to find the kth smallest frequently, how would you optimize?
 */

public class KthSmallestElementinBST703 {
	public class TreeNode {
		int val;
		TreeNode left;
		TreeNode right;
		TreeNode() {}
		TreeNode(int val) { this.val = val; }
		TreeNode(int val, TreeNode left, TreeNode right) {
			this.val = val;
			this.left = left;
			this.right = right;
		}
	}
	private class Result {
		int size, ans;
		boolean found;
		Result(int size, boolean found, int ans) {
			this.size= size;
			this.found = found;
			this.ans = ans;
		}
	}
	public int kthSmallest(TreeNode root, int k) {
		return helper(root, k).ans;
	}
	public Result helper(TreeNode root, int k) {
		if(root == null) {
			return new Result(0, false, -1);
		}
		Result left = helper(root.left, k);
		if(left.found) {
			return left;
		}
		if(left.size+1 == k) {
			return new Result(k, true, root.val);
		}

		Result right = helper(root.right, k - left.size - 1);
		if(right.found) {
			return right;
		}
		return new Result(left.size+right.size+1, false, -1);
	}
}
