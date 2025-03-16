package kumar.lc.trees;

import java.util.LinkedList;
import java.util.Queue;

/*
Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.

Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.

Clarification: The input/output format is the same as how LeetCode serializes a binary tree. You do not necessarily need to follow this format, so please be creative and come up with different approaches yourself.



Example 1:


Input: root = [1,2,3,null,null,4,5]
Output: [1,2,3,null,null,4,5]
Example 2:

Input: root = []
Output: []


Constraints:

The number of nodes in the tree is in the range [0, 104].
-1000 <= Node.val <= 1000 
 */
public class SerializeandDeserializeBinaryTree297 {
	public class TreeNode {
		int val;
		TreeNode left;
		TreeNode right;
		TreeNode(int x) { val = x; }
	}

	private final String delimeter = ", ";
	private final String NULL = "NULL";
	// Encodes a tree to a single string.
	public String serialize(TreeNode root) {
		if(root == null) {
			return "";
		}
		Queue<TreeNode> q = new LinkedList<>();
		StringBuilder sb = new StringBuilder();
		q.offer(root);
		sb.append(root.val).append(delimeter);
		while(!q.isEmpty()) {
			TreeNode node = q.poll();           
			if(node.left != null) {
				sb.append(node.left.val).append(delimeter);
				q.offer(node.left);
			} else {
				sb.append(NULL).append(delimeter);
			}
			if(node.right != null) {
				sb.append(node.right.val).append(delimeter);
				q.offer(node.right);
			} else {
				sb.append(NULL).append(delimeter);
			}
		}
		sb.setLength(sb.length()-2);
		return sb.toString();
	}

	// Decodes your encoded data to tree.
	public TreeNode deserialize(String data) {
		if(data.isEmpty()) {
			return null;
		}
		String[] array = data.split(delimeter);       
		int index = 0;
		TreeNode root = createNode(array[index]);
		index++;
		Queue<TreeNode> q = new LinkedList<>();
		q.offer(root);
		while(!q.isEmpty()) {
			TreeNode curr = q.poll();
			curr.left = createNode(array[index]);
			if(curr.left != null) {
				q.offer(curr.left);
			}
			curr.right = createNode(array[index+1]);
			if(curr.right != null) {
				q.offer(curr.right);
			}
			index += 2;
		}
		return root;
	}
	private TreeNode createNode(String temp) {
		if(temp.equals(NULL)) {
			return null;
		}
		return new TreeNode(Integer.parseInt(temp));
	}

}
