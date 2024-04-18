FROM python:3.8
ENV PYTHONUNBUFFERED=1
RUN pip3 install kafka-python paho-mqtt pyngsi
COPY kafka-ngsi.py /kafka-ngsi.py
CMD python kafka-ngsi.py
