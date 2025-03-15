package kumar.lc.slidingWindow;

/*
 
42. Trapping Rain Water
Solved
Hard
Topics
Companies
Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

 

Example 1:


Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped.
Example 2:

Input: height = [4,2,0,3,2,5]
Output: 9
 

Constraints:

n == height.length
1 <= n <= 2 * 104
0 <= height[i] <= 105

Time Complexity - O(n)
Space Comlexity - O(1)
 */

public class TrappingRainWater42 {
	public int trap(int[] height) {
        int leftMax = 0, rightMax = 0;
        int lo = 0, hi = height.length-1, total = 0;
        while(lo < hi) {
            leftMax = Math.max(leftMax, height[lo]);
            rightMax = Math.max(rightMax, height[hi]);
            if(leftMax <= rightMax) {
                total += Math.min(leftMax, rightMax) - height[lo];
                lo++;
            } else {
                total += Math.min(leftMax, rightMax) - height[hi];
                hi--;
            }
        }
        return total;
    }
}
