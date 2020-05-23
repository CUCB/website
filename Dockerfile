FROM node:14
RUN "npm install"
ENTRYPOINT ["npm", "run", "dev"]
