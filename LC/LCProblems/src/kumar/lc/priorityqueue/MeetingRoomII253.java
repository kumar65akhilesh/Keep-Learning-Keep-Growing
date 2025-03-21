package kumar.lc.priorityqueue;

import java.util.Arrays;
import java.util.PriorityQueue;
/*
253. Meeting Rooms II
Solved
Medium
Topics
Companies
Hint
Given an array of meeting time intervals intervals where intervals[i] = [starti, endi], return the minimum number of conference rooms required.

 

Example 1:

Input: intervals = [[0,30],[5,10],[15,20]]
Output: 2
Example 2:

Input: intervals = [[7,10],[2,4]]
Output: 1
 

Constraints:

1 <= intervals.length <= 104
0 <= starti < endi <= 106
Time Complexity - Onlogn
Space = O(n)
 */
public class MeetingRoomII253 {
	public int minMeetingRooms(int[][] intervals) {
        int max = 0;
        Arrays.sort(intervals, (a,b) -> a[0]-b[0]);
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for(int i = 0; i < intervals.length; i++) {
            while(!pq.isEmpty() && pq.peek() <= intervals[i][0]) {
                pq.poll();
            }
            pq.offer(intervals[i][1]);
            max = Math.max(max, pq.size());
        }
        return max;
    }
}
