package com.kumar.kafka;

import java.util.Properties;

import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.serialization.StringSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KafkaProducerWithKeys {

	private static final Logger log = LoggerFactory.getLogger(KafkaProducerWithKeys.class.getSimpleName());
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

		for(int j = 0; j < 2; j++) {
			for(int i = 0; i< 10; i++) {

				String topic ="java_topic";
				String key = "id_"+i;
				String value = "hello world " + i;
				ProducerRecord<String, String> producerRecord = new ProducerRecord<>(topic, key, value);
				producer.send(producerRecord,  new Callback() {
					@Override
					public void onCompletion(RecordMetadata metadata, Exception e) {
						if(e == null) { //record successfully sent
							log.info("Received new metadata \n" 
									+ "Key: " + key  + "Partition: " +metadata.partition() +"\n"
									);
						} else {
							log.error("Error while producing. ");
						}

					}

				});
			}
		}

		//flush and close producer synchronous operation
		producer.flush();
		producer.close();
	}
}
