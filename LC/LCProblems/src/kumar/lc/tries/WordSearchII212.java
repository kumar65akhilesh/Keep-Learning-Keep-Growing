package kumar.lc.tries;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
212. Word Search II
Solved
Hard
Topics
Companies
Hint
Given an m x n board of characters and a list of strings words, return all words on the board.

Each word must be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.

 

Example 1:


Input: board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]
Output: ["eat","oath"]
Example 2:


Input: board = [["a","b"],["c","d"]], words = ["abcb"]
Output: []
 

Constraints:

m == board.length
n == board[i].length
1 <= m, n <= 12
board[i][j] is a lowercase English letter.
1 <= words.length <= 3 * 104
1 <= words[i].length <= 10
words[i] consists of lowercase English letters.
All the strings of words are unique.
Time - 
Space - 
 */
public class WordSearchII212 {
	class Solution {
	    private class TrieNode {
	        char ch;
	        Map<Character, TrieNode> map;
	        boolean isLeaf = false;

	        TrieNode(char ch) {
	            this.ch = ch;
	            map = new HashMap<>();
	        }

	        public boolean find(String word, int index, List<String> result, TrieNode parent) {
	            if (index == word.length()) {
	                if (this.isLeaf) {
	                    result.add(word);
	                    isLeaf = false;
	                }
	                return true;
	            }
	            char curr = word.charAt(index);
	            if (!map.containsKey(curr)) {
	                return false;
	            }
	            TrieNode n = map.get(curr);
	            if (n.map.size() == 0) {
	                parent.map.remove(n.ch);
	            }
	            return n.find(word, index + 1, result, n);
	        }

	        public void insert(String word, int index) {
	            if (index == word.length()) {
	                this.isLeaf = true;
	                return;
	            }
	            char ch = word.charAt(index);
	            if (!map.containsKey(ch)) {
	                map.put(ch, new TrieNode(ch));
	            }
	            map.get(ch).insert(word, index + 1);
	        }
	    }

	    public List<String> findWords(char[][] board, String[] words) {
	        TrieNode root = new TrieNode('*');
	        List<String> result = new ArrayList<>();
	        for (String word : words) {
	            root.insert(word, 0);
	        }
	        int n = board.length;
	        int m = board[0].length;
	        for (int i = 0; i < board.length; i++) {
	            for (int j = 0; j < board[0].length; j++) {
	                dfs(board, i, j, root, result, new boolean[n][m], new StringBuilder());
	            }
	        }
	        return result;
	    }

	    int[] dx = new int[] { 0, 0, 1, -1 };
	    int[] dy = new int[] { 1, -1, 0, 0 };

	    private boolean dfs(char[][] board, int i, int j, TrieNode root, List<String> result, boolean[][] visited,
	            StringBuilder currWord) {
	        if (i < 0 || i >= board.length || j < 0 || j >= board[0].length || visited[i][j]) {
	            return false;
	        }
	        char ch = board[i][j];
	        currWord.append(ch);
	        visited[i][j] = true;
	        if (root.find(currWord.toString(), 0, result, root)) {
	            for (int k = 0; k < 4; k++) {
	                dfs(board, i + dx[k], j + dy[k], root, result, visited, currWord);
	            }
	        }
	        currWord.setLength(currWord.length() - 1);

	        visited[i][j] = false;
	        return true;
	    }
	}
}
