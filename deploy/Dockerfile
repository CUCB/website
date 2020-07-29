FROM node:current
WORKDIR /usr/src/app
COPY package*.json ./
COPY node_modules ./node_modules/
RUN npm install
COPY src ./src/
COPY *.js ./
COPY build.env ./.env
RUN npm run build
