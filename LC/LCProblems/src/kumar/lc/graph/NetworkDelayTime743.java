package kumar.lc.graph;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
/*
743. Network Delay Time
Solved
Medium
Topics
Companies
Hint
You are given a network of n nodes, labeled from 1 to n. You are also given times, a list of travel times as directed edges times[i] = (ui, vi, wi), where ui is the source node, vi is the target node, and wi is the time it takes for a signal to travel from source to target.

We will send a signal from a given node k. Return the minimum time it takes for all the n nodes to receive the signal. If it is impossible for all the n nodes to receive the signal, return -1.

 

Example 1:


Input: times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2
Output: 2
Example 2:

Input: times = [[1,2,1]], n = 2, k = 1
Output: 1
Example 3:

Input: times = [[1,2,1]], n = 2, k = 2
Output: -1
 

Constraints:

1 <= k <= n <= 100
1 <= times.length <= 6000
times[i].length == 3
1 <= ui, vi <= n
ui != vi
0 <= wi <= 100
All the pairs (ui, vi) are unique. (i.e., no multiple edges.)
 */

public class NetworkDelayTime743 {
    private class Edge {
        int neighbor, weight;

        Edge(int neighbor, int weight) {
            this.neighbor = neighbor;
            this.weight = weight;
        }
    }

    private class Node {
        int id;
        List<Edge> adjList;

        public Node(int id) {
            this.id = id;
            adjList = new ArrayList<>();
        }
    }

    private Map<Integer, Node> graph = new HashMap<>();
    Map<Integer, Integer> distance = new HashMap<>();

    public int networkDelayTime(int[][] times, int n, int k) {
        for (int i = 0; i < n; i++) {
            graph.put(i + 1, new Node(i + 1));
            distance.put(i + 1, Integer.MAX_VALUE);
        }
        for (int[] time : times) {
            Node from = graph.get(time[0]);
            Edge edg = new Edge(time[1], time[2]);
            from.adjList.add(edg);
        }

        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[] { 0, k });
        distance.put(k, 0);
        Set<Integer> visited = new HashSet<>();
        // ATT 773-456-3846 - Mary(Acc No) mh3249@att.com,
        int best = -1;

        while (!pq.isEmpty()) {
            int[] pair = pq.poll();
            int node = pair[1];
            int dist = pair[0];
            if (distance.get(node) < dist) {
                continue;
            }
            visited.add(node);
            best = dist;
            Node no = graph.get(node);
            for (Edge nei : no.adjList) {
                if (!visited.contains(nei.neighbor) && dist + nei.weight < distance.get(nei.neighbor)) {
                    distance.put(nei.neighbor, dist + nei.weight);
                    pq.offer(new int[] { dist + nei.weight, nei.neighbor });
                }
            }
        }
        return visited.size() == graph.size() ? best : -1;
    }
}
