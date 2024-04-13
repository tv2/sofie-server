Goals
===

- *Mongo-off-Meteor*
>Transfer data from Meteor's MongoDB to a containerized instance of MongoDB then maintain and operate with it for the purpose of `sofie-server` project.
- *Migrations*
>Transform database (offline) by applying schema migration sets described in `schema` sub-folder.

Pre-requisites
===

- `tv-automation-server-core` codebase running
- `sofie-server` codebase running
- `docker` installed
- `ts-node` installed ( `yarn global add ts-node typescript` )
- mongodb-tools for running cli commands (optional)

# Mongo off Meteor
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

3. Open third terminal:

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

## Additional notes

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

# Migrations

## Running
Schema migrations are applied to the database by running the following command:

```bash
yarn run migrate-database
```
This command will search in `database/schema` folder for  sem-ver named sub-foders - i.e. `v0.0.1`, `v0.0.2`, `v.0.1.0` etc.,  and will pick latest/highest - in this example `v0.1.0`. Once the latest available version is identified, then a runner container will execute and apply  actual changes as described in this sub-folder content. 

## Migration
The content is a set of json files named after the collection  they represent. Each file contains an array of objects that represent the changes to be applied to the collection. The migration runner will apply these changes in the order they are found in the file. 

## Runner
All tasks for the job are provided in `runner:v1` docker image and at development time you have to rebuild the image, so that any chanes in the migration executor `database/manager/migrate.ts` are included, by running:

### Rebuilding the runner image
```bash
yarn run build-runner
```

Expected result can ve verified by running:

```bash
$ docker images                                                     15:27:07
REPOSITORY                        TAG         IMAGE ID       CREATED        SIZE
runner                            v1          b0ec896a6c11   4 hours ago    167MB
...
``` 

*note*: Changes in `database/schema` does not require rebuilding the runner image, only the `database/manager/migrate.ts` changes do. `schema` folder content is consumed at runtime as exported volume.

### Direct runner execution
If you want to run the migration directly, you can do so by running:

```bash
docker run --rm -v ./database/schema:/schema -e VERSION=v0.1.0 -e MONGODB_HOST=127.0.0.1 -e MONGODB_PORT=3001 runner:v1
```
This way you can go through all the stages and perform the migration process selectively as needed.

*note: MIRATION.md - contains more detailed information about the migration process and the structure of the migration data files.
