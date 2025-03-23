package kumar.lc.DP_2D;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
269. Alien Dictionary
Solved
Hard
Topics
Companies
There is a new alien language that uses the English alphabet. However, the order of the letters is unknown to you.

You are given a list of strings words from the alien language's dictionary. Now it is claimed that the strings in words are sorted lexicographically by the rules of this new language.

If this claim is incorrect, and the given arrangement of string in words cannot correspond to any order of letters, return "".

Otherwise, return a string of the unique letters in the new alien language sorted in lexicographically increasing order by the new language's rules. If there are multiple solutions, return any of them.

 

Example 1:

Input: words = ["wrt","wrf","er","ett","rftt"]
Output: "wertf"
Example 2:

Input: words = ["z","x"]
Output: "zx"
Example 3:

Input: words = ["z","x","z"]
Output: ""
Explanation: The order is invalid, so return "".
 

Constraints:

1 <= words.length <= 100
1 <= words[i].length <= 100
words[i] consists of only lowercase English letters.
Time - O(V+E)
Space - O(V+E)
 */

public class AlienDictionary269 {
	private class Node {
        char ch;
        int incoming;
        List<Node> neighbors;
        Node(char ch) {
            this.ch = ch;
            this.incoming = 0;
            this.neighbors = new ArrayList<>();
        }
        public void addEdge(char other) {
            Node otherNode = getNode(other);
            neighbors.add(otherNode);
            otherNode.incoming++;
        }
    }
    public Node getNode(char id) {
        if(!graph.containsKey(id)) {
            graph.put(id, new Node(id));
        }
        return graph.get(id);
    }
    private Map<Character, Node> graph = new HashMap<>();

    public String alienOrder(String[] words) {
        for(String word: words) {
            for(char ch: word.toCharArray()) {
                getNode(ch);
            }
        }
        for(int i = 0; i < words.length; i++) {
            for(int j = i+1; j < words.length; j++) {
                String word1 = words[i];
                String word2 = words[j];
                if(word1.length() > word2.length() && word1.startsWith(word2)) {
                    return "";
                }
                compareAddEdge(word1, word2);
            }
        }
        return runKahnsAlgo();
    }

    public String runKahnsAlgo() {
        Node[] list = new Node[graph.size()];
        int k = 0;
        StringBuilder sb = new StringBuilder();
        for(Node n: graph.values()) {
            if(n.incoming == 0) {
                sb.append(n.ch);
                list[k++] = n;
            }
        }
        
        for(int i = 0; i < list.length; i++) {
            Node x = list[i];
            if(x == null) {
                return "";
            }
            for(Node m: x.neighbors) {
                m.incoming--;
                if(m.incoming == 0) {
                    sb.append(m.ch);
                    list[k++] = m;
                }
            }
        }

        return sb.toString();
    }

    public void compareAddEdge(String s1, String s2) {
        int i = 0;
        for(i = 0; i < s1.length() && i < s2.length(); i++) {
            char ch1 = s1.charAt(i);
            char ch2 = s2.charAt(i);
            if(ch1 != ch2) {
                getNode(ch1).addEdge(ch2);
                break;
            }
        }
    }
}
