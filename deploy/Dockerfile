# This stage installs the runtime dependencies.
FROM node:19 AS build-runtime
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production --unsafe-perm

FROM node:19 AS build-app
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=build-runtime /usr/src/app/node_modules ./node_modules
RUN sed -i "s/^.*cypress.*$//" package.json
RUN npm install --no-audit --unsafe-perm
RUN apt update && apt install -y git
COPY .git ./.git
COPY src ./src
# copy static files for service worker to be populated correctly
COPY static ./static
COPY *.js ./
COPY *.json ./
COPY build.env ./.env
RUN echo "SESSION_SECRET=somethingreallynotsecret" >> .env
RUN npx svelte-kit sync
RUN npm run build

FROM node:19 AS app
WORKDIR /usr/src/app
RUN apt update && apt install -y lame vorbis-tools ghostscript timidity abcm2ps abcmidi pdftk-java
RUN mkdir bin/
RUN cp /usr/bin/abc2abc ./bin/
RUN cp /usr/bin/abc2midi ./bin/
RUN cp /usr/bin/abcm2ps ./bin/
RUN cp /usr/bin/lame ./bin/
RUN cp /usr/bin/oggenc ./bin/
RUN cp /usr/bin/pdftk ./bin/
RUN cp /usr/bin/ps2pdf ./bin/
RUN cp /usr/bin/timidity ./bin/
# Copy package.json to ensure "type":"module" is set
COPY --from=build-app /usr/src/app/package.json ./
COPY --from=build-app /usr/src/app/build ./build
COPY --from=build-app /usr/src/app/static ./static
COPY --from=build-runtime /usr/src/app/node_modules ./node_modules
