package com.kumar.multithreading.interruption;

import java.math.BigInteger;

public class LongComputation implements Runnable {
	BigInteger base;
	BigInteger power;
	
	LongComputation(BigInteger base, BigInteger power) {
		this.base = base;
		this.power = power;
	}

	@Override
	public void run() {
		// TODO Auto-generated method stub
		
		System.out.println(base + "^" + power + " = " + pow(base, power));
		
	}
	private BigInteger pow(BigInteger base, BigInteger power) {
        BigInteger result = BigInteger.ONE;

        for (BigInteger i = BigInteger.ZERO; i.compareTo(power) != 0; i = i.add(BigInteger.ONE)) {
			/*
			 * if(Thread.currentThread().isInterrupted()) { System.out.println(
			 * "Thread interrupted "); return BigInteger.ZERO; }
			 */
            result = result.multiply(base);
        }

        return result;
    }
}
