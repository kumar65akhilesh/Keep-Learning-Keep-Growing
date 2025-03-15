package kumar.lc.DP_1D;
/*
152. Maximum Product Subarray
Solved
Medium
Topics
Companies
Given an integer array nums, find a subarray that has the largest product, and return the product.

The test cases are generated so that the answer will fit in a 32-bit integer.

 

Example 1:

Input: nums = [2,3,-2,4]
Output: 6
Explanation: [2,3] has the largest product 6.
Example 2:

Input: nums = [-2,0,-1]
Output: 0
Explanation: The result cannot be 2, because [-2,-1] is not a subarray.
 

Constraints:

1 <= nums.length <= 2 * 104
-10 <= nums[i] <= 10
The product of any subarray of nums is guaranteed to fit in a 32-bit integer.
 */
public class MaximumProductSubarray152 {
	 public int maxProduct(int[] nums) {
	        int min = nums[0], max = nums[0];
	        int best = nums[0];
	        for(int i = 1; i < nums.length; i++) {
	            int t1 = Math.min(Math.min(nums[i]*min, nums[i]*max), nums[i]);
	            int t2 = Math.max(Math.max(nums[i]*min, nums[i]*max), nums[i]);
	            min = t1;
	            max = t2;
	            best = Math.max(best, t2);
	        }
	        return best;
	    }
}
