package kumar.lc.binarySearch;

/*
 34. Find First and Last Position of Element in Sorted Array
Solved
Medium
Topics
Companies
Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value.

If target is not found in the array, return [-1, -1].

You must write an algorithm with O(log n) runtime complexity.

 

Example 1:

Input: nums = [5,7,7,8,8,10], target = 8
Output: [3,4]
Example 2:

Input: nums = [5,7,7,8,8,10], target = 6
Output: [-1,-1]
Example 3:

Input: nums = [], target = 0
Output: [-1,-1]
 

Constraints:

0 <= nums.length <= 105
-109 <= nums[i] <= 109
nums is a non-decreasing array.
-109 <= target <= 109
Time - O(log n)
Space - O(1)
 */

public class FindFirstAndLastPositionOfElementInSortedArray34 {
	public int[] searchRange(int[] nums, int target) {
        int[] ans = new int[] { -1, -1 };
        int left = search(nums, target, true);
        if(left == -1) {
            return ans;
        } 
        int right = search(nums, target, false);
        ans[0] = left;
        ans[1] = right;
        return ans;
    }

    public int search(int[] nums, int target, boolean findFirst) {
        int ans = -1;
        int lo = 0;
        int hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) {
                ans = mid;
                if(findFirst) {
                    hi = mid -1;
                } else {
                    lo = mid + 1;
                }
            } else if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return ans;
    }
}
