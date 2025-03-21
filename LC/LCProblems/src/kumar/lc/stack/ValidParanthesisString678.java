package kumar.lc.stack;

import java.util.Stack;
/*
 678. Valid Parenthesis String
Solved
Medium
Topics
Companies
Hint
Given a string s containing only three types of characters: '(', ')' and '*', return true if s is valid.

The following rules define a valid string:

Any left parenthesis '(' must have a corresponding right parenthesis ')'.
Any right parenthesis ')' must have a corresponding left parenthesis '('.
Left parenthesis '(' must go before the corresponding right parenthesis ')'.
'*' could be treated as a single right parenthesis ')' or a single left parenthesis '(' or an empty string "".
 

Example 1:

Input: s = "()"
Output: true
Example 2:

Input: s = "(*)"
Output: true
Example 3:

Input: s = "(*))"
Output: true
 

Constraints:

1 <= s.length <= 100
s[i] is '(', ')' or '*'.
Time-O(n)
Space O(n)
 */
public class ValidParanthesisString678 {
    public boolean checkValidString(String s) {
        Stack<Integer> left = new Stack<>();
        Stack<Integer> asterick = new Stack<>();
        for(int i = 0; i < s.length(); i++) {
            if(s.charAt(i) == '(') {
                left.push(i);
            } else if (s.charAt(i) == '*') {
                asterick.push(i);
            } else {
                if(!left.isEmpty()) {
                    left.pop();
                } else if(!asterick.isEmpty()) {
                    asterick.pop();
                } else {
                    return false;
                }
            }
        }
        while(!left.isEmpty()) {
            int i1 = left.pop();
            if(asterick.isEmpty() || asterick.peek() < i1) {
                return false;
            } else {
                asterick.pop();
            }
        }
        return true;
    }
}
