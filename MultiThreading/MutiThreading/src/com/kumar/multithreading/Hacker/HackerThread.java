package com.kumar.multithreading.Hacker;

public class HackerThread extends Thread {
	protected Vault vault;
	HackerThread(Vault vault) {
		this.vault = vault;
		this.setPriority(Thread.MAX_PRIORITY);
	}
	@Override
	public void run() {
		System.out.println("Starting Hacker thread " + this.getName());
		//super.start();
	}
}
