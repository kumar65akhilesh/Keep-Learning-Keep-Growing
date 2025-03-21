package kumar.lc.graph;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Stack;

public class CourseSchedule210 {
	 class Course {
	        int id;
	        List<Course> neighbors;
	        int state = 0;// 0 = unvisited, 1 = visiting, 2 = visited
	        public Course(int id) {
	            this.id = id;
	            this.neighbors = new ArrayList<>();
	        }
	    }
	    Map<Integer, Course> courseList = new HashMap<>();
	    public int[] findOrder(int numCourses, int[][] prerequisites) {
	       
	        Stack<Integer> ordering = new Stack<>();
	        for(int i = 0; i < numCourses; i++) {
	            courseList.put(i, new Course(i));            
	        }
	        for(int[] pre: prerequisites) {
	            Course to = courseList.get(pre[0]);
	            Course from = courseList.get(pre[1]);
	            from.neighbors.add(to);
	        }
	        for(Course c: courseList.values()) {
	            if(c.state == 0) {
	                if(!dfs(c, ordering)) {
	                    return new int[0];
	                }
	            }
	        }
	        int[] ans = new int[ordering.size()];
	        int i = 0;
	        while(!ordering.isEmpty()) {
	            ans[i++] = ordering.pop();
	        }
	        return ans;
	    }
	    public boolean dfs(Course node, Stack<Integer> ordering) {
	        if(node.state == 1) {
	            return false;
	        }
	        if(node.state == 0) {
	            
	            node.state = 1;
	            for(Course nei: node.neighbors) {
	                if(!dfs(nei, ordering)) {
	                    return false;
	                }
	            }
	            ordering.push(node.id);
	            node.state = 2;
	        }
	        return true;
	    }
	    
	    
}
