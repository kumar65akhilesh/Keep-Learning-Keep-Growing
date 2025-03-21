package kumar.lc.stack;

import java.util.Stack;

/*
 84. Largest Rectangle in Histogram
Solved
Hard
Topics
Companies
Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.

 

Example 1:


Input: heights = [2,1,5,6,2,3]
Output: 10
Explanation: The above is a histogram where width of each bar is 1.
The largest rectangle is shown in the red area, which has an area = 10 units.
Example 2:


Input: heights = [2,4]
Output: 4
 

Constraints:

1 <= heights.length <= 105
0 <= heights[i] <= 104
TimeO(n)
Space O(n)
 */
public class LargestRectangleHistogram84 {
	public int largestRectangleArea(int[] heights) {
        int max = 0;
        Stack<Integer> st = new Stack<>();
        int i = 0;
        for (i = 0; i < heights.length; i++) {
            int h = heights[i];
            while (!st.isEmpty() && heights[i] < heights[st.peek()]) {
                int prevHeight = heights[st.pop()];
                int previousIndex = st.isEmpty() ? -1 : st.peek();
                int width = i - previousIndex - 1;
                int area = width * prevHeight;
                max = Math.max(max, area);
            }
            st.push(i);
        }
        while (!st.isEmpty()) {
            int prevHeight = heights[st.pop()];
            int previousIndex = st.isEmpty() ? -1 : st.peek();
            int width = i - previousIndex - 1;
            int area = width * prevHeight;
            max = Math.max(max, area);
        }
        return max;
    }
}
