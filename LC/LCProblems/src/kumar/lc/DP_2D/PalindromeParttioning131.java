package kumar.lc.DP_2D;

import java.util.ArrayList;
import java.util.List;
/*
131. Palindrome Partitioning
Solved
Medium
Topics
Companies
Given a string s, partition s such that every substring of the partition is a palindrome. Return all possible palindrome partitioning of s.

 

Example 1:

Input: s = "aab"
Output: [["a","a","b"],["aa","b"]]
Example 2:

Input: s = "a"
Output: [["a"]]
 

Constraints:

1 <= s.length <= 16
s contains only lowercase English letters.
Time - 
Space - 
 */
public class PalindromeParttioning131 {
	 public List<List<String>> partition(String s) {
	        List<List<String>> result = new ArrayList<>();
	        Boolean[][] dp = new Boolean[s.length()][s.length()];
	        helper(s, 0, result, new ArrayList<>(), dp);
	        return result;
	    }
	    private void helper(String s, int start, List<List<String>> result, List<String> curr, Boolean[][] dp) {
	        if(start >= s.length()) {
	            result.add(new ArrayList<>(curr));
	            return;
	        }
	        for(int i = start+1; i <= s.length(); i++) {
	            if( (dp[start][i-1] != null && dp[start][i-1] == true ) || (dp[start][i-1] == null && isPlaindrome(s, start, i-1, dp))) {
	                curr.add(s.substring(start, i));
	                helper(s, i, result, curr, dp);
	                curr.remove(curr.size()-1);
	            }
	        }
	    }

	    private boolean isPlaindrome(String s, int i, int j, Boolean[][] dp) {
	        while (i < j) {
	            if (s.charAt(i) != s.charAt(j)) {
	                dp[i][j] = false;
	                return false;                
	            }
	            i++;
	            j--;
	        }
	        dp[i][j] = true;
	        return true;
	    }
}
