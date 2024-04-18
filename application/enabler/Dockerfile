FROM node:14-alpine
# Create app directory
WORKDIR /usr/src/api

COPY package*.json ./

RUN npm install --unsafe-perm

COPY . .

CMD [ "npm", "run", "start" ]
