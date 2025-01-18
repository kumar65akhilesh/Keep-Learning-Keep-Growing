package com.kumar.multithreading;

public class StartApplication {
	public static void main(String[] args) throws InterruptedException {
		Thread thread = new Thread(new Runnable() {
			@Override
			public void run() {
				// TODO Auto-generated method stub
				System.out.println("We are now in thread " + Thread.currentThread().getName());
				System.out.println("We are now in thread " + Thread.currentThread().getPriority());
				throw new RuntimeException("Intentional exception");
			}			
		});
		thread.setName("Misbehaving thread");
		thread.setUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {

			@Override
			public void uncaughtException(Thread t, Throwable e) {
				// TODO Auto-generated method stub
				System.out.println("A critical error happened in the thread "+ t.getName());
			}
			
		}) ;
		thread.start();
		
		
	}
}
