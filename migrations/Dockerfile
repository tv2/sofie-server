FROM node:22.6-alpine
WORKDIR /app
COPY . .

RUN yarn install --check-files --frozen-lockfile --production
RUN yarn cache clean --all
CMD ["yarn", "migrate"]
