package kumar.lc.trees;

import java.util.HashMap;
import java.util.Map;

/*
105. Construct Binary Tree from Preorder and Inorder Traversal
Solved
Medium
Topics
Companies
Given two integer arrays preorder and inorder where preorder is the preorder traversal of a binary tree and inorder is the inorder traversal of the same tree, construct and return the binary tree.

 

Example 1:


Input: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
Output: [3,9,20,null,null,15,7]
Example 2:

Input: preorder = [-1], inorder = [-1]
Output: [-1]
 

Constraints:

1 <= preorder.length <= 3000
inorder.length == preorder.length
-3000 <= preorder[i], inorder[i] <= 3000
preorder and inorder consist of unique values.
Each value of inorder also appears in preorder.
preorder is guaranteed to be the preorder traversal of the tree.
inorder is guaranteed to be the inorder traversal of the tree.
 */

public class ConstructBinaryTreefromPreorderandInorderTraversal105 {
	public class TreeNode {
		int val;
		TreeNode left;
		TreeNode right;
		TreeNode(int x) { val = x; }
	}
	 public TreeNode buildTree(int[] preorder, int[] inorder) {
	        Map<Integer, Integer> iMap = new HashMap<>();
	        for (int i = 0; i < inorder.length; i++) {
	            iMap.put(inorder[i], i);
	        }
	        return helper(preorder, iMap, 0, inorder.length-1);
	    }
	    int index = 0;
	    private TreeNode helper(int[] preorder, Map<Integer,Integer> map, int lo, int hi) {
	        if(lo > hi) {
	            return null;
	        }
	        int val = preorder[index];
	        index++;
	        TreeNode root = new TreeNode(val);
	        
	        root.left = helper(preorder, map, lo, map.get(val)-1);
	        root.right = helper(preorder, map, map.get(val)+1, hi);
	        return root;
	    }
}
