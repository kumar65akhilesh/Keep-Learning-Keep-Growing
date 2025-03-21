package kumar.lc.graph;

import java.util.HashMap;
import java.util.Map;
/*
323. Number of Connected Components in an Undirected Graph
Solved
Medium
Topics
Companies
You have a graph of n nodes. You are given an integer n and an array edges where edges[i] = [ai, bi] indicates that there is an edge between ai and bi in the graph.

Return the number of connected components in the graph.

 

Example 1:


Input: n = 5, edges = [[0,1],[1,2],[3,4]]
Output: 2
Example 2:


Input: n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]
Output: 1
 

Constraints:

1 <= n <= 2000
1 <= edges.length <= 5000
edges[i].length == 2
0 <= ai <= bi < n
ai != bi
There are no repeated edges.

Time - O(E alpha E)
Space - O(E)
 */
public class NumberOfConnectedComponentInGraph323 {
	Map<Integer, Integer> parent = new HashMap<>();
    Map<Integer, Integer> rank = new HashMap<>();
    public int countComponents(int n, int[][] edges) {
        for(int i = 0; i < n; i++) {
            parent.put(i, i);
            rank.put(i, 1);
        }
        int total = n;
        for(int[] edg: edges) {
            if(union(edg[0], edg[1])) {
                total--;
            }
        }
        return total;
    }
    private int find(int a) {
        if(parent.get(a) == a){
            return a;
        }
        return find(parent.get(a));
    }
    private boolean union(int a, int b) {
        int pa = find(a);
        int pb = find(b);
        if(pa == pb){
            return false;
        }
        int ra = rank.get(a);
        int rb = rank.get(b);
        if(ra > rb) {
            parent.put(pb, pa);
            rank.put(pa, ra+rb);
        } else{
            parent.put(pa, pb);
            rank.put(pb, ra+rb);
        }
        return true;
    }
}
