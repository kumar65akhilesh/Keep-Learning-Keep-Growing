package kumar.lc.arraysAndHashMap;

import java.util.ArrayList;
import java.util.List;
/*
54. Spiral Matrix
Solved
Medium
Topics
Companies
Hint
Given an m x n matrix, return all elements of the matrix in spiral order.

 

Example 1:


Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]
Example 2:


Input: matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]
 

Constraints:

m == matrix.length
n == matrix[i].length
1 <= m, n <= 10
-100 <= matrix[i][j] <= 100
Time - O(nm)
Space - O(1)
 */
public class SpiralMatrix54 {
	public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> ans = new ArrayList<>();
        int left = 0, top = 0, bottom = matrix.length-1, right = matrix[0].length - 1;
        while(ans.size() < matrix.length * matrix[0].length) {
            for(int i = left; i <= right && ans.size() < matrix.length * matrix[0].length; i++) {
                ans.add(matrix[top][i]);
            }
            top++;
            for(int j = top; j <= bottom && ans.size() < matrix.length * matrix[0].length; j++) {
                ans.add(matrix[j][right]);
            }
            right--;
            for(int i = right; i >= left && ans.size() < matrix.length * matrix[0].length; i--) {
                ans.add(matrix[bottom][i]);
            }
            bottom--;
            for(int j = bottom; j >= top && ans.size() < matrix.length * matrix[0].length; j--) {
                ans.add(matrix[j][left]);
            }
            left++;
        }
        return ans;
    }
}
