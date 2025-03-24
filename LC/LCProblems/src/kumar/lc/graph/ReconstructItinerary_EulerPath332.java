package kumar.lc.graph;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/*
 332. Reconstruct Itinerary
Solved
Hard
Topics
Companies
You are given a list of airline tickets where tickets[i] = [fromi, toi] represent the departure and the arrival airports of one flight. Reconstruct the itinerary in order and return it.

All of the tickets belong to a man who departs from "JFK", thus, the itinerary must begin with "JFK". If there are multiple valid itineraries, you should return the itinerary that has the smallest lexical order when read as a single string.

For example, the itinerary ["JFK", "LGA"] has a smaller lexical order than ["JFK", "LGB"].
You may assume all tickets form at least one valid itinerary. You must use all the tickets once and only once.

 

Example 1:


Input: tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]
Output: ["JFK","MUC","LHR","SFO","SJC"]
Example 2:


Input: tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]
Output: ["JFK","ATL","JFK","SFO","ATL","SFO"]
Explanation: Another possible reconstruction is ["JFK","SFO","ATL","JFK","ATL","SFO"] but it is larger in lexical order.
 

Constraints:

1 <= tickets.length <= 300
tickets[i].length == 2
fromi.length == 3
toi.length == 3
fromi and toi consist of uppercase English letters.
fromi != toi

Time - O(ELogE)
Space - O(V + E)
 */
public class ReconstructItinerary_EulerPath332 {
    private class Node {
        String city;
        List<Node> neighbors;

        public Node(String city) {
            this.city = city;
            neighbors = new ArrayList<>();
        }

        public void addEdge(String otherCity) {
            neighbors.add(getNode(otherCity));
        }
    }

    private Map<String, Node> graph = new HashMap<>();

    private Node getNode(String city) {
        if (!graph.containsKey(city)) {
            graph.put(city, new Node(city));
        }
        return graph.get(city);
    }

    public List<String> findItinerary(List<List<String>> tickets) {
        Collections.sort(tickets, (a, b) -> a.get(1).compareTo(b.get(1)));
        for (List<String> ticket : tickets) {
            String city1 = ticket.get(0);
            String city2 = ticket.get(1);
            getNode(city1).addEdge(city2);
        }
        List<String> result = new LinkedList<>();
        eulerPath(getNode("JFK"), result);
        return result;
    }

    public void eulerPath(Node node, List<String> result) {
        List<Node> children = node.neighbors;
        // result.add(node.city);
        while (children.size() > 0) {
            Node child = children.remove(0);
            eulerPath(child, result);
        }
        result.addFirst(node.city);
    }
}
