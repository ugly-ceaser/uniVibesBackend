# syntax=docker/dockerfile:1

FROM node:18-alpine3.17 AS base

WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl

# Copy prisma schema before installing packages so prisma generate works
COPY prisma ./prisma

COPY package.json package-lock.json* ./

# Override NODE_ENV for install so devDependencies like typescript get installed
RUN NODE_ENV=development npm install --include=dev

FROM base AS build
ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run build

FROM base AS production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server.js"]

