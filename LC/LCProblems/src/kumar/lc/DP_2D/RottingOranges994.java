package kumar.lc.DP_2D;

import java.util.LinkedList;
import java.util.Queue;

public class RottingOranges994 {
	private class Cell {
        int i, j;

        Cell(int i, int j) {
            this.i = i;
            this.j = j;
        }
    }

    public int orangesRotting(int[][] grid) {
        boolean[][] visited = new boolean[grid.length][grid[0].length];
        Queue<Cell> q = new LinkedList<>();
        int fresh = 0, total = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == 2) {
                    q.add(new Cell(i, j));
                }
                if (grid[i][j] == 1) {
                    fresh++;
                }
            }
        }
        if (fresh == 0) {
            return 0;
        }
        int time = -1;
        int[] dx = new int[] { 1, -1, 0, 0 };
        int[] dy = new int[] { 0, 0, 1, -1 };
        while (!q.isEmpty()) {
            int size = q.size();
            time++;
            for (int i = 0; i < size; i++) {
                Cell cell = q.poll();
                
                visited[cell.i][cell.j] = true;
                if (grid[cell.i][cell.j] == 1) {
                    //System.out.println(cell.i + " " + cell.j);
                    total++;
                }
                for (int k = 0; k < 4; k++) {
                    int x = cell.i + dx[k], y = cell.j + dy[k];
                    if (isInbound(grid, x, y) && !visited[x][y] && grid[x][y] == 1) {
                        visited[x][y] = true;
                        q.add(new Cell(x, y));
                    }
                }
            }
        }
        return total == fresh ? time : -1;
    }

    private boolean isInbound(int[][] grid, int i, int j) {
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) {
            return false;
        }
        return true;
    }
}
