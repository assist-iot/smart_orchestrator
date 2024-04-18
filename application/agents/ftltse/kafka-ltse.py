from datetime import datetime,timedelta

from elasticsearch import Elasticsearch
from elastic_transport import RequestsHttpNode
import json
import os
from kafka import KafkaConsumer

def process(data,es,ltse_index):

    response = es.index(index=ltse_index, body=data)

    if response['result'] == 'created':
        print('Documento insertado exitosamente en el índice:', ltse_index)
    else:
        print('Error al insertar el documento en el índice:', ltse_index)

def main():

    ltse_host = os.getenv('LTSE_HOST', 'localhost')
    ltse_port = os.getenv('LTSE_PORT', '30741')
    ltse_index_obm = os.getenv('LTSE_INDEX_OBM', 'obm')
    ltse_index_drivelet = os.getenv('LTSE_INDEX_DRIVELET', 'drivelet')
    kafka_bus = os.getenv('KAFKA_BUS', 'localhost:9092')

    es = Elasticsearch("http://"+ltse_host+":"+ltse_port+"/nosql/api")

    consumer = KafkaConsumer(bootstrap_servers=kafka_bus)

    consumer.subscribe('data')
    for message in consumer:
        print(message)
        print ("%s:%d:%d: key=%s value=%s" % (message.topic, message.partition,
                                            message.offset, message.key,
                                            message.value))
        
        dataJson = json.loads(message.value.decode('utf-8'))
        if dataJson["file_type"] == "OBM":
            process(message.value,es,ltse_index_obm)
        else:
            process(message.value,es,ltse_index_drivelet)


if __name__ == '__main__':
    main()
