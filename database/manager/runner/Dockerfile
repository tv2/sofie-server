FROM node:slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY ./database /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --no-frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile
WORKDIR /app
RUN /app/node_modules/.bin/tsc /app/manager/migrate.ts

FROM gcr.io/distroless/nodejs20-debian11

COPY --from=build /app/schema /app/schema
COPY --from=build /app/manager /app/manager

WORKDIR /app

CMD [ "manager/migrate.js", "--latest"]
