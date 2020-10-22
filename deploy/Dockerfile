FROM node:current
WORKDIR /usr/src/app
COPY package*.json ./
COPY node_modules ./node_modules/
RUN npm ci
COPY src ./src/
# copy static files for service worker to be populated correctly
COPY static ./static/
COPY *.js ./
COPY build.env ./.env
RUN npm run build
