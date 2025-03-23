package kumar.lc.DP_2D;
/*
 72. Edit Distance
Solved
Medium
Topics
Companies
Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.

You have the following three operations permitted on a word:

Insert a character
Delete a character
Replace a character
 

Example 1:

Input: word1 = "horse", word2 = "ros"
Output: 3
Explanation: 
horse -> rorse (replace 'h' with 'r')
rorse -> rose (remove 'r')
rose -> ros (remove 'e')
Example 2:

Input: word1 = "intention", word2 = "execution"
Output: 5
Explanation: 
intention -> inention (remove 't')
inention -> enention (replace 'i' with 'e')
enention -> exention (replace 'n' with 'x')
exention -> exection (replace 'n' with 'c')
exection -> execution (insert 'u')
 

Constraints:

0 <= word1.length, word2.length <= 500
word1 and word2 consist of lowercase English letters.
time - O(nm)
Space - O(nm)
 */
public class EditDistance72 {
    public int minDistance(String word1, String word2) {
        int[][] dp = new int[word1.length() + 1][word2.length() + 1];
        for (int j = 0; j <= word2.length(); j++) {
            dp[0][j] = j;
        }
        for (int i = 0; i <= word1.length(); i++) {
            dp[i][0] = i;
        }
        for (int i = 0; i < word1.length(); i++) {
            for (int j = 0; j < word2.length(); j++) {
                int x = i + 1, y = j + 1;
                char ch1 = word1.charAt(i);
                char ch2 = word2.charAt(j);
                dp[x][y] = Math.min(dp[x - 1][y]+1, dp[x][y - 1]+1);
                if (ch1 == ch2) {
                    dp[x][y] = Math.min(dp[x][y], dp[x - 1][y - 1] );
                } else {
                    dp[x][y] = Math.min(dp[x][y], dp[x - 1][y - 1] + 1);
                }
            }
        }
      
        return dp[dp.length - 1][dp[0].length - 1];
    }

}
