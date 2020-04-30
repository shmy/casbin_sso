FROM node:12.16.1-alpine

WORKDIR /opt/sso-server
COPY dist dist
COPY model.conf model.conf
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --production
EXPOSE 3000
ENTRYPOINT node dist/index.js
