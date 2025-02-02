package com.kumar.batch.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameter;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.kumar.batch.model.JobParamRequest;

//@Service
public class SecondJobScheduler {
	
	@Autowired
	JobLauncher jobLauncher;


	@Qualifier("secondJob")
	@Autowired
	Job secondJob;
	
	@Scheduled(cron = "0 0/1 * 1/1 * ?")
	public void secondJobStarter() {
		Map<String, JobParameter> params = new HashMap<>();
		params.put("currentTime", new JobParameter(System.currentTimeMillis()));
		/*
		 * jobParamRequest.stream().forEach((a) -> { params.put(a.getParamKey(), new
		 * JobParameter(a.getParamValue())); });
		 */
		JobParameters jobParameters = new JobParameters(params);
		try {
			
			
			JobExecution jobExecution = jobLauncher.run(secondJob, jobParameters);
			
			System.out.println("JOB EXECUTION ID " + jobExecution.getId());
		} catch (Exception e) {
			System.out.println("Exception while starting job");
		}
	}
}
