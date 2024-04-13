import { readdir } from 'fs/promises'
import * as fs from 'fs'
import {Db, MongoClient} from 'mongodb'


const MONGODB_PORT: string = process.env.MONGODB_PORT || '3001'
const MONGODB_HOST: string = process.env.MONGODB_HOST || 'gateway.docker.internal'
const MONGODB_REPLICA: string = process.env.MONGODB_REPLICA || 'rs0'
const MONGODB_DATABASE_NAME: string = process.env.MONGODB_DATABASE_NAME || 'meteor'
const VERSION: string = process.env.VERSION || 'v0.0.0'

console.log('')
console.log('Runner:')
console.log(`migrating to version ${VERSION}`)
console.log('environment:')
console.dir(process.env)

interface MigrationData {
  [key: string]: string
}

function getConnectedMongoClient(): Promise<MongoClient> {
  return new MongoClient(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/?replicaSet=${MONGODB_REPLICA}&directConnection=true&serverSelectionTimeoutMS=2000`)
    .connect()
}

function processMigrationData(collection: string, migrationData: MigrationData): void {
  console.log(` - applying migration for collection ${collection}...`)
  console.dir(migrationData)

  void getConnectedMongoClient().then(
    async client => {
      const db: Db = client.db(MONGODB_DATABASE_NAME)
      await db.collections().then(
        collections => {
          collections.forEach(
            c => {
              console.log(` - collection ${c.collectionName}`)
            },
          )
        },
      )
      await client.close()
    },
  )
}

async function getMigrationData(): Promise<void> {
  (await readdir(
    `/schema/${VERSION}`,
    {withFileTypes: true, recursive: false},
  ))
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
    .forEach(
      collectionFile => {
        const collection: string = collectionFile.name.replace (/.json$/,'')
        console.log(` - collection ${collection}...`)
        fs.readFile(`${collectionFile.path}/${collectionFile.name}`, {encoding: 'utf-8'}, (err, data) => {
          if (err) {
            console.error(err)
            return
          }
          const migrationData = JSON.parse(data)
          console.log('migration data:')
          processMigrationData(collection, migrationData)
        })
      },
    )
}

void getMigrationData().then(
  () => console.log('done!'),
).catch(e => console.error(e))
