# Alba Server
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

Welcome to the Alba ecosystem. This is the central server for rundown execution and management.

## Requirements
- NodeJS >= 16.20
- Yarn
- A running MongoDB instance with an initialized replica set.
- Optional: Docker and Docker Compose

## Usage

### Building
The server can be built to JavaScript by:
1. Install dependencies with `yarn install`.
2. Build to the folder `/dist` with `yarn build`.
3. To start the built application, run `yarn start`.

> [!note]
> The project is intended to be run as a Docker container and is currently published to the [tv2media](https://hub.docker.com/repository/docker/tv2media/alba-server/general) space.

### Configuration
Configuration is done through environment variables:

| Variable               | Description                                                      | Example                                  |
|------------------------|------------------------------------------------------------------|------------------------------------------|
| `MONGO_URL`            | The connection URL to the MongoDB instance.                      | `MONGO_URL=mongodb://localhost:3001`     |
| `INEWS_HOST`           | The host and port for the REST API of the Sofie iNews Gateway.   | `INEWS_HOST=localhost:3007`              |
| `PLAYOUT_GATEWAY_HOST` | The host and port for the REST API of the Sofie Playout Gateway. | `PLAYOUT_GATEWAY_HOST=localhost:3009`    |
| `INEWS_GATEWAY_HOST`   | The websocket URL used to connect to the Alba iNews Gateway.     | `INEWS_GATEWAY_HOST=ws://localhost:3008` |

### Running with development server
You can start a development server with `yarn watch`.

### Running alongside Sofie
As Alba is being rewritten, based on Sofie, in chunks, it co-exists with Sofie and relies on Sofie for functionalities like rundown ingest and playout control. With time this will gradually be moved over to Alba.

The repository has a Docker compose setup for Sofie, which you need Docker and Docker compose in order to use.
For now, it is possible to start a Sofie instance by:

1. Starting a mongo database:
   1. Run `yarn start-database`.
   2. Wait til the Docker container is started.
   3. Run `yarn init-replica-set`
2. Start Sofie ecosystem by running `yarn start-sofie`. For more information see the [README for Sofie Docker Compose setup](./sofie-stack/README.md).

## Related projects

At TV 2 the Alba server is used in conjunction with the [Alba TV 2 server](https://github.com/tv2/alba-tv2-server) and the [Angular web client](https://github.com/tv2/alba-web-client).
All 3 applications are needed to run Alba at TV 2.