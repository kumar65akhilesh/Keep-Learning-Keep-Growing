package kumar.lc.graph;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/*
210. Course Schedule II
Solved
Medium
Topics
Companies
Hint
There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.

For example, the pair [0, 1], indicates that to take course 0 you have to first take course 1.
Return the ordering of courses you should take to finish all courses. If there are many valid answers, return any of them. If it is impossible to finish all courses, return an empty array.

 

Example 1:

Input: numCourses = 2, prerequisites = [[1,0]]
Output: [0,1]
Explanation: There are a total of 2 courses to take. To take course 1 you should have finished course 0. So the correct course order is [0,1].
Example 2:

Input: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
Output: [0,2,1,3]
Explanation: There are a total of 4 courses to take. To take course 3 you should have finished both courses 1 and 2. Both courses 1 and 2 should be taken after you finished course 0.
So one correct course order is [0,1,2,3]. Another correct ordering is [0,2,1,3].
Example 3:

Input: numCourses = 1, prerequisites = []
Output: [0]
 

Constraints:

1 <= numCourses <= 2000
0 <= prerequisites.length <= numCourses * (numCourses - 1)
prerequisites[i].length == 2
0 <= ai, bi < numCourses
ai != bi
All the pairs [ai, bi] are distinct.
Time- O(V+E)
Complexity - O(V+E)
 */
public class CourseSchedule210BFS {
	private class Course {
        int id;
        List<Course> neighbors;
        int incoming;

        Course(int id) {
            this.id = id;
            this.incoming = 0;
            this.neighbors = new ArrayList<>();
        }

        public void addEdge(int course2) {
            neighbors.add(getOrCreateNode(course2));
            getOrCreateNode(course2).incoming++;
        }
    }

    private Course getOrCreateNode(int id) {
        if (!graph.containsKey(id)) {
            graph.put(id, new Course(id));
        }
        return graph.get(id);
    }

    Map<Integer, Course> graph = new HashMap<>();

    public int[] findOrder(int numCourses, int[][] prerequisites) {
        for (int i = 0; i < numCourses; i++) {
            getOrCreateNode(i);
        }
        for (int[] edg : prerequisites) {
            Course src = getOrCreateNode(edg[1]);
            // Course dst = getOrCreateNode(edg[1]);
            src.addEdge(edg[0]);
        }
        Course[] courses = new Course[numCourses];
        int pos = 0;
        for (Course c : graph.values()) {
            if (c.incoming == 0) {
                courses[pos++] = c;
            }
        }
        for (int i = 0; i < courses.length; i++) {
            Course c = courses[i];
            if (c == null) {
                return new int[0];
            }
            for (Course nei : getOrCreateNode(c.id).neighbors) {
                nei.incoming--;
                if (nei.incoming == 0) {
                    courses[pos++] = nei;
                }
            }
        }
        int[] ans = new int[courses.length];
        for(int i = 0; i < courses.length; i++) {
            ans[i] = courses[i].id;
        }
        return ans;
    }
}
