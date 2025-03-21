package kumar.lc.arraysAndHashMap;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/*
846. Hand of Straights
Solved
Medium
Topics
Companies
Alice has some number of cards and she wants to rearrange the cards into groups so that each group is of size groupSize, and consists of groupSize consecutive cards.

Given an integer array hand where hand[i] is the value written on the ith card and an integer groupSize, return true if she can rearrange the cards, or false otherwise.

 

Example 1:

Input: hand = [1,2,3,6,2,3,4,7,8], groupSize = 3
Output: true
Explanation: Alice's hand can be rearranged as [1,2,3],[2,3,4],[6,7,8]
Example 2:

Input: hand = [1,2,3,4,5], groupSize = 4
Output: false
Explanation: Alice's hand can not be rearranged into groups of 4.

 

Constraints:

1 <= hand.length <= 104
0 <= hand[i] <= 109
1 <= groupSize <= hand.length
 */
public class HandOfStraight846 {
	 public boolean isNStraightHand(int[] hand, int k) {
	        Map<Integer, Integer> map = new HashMap<>();
	        for(int h: hand) {
	            map.put(h, map.getOrDefault(h,0)+1);
	        }
	        while(map.size()  > 0) {
	            List<Integer> lst = new ArrayList<>();
	            for(int n: map.keySet()) {
	                if(!map.containsKey(n-1)) {
	                    for(int i=0; i< k; i++) {
	                        if(!map.containsKey(i+n)) {
	                            return false;
	                        }
	                        map.put(i+n, map.get(i+n)-1);
	                        if(map.get(i+n) == 0) {
	                            lst.add(i+n);
	                        }
	                    }
	                }
	            }
	            for(int a : lst){
	                map.remove(a);
	            }
	        }
	        return true;
	    }
}
