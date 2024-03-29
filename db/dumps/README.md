Goal
===
Transfer data from Meteor's MongoDB to a containerized instance of MongoDB.

Pre-requisites
===

- `tv-automation-server-core`
- `sofie-server`
- `docker`
- mongodb-tools for running cli commands

Steps
===
1.Obtain dump from tv-automation-server-core
Open a terminal and run the following commands:

```bash
cd tv-automation-server-core
yarn watch
```
Once the server is running, open second terminal and run the following command:

```bash
cd sofie-server/db/dumps
mongodump "mongodb://localhost:3001" --oplog --out=./meteor
```

this will create a dump of the database in the `meteor` sub-folder. In the next steps we'll use this to restore the database in our containerized MongoDB. Once restored - you can safely remove the `meteor` sub-folder.

2. Stop `tv-automation-server-core` - we don't need it anymore.
3. Open third terminal: :

```bash
cd sofie-server
yarn run start-database
```

Should start the database in a docker container. You can check the logs to see if it started correctly.

4. To restore the dump, return to your second terminal and run the following command:

```bash
mongorestore "mongodb://localhost:3001/?replicaSet=rs0" --oplogReplay ./meteor
```
or you can use:

```bash
yarn run seed-database
```


5. Once the restore is complete, you can inspect your database using a MongoDB client.

6. From that point on, you can start the server as usual:

```bash
cd sofie-server
yarn watch
```

Now you should have a working server with the database restored from the dump and sofie-server should be running off meteor.

Example of the sequence of commands:
```bash
docker ps -as
yarn run start-database
yarn run init-replica-set
yarn run seed-database
yarn run spy-database
```
output (node warnings omitted for clarity):
```bash
~/TV2/sofie-server SOF-1596/mongo-off-meteor* ❯ docker ps -as                                                                                                                                      15:08:49
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES     SIZE
~/TV2/sofie-server SOF-1596/mongo-off-meteor* ❯ yarn run start-database
$ npx ts-node ./db/manager/mongo.ts --start
starting mongo...
✨  Done in 1.10s.
~/TV2/sofie-server SOF-1596/mongo-off-meteor* ❯ yarn run init-replica-set
$ npx ts-node ./db/manager/mongo.ts --initrs
initializing replica set...
✨  Done in 1.67s.
~/TV2/sofie-server SOF-1596/mongo-off-meteor* ❯ yarn run seed-database
$ npx ts-node ./db/manager/mongo.ts --seed
seeding database...
✨  Done in 1.23s.
~/TV2/sofie-server SOF-1596/mongo-off-meteor* ❯ yarn run spy-database
$ npx ts-node ./db/manager/mongo.ts --spy
spying on the database...
```
