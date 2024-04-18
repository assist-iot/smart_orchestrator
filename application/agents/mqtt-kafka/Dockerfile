FROM python:3.7
ENV PYTHONUNBUFFERED=1
RUN pip3 install kafka-python paho-mqtt
COPY mqtt-kafka.py /mqtt-kafka.py
CMD python mqtt-kafka.py
