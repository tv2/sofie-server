Goal
===
Transfer data from Meteor's MongoDB to a containerized instance of MongoDB then maintain and operate with it for the purpose of `sofie-server` project.

Pre-requisites
===

- `tv-automation-server-core` codebase running
- `sofie-server` codebase running
- `docker` installed
- mongodb-tools for running cli commands (optional)

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
*note*: equivalent too the above command is `yarn run dump-database` from the `sofie-server` root folder. In this case you don't have to install mongotools for your distro.

this will create a dump of the database in the `meteor` sub-folder (git excluded!). In the next steps we'll use this to restore the database in our containerized MongoDB. Once restored - you can safely remove the `meteor` sub-folder.

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
