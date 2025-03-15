package kumar.lc.binarySearch;
/*
4. Median of Two Sorted Arrays
Solved
Hard
Topics
Companies
Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).

 

Example 1:

Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000
Explanation: merged array = [1,2,3] and median is 2.
Example 2:

Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.50000
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.
 

Constraints:

nums1.length == m
nums2.length == n
0 <= m <= 1000
0 <= n <= 1000
1 <= m + n <= 2000
-106 <= nums1[i], nums2[i] <= 106
Time Complexity - O(log(min(n1, n2))
Space Complexity = O(1)
*/
public class MedianOfTwoSortedArrays4 {
	public double findMedianSortedArrays(int[] nums1, int[] nums2) {
		 if(nums2.length < nums1.length) {
	            return findMedianSortedArrays(nums2, nums1);
	        }
        int total = nums1.length + nums2.length; // 1 2 3 4
        int half = (total + 1) / 2;
        int lo = Math.max(0, half - nums1.length), hi = Math.min(half, nums2.length);
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2; //number of elements in nums2
            int otherMid  = half - mid; // number of elements in nums1
            int l2 = mid-1 >= 0 ? nums2[mid-1] : Integer.MIN_VALUE;
            int r2 = mid < nums2.length ? nums2[mid] : Integer.MAX_VALUE;
            int l1 = otherMid - 1 >= 0 ? nums1[otherMid-1] : Integer.MIN_VALUE;
            int r1 = otherMid < nums1.length ? nums1[otherMid] : Integer.MAX_VALUE;
            if(l1 > r2) {
                lo = mid+1;
            } else if(l2 > r1) {
               hi = mid-1;
            } else {
                if(half+half == total) {
                    return (Math.max(l1, l2) + Math.min(r1, r2)) / (double) 2;
                } else{
                    return Math.max(l1, l2);
                }
            }
        }
        throw new IllegalArgumentException("Arrays not sorted");
    }
}
