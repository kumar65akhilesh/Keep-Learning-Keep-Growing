package com.kumar.multithreading.atomic;

import java.util.Random;

public class AtomicMain {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		Metrics metrics = new Metrics();
		BusinessLogic businessLogicThread1 = new BusinessLogic(metrics);
		BusinessLogic businessLogicThread2 = new BusinessLogic(metrics);
		MetricPrinter metricPrinter = new MetricPrinter(metrics);
		businessLogicThread1.start();
		businessLogicThread2.start();
		metricPrinter.start();
	}

	public static class MetricPrinter extends Thread {

		private Metrics metrics;
		public MetricPrinter(Metrics metrics) {
			this.metrics = metrics;
		}
		@Override
		public void run() {
			while(true) {
				
				try {
					Thread.sleep(100);
				} catch (InterruptedException e) {
					
				}
				double currentAverage = metrics.getAverage();
				System.out.println("Current average is: " + currentAverage);
			}
		}
	}

	public static class BusinessLogic extends Thread {

		private Metrics metrics;
		private Random rand = new Random();
		public BusinessLogic(Metrics metrics) {
			this.metrics = metrics;
		}

		@Override
		public void run() {
			while(true) {
				long start = System.currentTimeMillis();
				try {
					Thread.sleep(rand.nextInt(10));
				} catch (InterruptedException e) {
				}
				long end = System.currentTimeMillis();
				metrics.addSample(end-start);
			}
		}
	}

	public static class Metrics {
		private long count = 0;
		private volatile double average = 0.0;

		public synchronized void addSample(long sample) {
			double currentSum = average * count;
			count++;
			average = (currentSum + sample) / count;
		}

		public double getAverage() { // since average is updated at only one place this works. Otherwise synchronized keyword is required
			return average;
		}
	}

}
