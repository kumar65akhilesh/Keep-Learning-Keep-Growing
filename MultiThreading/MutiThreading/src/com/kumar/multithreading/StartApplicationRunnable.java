package com.kumar.multithreading;

public class StartApplicationRunnable {
	
	public static void main( String[] args) {
		Thread thread = new NewThread();
		thread.start();
	}
	
	private static class NewThread extends Thread {
		
		@Override
		public void run() {
			this.setName("Worker Thread");
			System.out.println("Hello from "+ this.getName());
			
		}
		
	}

}
