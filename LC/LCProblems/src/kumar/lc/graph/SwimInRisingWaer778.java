package kumar.lc.graph;

import java.util.PriorityQueue;
/*
 778. Swim in Rising Water
Solved
Hard
Topics
Companies
Hint
You are given an n x n integer matrix grid where each value grid[i][j] represents the elevation at that point (i, j).

The rain starts to fall. At time t, the depth of the water everywhere is t. You can swim from a square to another 4-directionally adjacent square if and only if the elevation of both squares individually are at most t. You can swim infinite distances in zero time. Of course, you must stay within the boundaries of the grid during your swim.

Return the least time until you can reach the bottom right square (n - 1, n - 1) if you start at the top left square (0, 0).

 

Example 1:


Input: grid = [[0,2],[1,3]]
Output: 3
Explanation:
At time 0, you are in grid location (0, 0).
You cannot go anywhere else because 4-directionally adjacent neighbors have a higher elevation than t = 0.
You cannot reach point (1, 1) until time 3.
When the depth of water is 3, we can swim anywhere inside the grid.
Example 2:


Input: grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]
Output: 16
Explanation: The final route is shown.
We need to wait until time 16 so that (0, 0) and (4, 4) are connected.
 

Constraints:

n == grid.length
n == grid[i].length
1 <= n <= 50
0 <= grid[i][j] < n2
Each value grid[i][j] is unique.
Time - O(n^2logn)
Space - O(N^2)
 */

public class SwimInRisingWaer778 {
    private class Cell {
        int i, j, val;

        public Cell(int i, int j, int val) {
            this.i = i;
            this.j = j;
            this.val = val;
        }
    }

    public int swimInWater(int[][] grid) {
        PriorityQueue<Cell> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
        int[] dx = new int[] { 0, 0, 1, -1 };
        int[] dy = new int[] { -1, 1, 0, 0 };
        boolean[][] visited = new boolean[grid.length][grid[0].length];
        pq.offer(new Cell(0, 0, grid[0][0]));
        int max = grid[0][0];
        while (!pq.isEmpty()) {
            Cell cell = pq.poll();
            int i = cell.i, j = cell.j;
            if (visited[i][j]) {
                continue;
            }
            visited[i][j] = true;
            max = Math.max(max, grid[i][j]);
            if (i == grid.length - 1 && j == grid[0].length - 1) {
                return max;
            }
            for (int k = 0; k < 4; k++) {
                if (inBound(i + dx[k], j + dy[k], grid) && !visited[i + dx[k]][j + dy[k]]) {
                    pq.offer(new Cell(i + dx[k], j + dy[k], grid[i + dx[k]][j + dy[k]]));
                }
            }
        }
        return max;
    }

    public boolean inBound(int i, int j, int[][] grid) {
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) {
            return false;
        }
        return true;
    }
}
