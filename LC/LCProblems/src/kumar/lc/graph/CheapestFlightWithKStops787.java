package kumar.lc.graph;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

/*
787. Cheapest Flights Within K Stops
Solved
Medium
Topics
Companies
There are n cities connected by some number of flights. You are given an array flights where flights[i] = [fromi, toi, pricei] indicates that there is a flight from city fromi to city toi with cost pricei.

You are also given three integers src, dst, and k, return the cheapest price from src to dst with at most k stops. If there is no such route, return -1.

 

Example 1:


Input: n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1
Output: 700
Explanation:
The graph is shown above.
The optimal path with at most 1 stop from city 0 to 3 is marked in red and has cost 100 + 600 = 700.
Note that the path through cities [0,1,2,3] is cheaper but is invalid because it uses 2 stops.
Example 2:


Input: n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1
Output: 200
Explanation:
The graph is shown above.
The optimal path with at most 1 stop from city 0 to 2 is marked in red and has cost 100 + 100 = 200.
Example 3:


Input: n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0
Output: 500
Explanation:
The graph is shown above.
The optimal path with no stops from city 0 to 2 is marked in red and has cost 500.
 

Constraints:

1 <= n <= 100
0 <= flights.length <= (n * (n - 1) / 2)
flights[i].length == 3
0 <= fromi, toi < n
fromi != toi
1 <= pricei <= 104
There will not be any multiple flights between two cities.
0 <= src, dst, k < n
src != dst
Time - O(ElogE)
Space - O(v+E)
 */
public class CheapestFlightWithKStops787 {
	private class Edge {
        int otherEnd, weight;

        Edge(int otherEnd, int weight) {
            this.otherEnd = otherEnd;
            this.weight = weight;
        }
    }

    private class GraphNode {
        int id;
        List<Edge> adjList;

        public GraphNode(int id) {
            this.id = id;
            adjList = new ArrayList<>();
        }

        public void addEdge(int other, int weight) {
            adjList.add(new Edge(other, weight));
        }
    }

    private class Node {
        int id, dist, stops;

        Node(int id, int dist, int stops) {
            this.id = id;
            this.dist = dist;
            this.stops = stops;
        }
    }

    Map<Integer, GraphNode> graph = new HashMap<>();

    public GraphNode getNode(int i) {
        return graph.get(i);
    }

    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        Map<Integer, Integer> stops = new HashMap<>();
        //Set<Integer> visited = new HashSet<>();
        PriorityQueue<Node> pq = new PriorityQueue<>((a, b) -> a.dist - b.dist);
        pq.offer(new Node(src, 0, 0));
        for (int i = 0; i < n; i++) {
            graph.put(i, new GraphNode(i));
            stops.put(i, Integer.MAX_VALUE);
        }
        //distance.put(src, 0);
        for (int[] flight : flights) {
            int start = flight[0];
            getNode(start).addEdge(flight[1], flight[2]);
        }
        int best = Integer.MAX_VALUE;
        while(!pq.isEmpty()) {
            Node node = pq.poll();
            if(node.stops > k+1 || node.stops > stops.get(node.id)) {
                continue;
            }
            stops.put(node.id, node.stops);
            if(node.id==dst) {
                return node.dist;
            }
            for(Edge edg: graph.get(node.id).adjList) {
                int nei = edg.otherEnd;
                int weight = edg.weight;
                if(node.stops <= k ) {
                    pq.offer(new Node(nei, node.dist + weight, node.stops+1));
                }
            }
        }
        return -1;
    }
}
