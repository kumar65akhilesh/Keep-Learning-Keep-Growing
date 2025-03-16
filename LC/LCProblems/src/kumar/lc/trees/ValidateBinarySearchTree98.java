package kumar.lc.trees;
/*
Given the root of a binary tree, determine if it is a valid binary search tree (BST).

A valid BST is defined as follows:

The left subtree of a node contains only nodes with keys less than the node's key.
The right subtree of a node contains only nodes with keys greater than the node's key.
Both the left and right subtrees must also be binary search trees.
 

Example 1:


Input: root = [2,1,3]
Output: true
Example 2:


Input: root = [5,1,4,null,null,3,6]
Output: false
Explanation: The root node's value is 5 but its right child's value is 4.
 

Constraints:

The number of nodes in the tree is in the range [1, 104].
-231 <= Node.val <= 231 - 1
Time Complexity - O(n)
Space - O(n)
 */

import kumar.lc.trees.LowestCommonAncestorBST235.TreeNode;

public class ValidateBinarySearchTree98 {
	public class TreeNode {
		int val;
		TreeNode left;
		TreeNode right;
		TreeNode(int x) { val = x; }
	}
	public boolean isValidBST(TreeNode root) {
        return helper(root, Integer.MAX_VALUE+1L, Integer.MIN_VALUE-1L);
    }
    public boolean helper(TreeNode root, long max, long min) {
        if(root == null) {
            return true;
        }
        if(root.val >= max || root.val <= min) {
            return false;
        }
        return helper(root.left, root.val, min) && helper(root.right, max, root.val);
    }
}
