package com.kumar.batch.config;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.configuration.annotation.JobBuilderFactory;
import org.springframework.batch.core.configuration.annotation.StepBuilderFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.launch.support.RunIdIncrementer;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.item.xml.StaxEventItemReader;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;
import org.springframework.core.io.FileSystemResource;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

import com.kumar.batch.listener.FirstJobListener;
import com.kumar.batch.listener.FirstStepListener;
import com.kumar.batch.model.StudentXml;
import com.kumar.batch.processor.FirstItemProcessor;
import com.kumar.batch.reader.FirstItemReader;
import com.kumar.batch.writer.FirstItemWriter;

@Configuration
public class SampleJob {

	@Autowired
	private JobBuilderFactory jobBuilderFactory;

	@Autowired
	private StepBuilderFactory stepBuilderFactory;
	
	@Autowired
	private FirstJobListener firstJobListener;
	
	@Autowired
	private FirstStepListener firstStepListenetr;
	
	
	@Autowired
	private FirstItemReader firstItemReader;
	
	@Autowired
	private FirstItemProcessor firstItemProcesor;
	
	@Autowired
	private FirstItemWriter firstItemWriter;

    @Bean
    Job secondJob() {
		return jobBuilderFactory.get("Second Job").
				incrementer(new RunIdIncrementer()).
				start(firstChunkStep()).
				//next(firstStep()).
				build();
	}

   // @Bean
    Job firstJob() {
		return jobBuilderFactory.get("First Job").
				incrementer(new RunIdIncrementer()).
				start(firstStep()).listener(firstJobListener).				
				build();
	}
    
    
    private Step firstChunkStep() {
    	return stepBuilderFactory.get("First Chunk Step").
    			<StudentXml, StudentXml>chunk(3).
    			//reader(firstItemReader).
    			reader(staxEventItemReader(null)).
    			//processor(firstItemProcesor).
    			writer(firstItemWriter).
    			build();
    	//C:\Users\kumar\Desktop\GitHub Repository Local\Spring Batch Funda\spring-batch\src\main\java\com\kumar\batch\config\SampleJob.java
    	//C:\Users\kumar\Desktop\GitHub Repository Local\Spring Batch Funda\spring-batch\src\main\resources\input files
    }
    
 
    
    @StepScope
	@Bean
	public StaxEventItemReader<StudentXml> staxEventItemReader(
			@Value("#{jobParameters['inputFile']}") FileSystemResource fileSystemResource) {
		StaxEventItemReader<StudentXml> staxEventItemReader = 
				new StaxEventItemReader<StudentXml>();
		
		staxEventItemReader.setResource(fileSystemResource);
		staxEventItemReader.setFragmentRootElementName("student");
		staxEventItemReader.setUnmarshaller(new Jaxb2Marshaller() {
			{
				setClassesToBeBound(StudentXml.class);
			}
		});
		
		return staxEventItemReader;
	}
	private Step firstStep() {
		return stepBuilderFactory.get("First Step").tasklet(firstTask()).listener(firstStepListenetr).build();
	}

	private Tasklet firstTask() {
		return new Tasklet() {
			
			@Override
			public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
				System.out.println("First tasklet");
				System.out.println(chunkContext.getStepContext().getJobExecutionContext());
				System.out.println("*************************" +chunkContext.getStepContext().getStepExecutionContext());
				return RepeatStatus.FINISHED;
			}

		};
	}
}
