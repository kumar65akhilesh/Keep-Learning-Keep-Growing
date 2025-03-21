package kumar.lc.DP_2D;

import java.util.LinkedList;
import java.util.Queue;

/*
 286. Walls and Gates
Solved
Medium
Topics
Companies
You are given an m x n grid rooms initialized with these three possible values.

-1 A wall or an obstacle.
0 A gate.
INF Infinity means an empty room. We use the value 231 - 1 = 2147483647 to represent INF as you may assume that the distance to a gate is less than 2147483647.
Fill each empty room with the distance to its nearest gate. If it is impossible to reach a gate, it should be filled with INF.

 

Example 1:


Input: rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]
Output: [[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]
Example 2:

Input: rooms = [[-1]]
Output: [[-1]]
 

Constraints:

m == rooms.length
n == rooms[i].length
1 <= m, n <= 250
rooms[i][j] is -1, 0, or 231 - 1.
Time O(nm)
Space o(nm)
 */

public class WallsAndGates286 {
	private class Cell {
        int i;
        int j;

        Cell(int i, int j) {
            this.i = i;
            this.j = j;
        }
    }

    public void wallsAndGates(int[][] rooms) {
        Queue<Cell> q = new LinkedList<>();
        boolean[][] visited = new boolean[rooms.length][rooms[0].length];
        for (int i = 0; i < rooms.length; i++) {
            for (int j = 0; j < rooms[0].length; j++) {
                if (rooms[i][j] == 0) {
                    q.offer(new Cell(i, j));
                }
            }
        }
        int dist = -1;
        int[] dx = new int[] { 0, 0, 1, -1 };
        int[] dy = new int[] { 1, -1, 0, 0 };
        while (!q.isEmpty()) {
            int size = q.size();
            dist++;
            for (int i = 0; i < size; i++) {
                Cell cell = q.poll();
                int x = cell.i, y = cell.j;
                
                rooms[x][y] = dist;
                for(int k = 0; k < 4; k++) {
                    if(isInbound(rooms, x+dx[k], y+dy[k]) && rooms[x+dx[k]][y+dy[k]] == Integer.MAX_VALUE && !visited[x+dx[k]][y+dy[k]]) {
                        visited[x+dx[k]][y+dy[k]] = true;
                        
                        q.offer(new Cell(x+dx[k], y+dy[k]));
                    }
                }
            }
        }
    }

    private boolean isInbound(int[][] rooms, int i, int j) {
        if (i < 0 || i >= rooms.length || j < 0 || j >= rooms[0].length) {
            return false;
        }
        return true;
    }
}
