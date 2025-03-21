package kumar.lc.graph;

import java.util.HashMap;
import java.util.Map;

/*
684. Redundant Connection
Solved
Medium
Topics
Companies
In this problem, a tree is an undirected graph that is connected and has no cycles.

You are given a graph that started as a tree with n nodes labeled from 1 to n, with one additional edge added. The added edge has two different vertices chosen from 1 to n, and was not an edge that already existed. The graph is represented as an array edges of length n where edges[i] = [ai, bi] indicates that there is an edge between nodes ai and bi in the graph.

Return an edge that can be removed so that the resulting graph is a tree of n nodes. If there are multiple answers, return the answer that occurs last in the input.

 

Example 1:


Input: edges = [[1,2],[1,3],[2,3]]
Output: [2,3]
Example 2:


Input: edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]
Output: [1,4]
TIme O (E alpha E) and not O( E log alpha E)XXXX
Space O(E)
 
 */
public class RedundantConnection684 {
    Map<Integer, Integer> parent = new HashMap<>();
    Map<Integer, Integer> rank = new HashMap<>();
    public int[] findRedundantConnection(int[][] edges) {
        
        for(int i = 1; i <= edges.length; i++) {
            parent.put(i, i);
            rank.put(i, 1);
        }
        for(int[] edg: edges) {
            int a = edg[0], b = edg[1];
            if(!union(a, b)) {
                return edg;
            }
        }
        return null;
    }
    private int find(int a) {
        if(parent.get(a) == a) {
            return a;
        }
        return find(parent.get(a));
    } 
    private boolean union(int a, int b) {
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
            rank.put(pa, ra+rb);
        }
        
        return true;
    }
}
