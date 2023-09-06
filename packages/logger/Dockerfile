ARG USER=node
ARG WORKSPACE=/app

ARG DOCKER_NODE_VERSION=18.17.0-slim

# ========================== BUILDER STAGE ==========================
FROM node:${DOCKER_NODE_VERSION} AS builder
ARG WORKSPACE

WORKDIR ${WORKSPACE}
COPY ./packages/logger/package.json ./
COPY ./package-lock.json ./
RUN npm install

WORKDIR ${WORKSPACE}/lib
COPY ./packages/logger ./
RUN npm run build:ts

CMD ["npm", "run", "build:ts:watch"]
