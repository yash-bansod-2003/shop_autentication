FROM node:24-alpine AS builder

WORKDIR /build

COPY package.json ./

RUN npm install --ignore-scripts

COPY . .

RUN npm run build

FROM node:24-alpine AS runner

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

ENV NODE_ENV=production

COPY --from=builder /build/package.json ./

RUN npm install --ignore-scripts --omit=dev \
  && npm uninstall bcrypt \
  && npm install bcrypt --ignore-scripts

COPY --from=builder /build/dist ./

EXPOSE 80

CMD [ "npm" , "start" ]