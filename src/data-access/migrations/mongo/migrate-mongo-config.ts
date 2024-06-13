// In this file you can configure migrate-mongo

const MONGO_CONNECTION_STRING: string = process.env.MONGO_URL ?? 'mongodb://localhost:3001'
const MONGO_DB_NAME: string = getMongoDatabaseName()

function getMongoDatabaseName(): string {
  const mongoUrlPattern: RegExp = /^mongodb:\/\/\w+(:\d+)?\/(?<databaseName>[^/]+)/i
  return mongoUrlPattern.exec(MONGO_CONNECTION_STRING)?.groups?.databaseName ?? 'meteor'
}

const config = {
  mongodb: {
    url: MONGO_CONNECTION_STRING,

    databaseName: MONGO_DB_NAME,
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: 'src/data-access/migrations/mongo/mongo-migrations',

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: 'changelog',

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: '.ts',

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: 'commonjs',
}

// eslint-disable-next-line no-undef
module.exports = config