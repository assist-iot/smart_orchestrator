FROM node:14-alpine

WORKDIR /usr/src/api

COPY package*.json ./

RUN npm install --unsafe-perm

COPY . .

CMD [ "npm", "run", "start" ]
