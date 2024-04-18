FROM python:3.8
ENV PYTHONUNBUFFERED=1
RUN pip3 install kafka-python elasticsearch
COPY kafka-ltse.py /kafka-ltse.py
CMD python kafka-ltse.py
