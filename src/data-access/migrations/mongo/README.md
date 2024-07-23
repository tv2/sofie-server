# MongoDB migrations

Sofie server uses the library [migrate-mongo](https://www.npmjs.com/package/migrate-mongo) for running the migrations.
A migration consists of `up` and `down` methods, where `up` applies the migration and `down` rolls back the changes from `up`.

Below is a migration-template that contains the `up`' and `down` methods.
Both methods accepts two parameters: `db` and `client`.
`db` is the MongoDB Db class. `client` is the MongoDB MongoClient class.

To write the migration simply write a MongoDB Query: https://www.mongodb.com/docs/manual/query-api/

```typescript
import * as mongodb from 'mongodb'

export async function up(database: mongodb.Db, client: mongodb.MongoClient): Promise<void> {
   // Below is an example of the 'up' implementation
   await db.collection('executedRundowns').updateOne({ name: 'NYHEDERNE-TEST.SOFIE.RKLI' }, { $set: { name: 'Hello World' }})
}

export async function down(database: mongodb.Db, client: mongodb.MongoClient): Promise<void> {
   // Below is an example of the 'down' implementation
   await db.collection('executedRundowns').updateOne({ name: 'Hello World' }, { $set: { name: 'NYHEDERNE-TEST.SOFIE.RKLI' }})
}
```

The migrations are applied in alphanumeric order, so the migration name has the format `<timestamp>-<descriptive-name>.ts`.
A new migration can be created with `yarn create-migration <descriptive-name>`.
