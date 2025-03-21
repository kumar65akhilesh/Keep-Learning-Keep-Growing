package kumar.lc.DP_2D;
/*
200. Number of Islands
Solved
Medium
Topics
Companies
Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

 

Example 1:

Input: grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
Output: 1
Example 2:

Input: grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
Output: 3
 

Constraints:

m == grid.length
n == grid[i].length
1 <= m, n <= 300
grid[i][j] is '0' or '1'.
Time - O(nm)
Space - O(nm)
 */
public class NumberOfIslands200 {
	 public int numIslands(char[][] grid) {
	        boolean[][] visited = new boolean[grid.length][grid[0].length];
	        int total = 0;
	        for(int i = 0; i < grid.length; i++){ 
	            for(int j = 0; j < grid[0].length; j++) {
	                if(grid[i][j] == '1' && !visited[i][j]) {
	                    dfs(grid, i, j, visited);
	                    total++;
	                }
	            }
	        }
	        return total;
	    }
	    public void dfs(char[][] grid, int i, int j, boolean[][] visited) {
	        if(i < 0 || i >= grid.length || j < 0 || j >= grid[0].length || visited[i][j] || grid[i][j] == '0') {
	            return;
	        }
	        visited[i][j] = true;
	        dfs(grid, i-1, j, visited);
	        dfs(grid, i+1, j, visited);
	        dfs(grid, i, j-1, visited);
	        dfs(grid, i, j+1, visited);
	    }
}
