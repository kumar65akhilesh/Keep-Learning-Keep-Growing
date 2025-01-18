package com.kumar.multithreading.Hacker;

import java.util.ArrayList;
import java.util.List;

public class MainClass {
	public static void main(String[] args) {
		Vault vault = new Vault();
		List<Thread> allThreads = new ArrayList<>();
		allThreads.add(new AscendingThread(vault));
		allThreads.add(new DescendingThread(vault));
		allThreads.add(new PoliceThread());
		for(Thread t: allThreads) {
			t.start();
		}
	}
}
