package com.kumar.kafka;

import java.util.Properties;

import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.serialization.StringSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KafkaProducerWithCallBback {

	private static final Logger log = LoggerFactory.getLogger(KafkaProducerWithCallBback.class.getSimpleName());
	public static void main(String[] args) {
		log.info("I am a Kafka Producer");

		//create Producer properties
		Properties properties = new Properties();
		properties.setProperty("bootstrap.servers", "127.0.0.1:9092");			
		properties.setProperty("key.serializer", StringSerializer.class.getName());
		properties.setProperty("value.serializer", StringSerializer.class.getName());
		//properties.setProperty("batch.size", "400");

		//create producer
		KafkaProducer<String, String> producer = new KafkaProducer<>(properties);

		//send data
		for(int j = 0; j < 10; j++) {
			for(int i = 0; i< 30; i++) {
				ProducerRecord<String, String> producerRecord = new ProducerRecord<>("java_topic", "Hello Kafka from Java Program : Iteration number " + i);
				producer.send(producerRecord,  new Callback() {
					@Override
					public void onCompletion(RecordMetadata metadata, Exception e) {
						if(e == null) { //record successfully sent
							log.info("Received new metadata \n" 
									+ "Topic: " +metadata.topic() + "\n"
									+ "Partition: " +metadata.partition() +"\n"
									+ "Offset: " +metadata.offset() +"\n"
									+ "Timestamp: " +metadata.timestamp() );
						} else {
							log.error("Error while producing. ");
						}

					}

				});
			}
			try {
				Thread.sleep(500);
			} catch (InterruptedException e) {
				
				e.printStackTrace();
			}
		}
		//flush and close producer synchronous operation
		producer.flush();
		producer.close();
	}
}
