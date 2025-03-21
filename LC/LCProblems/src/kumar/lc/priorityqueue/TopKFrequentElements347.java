package kumar.lc.priorityqueue;

import java.util.HashMap;
import java.util.Map;

/*
347. Top K Frequent Elements
Solved
Medium
Topics
Companies
Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.

 

Example 1:

Input: nums = [1,1,1,2,2,3], k = 2
Output: [1,2]
Example 2:

Input: nums = [1], k = 1
Output: [1]
 

Constraints:

1 <= nums.length <= 105
-104 <= nums[i] <= 104
k is in the range [1, the number of unique elements in the array].
It is guaranteed that the answer is unique.
 

Follow up: Your algorithm's time complexity must be better than O(n log n), where n is the array's size.
Time- O(n)
Space O(1)
 */
public class TopKFrequentElements347 {
	private class Frequency {
        int num, count;

        Frequency(int n, int c) {
            num = n;
            count = c;
        }

    }

    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int num : nums) {
            map.put(num, map.getOrDefault(num, 0) + 1);
        }
        Frequency[] freq = new Frequency[map.size()];
        int p = 0;
        for (int num : map.keySet()) {
            freq[p++] = new Frequency(num, map.get(num));
        }
        quickSelect(freq, freq.length-k, 0, freq.length - 1);
        int[] ans = new int[k];
        for (int i = 0; i < k; i++) {
            ans[i] = freq[freq.length - i - 1].num;
        }
        return ans;
    }

    private void quickSelect(Frequency[] freq, int k, int lo, int hi) {
        if (lo > hi) {
            return;
        }
        int pos = partition(freq, lo, hi);
        if(pos == k) {
            return;
        } else if(pos < k) {
            quickSelect(freq, k, pos+1, hi);
        } else {
            quickSelect(freq, k, lo, pos-1);
        }
    }

    private int partition(Frequency[] freq, int lo, int hi) {
        int i = lo-1, j = lo;
        Frequency pivot = freq[hi];
        while(j < hi) {
            if(freq[j].count < pivot.count) {
                swap(freq, i+1, j);
                i++;
            }
            j++;
        }
        swap(freq, i+1, hi);
        return i+1;
    }

    private void swap(Frequency[] freq, int i, int j) {
        Frequency temp = freq[i];
        freq[i] = freq[j];
        freq[j] = temp;
    }
}
