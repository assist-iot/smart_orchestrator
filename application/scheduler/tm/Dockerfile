#Deriving the latest base image
FROM pytorch/pytorch:latest

#Labels as key value pair
LABEL Maintainer="rreisim@upv.es"
# Any working directory can be chosen as per choice like '/' or '/home' etc

ENV TZ=Europe/Madrid
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ > /etc/timezone

# i have chosen /usr/app/src
WORKDIR /app

#to COPY the remote file at working directory in container
COPY . ./

ENV PYTHONUNBUFFERED=1

RUN apt-get update
RUN apt-get install python3-pip -y
RUN pip3 install -r requirements.txt

# configure the container to run in an executed manner
ENTRYPOINT [ "python3" ]

CMD ["main.py" ]
