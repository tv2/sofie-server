# Build phase
FROM node:18.19-alpine as BUILD_PHASE
WORKDIR /opt/sofie-server
COPY . .
RUN yarn install --check-files --frozen-lockfile
RUN yarn build

# Configuration phase
FROM node:18.19-alpine
WORKDIR /opt/sofie-server

COPY --from=BUILD_PHASE /opt/sofie-server/package.json ./
COPY --from=BUILD_PHASE /opt/sofie-server/yarn.lock ./
COPY --from=BUILD_PHASE /opt/sofie-server/dist ./
RUN yarn install --check-files --frozen-lockfile --production
RUN yarn cache clean --all

# REST API port
EXPOSE 3005
# WebSocket port
EXPOSE 3006

CMD node .
