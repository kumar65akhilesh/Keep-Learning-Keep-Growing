package kumar.lc.DP_2D;
/*
97. Interleaving String
Solved
Medium
Topics
Companies
Given strings s1, s2, and s3, find whether s3 is formed by an interleaving of s1 and s2.

An interleaving of two strings s and t is a configuration where s and t are divided into n and m substrings respectively, such that:

s = s1 + s2 + ... + sn
t = t1 + t2 + ... + tm
|n - m| <= 1
The interleaving is s1 + t1 + s2 + t2 + s3 + t3 + ... or t1 + s1 + t2 + s2 + t3 + s3 + ...
Note: a + b is the concatenation of strings a and b.

 

Example 1:


Input: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"
Output: true
Explanation: One way to obtain s3 is:
Split s1 into s1 = "aa" + "bc" + "c", and s2 into s2 = "dbbc" + "a".
Interleaving the two splits, we get "aa" + "dbbc" + "bc" + "a" + "c" = "aadbbcbcac".
Since s3 can be obtained by interleaving s1 and s2, we return true.
Example 2:

Input: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"
Output: false
Explanation: Notice how it is impossible to interleave s2 with any other string to obtain s3.
Example 3:

Input: s1 = "", s2 = "", s3 = ""
Output: true
 

Constraints:

0 <= s1.length, s2.length <= 100
0 <= s3.length <= 200
s1, s2, and s3 consist of lowercase English letters.
 

Follow up: Could you solve it using only O(s2.length) additional memory space?
Time O(mn)
Space O(mn)
 */
public class InterleavingString97 {
    public boolean isInterleave(String s1, String s2, String s3) {
        if (s1.length() + s2.length() != s3.length()) {
            return false;
        }
        boolean[][] dp = new boolean[s1.length() + 1][s2.length() + 1];
        dp[0][0] = true;
        for(int i = 1; i <= s1.length(); i++) {
            if(s1.charAt(i-1) == s3.charAt(i-1)) {
                dp[i][0] = dp[i-1][0];
            }
        }
        for(int j = 1; j <= s2.length(); j++) {
            if(s2.charAt(j-1) == s3.charAt(j-1)) {
                dp[0][j] = dp[0][j-1];
            }
        }
        for (int i = 0; i < s1.length(); i++) {
            for (int j = 0; j < s2.length(); j++) {
                char ch1 = s1.charAt(i);
                char ch2 = s2.charAt(j);
                char ch3 = s3.charAt(i + j + 1);
                int x = i + 1, y = j + 1;
                if(ch1 == ch3) {
                    dp[x][y] = dp[x-1][y];
                } 
                if(ch2 == ch3) {
                    dp[x][y] |= dp[x][y-1];
                }
            }
        }
       // System.out.println(Arrays.deepToString(dp));
        return dp[dp.length-1][dp[0].length-1];
    }
}
