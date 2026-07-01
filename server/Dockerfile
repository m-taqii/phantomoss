FROM node:20-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --config.node-linker=hoisted

COPY . .

RUN pnpm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]