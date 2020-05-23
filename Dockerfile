FROM node:14
RUN "cd /root/site"
RUN "npm install"
ENTRYPOINT ["npm", "run", "dev"]
