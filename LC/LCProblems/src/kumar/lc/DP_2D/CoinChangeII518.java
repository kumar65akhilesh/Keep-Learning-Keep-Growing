package kumar.lc.DP_2D;
/*
518. Coin Change II
Solved
Medium
Topics
Companies
You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.

Return the number of combinations that make up that amount. If that amount of money cannot be made up by any combination of the coins, return 0.

You may assume that you have an infinite number of each kind of coin.

The answer is guaranteed to fit into a signed 32-bit integer.

 

Example 1:

Input: amount = 5, coins = [1,2,5]
Output: 4
Explanation: there are four ways to make up the amount:
5=5
5=2+2+1
5=2+1+1+1
5=1+1+1+1+1
Example 2:

Input: amount = 3, coins = [2]
Output: 0
Explanation: the amount of 3 cannot be made up just with coins of 2.
Example 3:

Input: amount = 10, coins = [10]
Output: 1
 

Constraints:

1 <= coins.length <= 300
1 <= coins[i] <= 5000
All the values of coins are unique.
0 <= amount <= 5000
Time -O(mn)
Space - O(mn) can be optimized further
 */
public class CoinChangeII518 {
	public int change(int amount, int[] coins) {
        int[][] dp = new int[coins.length+1][amount+1];
        for(int i = 0; i < coins.length + 1; i++) {
            dp[i][0] = 1;
        }
        for(int i = 0; i < coins.length; i++) {
            for(int j = 1; j <= amount; j++) {
                int x = i + 1;
                int y = j;
                int amt = y - coins[i]; 
                dp[x][y] = dp[x-1][y];
                if(amt >= 0) {
                    dp[x][y] += dp[x][amt];
                }
            }
        }
        return dp[dp.length-1][dp[0].length-1];
    }
}
