package kumar.lc.maths;

/*
371. Sum of Two Integers
Solved
Medium
Topics
Companies
Given two integers a and b, return the sum of the two integers without using the operators + and -.

 

Example 1:

Input: a = 1, b = 2
Output: 3
Example 2:

Input: a = 2, b = 3
Output: 5
 

Constraints:

-1000 <= a, b <= 1000
Time Complexity - 
 */
public class SumOfTwoIntegers371 {
	public int getSum(int a, int b) {
        int carry = a;
        int sum = b;
        while(carry != 0) {
            int y = sum ^ carry;
            int x = ( sum & carry ) << 1;
            carry = x;
            sum = y;
        }
        return sum;
    }
}
