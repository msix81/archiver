FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# install npm
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# install gpg if not already included
#RUN apt-get update && apt-get install gnupg

# Bundle app source
COPY . .

# install public key
RUN gpg --import public-key.gpg

EXPOSE 8080:8080

CMD [ "node", "index.js" ]