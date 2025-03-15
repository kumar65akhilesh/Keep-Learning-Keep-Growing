package kumar.lc.slidingWindow;

import java.util.HashMap;
import java.util.Map;

/*
 424. Longest Repeating Character Replacement
Solved
Medium
Topics
Companies
You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most k times.

Return the length of the longest substring containing the same letter you can get after performing the above operations.

 

Example 1:

Input: s = "ABAB", k = 2
Output: 4
Explanation: Replace the two 'A's with two 'B's or vice versa.
Example 2:

Input: s = "AABABBA", k = 1
Output: 4
Explanation: Replace the one 'A' in the middle with 'B' and form "AABBBBA".
The substring "BBBB" has the longest repeating letters, which is 4.
There may exists other ways to achieve this answer too.
 */

public class LongestRepeatingCharacterReplacement424 {
	public int characterReplacement(String s, int k) {
        int lo = 0, hi = 0, max = 0, best = 0;
        Map<Character, Integer> map = new HashMap<>();
        for(int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);           
            map.put(ch, map.getOrDefault(ch, 0)+1);          
            max = Math.max(max, map.get(ch));
            if(i-lo+1-max > k) {
                char prev = s.charAt(lo);
                map.put(prev, map.get(prev)-1);
                lo++;
            } 
            //max = Math.max(max, map.get(ch));
            best = Math.max(best, i-lo+1);            
        }
        return best;
    }
}
