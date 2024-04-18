import paho.mqtt.client as mqtt
from kafka import KafkaProducer,KafkaClient
from kafka.admin import KafkaAdminClient, NewTopic
import json
import uuid
import os 

print('Starting subscriber')
mqtt_broker = os.getenv('MQTT_BROKER')
mqtt_port= os.getenv('MQTT_PORT')
# mqtt_broker = "192.168.250.124"
# mqtt_port= "31883"

mqtt_client = mqtt.Client(f'mqtt-kafka-connector',clean_session=False)
mqtt_client.connect(mqtt_broker, port=int(mqtt_port))

kafka_bus = os.getenv('KAFKA_BUS')
# # kafka_bus = 'localhost:9092'
admin_client = KafkaClient(
    bootstrap_servers=kafka_bus,
    client_id = f'{uuid.uuid1()}',
    api_version=(0, 9)
)

producer = KafkaProducer(bootstrap_servers=kafka_bus,value_serializer=lambda m: json.dumps(m).encode('ascii'))

def validateJson(message):
    try:
        msg_payload = json.loads(message.payload.decode("utf-8"))
        if type(msg_payload) == list:
            raise False
    except:
        return False
    
    return msg_payload

def validateRaw(message):
    try:
        messageRaw = message.payload.decode("utf-8").replace("="," ").split(";")
        msg_payload = dict()
        for sub in messageRaw:
            key, val = sub.split()

            if val.isnumeric():
                msg_payload[key] = int(val)
            elif val.replace('.', '', 1).isdigit():
                msg_payload[key] = float(val)
            elif val.lstrip('-').replace('.', '', 1).isdigit():
                msg_payload[key] = float(val)
            else:
                msg_payload[key] = str(val)
    except:
        return False
    
    return msg_payload

def on_message(client, userdata, message):
    validatedJson = validateJson(message)
    if  validatedJson is not False:
        print("Received MQTT message: ", validatedJson)
        producer.send(message.topic, validatedJson)
        print("KAFKA: Just published " + str(validatedJson) + " to topic " + message.topic)
    else:
        validatedRaw = validateRaw(message)
        if  validatedRaw is not False:
            print("Received MQTT message: ", validatedRaw)
            producer.send(message.topic, validatedRaw)
            print("KAFKA: Just published " + str(validatedRaw) + " to topic " + message.topic)
        else: 
            print('The data format is not correct')
            return

mqtt_client.subscribe("$share/ford/status/#",2)
mqtt_client.subscribe("$share/ford/data/#",2)
mqtt_client.on_message = on_message
mqtt_client.loop_forever()