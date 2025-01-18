package com.kumar.multithreading.Hacker;

public class DescendingThread extends HackerThread{
	
	public DescendingThread(Vault vault) {
		super(vault);
		this.setName("Descending Thread");
	}
	
	@Override
	public void run() {
		//this.setName("Ascending Thread");
		super.run();
		for(int i = Vault.MAX_NUM; i >= 0; i--) {
			try {
				if(vault.isPasswordCorrect(i)) {
					System.out.println("Password guessed by " + this.getName());
					System.exit(0);
				}
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
	}
}
