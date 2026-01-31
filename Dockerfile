# build based on Node
FROM node:21

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# install npm
RUN npm install

# install gpg if not already included
# RUN apt-get update && apt-get install gnupg

# Bundle app source
COPY . .

# install public key
RUN gpg --import public-key.gpg

# default port to expose
EXPOSE 8080:8080

# start application
CMD [ "node", "index.js" ]