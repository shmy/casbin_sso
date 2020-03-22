FROM node:12.16.1-alpine

WORKDIR /opt/sso
COPY dist dist
COPY model.conf model.conf
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY .env .env
RUN npm install --production
EXPOSE 3000
CMD ["node", "dist/index.js"]
