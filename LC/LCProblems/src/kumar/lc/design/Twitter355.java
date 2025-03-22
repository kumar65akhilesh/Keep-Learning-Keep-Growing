package kumar.lc.design;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

public class Twitter355 {
    private class Tweet {
        int id, time;

        Tweet(int id, int time) {
            this.id = id;
            this.time = time;
        }
    }

    private Map<Integer, Set<Integer>> friends;
    private Map<Integer, List<Tweet>> tweets;
    private int time;

    public Twitter355() {
        friends = new HashMap<>();
        tweets = new HashMap<>();
        time = 0;
    }

    public void postTweet(int userId, int tweetId) {
        if (!friends.containsKey(userId)) {
            friends.put(userId, new HashSet<>());
        }
        if (!tweets.containsKey(userId)) {
            tweets.put(userId, new LinkedList<>());
        }
        tweets.get(userId).addLast(new Tweet(tweetId, time++));
        if (tweets.get(userId).size() > 10) {
            tweets.get(userId).removeFirst();
        }
    }

    public List<Integer> getNewsFeed(int userId) {
        PriorityQueue<Tweet> pq = new PriorityQueue<>((a, b) -> a.time - b.time);
        if (tweets.get(userId) != null) {//missed
            for (Tweet tweet : tweets.get(userId)) {
                pq.offer(tweet);
            }
        }
        if (friends.get(userId) != null) {//missed
            for (int frndId : friends.get(userId)) {
                if (tweets.get(frndId) != null) { //missed
                    for (Tweet tweet : tweets.get(frndId)) {
                        pq.offer(tweet);
                        if (pq.size() > 10) {
                            pq.poll();
                        }
                    }
                }
            }
        }
        List<Integer> tweets = new LinkedList<>();
        while (!pq.isEmpty()) {
            tweets.addFirst(pq.poll().id);
        }
        return tweets;
    }

    public void follow(int followerId, int followeeId) {
        if (!friends.containsKey(followerId)) {
            friends.put(followerId, new HashSet<>());
        }
        if (!friends.containsKey(followeeId)) {
            friends.put(followeeId, new HashSet<>());
        }
        friends.get(followerId).add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        if (!friends.containsKey(followerId) || friends.get(followerId) == null) {
            return;
        }
        friends.get(followerId).remove(followeeId);
    }
}

/**
 * Your Twitter object will be instantiated and called as such:
 * Twitter obj = new Twitter();
 * obj.postTweet(userId,tweetId);
 * List<Integer> param_2 = obj.getNewsFeed(userId);
 * obj.follow(followerId,followeeId);
 * obj.unfollow(followerId,followeeId);
 */