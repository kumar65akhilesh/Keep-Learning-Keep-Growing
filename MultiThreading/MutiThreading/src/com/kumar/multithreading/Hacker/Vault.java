package com.kumar.multithreading.Hacker;

import java.util.Random;

public class Vault {
	
	public static final int MAX_NUM = 9999;
	private final int password;
	
	public  Vault() {
		Random rand = new Random();
		this.password = rand.nextInt(MAX_NUM);
		System.out.println(this.password);
	}

	public boolean isPasswordCorrect(int guess) throws InterruptedException {
		Thread.sleep(5);
		return guess == password;
	}
	
	
}
