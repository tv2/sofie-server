# Alba Server

Welcome to the Alba ecosystem. This is the central server for rundown execution and management.

## Requirements
- NodeJS >= 16.20
- Yarn
- Optional: Docker and Docker Compose

## Usage

### Building
The server can be built to JavaScript by:
1. Install dependencies with `yarn install`.
2. Build to the folder `/dist` with `yarn build`.

### Running with Sofie
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
All 3 services are needed to run Alba at TV 2.