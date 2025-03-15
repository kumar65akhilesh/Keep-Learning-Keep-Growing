package kumar.lc.backtracking;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/*
90. Subsets II
Solved
Medium
Topics
Companies
Given an integer array nums that may contain duplicates, return all possible subsets (the power set).

The solution set must not contain duplicate subsets. Return the solution in any order.



Example 1:

Input: nums = [1,2,2]
Output: [[],[1],[1,2],[1,2,2],[2],[2,2]]
Example 2:

Input: nums = [0]
Output: [[],[0]]


Constraints:

1 <= nums.length <= 10
-10 <= nums[i] <= 10

Time Complexity - 

Recursion formula - T(n) = 2T(n-1) + O(n) 

At leaf nodes thr operation to add all the values is O(n) hence overall 

Time complexity is O(n2^n)
Space Complexity - O(n) - Used in recurive stack and array 
 */

public class SubsetSum2 {
	public List<List<Integer>> subsetsWithDup(int[] nums) {
		List<List<Integer>> result = new ArrayList<>();
		Arrays.sort(nums);
		helper(nums, 0, new ArrayList<>(), result);
		return result;
	}

	public void helper(int[] nums, int index, List<Integer> curr, List<List<Integer>> result) {
		if (index >= nums.length) {
			result.add(new ArrayList<>(curr));
			return;
		}
		curr.add(nums[index]);
		helper(nums, index + 1, curr, result);
		curr.remove(curr.size() - 1);
		while (index + 1 < nums.length && nums[index] == nums[index + 1]) {
			index++;
		}
		helper(nums, index + 1, curr, result);
	}
}
