package com.kumar.multithreading.race;

public class RaceCondition {

	public static void main(String[] args) throws InterruptedException {
		RaceCondition race = new RaceCondition();

		Inventory inventory = race.new Inventory(1000);
		Thread inc = new Thread(race.new IncrementingThread(inventory));
		Thread dec = new Thread(race.new DecrementingThread(inventory));
		inc.start();

		dec.start();
		inc.join();
		dec.join();
		System.out.println(inventory.getCount());
	}

	private class Inventory {
		private int count = 1000;

		public Inventory(int count) {
			this.count = count;
		}

		public int getCount() {
			return count;
		}

		public void increment() {
			synchronized(this) {
				this.count++;
			}
		}

		public synchronized void decrement() {
			synchronized(this) {
				this.count--;
			}
		}
	}

	private class IncrementingThread implements Runnable {

		private Inventory inventory;
		public IncrementingThread(Inventory inventory) {
			this.inventory = inventory;
		}

		@Override
		public void run() {
			// TODO Auto-generated method stub
			for(int i = 0; i< 1000; i++) {
				inventory.increment();
			}
		}


	}
	private class DecrementingThread implements Runnable {

		private Inventory inventory;
		public DecrementingThread(Inventory inventory) {
			this.inventory = inventory;
		}

		@Override
		public void run() {
			for(int i = 0; i< 1000; i++) {
				inventory.decrement();
			}
		}


	}
}
