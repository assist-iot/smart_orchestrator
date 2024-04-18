FROM python:3.8-slim
RUN apt-get update -q \
  && apt-get install --no-install-recommends -qy python3-dev g++ gcc inetutils-ping \ 
  && pip3 install kubernetes pint prometheus-api-client pandas flask pymongo peewee pymysql
COPY utils.py /utils.py
COPY api.py /api.py
COPY mongo.py /mongo.py
COPY mysql_conf.py /mysql_conf.py
CMD python api.py