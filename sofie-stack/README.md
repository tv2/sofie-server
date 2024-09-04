# Running the Sofie stack in Docker containers.
The entire Sofie stack can be spun up as a Docker container with `yarn start`.
This will startup Sofie Core, Playout Gateway and iNews Gateway.

To spin up only Sofie Core: `yarn start sofie-core`

To spin up only Playout Gateway: `yarn start playout-gateway`

To spin up only iNews Gateway: `yarn start inews-gateway`

To spin up e.g. Sofie Core and Playout Gateway: `yarn start sofie-core playout-gateway`
