# This stage installs the runtime dependencies.
FROM node:16.14-alpine AS build-runtime
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production --unsafe-perm

FROM node:16.14-alpine AS build-app
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=build-runtime /usr/src/app/node_modules ./node_modules
RUN sed -i "s/^.*cypress.*$//" package.json
RUN npm install --no-audit --unsafe-perm
COPY src ./src
# copy static files for service worker to be populated correctly
COPY static ./static
COPY *.js ./
COPY *.json ./
COPY build.env ./.env
RUN echo "SESSION_SECRET=somethingreallynotsecret" >> .env
RUN npx svelte-kit sync
RUN npm run build

FROM node:16.14 AS app
WORKDIR /usr/src/app
RUN apt update && apt install -y lame vorbis-tools ghostscript timidity abcm2ps abcmidi pdftk-java musl git
# Copy package.json to ensure "type":"module" is set
COPY --from=build-app /usr/src/app/package.json ./
COPY --from=build-app /usr/src/app/build ./build
COPY --from=build-app /usr/src/app/static ./static
COPY --from=build-runtime /usr/src/app/node_modules ./node_modules
