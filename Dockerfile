# Stage 1: Build
FROM node:22-alpine AS BUILD_PHASE
WORKDIR /app
COPY . .
RUN yarn install --check-files --frozen-lockfile
RUN yarn build

# Stage 2: Configuration
FROM node:22-alpine AS PRODUCTION_PHASE
WORKDIR /app

COPY --from=BUILD_PHASE /app/package.json ./
COPY --from=BUILD_PHASE /app/yarn.lock ./
COPY --from=BUILD_PHASE /app/dist ./
RUN yarn install --check-files --frozen-lockfile --production
RUN yarn cache clean --all

# Stage 3: Final Image 
FROM node:22-alpine
WORKDIR /app
COPY --from=PRODUCTION_PHASE /app .

# REST API port
EXPOSE 3005
# WebSocket port
EXPOSE 3006

CMD node .