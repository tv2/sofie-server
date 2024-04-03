Goal
===

Transfer data from Meteor's MongoDB to a containerized instance of MongoDB then maintain and operate with it for the purpose of `sofie-server` project.

Pre-requisites
===

- `tv-automation-server-core` codebase running
- `sofie-server` codebase running
- `docker` installed
- `ts-node` installed ( `yarn global add ts-node typescript` )
- mongodb-tools for running cli commands (optional)

Steps
===

*note*: short example at the bottom of the page

1. Obtain dump from tv-automation-server-core

Open a terminal and run the following commands:

```bash
cd tv-automation-server-core
yarn watch
```
Once the server is running, open second terminal and run the following command:

```bash
cd sofie-server
yarn run dump-database
```
*note*: equivalent to the above command is:

```bash
cd sofie-server/db/dumps
mongodump "mongodb://localhost:3001" --oplog --out=./meteor
```

this will create a dump of the database in the `meteor` sub-folder (git excluded!). In the next steps we'll use this to restore the database in our containerized MongoDB. Once restored - you can safely remove the `meteor` sub-folder.

2. Stop `tv-automation-server-core` - we don't need it anymore.

3. Open third terminal: :

```bash
cd sofie-server
yarn run start-database
```

Should start the database in a docker container. You can check the logs to see if it started correctly.


4. Next step is to initialize the single node replica set:

```bash
yarn run init-replica-set
```

5. To restore the dump, return to your second terminal and run the following command:

```bash
yarn run seed-database
```

or you can use:

```bash
mongorestore "mongodb://localhost:3001/?replicaSet=rs0" --oplogReplay ./meteor
```

6. Once the restore is complete, you can inspect your database using a MongoDB client.

7. From that point on, you can start the server as usual:

```bash
cd sofie-server
yarn watch
```

Now you should have a working server with the database restored from the dump and sofie-server should be running off meteor.

Example of the sequence of commands:

```bash
# in terminal one
cd tv-automation-server-core
yarn watch
...
```

```bash
# in terminal two
cd sofie-server
yarn run dump-database
# now you can hit Ctrl-C in terminal one

ls -la db/dumps/meteor
# should contain:
# drwxr-xr-x    4 tv  staff   128 Mar 29 16:57 admin
# drwxr-xr-x   14 tv  staff   448 Mar 29 16:57 config
# drwxr-xr-x  106 tv  staff  3392 Mar 29 16:57 meteor
# -rw-r--r--    1 tv  staff   460 Mar 29 16:57 oplog.bson

docker ps -as
yarn run start-database
yarn run init-replica-set
yarn run seed-database
yarn run spy-database
```

Additional notes
===

Interoperability with `tv-automation-server-core` is preserved (Meteor will use containerized Mongo) by simply starting the `tv-automation-server-core` server with the following command:

```bash
MONGO_URL='mongodb://127.0.0.1:3001/meteor?replicaSet=rs0' MONGO_OPLOG_URL='mongodb://127.0.0.1:3001/local?replicaSet=rs0' yarn dev
```

or permanantly setting the `MONGO_URL` and `MONGO_OPLOG_URL` accordingly.

For Mac/Linux users, the `MONGO_URL` and `MONGO_OPLOG_URL` can be set by running the following commands in the terminal:

```bash
export MONGO_URL='mongodb://127.0.0.1:3001/meteor?replicaSet=rs0'
export MONGO_OPLOG_URL='mongodb://127.0.0.1:3001/local?replicaSet=rs0'
yarn dev
```

For Windows users, the `MONGO_URL` and `MONGO_OPLOG_URL` can be set by running the following commands in the terminal:

```bash
set MONGO_URL='mongodb://127.0.0.1:3001/meteor?replicaSet=rs0'
set MONGO_OPLOG_URL='mongodb://127.0.0.1:3001/local?replicaSet=rs0'
yarn dev
```

or for Powershell users:

```bash
$env:MONGO_URL='mongodb://127.0.0.1:3001/meteor?replicaSet=rs0'
$env:MONGO_OPLOG_URL='mongodb://127.0.0.1:3001/local?replicaSet=rs0'
yarn dev
```

This will work in the same terminal till you  close it. To make it permanent, you can set the environment variables in the system settings.
