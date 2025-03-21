package kumar.lc.graph;

import java.util.HashMap;
import java.util.Map;

/*
261. Graph Valid Tree
Solved
Medium
Topics
Companies
Hint
You have a graph of n nodes labeled from 0 to n - 1. You are given an integer n and a list of edges where edges[i] = [ai, bi] indicates that there is an undirected edge between nodes ai and bi in the graph.

Return true if the edges of the given graph make up a valid tree, and false otherwise.

 

Example 1:


Input: n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Output: true
Example 2:


Input: n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Output: false
 

Constraints:

1 <= n <= 2000
0 <= edges.length <= 5000
edges[i].length == 2
0 <= ai, bi < n
ai != bi
There are no self-loops or repeated edges.
TIm- O(E alphaE)
Space O(E)
 */
public class GraphValidTree261 {
    Map<Integer, Integer> parent = new HashMap<>();
    Map<Integer, Integer> rank = new HashMap<>();
    public boolean validTree(int n, int[][] edges) {
        for(int i = 0; i < n; i++) {
            parent.put(i, i);
            rank.put(i, 1);
        }    
        for(int[] edg: edges) {
            if(!addEdge(edg[0], edg[1])) {
                return false;
            }
            n--;
        }    
        return n == 1;
    }
    private int find(int node) {
        if(parent.get(node) == node) {
            return node;
        }
        return find(parent.get(node));
    }
    private boolean addEdge(int a, int b) {
        int pa = find(a);
        int pb = find(b);
        if(pa == pb) {
            return false;
        }
        int ra = rank.get(a);
        int rb = rank.get(b);
        if(ra > rb) {
            parent.put(pb, pa);
            rank.put(pa, ra+rb);
        } else {
            parent.put(pa, pb);
            rank.put(pb, ra+rb);
        }
        return true;
    }
}
