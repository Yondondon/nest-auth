ARG NODE_VERSION=22.13.0

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY tsconfig.json nest-cli.json ./

RUN npm ci

EXPOSE 3000

CMD npm run start:dev