FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY ./database /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN /app/node_modules/.bin/tsc /app/manager/migrate.ts

FROM gcr.io/distroless/nodejs20-debian11

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/manager /app/manager

WORKDIR /app

CMD [ "manager/migrate.js", "--latest" ]
