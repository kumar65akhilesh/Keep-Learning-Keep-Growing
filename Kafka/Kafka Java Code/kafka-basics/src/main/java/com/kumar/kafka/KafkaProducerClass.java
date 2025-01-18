package com.kumar.kafka;

import java.util.Properties;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KafkaProducerClass {
	
	private static final Logger log = LoggerFactory.getLogger(KafkaProducerClass.class.getSimpleName());
	public static void main(String[] args) {
		log.info("I am a Kafka Producer");
		
		//create Producer properties
		Properties properties = new Properties();
		properties.setProperty("bootstrap.servers", "127.0.0.1:9092");			
		properties.setProperty("key.serializer", StringSerializer.class.getName());
		properties.setProperty("value.serializer", StringSerializer.class.getName());
		
		//create producer
		KafkaProducer<String, String> producer = new KafkaProducer<>(properties);
		
		//send data
		ProducerRecord<String, String> producerRecord = new ProducerRecord<>("java_topic", "Hello Kafka from Java Program");
		producer.send(producerRecord);
		
		//flush and close producer synchronous operation
		producer.flush();
		producer.close();
	}
}
