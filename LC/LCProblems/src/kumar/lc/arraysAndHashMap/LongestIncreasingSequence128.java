package kumar.lc.arraysAndHashMap;

import java.util.HashSet;
import java.util.LinkedList;
import java.util.Queue;
import java.util.Set;

/*
128. Longest Consecutive Sequence
Solved
Medium
Topics
Companies
Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.

You must write an algorithm that runs in O(n) time.

 

Example 1:

Input: nums = [100,4,200,1,3,2]
Output: 4
Explanation: The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.
Example 2:

Input: nums = [0,3,7,2,5,8,4,6,0,1]
Output: 9
Example 3:

Input: nums = [1,0,1,2]
Output: 3
 

Constraints:

0 <= nums.length <= 105
-109 <= nums[i] <= 109
Time - O(n)
Space - O(n)

 */
public class LongestIncreasingSequence128 {
	public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for(int i = 0; i < nums.length; i++) {
            set.add(nums[i]);
        }
        Queue<Integer> q = new LinkedList<>();
        for(int a : set) {
            if(!set.contains(a-1)) {
                q.offer(a);
            }
        }
        int max = 0;
        while(!q.isEmpty()) {
            int seed = q.poll();
            int len = 0;
            while(set.contains(seed)) {
                len++;
                seed++;
                max = Math.max(max, len);
            }
        }
        return max;
    }
}
