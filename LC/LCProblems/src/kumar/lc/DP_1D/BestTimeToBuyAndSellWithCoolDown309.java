package kumar.lc.DP_1D;

import java.util.HashMap;
import java.util.Map;

/*
309. Best Time to Buy and Sell Stock with Cooldown
Solved
Medium
Topics
Companies
You are given an array prices where prices[i] is the price of a given stock on the ith day.

Find the maximum profit you can achieve. You may complete as many transactions as you like (i.e., buy one and sell one share of the stock multiple times) with the following restrictions:

After you sell your stock, you cannot buy stock on the next day (i.e., cooldown one day).
Note: You may not engage in multiple transactions simultaneously (i.e., you must sell the stock before you buy again).

 

Example 1:

Input: prices = [1,2,3,0,2]
Output: 3
Explanation: transactions = [buy, sell, cooldown, buy, sell]
Example 2:

Input: prices = [1]
Output: 0
 

Constraints:

1 <= prices.length <= 5000
0 <= prices[i] <= 1000 

Time - O(n)
Space - O(n)
 */
public class BestTimeToBuyAndSellWithCoolDown309 {
    public int maxProfit(int[] prices) {
        return helper(prices, 0, true, new HashMap());
    }

    private int helper(int[] prices, int index, boolean buy, Map<String, Integer> cache) {
        if (index >= prices.length) {
            return 0;
        }
        String key = index + " " + buy;
        if (cache.containsKey(key)) {
            return cache.get(key);
        }
        int max = 0;
        int option1 = helper(prices, index + 1, buy, cache);
        if (buy) {
            int option2 = -prices[index] + helper(prices, index + 1, !buy, cache);
            max = Math.max(option1, option2);
        } else {
            int option2 = prices[index] + helper(prices, index + 2, !buy, cache);
            max = Math.max(option1, option2);
        }
        cache.put(key, max);
        return max;
    }
}
