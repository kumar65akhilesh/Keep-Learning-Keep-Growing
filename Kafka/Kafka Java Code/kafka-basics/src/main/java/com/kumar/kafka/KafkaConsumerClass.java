package com.kumar.kafka;

import java.time.Duration;
import java.util.Arrays;
import java.util.Properties;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KafkaConsumerClass {
	
	private static final Logger log = LoggerFactory.getLogger(KafkaConsumerClass.class.getSimpleName());
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
		
		//create consumer
		KafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);
		
		//subscribe to a topic
		consumer.subscribe(Arrays.asList(topic));
		
		//poll for data
		while(true) {
			log.info("Polling");
			ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
			for(ConsumerRecord<String, String> record: records) {
				log.info("Key: " + record.key() + " Value: " + record.value());
				log.info("Partition : " + record.partition() + " Offset: " + record.offset());
			}
		}
		
	}
}
