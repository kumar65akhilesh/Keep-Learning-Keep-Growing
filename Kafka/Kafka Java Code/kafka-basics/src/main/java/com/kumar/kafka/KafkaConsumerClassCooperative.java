package com.kumar.kafka;

import java.time.Duration;
import java.util.Arrays;
import java.util.Properties;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.CooperativeStickyAssignor;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.errors.WakeupException;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KafkaConsumerClassCooperative {
	
	private static final Logger log = LoggerFactory.getLogger(KafkaConsumerClassCooperative.class.getSimpleName());
	public static void main(String[] args) {
		log.info("I am a Kafka Producer");
		
		String groupId = "my-java-application";
		String topic = "java_topic";
		//create Producer properties
		Properties properties = new Properties();
		properties.setProperty("bootstrap.servers", "127.0.0.1:9092");			
		properties.setProperty("key.deserializer", StringDeserializer.class.getName());
		properties.setProperty("value.deserializer", StringDeserializer.class.getName());
		properties.setProperty("group.id",groupId);
		properties.setProperty("auto.offset.reset", "earliest"); //"none/earliest/latest"
		properties.setProperty("partition.assignment.strategy", CooperativeStickyAssignor.class.getName());
		
		//create consumer
		KafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);
		
		final Thread mainThread = Thread.currentThread();
		
		Runtime.getRuntime().addShutdownHook(new Thread() {
			public void run() {
				log.info("Detected a shutdown, let's exit by calling consumer.wakeup()...");
				consumer.wakeup();
				
				//join the main thread to allow the execution of the code in main thread
				try {
					mainThread.join();
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
			}
		});
		
		
		try {
		//subscribe to a topic
		consumer.subscribe(Arrays.asList(topic));
		
		//poll for data
		while(true) {
			//log.info("Polling");
			ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
			for(ConsumerRecord<String, String> record: records) {
				log.info("Key: " + record.key() + " Value: " + record.value());
				log.info("Partition : " + record.partition() + " Offset: " + record.offset());
			}
		}
		} catch (WakeupException e) {
			log.info("Consumer is starting to shutdown");
		} catch (Exception e) {
			log.error("Unexpected exception in consumer ", e);
		} finally {
			consumer.close(); // closes and commits the offset
			log.info("Consumer is now gracefully shutdown");
		}
		
	}
}
