# Stage 1: Build
FROM node:24.11-alpine AS BUILD_PHASE
WORKDIR /app
COPY . .
RUN yarn install --check-files --frozen-lockfile
RUN yarn build

# Stage 2: Compose application with production dependencies
FROM node:24.11-alpine AS COMPOSE_PHASE
WORKDIR /app

COPY --from=BUILD_PHASE /app/package.json ./
COPY --from=BUILD_PHASE /app/yarn.lock ./
COPY --from=BUILD_PHASE /app/dist ./
RUN yarn install --check-files --frozen-lockfile --production
RUN yarn cache clean --all

# Stage 3: Final image
FROM node:24.11-alpine
WORKDIR /app
COPY --from=COMPOSE_PHASE /app .
RUN ln -s data-access/migrations/mongo/mongo-migrations

# REST API port
EXPOSE 3005
# WebSocket port
EXPOSE 3006

ARG GIT_REVISION
ENV GIT_REVISION=${GIT_REVISION}

ARG RELEASE_VERSION
ENV RELEASE_VERSION=${RELEASE_VERSION}

CMD node --no-deprecation .
