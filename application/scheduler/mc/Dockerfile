#Deriving the latest base image
FROM python:3.7

LABEL Maintainer="rreisim@upv.es"

# Define time zone
ENV TZ=Europe/Madrid
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Workdir chosen /usr/app/src
WORKDIR /usr/app/src

#to COPY the remote file at working directory in container
COPY . ./

RUN apt-get update
RUN apt-get install python3-pip -y

ENV PYTHONUNBUFFERED=1

# install the dependencies and packages in the requirements file
RUN pip3 install -r requirements.txt

#CMD instruction should be used to run the software
#contained by your image, along with any arguments.

CMD ["python3", "./main.py"]
