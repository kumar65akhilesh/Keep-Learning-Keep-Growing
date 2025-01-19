package com.kumar.multithreading.interruption;

import java.math.BigInteger;

public class MainClass {
	
	public static void main(String[] args) throws InterruptedException {
		LongComputation compute = new LongComputation(new BigInteger("200000"), new BigInteger("1000000"));
		Thread thread = new Thread(compute);
		
		///Thread thread2 = new Thread(new LongComputation(new BigInteger("20000"), new BigInteger("100000000")));
		thread.setDaemon(true);
		thread.start();
		//thread.interrupt();
		//thread.join();
	}
}
