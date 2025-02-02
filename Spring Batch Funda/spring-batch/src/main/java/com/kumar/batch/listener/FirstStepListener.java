package com.kumar.batch.listener;

import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.StepExecutionListener;
import org.springframework.stereotype.Component;

@Component
public class FirstStepListener implements StepExecutionListener{

	@Override
	public void beforeStep(StepExecution stepExecution) {
		// TODO Auto-generated method stub
		System.out.println("Before Step " + stepExecution.getStepName());
		System.out.println("Job Execution Context " + stepExecution.getJobExecution().getExecutionContext());
		System.out.println("Step Execution Context " + stepExecution.getExecutionContext());
		stepExecution.getExecutionContext().put("STEP KEY", "STEP VALUE");
	}

	@Override
	public ExitStatus afterStep(StepExecution stepExecution) {
		// TODO Auto-generated method stub
		System.out.println("After Step " + stepExecution.getStepName());
		System.out.println("Job Execution Context " + stepExecution.getJobExecution().getExecutionContext());
		System.out.println("Step Execution Context " + stepExecution.getExecutionContext());
		return ExitStatus.COMPLETED;
	}

}
