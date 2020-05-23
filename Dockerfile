FROM node:14
COPY src/ package.json package-lock.json ./
RUN npm install
ENTRYPOINT ["npm", "run", "dev"]
