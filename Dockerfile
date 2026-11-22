FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY server.mjs ./server.mjs

ENV NODE_ENV=production PORT=80
EXPOSE 80

CMD ["node", "server.mjs"]
