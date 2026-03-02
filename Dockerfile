ARG NODE_VERSION=22.13.0
FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

# TODO: to think how to avoid key signature mismatch and do not install corepack globally
RUN npm install -g corepack@latest \
 && corepack enable \
 && corepack prepare pnpm@10.30.3 --activate

COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json nest-cli.json ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm","run","start:dev"]