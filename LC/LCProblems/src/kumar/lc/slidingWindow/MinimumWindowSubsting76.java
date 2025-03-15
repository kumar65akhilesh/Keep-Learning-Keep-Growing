package kumar.lc.slidingWindow;

import java.util.HashMap;
import java.util.Map;

/*
 76. Minimum Window Substring
Solved
Hard
Topics
Companies
Hint
Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string "".

The testcases will be generated such that the answer is unique.

 

Example 1:

Input: s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"
Explanation: The minimum window substring "BANC" includes 'A', 'B', and 'C' from string t.
Example 2:

Input: s = "a", t = "a"
Output: "a"
Explanation: The entire string s is the minimum window.
Example 3:

Input: s = "a", t = "aa"
Output: ""
Explanation: Both 'a's from t must be included in the window.
Since the largest window of s only has one 'a', return empty string.
 */

public class MinimumWindowSubsting76 {
	public String minWindow(String s, String t) {
        Map<Character, Integer> tMap = new HashMap<>();
        Map<Character, Integer> sMap = new HashMap<>();
        int bestLen = s.length() + 1;
        for (char ch : t.toCharArray()) {
            tMap.put(ch, tMap.getOrDefault(ch, 0) + 1);
        }
        int lo = 0, matched = 0;
        String ans = "";
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            sMap.put(ch, sMap.getOrDefault(ch, 0) + 1);
            if (sMap.get(ch).intValue() == tMap.getOrDefault(ch, -1).intValue()) {
                matched++;
            }
            while (lo <= i && matched == tMap.size()) {
                if (bestLen > (i - lo + 1)) {
                    bestLen = i - lo + 1;
                    ans = s.substring(lo, i + 1);
                }
                char prev = s.charAt(lo);
                sMap.put(prev, sMap.get(prev) - 1);
                if (sMap.get(prev).intValue() == tMap.getOrDefault(prev, -1).intValue() - 1) {
                    matched--;
                }
                if (sMap.get(prev) == 0) {
                    sMap.remove(prev);
                }
                lo++;
            }
        }
        return ans;
    }
}
