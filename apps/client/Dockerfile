# Global Arguments
ARG USER=node
ARG WORKSPACE=/app

ARG DOCKER_NODE_VERSION=18.17.0-slim
ARG DOCKER_UBUNTU_VERSION=jammy-20230624

# ========================== NODE STAGE ==========================
FROM node:${DOCKER_NODE_VERSION} AS node
# Copy all the required libraries for Node to run in a scratch container
RUN mkdir -p /node-deps/lib/x86_64-linux-gnu \
      /node-deps/usr/lib/x86_64-linux-gnu \
      /node-deps/lib64 \
    && ldd $(which node) \
      | grep '=>' \
      | awk '{ print $3 }' \
      | xargs -I '{}' cp -v '{}' /node-deps'{}'


# ========================== PACKAGES STAGE ==========================
FROM node:${DOCKER_NODE_VERSION} AS packages
ARG WORKSPACE
WORKDIR ${WORKSPACE}

COPY --chown=${USER}:${USER} ./packages/ ./packages
COPY --chown=${USER}:${USER} ./package*.json ./
RUN npm install -ws \
    && npm run build -ws


# ========================== BASE STAGE ==========================
FROM ubuntu:${DOCKER_UBUNTU_VERSION} AS base
ARG USER
ARG WORKSPACE

RUN apt-get update \
    && apt-get -qq install -y --no-install-recommends \
    # Install Tini for signal handling
    tini

# Copy Node/NPM binaries and libraries
COPY --from=node /usr/local/include/ /usr/local/include/
COPY --from=node /usr/local/lib/ /usr/local/lib/
COPY --from=node /usr/local/bin/ /usr/local/bin/

# Create user and workspace
RUN groupadd --gid 1000 ${USER} \
    && useradd --uid 1000 --gid ${USER} --shell /bin/bash --create-home ${USER} \
    && mkdir ${WORKSPACE} \
    && chown -R ${USER}:${USER} ${WORKSPACE}

USER ${USER}
WORKDIR ${WORKSPACE}

# Install production dependencies
COPY --from=packages --chown=${USER}:${USER} ${WORKSPACE}/packages/ ./packages
COPY --chown=${USER}:${USER} ./apps/client/package.json ./
COPY --chown=${USER}:${USER} ./package-lock.json ./
RUN npm install --omit=dev


# ========================== DEVELOPMENT STAGE ==========================
FROM base AS development
ENV NODE_ENV=development

# Install all dependencies
RUN npm install && npm cache clean --force

# Copy source code for cases where the image is run outside of a docker-compose environment
WORKDIR ${WORKSPACE}/client
COPY --chown=${USER}:${USER} ./apps/client .

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "run", "start:dev"]


# ========================== BUILD STAGE ==========================
FROM base AS build
WORKDIR ${WORKSPACE}/client
COPY --chown=${USER}:${USER} ./apps/client .
COPY --from=development --chown=${USER}:${USER} ${WORKSPACE}/node_modules/ ${WORKSPACE}/node_modules/
RUN rm -rf build/ \
    && npx tsc -p tsconfig.json \
    && rm -rf ${WORKSPACE}/node_modules/


# ========================== PRODUCTION STAGE ==========================
FROM scratch AS production
ARG WORKSPACE
WORKDIR ${WORKSPACE}

ENV NODE_ENV=production

# Copy Tini
COPY --from=base /usr/bin/tini /usr/bin/tini

# Copy necessary libraries to run Node in a scratch container
COPY --from=node /node-deps/ /
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /lib64/ld-linux-x86-64.so.2 /lib64/

# Copy build artifacts
COPY --from=build --chown=${USER}:${USER} ${WORKSPACE}/client/dist ${WORKSPACE}/client/dist

# Copy production dependencies
COPY --from=base --chown=${USER}:${USER} ${WORKSPACE}/node_modules ${WORKSPACE}/node_modules

# Copy production dependencies
COPY --from=base --chown=${USER}:${USER} ${WORKSPACE}/packages ${WORKSPACE}/packages

WORKDIR ${WORKSPACE}/client
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "./dist"]
