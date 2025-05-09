package kumar.lc.maths;
/*
7. Reverse Integer
Solved
Medium
Topics
Companies
Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-231, 231 - 1], then return 0.

Assume the environment does not allow you to store 64-bit integers (signed or unsigned).

 

Example 1:

Input: x = 123
Output: 321
Example 2:

Input: x = -123
Output: -321
Example 3:

Input: x = 120
Output: 21
 

Constraints:

-231 <= x <= 231 - 1
Time Complexity - O(log(x))
 */
public class ReverseInteger7 {
	public int reverse(int x) {
        int result = 0;
        while(x != 0) {
            int num = x%10;
            x = x/10;
            if(result > Integer.MAX_VALUE/10 || result < Integer.MIN_VALUE/10) {
                return 0;
            } else if(result == Integer.MAX_VALUE/10 && num > Integer.MAX_VALUE%10) {
                return 0;
            } else if(result == Integer.MIN_VALUE/10 && num > Math.abs(Integer.MAX_VALUE%10)) {
                return 0;
            }
            result = result * 10 + num;
        }
        return result;
    }
}
