FROM mhart/alpine-node:12 AS build-app
WORKDIR /usr/src/app
COPY package*.json ./
COPY node_modules ./node_modules/
RUN npm install --no-audit --unsafe-perm
COPY src ./src
# copy static files for service worker to be populated correctly
COPY static ./static
COPY *.js ./
COPY build.env ./.env
RUN npm run build

# This stage installs the runtime dependencies.
FROM mhart/alpine-node:12 AS build-runtime
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production --unsafe-perm

FROM mhart/alpine-node:slim-12 AS app
WORKDIR /usr/src/app
COPY --from=build-app /usr/src/app/__sapper__ ./__sapper__
COPY --from=build-app /usr/src/app/static ./static
COPY --from=build-runtime /usr/src/app/node_modules ./node_modules
