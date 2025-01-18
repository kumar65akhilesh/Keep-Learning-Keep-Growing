package com.kumar.multithreading.Hacker;

public class PoliceThread extends Thread {
	
	@Override
	public void run() {
		this.setName("Police Thread");
		System.out.println("String thread:  " + this.getName());
		System.out.println("Catching all hackers in:  " );
		for(int i = 0; i < 10; i++) {
			System.out.println(i + " seconds ");
			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				
				e.printStackTrace();
			}
		}
		System.out.println("Game over for hackers ");
		System.exit(0);
	}

}
