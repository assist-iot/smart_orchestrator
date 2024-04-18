FROM python:3.8-slim
RUN apt-get update -q \
  && apt-get install --no-install-recommends -qy python3-dev g++ gcc inetutils-ping \ 
  && pip3 install kopf kubernetes pint prometheus-api-client pymongo
COPY utils.py /utils.py
COPY multi-service.py /multi-service.py
CMD kopf run --standalone /multi-service.py
