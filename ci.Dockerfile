FROM node:16.14
USER root
COPY . /home/node/app/
RUN chown -R node:node /home/node/app
USER node
