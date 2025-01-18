package com.kumar.multithreading;

import java.util.List;

public class MultiExecutor {
	private List<Runnable> tasks;
	public MultiExecutor(List<Runnable> tasks) {
		// Complete your code here
		this.tasks = tasks;

	}

	/**
	 * Starts and executes all the tasks concurrently
	 */
	public void executeAll() {
		// complete your code here
		for(Runnable task: tasks) {
			task.run();
		}
	}
}