package com.kumar.multithreading.Hacker;

public class AscendingThread extends HackerThread {
	
	
	
	AscendingThread(Vault vault) {
		
		super(vault);
		this.setName("Ascending Thread");
	}
	
	@Override
	public void run() {
		
		super.run();
		for(int i = 0; i < Vault.MAX_NUM; i++) {
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
