package kumar.lc.slidingWindow;

import java.util.HashMap;
import java.util.Map;

/*
 567. Permutation in String
Solved
Medium
Topics
Companies
Hint
Given two strings s1 and s2, return true if s2 contains a permutation of s1, or false otherwise.

In other words, return true if one of s1's permutations is the substring of s2.

 

Example 1:

Input: s1 = "ab", s2 = "eidbaooo"
Output: true
Explanation: s2 contains one permutation of s1 ("ba").
Example 2:

Input: s1 = "ab", s2 = "eidboaoo"
Output: false
 

Constraints:

1 <= s1.length, s2.length <= 104
s1 and s2 consist of lowercase English letters.

Time Complexity - o(n + m)
Space Complexity -  o(n + m)
 */

public class PermutationInString567 {
	public boolean checkInclusion(String s1, String s2) {
        if (s2.length() < s1.length()) {
            return false;
        }
        Map<Character, Integer> map1 = new HashMap<>();
        Map<Character, Integer> map2 = new HashMap<>();
        for (int i = 0; i < s1.length(); i++) {
            char ch1 = s1.charAt(i);
            char ch2 = s2.charAt(i);
            map1.put(ch1, map1.getOrDefault(ch1, 0) + 1);
            map2.put(ch2, map2.getOrDefault(ch2, 0) + 1);
        }
        if (map1.equals(map2)) {
            return true;
        }
        for (int i = s1.length(); i < s2.length(); i++) {
            int j = i - s1.length();
            char ch1 = s2.charAt(j);
            char ch2 = s2.charAt(i);
            map2.put(ch1, map2.get(ch1) - 1);
            if (map2.get(ch1) == 0) {
                map2.remove(ch1);
            }
            map2.put(ch2, map2.getOrDefault(ch2, 0) + 1);
            if (map2.equals(map1)) {
                return true;
            }
        }
        return false;
    }
}
