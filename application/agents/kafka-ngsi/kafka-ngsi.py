from datetime import datetime,timedelta

# import dateutil.relativedelta

from pyngsi.agent import NgsiAgent
from pyngsi.sources.source import Row
from pyngsi.sources.source_ftp import SourceFtp
from pyngsi.sources.source import Source
from pyngsi.sink import SinkStdout, SinkOrion
from pyngsi.ngsi import DataModel

import time
import json
import os
from kafka import KafkaConsumer


def build_entity(data):       
    current_milliseconds = int(time.time() * 1000)
    dateModified = str(current_milliseconds)
    cluster=data['cluster']
    enablerId = data['id']
    group = data['group']
    if group == "":
        pass
    else:
        group = f'urn:ngsi-ld:Group:{group}'

    enablerId = data['id']

    m = DataModel(id=f'urn:ngsi-ld:Enabler:{enablerId}:Cluster:{cluster}', type="Enabler") 
    m.add("refCluster", f'urn:ngsi-ld:Cluster:{cluster}')
    m.add("refGroup", group)
    m.add("status", data['status'])
    m.add("info", data['info'])

    m.add("timestamp", dateModified)
    
    return m

def process(data,orion_host, orion_port):

    sink = SinkOrion(orion_host,orion_port)

    dataJson = json.loads(data.decode('utf-8'))

    # Per month   
    print("Enabler -- ",dataJson['id'])
    print("Cluster -- ",dataJson['cluster'])
    print("status -- ",dataJson['status'])
    print("------------")
    entityEnabler = build_entity(dataJson)
    sink.write(entityEnabler.json()) 


def main():

    orion_host = os.getenv('ORION_HOST')
    orion_port = int(os.getenv('ORION_PORT'))
    kafka_bus = os.getenv('KAFKA_BUS')

    consumer = KafkaConsumer(bootstrap_servers=kafka_bus)
    consumer.subscribe('status')
    for message in consumer:
        print(message)

        print ("%s:%d:%d: key=%s value=%s" % (message.topic, message.partition,
                                            message.offset, message.key,
                                            message.value))

        process(message.value,orion_host,orion_port)

if __name__ == '__main__':
    main()
